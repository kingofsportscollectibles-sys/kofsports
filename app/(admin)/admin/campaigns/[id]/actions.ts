"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

export type UpdateCampaignMemberState = {
  status: "idle" | "success" | "error";
  message: string;
};

const allowedStatuses = new Set([
  "queued",
  "contacted",
  "replied",
  "interested",
  "converted",
  "unresponsive",
  "opted_out",
  "removed",
]);

function readString(
  formData: FormData,
  key: string,
) {
  const value = formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function updateCampaignMemberAction(
  campaignId: string,
  leadId: string,
  _previousState: UpdateCampaignMemberState,
  formData: FormData,
): Promise<UpdateCampaignMemberState> {
  try {
    const status = readString(formData, "status");
    const notes = readString(formData, "notes");
    const revenueText = readString(
      formData,
      "revenueAttributed",
    );

    if (!allowedStatuses.has(status)) {
      return {
        status: "error",
        message: "Select a valid campaign status.",
      };
    }

    const revenueAttributed = revenueText
      ? Number(revenueText)
      : 0;

    if (
      !Number.isFinite(revenueAttributed) ||
      revenueAttributed < 0
    ) {
      return {
        status: "error",
        message: "Enter a valid attributed revenue amount.",
      };
    }

    const supabase = createAdminClient();

    const { data: existingMember, error: memberError } =
      await supabase
        .from("growth_campaign_members")
        .select(`
          status,
          contacted_at,
          replied_at,
          converted_at
        `)
        .eq("campaign_id", campaignId)
        .eq("lead_id", leadId)
        .maybeSingle();

    if (memberError) {
      throw new Error(memberError.message);
    }

    if (!existingMember) {
      return {
        status: "error",
        message: "Campaign member not found.",
      };
    }

    const now = new Date().toISOString();

    const contactedStatuses = new Set([
      "contacted",
      "replied",
      "interested",
      "converted",
      "unresponsive",
      "opted_out",
    ]);

    const repliedStatuses = new Set([
      "replied",
      "interested",
      "converted",
    ]);

    const contactedAt =
      contactedStatuses.has(status)
        ? existingMember.contacted_at ?? now
        : null;

    const repliedAt =
      repliedStatuses.has(status)
        ? existingMember.replied_at ?? now
        : null;

    const convertedAt =
      status === "converted"
        ? existingMember.converted_at ?? now
        : null;

    const { error: updateError } = await supabase
      .from("growth_campaign_members")
      .update({
        status,
        contacted_at: contactedAt,
        replied_at: repliedAt,
        converted_at: convertedAt,
        last_activity_at: now,
        revenue_attributed: revenueAttributed,
        notes: notes || null,
        updated_at: now,
      })
      .eq("campaign_id", campaignId)
      .eq("lead_id", leadId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (status === "converted") {
      const { error: leadError } = await supabase
        .from("growth_leads")
        .update({
          status: "premium",
          converted_at:
            existingMember.converted_at ?? now,
          updated_at: now,
        })
        .eq("id", leadId);

      if (leadError) {
        throw new Error(leadError.message);
      }
    }

    const activityType =
      status === "converted"
        ? "campaign_conversion"
        : status === "replied"
          ? "campaign_reply"
          : status === "interested"
            ? "campaign_interest"
            : status === "contacted"
              ? "campaign_contact"
              : "campaign_status_update";

    const { error: activityError } = await supabase
      .from("growth_activities")
      .insert({
        lead_id: leadId,
        campaign_id: campaignId,
        activity_type: activityType,
        platform: null,
        direction: "internal",
        title: "Campaign member updated",
        description: `Campaign status changed to ${status.replaceAll(
          "_",
          " ",
        )}.`,
        occurred_at: now,
        metadata: {
          campaign_status: status,
          revenue_attributed: revenueAttributed,
        },
      });

    if (activityError) {
      throw new Error(activityError.message);
    }

    revalidatePath("/admin/campaigns");
    revalidatePath(`/admin/campaigns/${campaignId}`);
    revalidatePath(`/admin/growth/leads/${leadId}`);

    return {
      status: "success",
      message: "Campaign member updated.",
    };
  } catch (error) {
    console.error(
      "Unable to update campaign member:",
      error,
    );

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to update campaign member.",
    };
  }
}