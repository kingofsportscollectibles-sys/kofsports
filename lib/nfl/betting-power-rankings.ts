import { createClient } from "@/lib/supabase/server";

export type NflBettingPowerRanking = {
  season: number;
  rank: number;
  team: string;
  games: number;
  wins: number;
  losses: number;
  pushes: number;
  decisions: number;
  atsPct: number | null;
  avgCoverMargin: number | null;
  totalCoverMargin: number | null;
};

type BettingPowerRankingRow = {
  season: number;
  rank: number | string;
  team: string;
  games: number;
  wins: number;
  losses: number;
  pushes: number;
  decisions: number;
  ats_pct: number | string | null;
  avg_cover_margin: number | string | null;
  total_cover_margin: number | string | null;
};

function nullableNumber(
  value: number | string | null,
): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

export async function getNflBettingPowerRankings(
  season = 2026,
): Promise<NflBettingPowerRanking[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_betting_power_rankings")
    .select("*")
    .eq("season", season)
    .order("rank", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load NFL betting power rankings:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NFL betting power rankings: ${error.message}`,
    );
  }

  return (
    (data ?? []) as BettingPowerRankingRow[]
  ).map((row) => ({
    season: row.season,
    rank: Number(row.rank),
    team: row.team,
    games: row.games,
    wins: row.wins,
    losses: row.losses,
    pushes: row.pushes,
    decisions: row.decisions,
    atsPct: nullableNumber(row.ats_pct),
    avgCoverMargin: nullableNumber(
      row.avg_cover_margin,
    ),
    totalCoverMargin: nullableNumber(
      row.total_cover_margin,
    ),
  }));
}
