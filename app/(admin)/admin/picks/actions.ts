"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fromZonedTime } from "date-fns-tz";
import { notifyPremiumMembers } from "@/lib/notifications/notify-premium-members";

import { createClient } from "@/lib/supabase/server";

export type PickFormState = {
  error: string;
};

function calculateProfitLoss(
  status: string,
  odds: number,
  units: number,
): number | null {
  if (status === "pending") {
    return null;
  }

  if (status === "lost") {
    return Number((-units).toFixed(2));
  }

  if (status === "push" || status === "cancelled") {
    return 0;
  }

  if (status === "won") {
    const profit =
      odds > 0
        ? units * (odds / 100)
        : units * (100 / Math.abs(odds));

    return Number(profit.toFixed(2));
  }

  return null;
}

function validatePickFields(formData: FormData) {
  const sport = String(formData.get("sport") ?? "").trim();
  const betType = String(formData.get("bet_type") ?? "").trim();
  const matchup = String(formData.get("matchup") ?? "").trim();
  const selection = String(formData.get("selection") ?? "").trim();
  const analysis = String(formData.get("analysis") ?? "").trim();
  const gameTime = String(formData.get("game_time") ?? "").trim();
  const gameDate = gameTime.slice(0, 10);

  const odds = Number(String(formData.get("odds") ?? "").trim());
  const units = Number(String(formData.get("units") ?? "").trim());
  const confidence = Number(
    String(formData.get("confidence") ?? "").trim(),
  );

  if (
  !sport ||
  !betType ||
  !matchup ||
  !selection ||
  !gameTime ||
  !gameDate
) {
    return {
      error:
        "Sport, bet type, matchup, selection, and game time are required.",
      data: null,
    };
  }

  if (!Number.isInteger(odds) || odds === 0) {
    return {
      error:
        "Odds must be entered as a non-zero whole American-odds number.",
      data: null,
    };
  }

  if (!Number.isFinite(units) || units <= 0) {
    return {
      error: "Units must be greater than zero.",
      data: null,
    };
  }

  if (
    !Number.isInteger(confidence) ||
    confidence < 1 ||
    confidence > 5
  ) {
    return {
      error: "Confidence must be between 1 and 5.",
      data: null,
    };
  }

const parsedGameTime = fromZonedTime(gameTime, "America/New_York");

  if (Number.isNaN(parsedGameTime.getTime())) {
    return {
      error: "Please enter a valid game date and time.",
      data: null,
    };
  }

  return {
    error: "",
    data: {
      sport,
      betType,
      matchup,
      selection,
      analysis,
      odds,
      units,
      confidence,
       gameDate,
      gameTime: parsedGameTime.toISOString(),
    },
  };
}

async function verifyAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      user: null,
      error: "You must be logged in.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return {
      supabase,
      user: null,
      error: "You do not have permission to manage picks.",
    };
  }

  return {
    supabase,
    user,
    error: "",
  };
}

export async function createPick(
  _previousState: PickFormState,
  formData: FormData,
): Promise<PickFormState> {
  const auth = await verifyAdmin();

  if (!auth.user) {
    return {
      error: auth.error,
    };
  }

  const validation = validatePickFields(formData);

  if (!validation.data) {
    return {
      error: validation.error,
    };
  }

  const isPublished = formData.get("is_published") === "on";

const { data: createdPick, error } = await auth.supabase
  .from("vip_picks")
  .insert({
    sport: validation.data.sport,
    bet_type: validation.data.betType,
    matchup: validation.data.matchup,
    selection: validation.data.selection,
    odds: validation.data.odds,
    units: validation.data.units,
    confidence: validation.data.confidence,
    analysis: validation.data.analysis || null,
    game_date: validation.data.gameDate,
    game_time: validation.data.gameTime,
    status: "pending",
    profit_loss: null,
    is_published: isPublished,
    is_premium: true,
    published_at: isPublished ? new Date().toISOString() : null,
    created_by: auth.user.id,
    updated_at: new Date().toISOString(),
  })
  .select("id")
  .single();

  if (error || !createdPick) {
  return {
    error: error?.message ?? "The pick could not be created.",
  };
}

if (isPublished) {
  await notifyPremiumMembers(createdPick.id);
}

  revalidatePath("/admin");
  revalidatePath("/admin/picks");
  revalidatePath("/vip-picks");

  redirect("/admin/picks");
}

