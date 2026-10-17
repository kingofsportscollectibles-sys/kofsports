import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNflPlayerSlugMap } from "@/lib/nfl/player-pages";
import {
  getNflPassingYardsProjections,
  getNflQbRushYardsProjections,
  getNflReceptionsProjections,
  getNflReceivingYardsProjections,
  getNflRushYardsProjections,
} from "@/lib/nfl/player-projections";

export const NFL_PROP_MARKETS = [
  "player_pass_yds",
  "player_rush_yds",
  "player_reception_yds",
  "player_receptions",
] as const;

export type NflPropMarket = (typeof NFL_PROP_MARKETS)[number];

export type NflPropGameResult = {
  game_date: string;
  opponent: string | null;
  value: number;
  is_home: boolean | null;
  result: "over" | "under" | "push";
};

export type NflPlayerPropTrend = {
  propId: number;
  externalEventId: string | null;
  externalPlayerId: string | null;
  playerSlug: string | null;

  playerName: string;
  playerTeam: string | null;
  position: string | null;

  market: NflPropMarket;
  line: number;

  overPrice: number | null;
  underPrice: number | null;

  bookmaker: string;

  homeTeam: string;
  awayTeam: string;
  upcomingOpponent: string | null;

  commenceTime: string;
  fetchedAt: string | null;

  l5Games: number;
  l5Overs: number;
  l5Unders: number;
  l5Pushes: number;
  l5OverPct: number | null;
  avgL5: number | null;

  l10Games: number;
  l10Overs: number;
  l10Unders: number;
  l10Pushes: number;
  l10OverPct: number | null;
  avgL10: number | null;

  seasonGames: number;
  seasonOvers: number;
  seasonOverPct: number | null;

  h2hGames: number;
  h2hOvers: number;
  h2hOverPct: number | null;
  avgH2h: number | null;

  lastTen: NflPropGameResult[];

  passingProjection: {
    projectedPassingYards: number;
    projectedAttempts: number;
    expectedYardsPerAttempt: number;
    modelVersion: string;
  } | null;

  rushingProjection: {
    projectedRushingYards: number;
    projectedCarries: number | null;
    expectedYpc: number | null;
    modelVersion: string;
  } | null;

  receivingProjection: {
    projectedReceivingYards: number;
    projectedTargets: number;
    expectedYardsPerTarget: number;
    modelVersion: string;
  } | null;

  receptionsProjection: {
    projectedReceptions: number;
    projectedTargets: number;
    expectedCatchRate: number;
    modelVersion: string;
  } | null;
};

function hasModelProjection(prop: NflPlayerPropTrend): boolean {
  switch (prop.market) {
    case "player_pass_yds":
      return prop.passingProjection !== null;
    case "player_rush_yds":
      return prop.rushingProjection !== null;
    case "player_reception_yds":
      return prop.receivingProjection !== null;
    case "player_receptions":
      return prop.receptionsProjection !== null;
  }
}

