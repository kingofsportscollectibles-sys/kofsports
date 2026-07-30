"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type AddLeadState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: {
    displayName?: string;
    username?: string;
    platform?: string;
  };
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function normalizeUsername(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

export async function addLeadAction(
  _previousState: AddLeadState,
  formData: FormData,
): Promise<AddLeadState> {
  const name = getString(formData, "displayName");
  const username = getString(formData, "username").replace(/^@/, "");
  const normalizedUsername = username
    ? normalizeUsername(username)
    : null;
  const platform = getString(formData, "platform");
  const source = getString(formData, "source");
  const notes = getString(formData, "notes");

  const fieldErrors: AddLeadState["fieldErrors"] = {};

  if (!name && !username) {
    fieldErrors.displayName =
      "Enter a display name or social username.";
  }

  if (!platform) {
    fieldErrors.platform = "Select a platform.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Review the highlighted fields.",
      fieldErrors,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Your admin session has expired. Sign in again.",
    };
  }

  if (normalizedUsername) {
    const { data: existingLead, error: lookupError } = await supabase
      .from("growth_leads")
      .select("id")
      .eq("platform", platform)
      .eq("normalized_username", normalizedUsername)
      .maybeSingle();

    if (lookupError) {
      console.error(
        "Lead duplicate check failed:",
        lookupError.message,
      );

      return {
        status: "error",
        message: "Unable to check for an existing lead.",
      };
    }

    if (existingLead) {
      return {
        status: "error",
        message: `A ${platform} lead with that username already exists.`,
        fieldErrors: {
          username: "This social profile is already in the CRM.",
        },
      };
    }
  }

  const { error } = await supabase
    .from("growth_leads")
    .insert({
      name: name || username,
      username: username || null,
      normalized_username: normalizedUsername,
      platform,
      status: "new",
      source: source || "manual",
      notes: notes || null,
      lead_score: 0,
      owner_id: user.id,
      created_by: user.id,
    });

  if (error) {
    console.error("Unable to create Growth OS lead:", error);

    return {
      status: "error",
      message: `Unable to add lead: ${error.message}`,
    };
  }

  revalidatePath("/admin/growth");
  revalidatePath("/admin/growth/leads");

  return {
    status: "success",
    message: "Lead added to Growth OS.",
  };
}
