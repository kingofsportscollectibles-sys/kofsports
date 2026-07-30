import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import type { CreateGrowthEventInput } from "./types";

export type ResolvedGrowthLead = {
  id: string;
  leadScore: number;
  anonymousId: string | null;
  userId: string | null;
};

type ResolveGrowthLeadInput = Pick<
  CreateGrowthEventInput,
  "leadId" | "anonymousId" | "userId"
>;

type GrowthLeadRecord = {
  id: string;
  lead_score: number | null;
  anonymous_id: string | null;
  user_id: string | null;
};

function formatResolvedLead(
  lead: GrowthLeadRecord,
): ResolvedGrowthLead {
  return {
    id: lead.id,
    leadScore: lead.lead_score ?? 0,
    anonymousId: lead.anonymous_id,
    userId: lead.user_id,
  };
}

async function attachIdentityToLead({
  leadId,
  currentAnonymousId,
  currentUserId,
  anonymousId,
  userId,
}: {
  leadId: string;
  currentAnonymousId: string | null;
  currentUserId: string | null;
  anonymousId?: string;
  userId?: string;
}) {
  const updates: {
    anonymous_id?: string;
    user_id?: string;
  } = {};

  if (anonymousId && !currentAnonymousId) {
    updates.anonymous_id = anonymousId;
  }

  if (userId && !currentUserId) {
    updates.user_id = userId;
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("growth_leads")
    .update(updates)
    .eq("id", leadId);

  if (error) {
    console.error(
      "Unable to attach identity to growth lead:",
      error,
    );
  }
}

export async function resolveGrowthLead(
  input: ResolveGrowthLeadInput,
): Promise<ResolvedGrowthLead | null> {
  const supabase = createAdminClient();

  /*
   * 1. Explicit leadId is the strongest identity signal.
   */
  if (input.leadId) {
    const { data: lead, error } = await supabase
      .from("growth_leads")
      .select(
        "id, lead_score, anonymous_id, user_id",
      )
      .eq("id", input.leadId)
      .maybeSingle();

    if (error) {
      console.error(
        "Unable to resolve lead by leadId:",
        error,
      );

      return null;
    }

    if (!lead) {
      return null;
    }

    await attachIdentityToLead({
      leadId: lead.id,
      currentAnonymousId: lead.anonymous_id,
      currentUserId: lead.user_id,
      anonymousId: input.anonymousId,
      userId: input.userId,
    });

    return {
      ...formatResolvedLead(lead),
      anonymousId:
        lead.anonymous_id ??
        input.anonymousId ??
        null,
      userId: lead.user_id ?? input.userId ?? null,
    };
  }

  /*
   * 2. Resolve through the authenticated KofSports account.
   */
  if (input.userId) {
    const { data: lead, error } = await supabase
      .from("growth_leads")
      .select(
        "id, lead_score, anonymous_id, user_id",
      )
      .eq("user_id", input.userId)
      .maybeSingle();

    if (error) {
      console.error(
        "Unable to resolve lead by userId:",
        error,
      );

      return null;
    }

    if (lead) {
      await attachIdentityToLead({
        leadId: lead.id,
        currentAnonymousId: lead.anonymous_id,
        currentUserId: lead.user_id,
        anonymousId: input.anonymousId,
        userId: input.userId,
      });

      return {
        ...formatResolvedLead(lead),
        anonymousId:
          lead.anonymous_id ??
          input.anonymousId ??
          null,
      };
    }
  }

  /*
   * 3. Resolve through the persistent browser identity.
   */
  if (input.anonymousId) {
    const { data: lead, error } = await supabase
      .from("growth_leads")
      .select(
        "id, lead_score, anonymous_id, user_id",
      )
      .eq("anonymous_id", input.anonymousId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Unable to resolve lead by anonymousId:",
        error,
      );

      return null;
    }

    if (!lead) {
      return null;
    }

    await attachIdentityToLead({
      leadId: lead.id,
      currentAnonymousId: lead.anonymous_id,
      currentUserId: lead.user_id,
      anonymousId: input.anonymousId,
      userId: input.userId,
    });

    return {
      ...formatResolvedLead(lead),
      userId: lead.user_id ?? input.userId ?? null,
    };
  }

  return null;
}