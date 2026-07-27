"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type UpdateDashboardGoalsInput = {
  premiumMembersGoal: number;
  monthlyRevenueGoal: number;
  paidSignupsGoal: number;
};

export type UpdateDashboardGoalsResult = {
  success: boolean;
  message: string;
};

function isValidNonNegativeNumber(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export async function updateDashboardGoals(
  input: UpdateDashboardGoalsInput,
): Promise<UpdateDashboardGoalsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "You must be signed in to update dashboard goals.",
    };
  }

  const premiumMembersGoal = Math.round(input.premiumMembersGoal);
  const monthlyRevenueGoalInCents = Math.round(
    input.monthlyRevenueGoal * 100,
  );
  const paidSignupsGoal = Math.round(input.paidSignupsGoal);

  if (
    !isValidNonNegativeNumber(premiumMembersGoal) ||
    !isValidNonNegativeNumber(monthlyRevenueGoalInCents) ||
    !isValidNonNegativeNumber(paidSignupsGoal)
  ) {
    return {
      success: false,
      message: "All goals must be valid numbers of zero or greater.",
    };
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const { error } = await supabase.from("dashboard_goals").upsert(
    {
      year,
      month,
      premium_members_goal: premiumMembersGoal,
      monthly_revenue_goal_cents: monthlyRevenueGoalInCents,
      paid_signups_goal: paidSignupsGoal,
      updated_at: now.toISOString(),
    },
    {
      onConflict: "year,month",
    },
  );

  if (error) {
    console.error("Unable to update dashboard goals:", error);

    return {
      success: false,
      message: "The goals could not be saved. Please try again.",
    };
  }

  revalidatePath("/admin");

  return {
    success: true,
    message: "Monthly goals updated.",
  };
}