"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreateCampaignState = {
  error?: string;
};

const allowedStatuses = new Set([
  "draft",
  "scheduled",
  "active",
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseOptionalDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Enter valid campaign dates.");
  }

  return date.toISOString();
}

export async function createCampaignAction(
  _previousState: CreateCampaignState,
  formData: FormData,
): Promise<CreateCampaignState> {
  let campaignId: string | null = null;

  try {
    const name = readString(formData, "name");

    const description =
      readString(formData, "description") || null;

    const platform =
      readString(formData, "platform") || null;

    const campaignType =
      readString(formData, "campaignType") || null;

    const status = readString(formData, "status");

    const audienceDescription =
      readString(formData, "audienceDescription") ||
      null;

    const messageTemplate =
      readString(formData, "messageTemplate") || null;

    const goalType =
      readString(formData, "goalType") || null;

    const goalValueText = readString(
      formData,
      "goalValue",
    );

    const budgetText = readString(
      formData,
      "budget",
    );

    const targetLeadCountText = readString(
      formData,
      "targetLeadCount",
    );

    const startsAt = parseOptionalDate(
      readString(formData, "startsAt"),
    );

    const endsAt = parseOptionalDate(
      readString(formData, "endsAt"),
    );

    if (!name) {
      return {
        error: "Campaign name is required.",
      };
    }

    if (!allowedStatuses.has(status)) {
      return {
        error: "Select a valid campaign status.",
      };
    }

    if (
      startsAt &&
      endsAt &&
      new Date(endsAt) < new Date(startsAt)
    ) {
      return {
        error:
          "The campaign end date must be after the start date.",
      };
    }

    const budget = budgetText
      ? Number(budgetText)
      : 0;

    const targetLeadCount = targetLeadCountText
      ? Number(targetLeadCountText)
      : 0;

    const goalValue = goalValueText
      ? Number(goalValueText)
      : null;

    if (!Number.isFinite(budget) || budget < 0) {
      return {
        error: "Enter a valid campaign budget.",
      };
    }

    if (
      !Number.isInteger(targetLeadCount) ||
      targetLeadCount < 0
    ) {
      return {
        error:
          "Target lead count must be a whole number.",
      };
    }

    if (
      goalValue !== null &&
      (!Number.isFinite(goalValue) ||
        goalValue < 0)
    ) {
      return {
        error: "Enter a valid campaign goal.",
      };
    }

    const userClient = await createClient();

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return {
        error:
          "You must be signed in to create a campaign.",
      };
    }

    const supabase = createAdminClient();

    const baseSlug =
      slugify(name) || `campaign-${Date.now()}`;

    let slug = baseSlug;

    const { data: existingCampaign } =
      await supabase
        .from("growth_campaigns")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (existingCampaign) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const { data: campaign, error } =
      await supabase
        .from("growth_campaigns")
        .insert({
          name,
          slug,
          description,
          status,
          platform,
          campaign_type: campaignType,
          starts_at: startsAt,
          ends_at: endsAt,
          budget_cents: Math.round(budget * 100),
          goal_type: goalType,
          goal_value: goalValue,
          audience_description:
            audienceDescription,
          message_template: messageTemplate,
          target_lead_count: targetLeadCount,
          created_by: user.id,
          metadata: {},
        })
        .select("id")
        .single();

    if (error) {
      console.error(
        "Unable to create campaign:",
        error,
      );

      return {
        error:
          error.message ||
          "Unable to create the campaign.",
      };
    }

    campaignId = campaign.id;
  } catch (error) {
    console.error(
      "Create campaign failed:",
      error,
    );

    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to create the campaign.",
    };
  }

  if (!campaignId) {
    return {
      error: "The campaign was not created.",
    };
  }

  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns/${campaignId}`);
}