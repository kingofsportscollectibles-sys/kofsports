import { createClient } from "@/lib/supabase/server";

export type NflPlayerPropRecord = {
  season: number;
  externalPlayerId: string;
  playerName: string;
  team: string | null;
  position: string | null;

  gradedProps: number;
  wins: number;
  losses: number;
  pushes: number;
  coverPct: number | null;
  avgDelta: number | null;

  passWins: number;
  passLosses: number;
  passPushes: number;
  passGradedProps: number;
  passCoverPct: number | null;
  passAvgDelta: number | null;

  rushWins: number;
  rushLosses: number;
  rushPushes: number;
  rushGradedProps: number;
  rushCoverPct: number | null;
  rushAvgDelta: number | null;

  receivingWins: number;
  receivingLosses: number;
  receivingPushes: number;
  receivingGradedProps: number;
  receivingCoverPct: number | null;
  receivingAvgDelta: number | null;
};

type PlayerPropRecordRow = {
  season: number;
  external_player_id: string;
  player_name: string;
  team: string | null;
  position: string | null;

  graded_props: number;
  wins: number;
  losses: number;
  pushes: number;
  cover_pct: number | string | null;
  avg_delta: number | string | null;

  pass_wins: number;
  pass_losses: number;
  pass_pushes: number;
  pass_graded_props: number | null;
  pass_cover_pct: number | string | null;
  pass_avg_delta: number | string | null;

  rush_wins: number;
  rush_losses: number;
  rush_pushes: number;
  rush_graded_props: number | null;
  rush_cover_pct: number | string | null;
  rush_avg_delta: number | string | null;

  receiving_wins: number;
  receiving_losses: number;
  receiving_pushes: number;
  receiving_graded_props: number | null;
  receiving_cover_pct: number | string | null;
  receiving_avg_delta: number | string | null;
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

function mapPlayerPropRecord(
  row: PlayerPropRecordRow,
): NflPlayerPropRecord {
  return {
    season: row.season,
    externalPlayerId: row.external_player_id,
    playerName: row.player_name,
    team: row.team,
    position: row.position,

    gradedProps: row.graded_props,
    wins: row.wins,
    losses: row.losses,
    pushes: row.pushes,
    coverPct: nullableNumber(row.cover_pct),
    avgDelta: nullableNumber(row.avg_delta),

    passWins: row.pass_wins,
    passLosses: row.pass_losses,
    passPushes: row.pass_pushes,
    passGradedProps: row.pass_graded_props ?? 0,
    passCoverPct: nullableNumber(
      row.pass_cover_pct,
    ),
    passAvgDelta: nullableNumber(
      row.pass_avg_delta,
    ),

    rushWins: row.rush_wins,
    rushLosses: row.rush_losses,
    rushPushes: row.rush_pushes,
    rushGradedProps: row.rush_graded_props ?? 0,
    rushCoverPct: nullableNumber(
      row.rush_cover_pct,
    ),
    rushAvgDelta: nullableNumber(
      row.rush_avg_delta,
    ),

    receivingWins: row.receiving_wins,
    receivingLosses: row.receiving_losses,
    receivingPushes: row.receiving_pushes,
    receivingGradedProps:
      row.receiving_graded_props ?? 0,
    receivingCoverPct: nullableNumber(
      row.receiving_cover_pct,
    ),
    receivingAvgDelta: nullableNumber(
      row.receiving_avg_delta,
    ),
  };
}

export async function getNflPlayerPropRecords(
  season = 2026,
): Promise<NflPlayerPropRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_prop_leaderboard")
    .select("*")
    .eq("season", season)
    .gt("graded_props", 0)
    .order("cover_pct", {
      ascending: false,
      nullsFirst: false,
    })
    .order("graded_props", {
      ascending: false,
    })
    .order("avg_delta", {
      ascending: false,
      nullsFirst: false,
    })
    .order("player_name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load NFL player prop records:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NFL player prop records: ${error.message}`,
    );
  }

  return (
    (data ?? []) as PlayerPropRecordRow[]
  ).map(mapPlayerPropRecord);
}

export async function getNflPlayerPropRecordByPlayer(
  externalPlayerId: string,
  season = 2026,
): Promise<NflPlayerPropRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_prop_leaderboard")
    .select("*")
    .eq("external_player_id", externalPlayerId)
    .eq("season", season)
    .gt("graded_props", 0)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load NFL player prop record:",
      {
        externalPlayerId,
        season,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    return null;
  }

  const row = data as PlayerPropRecordRow | null;

  if (!row) {
    return null;
  }

  return mapPlayerPropRecord(row);
}