export function getFreeNflProjectionIds(
  props: NflPlayerPropTrend[],
): Set<number> {
  const eligibleProps = props.filter(hasModelProjection);

  if (eligibleProps.length === 0) {
    return new Set();
  }

  const sundayProps = eligibleProps.filter((prop) => {
    const date = new Date(prop.commenceTime);

    return date.getUTCDay() === 0;
  });

  const pool =
    sundayProps.length > 0 ? sundayProps : eligibleProps;

  const unlockCount = sundayProps.length > 0 ? 3 : 1;

  const sorted = [...pool].sort((a, b) => {
    const gameCompare =
      a.commenceTime.localeCompare(b.commenceTime);

    if (gameCompare !== 0) {
      return gameCompare;
    }

    const playerCompare =
      a.playerName.localeCompare(b.playerName);

    if (playerCompare !== 0) {
      return playerCompare;
    }

    return a.market.localeCompare(b.market);
  });

  const selectedIds: number[] = [];
  const selectedPlayers = new Set<string>();
  const selectedGames = new Set<string>();
  const selectedMarkets = new Set<NflPropMarket>();

  const getGameKey = (prop: NflPlayerPropTrend) =>
    prop.externalEventId ??
    `${prop.awayTeam}-${prop.homeTeam}-${prop.commenceTime}`;

  const selectProp = (prop: NflPlayerPropTrend) => {
    selectedIds.push(prop.propId);
    selectedPlayers.add(prop.playerName);
    selectedGames.add(getGameKey(prop));
    selectedMarkets.add(prop.market);
  };

  // First, maximize variety across games, players, and markets.
  for (const prop of sorted) {
    const gameKey = getGameKey(prop);

    if (
      selectedPlayers.has(prop.playerName) ||
      selectedGames.has(gameKey) ||
      selectedMarkets.has(prop.market)
    ) {
      continue;
    }

    selectProp(prop);

    if (selectedIds.length >= unlockCount) {
      return new Set(selectedIds);
    }
  }

  // If there are not enough unique markets, preserve unique
  // games and players before repeating a market.
  for (const prop of sorted) {
    const gameKey = getGameKey(prop);

    if (
      selectedIds.includes(prop.propId) ||
      selectedPlayers.has(prop.playerName) ||
      selectedGames.has(gameKey)
    ) {
      continue;
    }

    selectProp(prop);

    if (selectedIds.length >= unlockCount) {
      return new Set(selectedIds);
    }
  }

  // Only repeat a game if the board does not contain enough
  // unique games. Still avoid featuring the same player twice.
  for (const prop of sorted) {
    if (
      selectedIds.includes(prop.propId) ||
      selectedPlayers.has(prop.playerName)
    ) {
      continue;
    }

    selectProp(prop);

    if (selectedIds.length >= unlockCount) {
      break;
    }
  }

  return new Set(selectedIds);
}

type PropTrendRow = {
  prop_id: number;
  external_event_id: string | null;
  external_player_id: string | null;

  player_name: string;
  player_team: string | null;

  market: string;
  line: number | string;

  over_price: number | null;
  under_price: number | null;

  bookmaker: string;

  home_team: string;
  away_team: string;
  upcoming_opponent: string | null;

  commence_time: string;
  fetched_at: string | null;

  l5_games: number;
  l5_overs: number;
  l5_unders: number;
  l5_pushes: number;
  l5_over_pct: number | string | null;
  avg_l5: number | string | null;

  l10_games: number;
  l10_overs: number;
  l10_unders: number;
  l10_pushes: number;
  l10_over_pct: number | string | null;
  avg_l10: number | string | null;

  season_games: number;
  season_overs: number;
  season_over_pct: number | string | null;

  h2h_games: number;
  h2h_overs: number;
  h2h_over_pct: number | string | null;
  avg_h2h: number | string | null;

  last_ten: NflPropGameResult[] | null;
};

