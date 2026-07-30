"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type CreateActivityState = {
  status: "idle" | "success" | "error";
  message: string;
};

const ACTIVITY_SCORE_VALUES: Record<string, number> = {
  note: 0,

  dm_sent: 2,
  direct_message_sent: 2,
  email_sent: 2,

  tweet_reply: 3,
  comment_reply: 3,
  social_reply: 3,

  website_visit: 5,
  link_click: 5,

  dm_received: 8,
  direct_message_received: 8,
  email_received: 8,
  reply_received: 8,

  interested: 15,
  qualified: 15,

  trial_started: 25,
  free_trial: 25,

  premium_signup: 100,
  premium: 100,
  converted: 100,
};

function getActivityScore(
  activityType: string,
  direction: string,
): number {
  const normalizedType = activityType.toLowerCase();
  const normalizedDirection = direction.toLowerCase();

  const exactScore = ACTIVITY_SCORE_VALUES[normalizedType];

  if (typeof exactScore === "number") {
    return exactScore;
  }

  if (
    normalizedDirection === "inbound" &&
    ["dm", "direct_message", "email", "reply"].includes(normalizedType)
  ) {
    return 8;
  }

  if (
    normalizedDirection === "outbound" &&
    ["dm", "direct_message", "email"].includes(normalizedType)
  ) {
    return 2;
  }

  if (
    normalizedType === "tweet_reply" ||
    normalizedType === "comment_reply"
  ) {
    return 3;
  }

  return 0;
}

export async function createActivity(
  leadId: string,
  _previousState: CreateActivityState,
  formData: FormData,
): Promise<CreateActivityState> {
  const activityType = String(
    formData.get("activityType") ?? "",
  ).trim();

  const platform = String(
    formData.get("platform") ?? "",
  ).trim();

  const direction = String(
    formData.get("direction") ?? "",
  ).trim();

  const title = String(
    formData.get("title") ?? "",
  ).trim();

  const description = String(
    formData.get("description") ?? "",
  ).trim();

  if (!leadId) {
    return {
      status: "error",
      message: "Lead ID is missing.",
    };
  }

  if (!activityType) {
    return {
      status: "error",
      message: "Please select an activity type.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "Authentication required.",
    };
  }

  const occurredAt = new Date().toISOString();

  const { error: activityError } = await supabase
    .from("growth_activities")
    .insert({
      lead_id: leadId,
      activity_type: activityType,
      platform: platform || null,
      direction: direction || null,
      title: title || null,
      description: description || null,
      occurred_at: occurredAt,
      actor_id: user.id,
    });

  if (activityError) {
    console.error(
      "Unable to create growth activity:",
      activityError,
    );

    return {
      status: "error",
      message: activityError.message,
    };
  }

  const shouldUpdateLastContact =
    activityType !== "note" &&
    activityType !== "website_visit";

  const scoreIncrease = getActivityScore(
    activityType,
    direction,
  );

  const { data: currentLead, error: leadReadError } =
    await supabase
      .from("growth_leads")
      .select("lead_score")
      .eq("id", leadId)
      .single();

  if (leadReadError) {
    console.error(
      "Activity saved, but lead score could not be read:",
      leadReadError,
    );
  } else {
    const currentScore =
      typeof currentLead.lead_score === "number"
        ? currentLead.lead_score
        : Number(currentLead.lead_score ?? 0);

    const leadUpdates: {
      lead_score: number;
      last_contact_at?: string;
    } = {
      lead_score:
        (Number.isFinite(currentScore) ? currentScore : 0) +
        scoreIncrease,
    };

    if (shouldUpdateLastContact) {
      leadUpdates.last_contact_at = occurredAt;
    }

    const { error: leadUpdateError } = await supabase
      .from("growth_leads")
      .update(leadUpdates)
      .eq("id", leadId);

    if (leadUpdateError) {
      console.error(
        "Activity saved, but lead details were not updated:",
        leadUpdateError,
      );
    }
  }

  revalidatePath("/admin/growth");
  revalidatePath("/admin/growth/leads");
  revalidatePath(`/admin/growth/leads/${leadId}`);

  return {
    status: "success",
    message:
      scoreIncrease > 0
        ? `Activity logged. Lead score increased by ${scoreIncrease}.`
        : "Activity logged successfully.",
  };
}
