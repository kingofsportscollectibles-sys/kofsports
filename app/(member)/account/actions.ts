"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type NotificationPreferenceState = {
  success: boolean;
  message: string;
};

export async function updateNotificationPreferences(
  _previousState: NotificationPreferenceState,
  formData: FormData,
): Promise<NotificationPreferenceState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be signed in to update notifications.",
    };
  }

  const emailEnabled = formData.get("email_enabled") === "on";

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        email_enabled: emailEnabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

  if (error) {
    console.error("Notification preference update failed:", error);

    return {
      success: false,
      message: "We could not save your notification preferences.",
    };
  }

  revalidatePath("/account");

  return {
    success: true,
    message: emailEnabled
      ? "Email alerts are enabled."
      : "Email alerts are disabled.",
  };
}