function nullableNumber(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

type NflPropScheduleRow = {
  season: number;
  week: number;
  home_team: string;
  away_team: string;
  commence_time: string;
};

async function getEligibleProjectionIds(
  externalPlayerIds: string[],
  season: number,
  positions: string[],
): Promise<Set<string>> {
  const uniquePlayerIds = Array.from(
    new Set(externalPlayerIds.filter(Boolean)),
  );

  if (
    uniquePlayerIds.length === 0 ||
    positions.length === 0
  ) {
    return new Set();
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("nfl_player_current_teams")
    .select("gsis_id")
    .in("gsis_id", uniquePlayerIds)
    .eq("season", season)
    .eq("game_type", "REG")
    .in("position", positions);

  if (error) {
    console.error(
      "Failed to load NFL projection eligibility:",
      {
        positions,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NFL projection eligibility: ${error.message}`,
    );
  }

  return new Set(
    (data ?? [])
      .map((row) => row.gsis_id)
      .filter(
        (id): id is string =>
          typeof id === "string" && id.length > 0,
      ),
  );
}

async function resolvePropSeasonAndWeek(
  trends: NflPlayerPropTrend[],
): Promise<{ season: number; week: number } | null> {
  if (trends.length === 0) {
    return null;
  }

  const supabase = await createClient();

  const earliestCommenceTime = trends.reduce(
    (earliest, trend) =>
      trend.commenceTime < earliest
        ? trend.commenceTime
        : earliest,
    trends[0].commenceTime,
  );

  const latestCommenceTime = trends.reduce(
    (latest, trend) =>
      trend.commenceTime > latest
        ? trend.commenceTime
        : latest,
    trends[0].commenceTime,
  );

  const { data, error } = await supabase
    .from("nfl_games")
    .select(
      "season, week, home_team, away_team, commence_time",
    )
    .eq("game_type", "REG")
    .gte("commence_time", earliestCommenceTime)
    .lte("commence_time", latestCommenceTime);

  if (error) {
    console.error("Failed to resolve NFL prop season/week:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    throw new Error(
      `Unable to resolve NFL prop season/week: ${error.message}`,
    );
  }

  const scheduleRows = (data ?? []) as NflPropScheduleRow[];

  const matchedWeeks = new Map<string, {
    season: number;
    week: number;
  }>();

  for (const trend of trends) {
    const match = scheduleRows.find(
      (game) =>
        game.home_team === trend.homeTeam &&
        game.away_team === trend.awayTeam &&
        game.commence_time === trend.commenceTime,
    );

    if (match) {
      matchedWeeks.set(
        `${match.season}-${match.week}`,
        {
          season: match.season,
          week: match.week,
        },
      );
    }
  }

  if (matchedWeeks.size !== 1) {
    return null;
  }

  return matchedWeeks.values().next().value ?? null;
}

function mapPropTrend(row: PropTrendRow): NflPlayerPropTrend {
  return {
    propId: row.prop_id,
    externalEventId: row.external_event_id,
    externalPlayerId: row.external_player_id,
    playerSlug: null,

    playerName: row.player_name,
    playerTeam: row.player_team,
    position: null,

    market: row.market as NflPropMarket,
    line: Number(row.line),

    overPrice: row.over_price,
    underPrice: row.under_price,

    bookmaker: row.bookmaker,

    homeTeam: row.home_team,
    awayTeam: row.away_team,
    upcomingOpponent: row.upcoming_opponent,

    commenceTime: row.commence_time,
    fetchedAt: row.fetched_at,

    l5Games: row.l5_games,
    l5Overs: row.l5_overs,
    l5Unders: row.l5_unders,
    l5Pushes: row.l5_pushes,
    l5OverPct: nullableNumber(row.l5_over_pct),
    avgL5: nullableNumber(row.avg_l5),

    l10Games: row.l10_games,
    l10Overs: row.l10_overs,
    l10Unders: row.l10_unders,
    l10Pushes: row.l10_pushes,
    l10OverPct: nullableNumber(row.l10_over_pct),
    avgL10: nullableNumber(row.avg_l10),

    seasonGames: row.season_games,
    seasonOvers: row.season_overs,
    seasonOverPct: nullableNumber(row.season_over_pct),

    h2hGames: row.h2h_games,
    h2hOvers: row.h2h_overs,
    h2hOverPct: nullableNumber(row.h2h_over_pct),
    avgH2h: nullableNumber(row.avg_h2h),

    lastTen: Array.isArray(row.last_ten) ? row.last_ten : [],

    passingProjection: null,
    rushingProjection: null,
    receivingProjection: null,
    receptionsProjection: null,
  };
}

export async function getNflPlayerPropTrends(): Promise<
  NflPlayerPropTrend[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_prop_trends_with_identity")
    .select("*")
    .eq("bookmaker", "draftkings")
    .in("market", NFL_PROP_MARKETS)
    .gte("commence_time", new Date().toISOString())
    .order("commence_time", { ascending: true })
    .order("player_name", { ascending: true });

if (error) {
  console.error("Failed to load NFL player prop trends:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new Error(
    `Unable to load NFL player prop trends: ${error.message}`,
  );
}

  const trends = ((data ?? []) as PropTrendRow[]).map(mapPropTrend);

  const externalPlayerIds = trends
    .map((trend) => trend.externalPlayerId)
    .filter((id): id is string => Boolean(id));

  const [slugMap, schedule] = await Promise.all([
    getNflPlayerSlugMap(externalPlayerIds),
    resolvePropSeasonAndWeek(trends),
  ]);

  const positionMap = new Map<string, string>();

  if (schedule && externalPlayerIds.length > 0) {
    const admin = createAdminClient();

    const { data: rosterRows, error: rosterError } = await admin
      .from("nfl_player_current_teams")
      .select("gsis_id, position")
      .in("gsis_id", Array.from(new Set(externalPlayerIds)))
      .eq("season", schedule.season)
      .eq("game_type", "REG");

    if (rosterError) {
      console.error("Failed to load NFL prop player positions:", {
        message: rosterError.message,
        details: rosterError.details,
        hint: rosterError.hint,
        code: rosterError.code,
      });

      throw new Error(
        `Unable to load NFL prop player positions: ${rosterError.message}`,
      );
    }

    for (const row of rosterRows ?? []) {
      if (
        typeof row.gsis_id === "string" &&
        typeof row.position === "string"
      ) {
        positionMap.set(row.gsis_id, row.position);
      }
    }
  }

  const playerIdsByMarket = {
    passing: trends
      .filter(
        (trend) =>
          trend.market === "player_pass_yds" &&
          trend.externalPlayerId,
      )
      .map((trend) => trend.externalPlayerId as string),

    rushing: trends
      .filter(
        (trend) =>
          trend.market === "player_rush_yds" &&
          trend.externalPlayerId,
      )
      .map((trend) => trend.externalPlayerId as string),

    receiving: trends
      .filter(
        (trend) =>
          trend.market === "player_reception_yds" &&
          trend.externalPlayerId,
      )
      .map((trend) => trend.externalPlayerId as string),

    receptions: trends
      .filter(
        (trend) =>
          trend.market === "player_receptions" &&
          trend.externalPlayerId,
      )
      .map((trend) => trend.externalPlayerId as string),
  };

  const [
    eligiblePassingIds,
    eligibleRushingIds,
    eligibleQbRushingIds,
    eligibleReceivingIds,
    eligibleReceptionsIds,
  ] = schedule
    ? await Promise.all([
        getEligibleProjectionIds(
          playerIdsByMarket.passing,
          schedule.season,
          ["QB"],
        ),
        getEligibleProjectionIds(
          playerIdsByMarket.rushing,
          schedule.season,
          ["RB"],
        ),
        getEligibleProjectionIds(
          playerIdsByMarket.rushing,
          schedule.season,
          ["QB"],
        ),
        getEligibleProjectionIds(
          playerIdsByMarket.receiving,
          schedule.season,
          ["RB", "WR", "TE"],
        ),
        getEligibleProjectionIds(
          playerIdsByMarket.receptions,
          schedule.season,
          ["RB", "WR", "TE"],
        ),
      ])
    : [
        new Set<string>(),
        new Set<string>(),
        new Set<string>(),
        new Set<string>(),
        new Set<string>(),
      ];

  const [
    passingProjections,
    rushProjections,
    qbRushProjections,
    receivingProjections,
    receptionsProjections,
  ] = schedule
    ? await Promise.all([
        getNflPassingYardsProjections(
          playerIdsByMarket.passing.filter((id) =>
            eligiblePassingIds.has(id),
          ),
          schedule.season,
          schedule.week,
        ),
        getNflRushYardsProjections(
          playerIdsByMarket.rushing.filter((id) =>
            eligibleRushingIds.has(id),
          ),
          schedule.season,
          schedule.week,
        ),
        getNflQbRushYardsProjections(
          trends
            .filter(
              (trend) =>
                trend.market === "player_rush_yds" &&
                trend.externalPlayerId &&
                trend.upcomingOpponent &&
                eligibleQbRushingIds.has(
                  trend.externalPlayerId,
                ),
            )
            .map((trend) => ({
              externalPlayerId:
                trend.externalPlayerId as string,
              opponent:
                trend.upcomingOpponent as string,
            })),
          schedule.season,
          schedule.week,
        ),
        getNflReceivingYardsProjections(
          playerIdsByMarket.receiving.filter((id) =>
            eligibleReceivingIds.has(id),
          ),
          schedule.season,
          schedule.week,
        ),
        getNflReceptionsProjections(
          playerIdsByMarket.receptions.filter((id) =>
            eligibleReceptionsIds.has(id),
          ),
          schedule.season,
          schedule.week,
        ),
      ])
    : [
        new Map(),
        new Map(),
        new Map(),
        new Map(),
        new Map(),
      ];

  return trends.map((trend) => {
    const passingProjection =
      trend.market === "player_pass_yds" &&
      trend.externalPlayerId
        ? passingProjections.get(trend.externalPlayerId) ?? null
        : null;

    const rbRushingProjection =
      trend.market === "player_rush_yds" &&
      trend.externalPlayerId
        ? rushProjections.get(trend.externalPlayerId) ?? null
        : null;

    const qbRushingProjection =
      trend.market === "player_rush_yds" &&
      trend.externalPlayerId
        ? qbRushProjections.get(trend.externalPlayerId) ?? null
        : null;

    const receivingProjection =
      trend.market === "player_reception_yds" &&
      trend.externalPlayerId
        ? receivingProjections.get(trend.externalPlayerId) ?? null
        : null;

    const receptionsProjection =
      trend.market === "player_receptions" &&
      trend.externalPlayerId
        ? receptionsProjections.get(trend.externalPlayerId) ?? null
        : null;

    return {
      ...trend,
      playerSlug: trend.externalPlayerId
        ? slugMap.get(trend.externalPlayerId) ?? null
        : null,
      position: trend.externalPlayerId
        ? positionMap.get(trend.externalPlayerId) ?? null
        : null,

      passingProjection: passingProjection
        ? {
            projectedPassingYards:
              passingProjection.projectedPassingYards,
            projectedAttempts:
              passingProjection.projectedAttempts,
            expectedYardsPerAttempt:
              passingProjection.expectedYardsPerAttempt,
            modelVersion: passingProjection.modelVersion,
          }
        : null,

      rushingProjection: rbRushingProjection
        ? {
            projectedRushingYards:
              rbRushingProjection.projectedRushingYards,
            projectedCarries:
              rbRushingProjection.projectedCarries,
            expectedYpc: rbRushingProjection.expectedYpc,
            modelVersion: rbRushingProjection.modelVersion,
          }
        : qbRushingProjection
          ? {
              projectedRushingYards:
                qbRushingProjection.projectedRushingYards,
              projectedCarries: null,
              expectedYpc: null,
              modelVersion:
                qbRushingProjection.modelVersion,
            }
          : null,

      receivingProjection: receivingProjection
        ? {
            projectedReceivingYards:
              receivingProjection.projectedReceivingYards,
            projectedTargets:
              receivingProjection.projectedTargets,
            expectedYardsPerTarget:
              receivingProjection.expectedYardsPerTarget,
            modelVersion: receivingProjection.modelVersion,
          }
        : null,

      receptionsProjection: receptionsProjection
        ? {
            projectedReceptions:
              receptionsProjection.projectedReceptions,
            projectedTargets:
              receptionsProjection.projectedTargets,
            expectedCatchRate:
              receptionsProjection.expectedCatchRate,
            modelVersion: receptionsProjection.modelVersion,
          }
        : null,
    };
  });
}

export async function getNflPlayerPropTrendsByPlayer(
  externalPlayerId: string,
): Promise<NflPlayerPropTrend[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_prop_trends_with_identity")
    .select("*")
    .eq("external_player_id", externalPlayerId)
    .eq("bookmaker", "draftkings")
    .in("market", NFL_PROP_MARKETS)
    .gte("commence_time", new Date().toISOString())
    .order("commence_time", {
      ascending: true,
    })
    .order("market", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load NFL player prop trends by player:",
      {
        externalPlayerId,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NFL player prop trends by player: ${error.message}`,
    );
  }

  return ((data ?? []) as PropTrendRow[]).map(
    mapPropTrend,
  );
}

export type NflDvpPosition = "QB" | "RB" | "WR" | "TE";

export async function getNflPropsFacingDefense(
  defense: string,
  position: NflDvpPosition,
): Promise<NflPlayerPropTrend[]> {
  const normalizedDefense = defense.trim().toUpperCase();

  const props = await getNflPlayerPropTrends();

  return props.filter(
    (prop) =>
      prop.upcomingOpponent === normalizedDefense &&
      prop.position === position,
  );
}
