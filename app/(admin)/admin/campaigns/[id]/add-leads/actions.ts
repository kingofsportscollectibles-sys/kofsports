"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AddCampaignLeadsState = {
  error?: string;
};

function readLeadIds(formData: FormData) {
  return formData
    .getAll("leadIds")
    .filter(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    );
}

export async function addCampaignLeadsAction(
  campaignId: string,
  _previousState: AddCampaignLeadsState,
  formData: FormData,
): Promise<AddCampaignLeadsState> {
  let shouldRedirect = false;

  try {
    const leadIds = readLeadIds(formData);

    if (leadIds.length === 0) {
      return {
        error: "Select at least one lead.",
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
          "You must be signed in to add leads to a campaign.",
      };
    }

    const supabase = createAdminClient();

    const { data: campaign, error: campaignError } =
      await supabase
        .from("growth_campaigns")
        .select("id")
        .eq("id", campaignId)
        .maybeSingle();

    if (campaignError) {
      throw new Error(campaignError.message);
    }

    if (!campaign) {
      return {
        error: "Campaign not found.",
      };
    }

    const rows = leadIds.map((leadId) => ({
      campaign_id: campaignId,
      lead_id: leadId,
      status: "queued",
      attribution_type: "primary",
      joined_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        added_by: user.id,
      },
    }));

    const { error: insertError } = await supabase
      .from("growth_campaign_members")
      .upsert(rows, {
        onConflict: "campaign_id,lead_id",
        ignoreDuplicates: true,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    await supabase
      .from("growth_campaigns")
      .update({
        target_lead_count: leadIds.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    shouldRedirect = true;
  } catch (error) {
    console.error(
      "Unable to add campaign leads:",
      error,
    );

    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to add leads to the campaign.",
    };
  }

  if (shouldRedirect) {
    revalidatePath("/admin/campaigns");
    revalidatePath(`/admin/campaigns/${campaignId}`);

    redirect(`/admin/campaigns/${campaignId}`);
  }

  return {
    error: "Unable to add leads to the campaign.",
  };
}