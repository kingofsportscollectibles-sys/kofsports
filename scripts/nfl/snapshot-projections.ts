import { createClient } from "@supabase/supabase-js";

import {
  NFL_PROP_MARKETS,
  enrichNflPlayerPropTrends,
  mapPropTrend,
  resolvePropSchedule,
  type NflPlayerPropTrend,
  type PropTrendRow,
} from "../../lib/nfl/prop-trends";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SNAPSHOT_TYPE = "pre_weekend";

function getTrendGameKey(trend: NflPlayerPropTrend) {
  return (
    trend.externalEventId ??
    `${trend.awayTeam}-${trend.homeTeam}-${trend.commenceTime}`
  );
}

function getSnapshotProjection(trend: NflPlayerPropTrend) {
  switch (trend.market) {
    case "player_pass_yds":
      return trend.passingProjection
        ? {
            projectedValue:
              trend.passingProjection.projectedPassingYards,
            modelVersion: trend.passingProjection.modelVersion,
            projectedVolume:
              trend.passingProjection.projectedAttempts,
            expectedEfficiency:
              trend.passingProjection.expectedYardsPerAttempt,
          }
        : null;

    case "player_rush_yds":
      return trend.rushingProjection
        ? {
            projectedValue:
              trend.rushingProjection.projectedRushingYards,
            modelVersion: trend.rushingProjection.modelVersion,
            projectedVolume:
              trend.rushingProjection.projectedCarries,
            expectedEfficiency:
              trend.rushingProjection.expectedYpc,
          }
        : null;

    case "player_reception_yds":
      return trend.receivingProjection
        ? {
            projectedValue:
              trend.receivingProjection.projectedReceivingYards,
            modelVersion: trend.receivingProjection.modelVersion,
            projectedVolume:
              trend.receivingProjection.projectedTargets,
            expectedEfficiency:
              trend.receivingProjection.expectedYardsPerTarget,
          }
        : null;

    case "player_receptions":
      return trend.receptionsProjection
        ? {
            projectedValue:
              trend.receptionsProjection.projectedReceptions,
            modelVersion: trend.receptionsProjection.modelVersion,
            projectedVolume:
              trend.receptionsProjection.projectedTargets,
            expectedEfficiency:
              trend.receptionsProjection.expectedCatchRate,
          }
        : null;
  }
}

async function main() {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("nfl_player_prop_trends_with_identity")
    .select("*")
    .eq("bookmaker", "draftkings")
    .in("market", NFL_PROP_MARKETS)
    .gte("commence_time", now)
    .order("commence_time", { ascending: true })
    .order("player_name", { ascending: true });

  if (error) {
    throw new Error(
      `Unable to load NFL player prop trends: ${error.message}`,
    );
  }

  const trends = ((data ?? []) as PropTrendRow[]).map(mapPropTrend);

  if (trends.length === 0) {
    console.log("No upcoming DraftKings NFL props found.");
    return;
  }

  const enrichedTrends = await enrichNflPlayerPropTrends(
    trends,
    new Map(),
    supabase,
  );
  const scheduleMap = await resolvePropSchedule(
    enrichedTrends,
    supabase,
  );

  const rows = enrichedTrends.flatMap((trend) => {
    if (!trend.externalPlayerId) {
      return [];
    }

    const schedule = scheduleMap.get(getTrendGameKey(trend));
    const projection = getSnapshotProjection(trend);

    if (!schedule || !projection) {
      return [];
    }

    const modelLean =
      projection.projectedValue > trend.line
        ? "over"
        : projection.projectedValue < trend.line
          ? "under"
          : "push";

    return [
      {
        season: schedule.season,
        week: schedule.week,
        external_event_id: trend.externalEventId,
        external_player_id: trend.externalPlayerId,
        player_name: trend.playerName,
        player_team: trend.playerTeam,
        market: trend.market,
        bookmaker: trend.bookmaker,
        line: trend.line,
        over_price: trend.overPrice,
        under_price: trend.underPrice,
        home_team: trend.homeTeam,
        away_team: trend.awayTeam,
        commence_time: trend.commenceTime,
        projected_value: projection.projectedValue,
        model_version: projection.modelVersion,
        projected_volume: projection.projectedVolume,
        expected_efficiency: projection.expectedEfficiency,
        snapshot_type: SNAPSHOT_TYPE,
        model_lean: modelLean,
      },
    ];
  });

  if (rows.length === 0) {
    console.log(
      "Upcoming NFL props were found, but none had a resolved schedule and model projection.",
    );
    return;
  }

  const weeks = Array.from(
    new Set(rows.map((row) => `${row.season}-${row.week}`)),
  ).sort();

  console.log(
    `Prepared ${rows.length} ${SNAPSHOT_TYPE} projection snapshots for ${weeks.join(", ")}.`,
  );

  const { error: upsertError } = await supabase
    .from("nfl_prop_projection_snapshots")
    .upsert(rows, {
      onConflict:
        "season,week,external_player_id,market,bookmaker,model_version,snapshot_type",
      ignoreDuplicates: true,
    });

  if (upsertError) {
    throw new Error(
      `Unable to save NFL projection snapshots: ${upsertError.message}`,
    );
  }

  console.log(
    `NFL projection snapshot complete: ${rows.length} candidate rows processed.`,
  );
}

void main().catch((error) => {
  console.error("NFL projection snapshot failed:", error);
  process.exitCode = 1;
});
