import { createClient } from "@/lib/supabase/server";

export type NflSnapCountPlayer = {
  externalPlayerId: string;
  playerName: string;
  position: string;
  team: string;
  opponent: string | null;
  season: number;
  latestWeek: number;
  latestOffensiveSnaps: number | null;
  latestSnapPct: number | null;
  previousSnapPct: number | null;
  snapPctChange: number | null;
  l3SnapPct: number | null;
  l5SnapPct: number | null;
  seasonSnapPct: number | null;
  seasonAvgSnaps: number | null;
  gamesPlayed: number;
};

type SnapCountRow = {
  external_player_id: string;
  player_name: string | null;
  position: string | null;
  team: string | null;
  opponent: string | null;
  season: number;
  latest_week: number;
  latest_offensive_snaps: number | null;
  latest_snap_pct: number | string | null;
  previous_snap_pct: number | string | null;
  snap_pct_change: number | string | null;
  l3_snap_pct: number | string | null;
  l5_snap_pct: number | string | null;
  season_snap_pct: number | string | null;
  season_avg_snaps: number | string | null;
  games_played: number;
};

function toNumber(value: number | string | null): number | null {
  if (value === null) return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export async function getNflSnapCounts(
  season = 2025,
): Promise<NflSnapCountPlayer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_snap_summary")
    .select("*")
    .eq("season", season)
    .order("latest_snap_pct", { ascending: false })
    .order("player_name", { ascending: true });

  if (error) {
    console.error("Failed to load NFL snap counts:", error);

    throw new Error(
      `Unable to load NFL snap counts: ${error.message}`,
    );
  }

  return ((data ?? []) as SnapCountRow[])
    .filter(
      (row) =>
        row.player_name &&
        row.position &&
        row.team,
    )
    .map((row) => ({
      externalPlayerId: row.external_player_id,
      playerName: row.player_name!,
      position: row.position!,
      team: row.team!,
      opponent: row.opponent,
      season: row.season,
      latestWeek: row.latest_week,
      latestOffensiveSnaps: row.latest_offensive_snaps,
      latestSnapPct: toNumber(row.latest_snap_pct),
      previousSnapPct: toNumber(row.previous_snap_pct),
      snapPctChange: toNumber(row.snap_pct_change),
      l3SnapPct: toNumber(row.l3_snap_pct),
      l5SnapPct: toNumber(row.l5_snap_pct),
      seasonSnapPct: toNumber(row.season_snap_pct),
      seasonAvgSnaps: toNumber(row.season_avg_snaps),
      gamesPlayed: row.games_played,
    }));
}
