import { createClient } from "@supabase/supabase-js";

type SnapshotRow = {
  id: number;
  season: number;
  week: number;
  external_player_id: string;
  player_name: string;
  market:
    | "player_pass_yds"
    | "player_rush_yds"
    | "player_reception_yds"
    | "player_receptions";
  line: number | string;
  projected_value: number | string;
  model_lean: "over" | "under" | "push" | null;
  actual_value: number | string | null;
  graded_at: string | null;
};

type PlayerGameStatRow = {
  external_player_id: string;
  passing_yards: number | null;
  rushing_yards: number | null;
  receiving_yards: number | null;
  receptions: number | null;
};

function parseArgs() {
  const args = process.argv.slice(2);

  let season: number | null = null;
  let week: number | null = null;
  let dryRun = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--season") {
      season = Number(args[index + 1]);
      index += 1;
    } else if (arg === "--week") {
      week = Number(args[index + 1]);
      index += 1;
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }

  if (!Number.isInteger(season) || !Number.isInteger(week)) {
    throw new Error(
      "Usage: npx tsx scripts/nfl/grade-projection-snapshots.ts --season <season> --week <week> [--dry-run]",
    );
  }

  return {
    season: season as number,
    week: week as number,
    dryRun,
  };
}

function getActualValue(
  snapshot: SnapshotRow,
  stats: PlayerGameStatRow,
): number | null {
  switch (snapshot.market) {
    case "player_pass_yds":
      return stats.passing_yards;
    case "player_rush_yds":
      return stats.rushing_yards;
    case "player_reception_yds":
      return stats.receiving_yards;
    case "player_receptions":
      return stats.receptions;
  }
}

function getLineResult(
  actualValue: number,
  line: number,
): "over" | "under" | "push" {
  if (actualValue > line) return "over";
  if (actualValue < line) return "under";
  return "push";
}

function getModelLeanResult(
  modelLean: SnapshotRow["model_lean"],
  lineResult: "over" | "under" | "push",
): "win" | "loss" | "push" | null {
  if (!modelLean) return null;

  if (lineResult === "push" || modelLean === "push") {
    return "push";
  }

  return modelLean === lineResult ? "win" : "loss";
}

async function main() {
  const { season, week, dryRun } = parseArgs();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: snapshotData, error: snapshotError } = await supabase
    .from("nfl_prop_projection_snapshots")
    .select(
      "id, season, week, external_player_id, player_name, market, line, projected_value, model_lean, actual_value, graded_at",
    )
    .eq("season", season)
    .eq("week", week)
    .eq("snapshot_type", "pre_weekend")
    .order("id");

  if (snapshotError) {
    throw snapshotError;
  }

  const snapshots = (snapshotData ?? []) as SnapshotRow[];

  if (snapshots.length === 0) {
    console.log(`No pre_weekend snapshots found for ${season}-${week}.`);
    return;
  }

  const playerIds = [
    ...new Set(snapshots.map((snapshot) => snapshot.external_player_id)),
  ];

  const { data: statsData, error: statsError } = await supabase
    .from("nfl_player_game_stats")
    .select(
      "external_player_id, passing_yards, rushing_yards, receiving_yards, receptions",
    )
    .eq("season", season)
    .eq("week", week)
    .in("external_player_id", playerIds);

  if (statsError) {
    throw statsError;
  }

  const statsByPlayerId = new Map<string, PlayerGameStatRow>();

  for (const row of (statsData ?? []) as PlayerGameStatRow[]) {
    statsByPlayerId.set(row.external_player_id, row);
  }

  let gradeable = 0;
  let alreadyGraded = 0;
  let missingStats = 0;
  let missingMarketStat = 0;

  const updates: Array<{
    id: number;
    actual_value: number;
    absolute_error: number;
    line_result: "over" | "under" | "push";
    model_lean_result: "win" | "loss" | "push" | null;
    graded_at: string;
  }> = [];

  const gradedAt = new Date().toISOString();

  for (const snapshot of snapshots) {
    if (snapshot.graded_at !== null || snapshot.actual_value !== null) {
      alreadyGraded += 1;
      continue;
    }

    const stats = statsByPlayerId.get(snapshot.external_player_id);

    if (!stats) {
      missingStats += 1;
      continue;
    }

    const actualValue = getActualValue(snapshot, stats);

    if (actualValue === null) {
      missingMarketStat += 1;
      continue;
    }

    const line = Number(snapshot.line);
    const projectedValue = Number(snapshot.projected_value);

    if (!Number.isFinite(line) || !Number.isFinite(projectedValue)) {
      throw new Error(`Invalid numeric values for snapshot ${snapshot.id}.`);
    }

    const lineResult = getLineResult(actualValue, line);

    updates.push({
      id: snapshot.id,
      actual_value: actualValue,
      absolute_error: Math.abs(projectedValue - actualValue),
      line_result: lineResult,
      model_lean_result: getModelLeanResult(
        snapshot.model_lean,
        lineResult,
      ),
      graded_at: gradedAt,
    });

    gradeable += 1;
  }

  console.log(
    [
      `NFL projection grading ${season}-${week}`,
      `Snapshots: ${snapshots.length}`,
      `Gradeable now: ${gradeable}`,
      `Already graded: ${alreadyGraded}`,
      `Missing player stats: ${missingStats}`,
      `Missing market stat: ${missingMarketStat}`,
      `Mode: ${dryRun ? "dry-run" : "write"}`,
    ].join("\n"),
  );

  if (dryRun || updates.length === 0) {
    return;
  }

  for (const update of updates) {
    const { error } = await supabase
      .from("nfl_prop_projection_snapshots")
      .update({
        actual_value: update.actual_value,
        absolute_error: update.absolute_error,
        line_result: update.line_result,
        model_lean_result: update.model_lean_result,
        graded_at: update.graded_at,
      })
      .eq("id", update.id)
      .is("graded_at", null);

    if (error) {
      throw error;
    }
  }

  console.log(`Graded ${updates.length} projection snapshots.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
