import { createClient } from "@/lib/supabase/server";

const RELAUNCH_CUTOFF = "2026-07-20T00:00:00.000Z";

const SPORT_ORDER = ["NFL", "MLB", "NHL", "NBA", "CFB", "CBB"];

type SportRecordBaseline = {
  sport: string;
  starting_wins: number;
  starting_losses: number;
};

type SettledPick = {
  sport: string;
  status: string;
};

export type SportResult = {
  sport: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  formattedWins: string;
  formattedLosses: string;
  formattedTotal: string;
  formattedWinRate: string;
};

export type OverallRecord = {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  formattedWins: string;
  formattedLosses: string;
  formattedTotal: string;
  formattedWinRate: string;
};

function normalizeSport(sport: string) {
  return sport.trim().toUpperCase();
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatWinRate(value: number) {
  return `${value.toFixed(1)}%`;
}

export async function getSportResults(): Promise<SportResult[]> {
  const supabase = await createClient();

  const [
    { data: baselines, error: baselinesError },
    { data: settledPicks, error: settledPicksError },
  ] = await Promise.all([
    supabase
      .from("sport_record_baselines")
      .select("sport, starting_wins, starting_losses"),

    supabase
      .from("vip_picks")
      .select("sport, status")
      .in("status", ["won", "lost"])
      .gte("published_at", RELAUNCH_CUTOFF),
  ]);

  if (baselinesError) {
    console.error(
      "Unable to load sport record baselines:",
      baselinesError.message,
    );

    throw new Error("Unable to load the historical sports record.");
  }

  if (settledPicksError) {
    console.error(
      "Unable to load settled VIP picks:",
      settledPicksError.message,
    );

    throw new Error("Unable to load settled picks.");
  }

  const typedBaselines = (baselines ?? []) as SportRecordBaseline[];
  const typedSettledPicks = (settledPicks ?? []) as SettledPick[];

  const results = typedBaselines.map((baseline) => {
    const sport = normalizeSport(baseline.sport);

    const sportPicks = typedSettledPicks.filter(
      (pick) => normalizeSport(pick.sport) === sport,
    );

    const newWins = sportPicks.filter(
      (pick) => normalizeStatus(pick.status) === "won",
    ).length;

    const newLosses = sportPicks.filter(
      (pick) => normalizeStatus(pick.status) === "lost",
    ).length;

    const wins = baseline.starting_wins + newWins;
    const losses = baseline.starting_losses + newLosses;
    const total = wins + losses;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    return {
      sport,
      wins,
      losses,
      total,
      winRate,
      formattedWins: formatNumber(wins),
      formattedLosses: formatNumber(losses),
      formattedTotal: formatNumber(total),
      formattedWinRate: formatWinRate(winRate),
    };
  });

  return results.sort((a, b) => {
    const aIndex = SPORT_ORDER.indexOf(a.sport);
    const bIndex = SPORT_ORDER.indexOf(b.sport);

    const safeAIndex = aIndex === -1 ? SPORT_ORDER.length : aIndex;
    const safeBIndex = bIndex === -1 ? SPORT_ORDER.length : bIndex;

    return safeAIndex - safeBIndex;
  });
}

export function getOverallRecord(
  sportsResults: SportResult[],
): OverallRecord {
  const wins = sportsResults.reduce(
    (total, result) => total + result.wins,
    0,
  );

  const losses = sportsResults.reduce(
    (total, result) => total + result.losses,
    0,
  );

  const total = wins + losses;
  const winRate = total > 0 ? (wins / total) * 100 : 0;

  return {
    wins,
    losses,
    total,
    winRate,
    formattedWins: formatNumber(wins),
    formattedLosses: formatNumber(losses),
    formattedTotal: formatNumber(total),
    formattedWinRate: formatWinRate(winRate),
  };
}