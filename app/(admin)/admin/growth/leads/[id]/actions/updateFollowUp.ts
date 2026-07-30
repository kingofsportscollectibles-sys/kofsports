"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type UpdateFollowUpState = {
  success: boolean;
  message: string;
};

export async function updateFollowUp(
  leadId: string,
  _previousState: UpdateFollowUpState,
  formData: FormData,
): Promise<UpdateFollowUpState> {
  const followUpValue = formData.get("nextFollowUpAt");

  if (typeof followUpValue !== "string") {
    return {
      success: false,
      message: "Follow-up date is missing.",
    };
  }

  const normalizedValue = followUpValue.trim();

  let nextFollowUpAt: string | null = null;

  if (normalizedValue) {
    const followUpDate = new Date(normalizedValue);

    if (Number.isNaN(followUpDate.getTime())) {
      return {
        success: false,
        message: "Enter a valid follow-up date.",
      };
    }

    nextFollowUpAt = followUpDate.toISOString();
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("growth_leads")
    .update({
      next_follow_up_at: nextFollowUpAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) {
    console.error("Unable to update follow-up:", error);

    return {
      success: false,
      message: error.message,
    };
  }

  revalidatePath("/admin/growth");
  revalidatePath("/admin/growth/leads");
  revalidatePath(`/admin/growth/leads/${leadId}`);

  return {
    success: true,
    message: nextFollowUpAt
      ? "Follow-up scheduled."
      : "Follow-up cleared.",
  };
}