export async function updatePick(
  _previousState: PickFormState,
  formData: FormData,
): Promise<PickFormState> {
  const auth = await verifyAdmin();

  if (!auth.user) {
    return {
      error: auth.error,
    };
  }

  const pickId = String(formData.get("pick_id") ?? "").trim();
  const actionType = String(formData.get("action_type") ?? "save");

  if (!pickId) {
    return {
      error: "Pick ID is missing.",
    };
  }

  const validation = validatePickFields(formData);

  if (!validation.data) {
    return {
      error: validation.error,
    };
  }

  const { data: existingPick, error: existingPickError } =
    await auth.supabase
      .from("vip_picks")
      .select("status, is_published, published_at")
      .eq("id", pickId)
      .maybeSingle();

  if (existingPickError || !existingPick) {
    return {
      error: existingPickError?.message ?? "Pick could not be found.",
    };
  }

  const isFirstPublication =
  actionType === "publish" && existingPick.is_published !== true;

  let status = existingPick.status ?? "pending";
  let isPublished = existingPick.is_published ?? false;
  let publishedAt = existingPick.published_at;
  let profitLoss: number | null = null;

  if (actionType === "publish") {
    isPublished = true;
    publishedAt = existingPick.published_at ?? new Date().toISOString();
  }

  if (actionType === "unpublish") {
    isPublished = false;
    publishedAt = null;
  }

  if (
    actionType === "won" ||
    actionType === "lost" ||
    actionType === "push" ||
    actionType === "cancelled"
  ) {
    status = actionType;
    profitLoss = calculateProfitLoss(
      status,
      validation.data.odds,
      validation.data.units,
    );
  } else if (actionType === "reset") {
    status = "pending";
    profitLoss = null;
  } else {
    profitLoss = calculateProfitLoss(
      status,
      validation.data.odds,
      validation.data.units,
    );
  }

  const { error } = await auth.supabase
    .from("vip_picks")
    .update({
      sport: validation.data.sport,
      bet_type: validation.data.betType,
      matchup: validation.data.matchup,
      selection: validation.data.selection,
      odds: validation.data.odds,
      units: validation.data.units,
      confidence: validation.data.confidence,
      analysis: validation.data.analysis || null,
      game_date: validation.data.gameDate,
      game_time: validation.data.gameTime,
      status,
      profit_loss: profitLoss,
      is_published: isPublished,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pickId);

  if (error) {
    return {
      error: error.message,
    };
  }

  if (isFirstPublication) {
  await notifyPremiumMembers(pickId);
}

  revalidatePath("/admin");
  revalidatePath("/admin/picks");
  revalidatePath(`/admin/picks/${pickId}`);
  revalidatePath("/admin/results");
  revalidatePath("/vip-picks");

  redirect(`/admin/picks/${pickId}?updated=true`);
}

export async function deletePick(formData: FormData) {
  const auth = await verifyAdmin();

  if (!auth.user) {
    redirect("/login");
  }

  const pickId = String(formData.get("pick_id") ?? "").trim();

  if (!pickId) {
    redirect("/admin/picks");
  }

  const { data: pick } = await auth.supabase
    .from("vip_picks")
    .select("status")
    .eq("id", pickId)
    .maybeSingle();

  if (!pick) {
    redirect("/admin/picks");
  }

  if (pick.status !== "pending") {
    redirect(`/admin/picks/${pickId}?delete_error=graded`);
  }

  await auth.supabase.from("vip_picks").delete().eq("id", pickId);

  revalidatePath("/admin");
  revalidatePath("/admin/picks");
  revalidatePath("/vip-picks");

  redirect("/admin/picks");
}