import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { createCrmActivityFromEvent } from "./processors/createCrmActivity";
import { getLeadScoreIncrease } from "./processors/leadScoring";
import { shouldCreateActivity } from "./processors/crmActivity";
import { resolveGrowthLead } from "./resolveLead";

import type { CreateGrowthEventInput } from "./types";

type ProcessGrowthEventInput = {
  eventId: string;
  event: CreateGrowthEventInput;
};

export async function processGrowthEvent({
  eventId,
  event,
}: ProcessGrowthEventInput) {
  const scoreIncrease = getLeadScoreIncrease(
    event.eventType,
  );

  const shouldCreateCrmActivity =
    shouldCreateActivity(event.eventType);

  const lead = await resolveGrowthLead({
    leadId: event.leadId,
    userId: event.userId,
    anonymousId: event.anonymousId,
  });

  console.table({
    event: event.eventType,
    leadId: lead?.id ?? "anonymous",
    leadScoreIncrease: scoreIncrease,
    createActivity: shouldCreateCrmActivity,
  });

  /*
   * Anonymous events remain available for analytics, but they
   * cannot modify a specific CRM lead yet.
   */
  if (!lead) {
    return {
      leadId: null,
      scoreIncrease: 0,
      activityCreated: false,
    };
  }

  const supabase = createAdminClient();

  /*
   * Attach the stored event to the resolved CRM lead.
   */
  const { error: eventUpdateError } = await supabase
    .from("growth_events")
    .update({
      lead_id: lead.id,
    })
    .eq("id", eventId);

  if (eventUpdateError) {
    console.error(
      "Unable to attach growth event to lead:",
      eventUpdateError,
    );
  }

  /*
   * Apply the event's intent score.
   */
  if (scoreIncrease > 0) {
    const nextLeadScore =
      lead.leadScore + scoreIncrease;

    const { error: scoreError } = await supabase
      .from("growth_leads")
      .update({
        lead_score: nextLeadScore,
      })
      .eq("id", lead.id);

    if (scoreError) {
      console.error(
        "Unable to update lead score:",
        scoreError,
      );

      throw new Error(
        "Growth event was recorded, but lead scoring failed.",
      );
    }
  }

  /*
   * Add important website behavior to the CRM timeline.
   */
  let activityCreated = false;

  if (shouldCreateCrmActivity) {
    activityCreated =
      await createCrmActivityFromEvent({
        eventId,
        leadId: lead.id,
        event,
      });
  }

  return {
    leadId: lead.id,
    scoreIncrease,
    activityCreated,
  };
}