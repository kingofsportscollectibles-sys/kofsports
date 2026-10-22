import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export const NFL_RUSH_YDS_MODEL_VERSION =
  "nfl_rush_yds_v1.0" as const;

const CURRENT_SEASON_WEIGHT = 0.60;
const LAST_THREE_WEIGHT = 0.40;

const PRIOR_SEASON_MIN_ATTEMPTS = 100;
const PRIOR_SEASON_ANCHOR_GAMES = 3;

const LEAGUE_YPC_PRIOR_ATTEMPTS = 1000;

export type NflRushYardsProjection = {
  externalPlayerId: string;

  modelVersion: typeof NFL_RUSH_YDS_MODEL_VERSION;

  projectedRushingYards: number;
  projectedCarries: number;
  expectedYpc: number;

  currentSeasonGames: number;
  currentSeasonCarriesPerGame: number;
  lastThreeCarriesPerGame: number;

  priorSeasonAttempts: number;
  priorSeasonCarriesPerGame: number | null;
  priorSeasonAnchorApplied: boolean;
};

type NflRushGameStatRow = {
  external_player_id: string;
  season: number;
  week: number;
  rushing_attempts: number | null;
  rushing_yards: number | null;
  nfl_games: {
    game_type: string;
  }[];
};

async function loadRushProjectionHistory(
  externalPlayerIds: string[],
  currentSeason: number,
  targetWeek: number,
  client?: SupabaseClient,
): Promise<NflRushGameStatRow[]> {
  if (externalPlayerIds.length === 0) {
    return [];
  }

  const supabase = client ?? (await createClient());

  const { data, error } = await supabase
    .from("nfl_player_game_stats")
    .select(
      `
        external_player_id,
        season,
        week,
        rushing_attempts,
        rushing_yards,
        nfl_games!inner (
          game_type
        )
      `,
    )
    .in("external_player_id", externalPlayerIds)
    .in("season", [currentSeason - 1, currentSeason])
    .eq("nfl_games.game_type", "REG")
    .order("season", { ascending: true })
    .order("week", { ascending: true });

  if (error) {
    console.error("Failed to load NFL rush projection history:", {
      currentSeason,
      playerCount: externalPlayerIds.length,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    throw new Error(
      `Unable to load NFL rush projection history: ${error.message}`,
    );
  }

  return ((data ?? []) as NflRushGameStatRow[]).filter(
    (row) =>
      row.season === currentSeason - 1 ||
      (row.season === currentSeason && row.week < targetWeek),
  );
}

function calculateProjectedCarries(
  currentRows: NflRushGameStatRow[],
  priorRows: NflRushGameStatRow[],
): {
  projectedCarries: number;
  currentSeasonGames: number;
  currentSeasonCarriesPerGame: number;
  lastThreeCarriesPerGame: number;
  priorSeasonAttempts: number;
  priorSeasonCarriesPerGame: number | null;
  priorSeasonAnchorApplied: boolean;
} | null {
  if (currentRows.length === 0) {
    return null;
  }

  const currentSeasonAttempts = currentRows.reduce(
    (sum, row) => sum + (row.rushing_attempts ?? 0),
    0,
  );

  const currentSeasonCarriesPerGame =
    currentSeasonAttempts / currentRows.length;

  const lastThreeRows = currentRows.slice(-3);

  const lastThreeAttempts = lastThreeRows.reduce(
    (sum, row) => sum + (row.rushing_attempts ?? 0),
    0,
  );

  const lastThreeCarriesPerGame =
    lastThreeAttempts / lastThreeRows.length;

  const baseCarries =
    CURRENT_SEASON_WEIGHT * currentSeasonCarriesPerGame +
    LAST_THREE_WEIGHT * lastThreeCarriesPerGame;

  const priorSeasonAttempts = priorRows.reduce(
    (sum, row) => sum + (row.rushing_attempts ?? 0),
    0,
  );

  const priorSeasonCarriesPerGame =
    priorRows.length > 0
      ? priorSeasonAttempts / priorRows.length
      : null;

  const priorSeasonAnchorApplied =
    priorSeasonAttempts >= PRIOR_SEASON_MIN_ATTEMPTS &&
    priorSeasonCarriesPerGame !== null;

  const projectedCarries = priorSeasonAnchorApplied
    ? (
        baseCarries * currentRows.length +
        priorSeasonCarriesPerGame * PRIOR_SEASON_ANCHOR_GAMES
      ) /
      (currentRows.length + PRIOR_SEASON_ANCHOR_GAMES)
    : baseCarries;

  return {
    projectedCarries,
    currentSeasonGames: currentRows.length,
    currentSeasonCarriesPerGame,
    lastThreeCarriesPerGame,
    priorSeasonAttempts,
    priorSeasonCarriesPerGame,
    priorSeasonAnchorApplied,
  };
}

function calculateExpectedYpc(
  priorSeasonAttempts: number,
  priorSeasonYards: number,
  currentSeasonAttemptsBeforeWeek: number,
  currentSeasonYardsBeforeWeek: number,
): number | null {
  if (priorSeasonAttempts <= 0) {
    return null;
  }

  const priorSeasonYpc =
    priorSeasonYards / priorSeasonAttempts;

  return (
    priorSeasonYpc * LEAGUE_YPC_PRIOR_ATTEMPTS +
    currentSeasonYardsBeforeWeek
  ) / (
    LEAGUE_YPC_PRIOR_ATTEMPTS +
    currentSeasonAttemptsBeforeWeek
  );
}

type NflRbWeeklyRushingTotalRow = {
  season: number;
  week: number;
  rushing_attempts: number;
  rushing_yards: number;
};

async function loadRbWeeklyRushingTotals(
  currentSeason: number,
  client?: SupabaseClient,
): Promise<NflRbWeeklyRushingTotalRow[]> {
  const supabase = client ?? (await createClient());

  const { data, error } = await supabase
    .from("nfl_rb_weekly_rushing_totals")
    .select("season, week, rushing_attempts, rushing_yards")
    .in("season", [currentSeason - 1, currentSeason])
    .order("season", { ascending: true })
    .order("week", { ascending: true });

  if (error) {
    console.error("Failed to load NFL RB weekly rushing totals:", {
      currentSeason,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    throw new Error(
      `Unable to load NFL RB weekly rushing totals: ${error.message}`,
    );
  }

  return (data ?? []) as NflRbWeeklyRushingTotalRow[];
}

function calculateExpectedYpcForWeek(
  weeklyRows: NflRbWeeklyRushingTotalRow[],
  currentSeason: number,
  targetWeek: number,
): number | null {
  const priorSeasonRows = weeklyRows.filter(
    (row) => row.season === currentSeason - 1,
  );

  const currentSeasonRows = weeklyRows.filter(
    (row) =>
      row.season === currentSeason &&
      row.week < targetWeek,
  );

  const priorSeasonAttempts = priorSeasonRows.reduce(
    (sum, row) => sum + row.rushing_attempts,
    0,
  );

  const priorSeasonYards = priorSeasonRows.reduce(
    (sum, row) => sum + row.rushing_yards,
    0,
  );

  const currentSeasonAttemptsBeforeWeek =
    currentSeasonRows.reduce(
      (sum, row) => sum + row.rushing_attempts,
      0,
    );

  const currentSeasonYardsBeforeWeek =
    currentSeasonRows.reduce(
      (sum, row) => sum + row.rushing_yards,
      0,
    );

  return calculateExpectedYpc(
    priorSeasonAttempts,
    priorSeasonYards,
    currentSeasonAttemptsBeforeWeek,
    currentSeasonYardsBeforeWeek,
  );
}

export async function getNflRushYardsProjections(
  externalPlayerIds: string[],
  currentSeason: number,
  targetWeek: number,
  client?: SupabaseClient,
): Promise<Map<string, NflRushYardsProjection>> {
  const uniquePlayerIds = Array.from(
    new Set(externalPlayerIds.filter(Boolean)),
  );

  if (uniquePlayerIds.length === 0) {
    return new Map();
  }

  const [historyRows, weeklyRows] = await Promise.all([
    loadRushProjectionHistory(
      uniquePlayerIds,
      currentSeason,
      targetWeek,
      client,
    ),
    loadRbWeeklyRushingTotals(currentSeason, client),
  ]);

  const expectedYpc = calculateExpectedYpcForWeek(
    weeklyRows,
    currentSeason,
    targetWeek,
  );

  if (expectedYpc === null) {
    return new Map();
  }

  const projections = new Map<string, NflRushYardsProjection>();

  for (const externalPlayerId of uniquePlayerIds) {
    const currentRows = historyRows.filter(
      (row) =>
        row.external_player_id === externalPlayerId &&
        row.season === currentSeason &&
        row.week < targetWeek,
    );

    const priorRows = historyRows.filter(
      (row) =>
        row.external_player_id === externalPlayerId &&
        row.season === currentSeason - 1,
    );

    const carries = calculateProjectedCarries(
      currentRows,
      priorRows,
    );

    if (carries === null) {
      continue;
    }

    projections.set(externalPlayerId, {
      externalPlayerId,
      modelVersion: NFL_RUSH_YDS_MODEL_VERSION,
      projectedRushingYards:
        carries.projectedCarries * expectedYpc,
      projectedCarries: carries.projectedCarries,
      expectedYpc,
      currentSeasonGames: carries.currentSeasonGames,
      currentSeasonCarriesPerGame:
        carries.currentSeasonCarriesPerGame,
      lastThreeCarriesPerGame:
        carries.lastThreeCarriesPerGame,
      priorSeasonAttempts: carries.priorSeasonAttempts,
      priorSeasonCarriesPerGame:
        carries.priorSeasonCarriesPerGame,
      priorSeasonAnchorApplied:
        carries.priorSeasonAnchorApplied,
    });
  }

  return projections;
}

export const NFL_RECEPTIONS_MODEL_VERSION =
  "nfl_receptions_v1.0" as const;

const RECEPTIONS_SEASON_TARGET_WEIGHT = 0.70;
const RECEPTIONS_LAST_THREE_TARGET_WEIGHT = 0.30;

const RECEPTIONS_PRIOR_MIN_TARGETS = 10;
const RECEPTIONS_PRIOR_TARGET_ANCHOR_GAMES = 1;

const RECEPTIONS_PRIOR_CATCH_RATE_PSEUDO_TARGETS = 100;
const RECEPTIONS_CURRENT_CATCH_RATE_PSEUDO_TARGETS = 30;

export type NflReceptionsProjection = {
  externalPlayerId: string;

  modelVersion: typeof NFL_RECEPTIONS_MODEL_VERSION;

  projectedReceptions: number;
  projectedTargets: number;
  expectedCatchRate: number;

  currentSeasonGames: number;
  currentSeasonTargets: number;
  currentSeasonReceptions: number;
  currentSeasonTargetsPerGame: number;
  lastThreeTargetsPerGame: number;

  priorSeasonGames: number;
  priorSeasonTargets: number;
  priorSeasonReceptions: number;
  priorSeasonTargetsPerGame: number | null;
  priorSeasonAnchorApplied: boolean;

  positionCatchRate: number;
  historicalCatchRate: number;
};

type NflReceptionGameStatRow = {
  external_player_id: string;
  season: number;
  week: number;
  position: string | null;
  targets: number | null;
  receptions: number | null;
  nfl_games: {
    game_type: string;
  }[];
};

async function loadReceptionProjectionHistory(
  externalPlayerIds: string[],
  currentSeason: number,
  targetWeek: number,
  client?: SupabaseClient,
): Promise<NflReceptionGameStatRow[]> {
  if (externalPlayerIds.length === 0) {
    return [];
  }

  const supabase = client ?? (await createClient());

  const pageSize = 1000;
  const rows: NflReceptionGameStatRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("nfl_player_game_stats")
      .select(
        `
          external_player_id,
          season,
          week,
          position,
          targets,
          receptions,
          nfl_games!inner (
            game_type
          )
        `,
      )
      .in("external_player_id", externalPlayerIds)
      .in("season", [currentSeason - 1, currentSeason])
      .eq("nfl_games.game_type", "REG")
      .order("season", { ascending: true })
      .order("week", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Failed to load NFL receptions projection history:", {
        currentSeason,
        playerCount: externalPlayerIds.length,
        from,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      throw new Error(
        `Unable to load NFL receptions projection history: ${error.message}`,
      );
    }

    const page = (data ?? []) as NflReceptionGameStatRow[];

    rows.push(...page);

    if (page.length < pageSize) {
      break;
    }
  }

  return rows.filter(
    (row) =>
      row.targets !== null &&
      row.receptions !== null &&
      (
        row.season === currentSeason - 1 ||
        (row.season === currentSeason && row.week < targetWeek)
      ),
  );
}

type NflPositionReceivingTotals = {
  targets: number;
  receptions: number;
};

async function loadPriorSeasonPositionCatchRates(
  priorSeason: number,
  client?: SupabaseClient,
): Promise<Map<string, number>> {
  const supabase = client ?? (await createClient());

  const pageSize = 1000;
  const totals = new Map<string, NflPositionReceivingTotals>();

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("nfl_player_game_stats")
      .select(
        `
          position,
          targets,
          receptions,
          nfl_games!inner (
            game_type
          )
        `,
      )
      .eq("season", priorSeason)
      .eq("nfl_games.game_type", "REG")
      .in("position", ["WR", "TE", "RB"])
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Failed to load NFL position catch rates:", {
        priorSeason,
        from,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      throw new Error(
        `Unable to load NFL position catch rates: ${error.message}`,
      );
    }

    for (const row of data ?? []) {
      if (
        !row.position ||
        row.targets === null ||
        row.receptions === null
      ) {
        continue;
      }

      const current = totals.get(row.position) ?? {
        targets: 0,
        receptions: 0,
      };

      current.targets += row.targets;
      current.receptions += row.receptions;

      totals.set(row.position, current);
    }

    if ((data ?? []).length < pageSize) {
      break;
    }
  }

  const rates = new Map<string, number>();

  for (const [position, total] of totals) {
    if (total.targets > 0) {
      rates.set(
        position,
        total.receptions / total.targets,
      );
    }
  }

  return rates;
}

function calculateReceptionsProjection(
  currentRows: NflReceptionGameStatRow[],
  priorRows: NflReceptionGameStatRow[],
  positionCatchRate: number,
): Omit<
  NflReceptionsProjection,
  "externalPlayerId" | "modelVersion"
> | null {
  if (currentRows.length === 0) {
    return null;
  }

  const currentSeasonTargets = currentRows.reduce(
    (sum, row) => sum + (row.targets ?? 0),
    0,
  );

  const currentSeasonReceptions = currentRows.reduce(
    (sum, row) => sum + (row.receptions ?? 0),
    0,
  );

  const currentSeasonTargetsPerGame =
    currentSeasonTargets / currentRows.length;

  const lastThreeRows = currentRows.slice(-3);

  const lastThreeTargets = lastThreeRows.reduce(
    (sum, row) => sum + (row.targets ?? 0),
    0,
  );

  const lastThreeTargetsPerGame =
    lastThreeTargets / lastThreeRows.length;

  const baseTargets =
    RECEPTIONS_SEASON_TARGET_WEIGHT *
      currentSeasonTargetsPerGame +
    RECEPTIONS_LAST_THREE_TARGET_WEIGHT *
      lastThreeTargetsPerGame;

  const priorSeasonTargets = priorRows.reduce(
    (sum, row) => sum + (row.targets ?? 0),
    0,
  );

  const priorSeasonReceptions = priorRows.reduce(
    (sum, row) => sum + (row.receptions ?? 0),
    0,
  );

  const priorSeasonTargetsPerGame =
    priorRows.length > 0
      ? priorSeasonTargets / priorRows.length
      : null;

  const priorSeasonAnchorApplied =
    priorSeasonTargets >= RECEPTIONS_PRIOR_MIN_TARGETS &&
    priorSeasonTargetsPerGame !== null;

  const projectedTargets = priorSeasonAnchorApplied
    ? (
        baseTargets * currentRows.length +
        priorSeasonTargetsPerGame *
          RECEPTIONS_PRIOR_TARGET_ANCHOR_GAMES
      ) /
      (
        currentRows.length +
        RECEPTIONS_PRIOR_TARGET_ANCHOR_GAMES
      )
    : baseTargets;

  const historicalCatchRate =
    priorSeasonTargets > 0
      ? (
          priorSeasonReceptions +
          positionCatchRate *
            RECEPTIONS_PRIOR_CATCH_RATE_PSEUDO_TARGETS
        ) /
        (
          priorSeasonTargets +
          RECEPTIONS_PRIOR_CATCH_RATE_PSEUDO_TARGETS
        )
      : positionCatchRate;

  const expectedCatchRate =
    (
      currentSeasonReceptions +
      historicalCatchRate *
        RECEPTIONS_CURRENT_CATCH_RATE_PSEUDO_TARGETS
    ) /
    (
      currentSeasonTargets +
      RECEPTIONS_CURRENT_CATCH_RATE_PSEUDO_TARGETS
    );

  return {
    projectedReceptions:
      projectedTargets * expectedCatchRate,
    projectedTargets,
    expectedCatchRate,
    currentSeasonGames: currentRows.length,
    currentSeasonTargets,
    currentSeasonReceptions,
    currentSeasonTargetsPerGame,
    lastThreeTargetsPerGame,
    priorSeasonGames: priorRows.length,
    priorSeasonTargets,
    priorSeasonReceptions,
    priorSeasonTargetsPerGame,
    priorSeasonAnchorApplied,
    positionCatchRate,
    historicalCatchRate,
  };
}

export async function getNflReceptionsProjections(
  externalPlayerIds: string[],
  currentSeason: number,
  targetWeek: number,
  client?: SupabaseClient,
): Promise<Map<string, NflReceptionsProjection>> {
  const uniquePlayerIds = Array.from(
    new Set(externalPlayerIds.filter(Boolean)),
  );

  if (uniquePlayerIds.length === 0) {
    return new Map();
  }

  const [historyRows, positionCatchRates] = await Promise.all([
    loadReceptionProjectionHistory(
      uniquePlayerIds,
      currentSeason,
      targetWeek,
      client,
    ),
    loadPriorSeasonPositionCatchRates(
      currentSeason - 1,
      client,
    ),
  ]);

  const projections = new Map<string, NflReceptionsProjection>();

  for (const externalPlayerId of uniquePlayerIds) {
    const currentRows = historyRows.filter(
      (row) =>
        row.external_player_id === externalPlayerId &&
        row.season === currentSeason &&
        row.week < targetWeek,
    );

    const priorRows = historyRows.filter(
      (row) =>
        row.external_player_id === externalPlayerId &&
        row.season === currentSeason - 1,
    );

    if (currentRows.length === 0) {
      continue;
    }

    const position =
      currentRows.at(-1)?.position ??
      priorRows.at(-1)?.position ??
      null;

    if (
      position !== "WR" &&
      position !== "TE" &&
      position !== "RB"
    ) {
      continue;
    }

    const positionCatchRate =
      positionCatchRates.get(position);

    if (positionCatchRate === undefined) {
      continue;
    }

    const projection = calculateReceptionsProjection(
      currentRows,
      priorRows,
      positionCatchRate,
    );

    if (projection === null) {
      continue;
    }

    projections.set(externalPlayerId, {
      externalPlayerId,
      modelVersion: NFL_RECEPTIONS_MODEL_VERSION,
      ...projection,
    });
  }

  return projections;
}

export const NFL_RECEIVING_YDS_MODEL_VERSION =
  "nfl_receiving_yds_v1.0" as const;

const RECEIVING_YDS_SEASON_TARGET_WEIGHT = 0.90;
const RECEIVING_YDS_LAST_THREE_TARGET_WEIGHT = 0.10;
const RECEIVING_YDS_PRIOR_MIN_TARGETS = 20;
const RECEIVING_YDS_PRIOR_TARGET_ANCHOR_GAMES = 1;
const RECEIVING_YDS_CURRENT_YPT_PSEUDO_TARGETS = 30;

export type NflReceivingYardsProjection = {
  externalPlayerId: string;
  modelVersion: typeof NFL_RECEIVING_YDS_MODEL_VERSION;
  projectedReceivingYards: number;
  projectedTargets: number;
  expectedYardsPerTarget: number;
  currentSeasonGames: number;
  currentSeasonTargets: number;
  currentSeasonReceivingYards: number;
  currentSeasonTargetsPerGame: number;
  lastThreeTargetsPerGame: number;
  priorSeasonGames: number;
  priorSeasonTargets: number;
  priorSeasonTargetsPerGame: number | null;
  priorSeasonAnchorApplied: boolean;
  positionYardsPerTarget: number;
};

type NflReceivingYardsGameStatRow = {
  external_player_id: string;
  season: number;
  week: number;
  position: string | null;
  targets: number | null;
  receiving_yards: number | null;
  nfl_games: {
    game_type: string;
  }[];
};

async function loadReceivingYardsProjectionHistory(
  externalPlayerIds: string[],
  currentSeason: number,
  targetWeek: number,
  client?: SupabaseClient,
): Promise<NflReceivingYardsGameStatRow[]> {
  const supabase = client ?? (await createClient());
  const pageSize = 1000;
  const rows: NflReceivingYardsGameStatRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("nfl_player_game_stats")
      .select(
        `
          external_player_id,
          season,
          week,
          position,
          targets,
          receiving_yards,
          nfl_games!inner (
            game_type
          )
        `,
      )
      .in("external_player_id", externalPlayerIds)
      .in("season", [currentSeason - 1, currentSeason])
      .eq("nfl_games.game_type", "REG")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Failed to load NFL receiving yards projection history:", {
        currentSeason,
        targetWeek,
        from,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      throw new Error(
        `Unable to load NFL receiving yards projection history: ${error.message}`,
      );
    }

    const page = (data ?? []) as NflReceivingYardsGameStatRow[];

    for (const row of page) {
      if (
        row.targets === null ||
        row.receiving_yards === null
      ) {
        continue;
      }

      if (
        row.season === currentSeason &&
        row.week >= targetWeek
      ) {
        continue;
      }

      rows.push(row);
    }

    if (page.length < pageSize) {
      break;
    }
  }

  rows.sort(
    (a, b) =>
      a.season - b.season ||
      a.week - b.week,
  );

  return rows;
}

async function loadPriorSeasonPositionYardsPerTarget(
  priorSeason: number,
  client?: SupabaseClient,
): Promise<Map<string, number>> {
  const supabase = client ?? (await createClient());
  const pageSize = 1000;

  const totals = new Map<
    string,
    {
      targets: number;
      receivingYards: number;
    }
  >();

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("nfl_player_game_stats")
      .select(
        `
          id,
          position,
          targets,
          receiving_yards,
          nfl_games!inner (
            game_type
          )
        `,
      )
      .eq("season", priorSeason)
      .eq("nfl_games.game_type", "REG")
      .in("position", ["WR", "TE", "RB"])
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Failed to load NFL position yards per target:", {
        priorSeason,
        from,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      throw new Error(
        `Unable to load NFL position yards per target: ${error.message}`,
      );
    }

    for (const row of data ?? []) {
      if (
        !row.position ||
        row.targets === null ||
        row.receiving_yards === null
      ) {
        continue;
      }

      const current = totals.get(row.position) ?? {
        targets: 0,
        receivingYards: 0,
      };

      current.targets += row.targets;
      current.receivingYards += row.receiving_yards;

      totals.set(row.position, current);
    }

    if ((data ?? []).length < pageSize) {
      break;
    }
  }

  const rates = new Map<string, number>();

  for (const [position, total] of totals) {
    if (total.targets > 0) {
      rates.set(
        position,
        total.receivingYards / total.targets,
      );
    }
  }

  return rates;
}

function calculateReceivingYardsProjection(
  currentRows: NflReceivingYardsGameStatRow[],
  priorRows: NflReceivingYardsGameStatRow[],
  positionYardsPerTarget: number,
): Omit<
  NflReceivingYardsProjection,
  "externalPlayerId" | "modelVersion"
> | null {
  if (currentRows.length === 0) {
    return null;
  }

  const currentSeasonTargets = currentRows.reduce(
    (sum, row) => sum + (row.targets ?? 0),
    0,
  );

  const currentSeasonReceivingYards = currentRows.reduce(
    (sum, row) => sum + (row.receiving_yards ?? 0),
    0,
  );

  const currentSeasonTargetsPerGame =
    currentSeasonTargets / currentRows.length;

  const lastThreeRows = currentRows.slice(-3);

  const lastThreeTargets = lastThreeRows.reduce(
    (sum, row) => sum + (row.targets ?? 0),
    0,
  );

  const lastThreeTargetsPerGame =
    lastThreeTargets / lastThreeRows.length;

  const baseTargets =
    RECEIVING_YDS_SEASON_TARGET_WEIGHT *
      currentSeasonTargetsPerGame +
    RECEIVING_YDS_LAST_THREE_TARGET_WEIGHT *
      lastThreeTargetsPerGame;

  const priorSeasonTargets = priorRows.reduce(
    (sum, row) => sum + (row.targets ?? 0),
    0,
  );

  const priorSeasonTargetsPerGame =
    priorRows.length > 0
      ? priorSeasonTargets / priorRows.length
      : null;

  const priorSeasonAnchorApplied =
    priorSeasonTargets >= RECEIVING_YDS_PRIOR_MIN_TARGETS &&
    priorSeasonTargetsPerGame !== null;

  const projectedTargets = priorSeasonAnchorApplied
    ? (
        baseTargets * currentRows.length +
        priorSeasonTargetsPerGame *
          RECEIVING_YDS_PRIOR_TARGET_ANCHOR_GAMES
      ) /
      (
        currentRows.length +
        RECEIVING_YDS_PRIOR_TARGET_ANCHOR_GAMES
      )
    : baseTargets;

  const expectedYardsPerTarget =
    (
      currentSeasonReceivingYards +
      positionYardsPerTarget *
        RECEIVING_YDS_CURRENT_YPT_PSEUDO_TARGETS
    ) /
    (
      currentSeasonTargets +
      RECEIVING_YDS_CURRENT_YPT_PSEUDO_TARGETS
    );

  return {
    projectedReceivingYards:
      projectedTargets * expectedYardsPerTarget,
    projectedTargets,
    expectedYardsPerTarget,
    currentSeasonGames: currentRows.length,
    currentSeasonTargets,
    currentSeasonReceivingYards,
    currentSeasonTargetsPerGame,
    lastThreeTargetsPerGame,
    priorSeasonGames: priorRows.length,
    priorSeasonTargets,
    priorSeasonTargetsPerGame,
    priorSeasonAnchorApplied,
    positionYardsPerTarget,
  };
}

export async function getNflReceivingYardsProjections(
  externalPlayerIds: string[],
  currentSeason: number,
  targetWeek: number,
  client?: SupabaseClient,
): Promise<Map<string, NflReceivingYardsProjection>> {
  const uniquePlayerIds = Array.from(
    new Set(externalPlayerIds.filter(Boolean)),
  );

  if (uniquePlayerIds.length === 0) {
    return new Map();
  }

  const [historyRows, positionYardsPerTarget] =
    await Promise.all([
      loadReceivingYardsProjectionHistory(
        uniquePlayerIds,
        currentSeason,
        targetWeek,
        client,
      ),
      loadPriorSeasonPositionYardsPerTarget(
        currentSeason - 1,
        client,
      ),
    ]);

  const projections =
    new Map<string, NflReceivingYardsProjection>();

  for (const externalPlayerId of uniquePlayerIds) {
    const currentRows = historyRows.filter(
      (row) =>
        row.external_player_id === externalPlayerId &&
        row.season === currentSeason &&
        row.week < targetWeek,
    );

    const priorRows = historyRows.filter(
      (row) =>
        row.external_player_id === externalPlayerId &&
        row.season === currentSeason - 1,
    );

    if (currentRows.length === 0) {
      continue;
    }

    const position =
      currentRows.at(-1)?.position ??
      priorRows.at(-1)?.position ??
      null;

    if (
      position !== "WR" &&
      position !== "TE" &&
      position !== "RB"
    ) {
      continue;
    }

    const positionRate =
      positionYardsPerTarget.get(position);

    if (positionRate === undefined) {
      continue;
    }

    const projection =
      calculateReceivingYardsProjection(
        currentRows,
        priorRows,
        positionRate,
      );

    if (projection === null) {
      continue;
    }

    projections.set(externalPlayerId, {
      externalPlayerId,
      modelVersion: NFL_RECEIVING_YDS_MODEL_VERSION,
      ...projection,
    });
  }

  return projections;
}

export const NFL_PASS_YDS_MODEL_VERSION =
  "nfl_pass_yds_v1.0" as const;

const PASS_YDS_PRIOR_VOLUME_MIN_ATTEMPTS = 50;
const PASS_YDS_PRIOR_VOLUME_ANCHOR_GAMES = 3;

const PASS_YDS_PRIOR_EFFICIENCY_MIN_ATTEMPTS = 300;
const PASS_YDS_PRIOR_YPA_PSEUDO_ATTEMPTS = 200;
const PASS_YDS_CURRENT_YPA_PSEUDO_ATTEMPTS = 200;

export type NflPassingYardsProjection = {
  externalPlayerId: string;

  modelVersion: typeof NFL_PASS_YDS_MODEL_VERSION;

  projectedPassingYards: number;
  projectedAttempts: number;
  expectedYardsPerAttempt: number;

  currentSeasonGames: number;
  currentSeasonAttempts: number;
  currentSeasonPassingYards: number;
  currentSeasonAttemptsPerGame: number;

  priorSeasonGames: number;
  priorSeasonAttempts: number;
  priorSeasonPassingYards: number;
  priorSeasonAttemptsPerGame: number | null;

  priorVolumeAnchorApplied: boolean;
  priorEfficiencyAnchorApplied: boolean;

  priorLeagueYardsPerAttempt: number;
  historicalYardsPerAttempt: number;
};

type NflPassingYardsGameStatRow = {
  external_player_id: string;
  season: number;
  week: number;
  position: string | null;
  passing_attempts: number | null;
  passing_yards: number | null;
  nfl_games: {
    game_type: string;
  }[];
};

async function loadPassingYardsProjectionHistory(
  externalPlayerIds: string[],
  currentSeason: number,
  targetWeek: number,
  client?: SupabaseClient,
): Promise<NflPassingYardsGameStatRow[]> {
  if (externalPlayerIds.length === 0) {
    return [];
  }

  const supabase = client ?? (await createClient());
  const pageSize = 1000;
  const rows: NflPassingYardsGameStatRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("nfl_player_game_stats")
      .select(
        `
          external_player_id,
          season,
          week,
          position,
          passing_attempts,
          passing_yards,
          nfl_games!inner (
            game_type
          )
        `,
      )
      .in("external_player_id", externalPlayerIds)
      .in("season", [currentSeason - 1, currentSeason])
      .eq("nfl_games.game_type", "REG")
      .order("season", { ascending: true })
      .order("week", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(
        "Failed to load NFL passing yards projection history:",
        {
          currentSeason,
          playerCount: externalPlayerIds.length,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
      );

      throw new Error(
        `Unable to load NFL passing yards projection history: ${error.message}`,
      );
    }

    const page =
      (data ?? []) as NflPassingYardsGameStatRow[];

    for (const row of page) {
      if (
        row.passing_attempts === null ||
        row.passing_yards === null
      ) {
        continue;
      }

      if (
        row.season === currentSeason &&
        row.week >= targetWeek
      ) {
        continue;
      }

      rows.push(row);
    }

    if (page.length < pageSize) {
      break;
    }
  }

  return rows;
}

async function loadPriorSeasonLeagueQbYpa(
  priorSeason: number,
  client?: SupabaseClient,
): Promise<number | null> {
  const supabase = client ?? (await createClient());
  const pageSize = 1000;

  let attempts = 0;
  let yards = 0;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("nfl_player_game_stats")
      .select(
        `
          id,
          position,
          passing_attempts,
          passing_yards,
          nfl_games!inner (
            game_type
          )
        `,
      )
      .eq("season", priorSeason)
      .eq("position", "QB")
      .eq("nfl_games.game_type", "REG")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(
        "Failed to load prior-season NFL league QB YPA:",
        {
          priorSeason,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
      );

      throw new Error(
        `Unable to load prior-season NFL league QB YPA: ${error.message}`,
      );
    }

    const page = data ?? [];

    for (const row of page) {
      if (
        row.passing_attempts === null ||
        row.passing_yards === null ||
        row.passing_attempts <= 0
      ) {
        continue;
      }

      attempts += row.passing_attempts;
      yards += row.passing_yards;
    }

    if (page.length < pageSize) {
      break;
    }
  }

  if (attempts <= 0) {
    return null;
  }

  return yards / attempts;
}

function calculatePassingYardsProjection(
  currentRows: NflPassingYardsGameStatRow[],
  priorRows: NflPassingYardsGameStatRow[],
  priorLeagueYardsPerAttempt: number,
): Omit<
  NflPassingYardsProjection,
  "externalPlayerId" | "modelVersion"
> | null {
  if (currentRows.length === 0) {
    return null;
  }

  const currentSeasonAttempts = currentRows.reduce(
    (sum, row) => sum + (row.passing_attempts ?? 0),
    0,
  );

  const currentSeasonPassingYards = currentRows.reduce(
    (sum, row) => sum + (row.passing_yards ?? 0),
    0,
  );

  if (currentSeasonAttempts <= 0) {
    return null;
  }

  const currentSeasonAttemptsPerGame =
    currentSeasonAttempts / currentRows.length;

  const priorSeasonAttempts = priorRows.reduce(
    (sum, row) => sum + (row.passing_attempts ?? 0),
    0,
  );

  const priorSeasonPassingYards = priorRows.reduce(
    (sum, row) => sum + (row.passing_yards ?? 0),
    0,
  );

  const priorSeasonAttemptsPerGame =
    priorRows.length > 0
      ? priorSeasonAttempts / priorRows.length
      : null;

  const priorVolumeAnchorApplied =
    priorSeasonAttempts >=
      PASS_YDS_PRIOR_VOLUME_MIN_ATTEMPTS &&
    priorSeasonAttemptsPerGame !== null;

  const projectedAttempts = priorVolumeAnchorApplied
    ? (
        currentSeasonAttemptsPerGame *
          currentRows.length +
        priorSeasonAttemptsPerGame *
          PASS_YDS_PRIOR_VOLUME_ANCHOR_GAMES
      ) /
      (
        currentRows.length +
        PASS_YDS_PRIOR_VOLUME_ANCHOR_GAMES
      )
    : currentSeasonAttemptsPerGame;

  const priorEfficiencyAnchorApplied =
    priorSeasonAttempts >=
    PASS_YDS_PRIOR_EFFICIENCY_MIN_ATTEMPTS;

  const historicalYardsPerAttempt =
    priorEfficiencyAnchorApplied
      ? (
          priorSeasonPassingYards +
          priorLeagueYardsPerAttempt *
            PASS_YDS_PRIOR_YPA_PSEUDO_ATTEMPTS
        ) /
        (
          priorSeasonAttempts +
          PASS_YDS_PRIOR_YPA_PSEUDO_ATTEMPTS
        )
      : priorLeagueYardsPerAttempt;

  const expectedYardsPerAttempt =
    (
      currentSeasonPassingYards +
      historicalYardsPerAttempt *
        PASS_YDS_CURRENT_YPA_PSEUDO_ATTEMPTS
    ) /
    (
      currentSeasonAttempts +
      PASS_YDS_CURRENT_YPA_PSEUDO_ATTEMPTS
    );

  return {
    projectedPassingYards:
      projectedAttempts * expectedYardsPerAttempt,
    projectedAttempts,
    expectedYardsPerAttempt,

    currentSeasonGames: currentRows.length,
    currentSeasonAttempts,
    currentSeasonPassingYards,
    currentSeasonAttemptsPerGame,

    priorSeasonGames: priorRows.length,
    priorSeasonAttempts,
    priorSeasonPassingYards,
    priorSeasonAttemptsPerGame,

    priorVolumeAnchorApplied,
    priorEfficiencyAnchorApplied,

    priorLeagueYardsPerAttempt,
    historicalYardsPerAttempt,
  };
}

export async function getNflPassingYardsProjections(
  externalPlayerIds: string[],
  currentSeason: number,
  targetWeek: number,
  client?: SupabaseClient,
): Promise<Map<string, NflPassingYardsProjection>> {
  const uniquePlayerIds = Array.from(
    new Set(externalPlayerIds.filter(Boolean)),
  );

  if (uniquePlayerIds.length === 0) {
    return new Map();
  }

  const [historyRows, priorLeagueYardsPerAttempt] =
    await Promise.all([
      loadPassingYardsProjectionHistory(
        uniquePlayerIds,
        currentSeason,
        targetWeek,
        client,
      ),
      loadPriorSeasonLeagueQbYpa(
        currentSeason - 1,
        client,
      ),
    ]);

  if (priorLeagueYardsPerAttempt === null) {
    return new Map();
  }

  const projections =
    new Map<string, NflPassingYardsProjection>();

  for (const externalPlayerId of uniquePlayerIds) {
    const currentRows = historyRows.filter(
      (row) =>
        row.external_player_id === externalPlayerId &&
        row.season === currentSeason &&
        row.week < targetWeek,
    );

    const priorRows = historyRows.filter(
      (row) =>
        row.external_player_id === externalPlayerId &&
        row.season === currentSeason - 1,
    );

    if (currentRows.length === 0) {
      continue;
    }

    const position =
      currentRows.at(-1)?.position ??
      priorRows.at(-1)?.position ??
      null;

    if (position !== "QB") {
      continue;
    }

    const projection =
      calculatePassingYardsProjection(
        currentRows,
        priorRows,
        priorLeagueYardsPerAttempt,
      );

    if (projection === null) {
      continue;
    }

    projections.set(externalPlayerId, {
      externalPlayerId,
      modelVersion: NFL_PASS_YDS_MODEL_VERSION,
      ...projection,
    });
  }

  return projections;
}

/* -------------------------------------------------------------------------- */
/* QB Rushing Yards Projection                                                */
/* -------------------------------------------------------------------------- */

export const NFL_QB_RUSH_YDS_MODEL_VERSION =
  "nfl_qb_rush_yds_v1.0" as const;

const QB_RUSH_PRIOR_PLAYER_ANCHOR_GAMES = 1;
const QB_RUSH_DEFENSE_PRIOR_GAMES = 3;
const QB_RUSH_MATCHUP_WEIGHT = 0.50;

export type NflQbRushYardsProjection = {
  externalPlayerId: string;
  modelVersion: typeof NFL_QB_RUSH_YDS_MODEL_VERSION;

  projectedRushingYards: number;

  currentSeasonGames: number;
  currentSeasonRushingYardsPerGame: number;

  priorSeasonGames: number;
  priorSeasonRushingYardsPerGame: number | null;
  priorSeasonAnchorApplied: boolean;

  baselineRushingYards: number;

  opponent: string;
  opponentCurrentSeasonGames: number;
  opponentAdjustedQbRushingYardsAllowedPerGame: number;
  priorLeagueQbRushingYardsPerGame: number;
  matchupMultiplier: number;
};

export type NflQbRushProjectionInput = {
  externalPlayerId: string;
  opponent: string;
};

type NflQbRushGameStatRow = {
  external_player_id: string;
  season: number;
  week: number;
  position: string | null;
  team: string | null;
  opponent: string | null;
  rushing_yards: number | null;
  nfl_games: {
    game_type: string;
  }[];
};

async function loadQbRushProjectionHistory(
  currentSeason: number,
  targetWeek: number,
  client?: SupabaseClient,
): Promise<NflQbRushGameStatRow[]> {
  const supabase = client ?? (await createClient());
  const pageSize = 1000;
  const rows: NflQbRushGameStatRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("nfl_player_game_stats")
      .select(
        `
          external_player_id,
          season,
          week,
          position,
          team,
          opponent,
          rushing_yards,
          nfl_games!inner (
            game_type
          )
        `,
      )
      .in("season", [currentSeason - 1, currentSeason])
      .eq("position", "QB")
      .eq("nfl_games.game_type", "REG")
      .order("season", { ascending: true })
      .order("week", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(
        "Failed to load NFL QB rushing projection history:",
        {
          currentSeason,
          targetWeek,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
      );

      throw new Error(
        `Unable to load NFL QB rushing projection history: ${error.message}`,
      );
    }

    const page = (data ?? []) as NflQbRushGameStatRow[];

    for (const row of page) {
      if (
        row.season === currentSeason &&
        row.week >= targetWeek
      ) {
        continue;
      }

      rows.push(row);
    }

    if (page.length < pageSize) {
      break;
    }
  }

  return rows;
}

function calculatePriorLeagueQbRushingYardsPerGame(
  rows: NflQbRushGameStatRow[],
  priorSeason: number,
): number | null {
  const offenseGameTotals = new Map<string, number>();

  for (const row of rows) {
    if (
      row.season !== priorSeason ||
      !row.team ||
      !row.opponent
    ) {
      continue;
    }

    const key = [
      row.season,
      row.week,
      row.team,
      row.opponent,
    ].join(":");

    offenseGameTotals.set(
      key,
      (offenseGameTotals.get(key) ?? 0) +
        (row.rushing_yards ?? 0),
    );
  }

  if (offenseGameTotals.size === 0) {
    return null;
  }

  const totalYards = Array.from(
    offenseGameTotals.values(),
  ).reduce((sum, yards) => sum + yards, 0);

  return totalYards / offenseGameTotals.size;
}

function calculatePregameOpponentQbRushAllowance(
  rows: NflQbRushGameStatRow[],
  opponent: string,
  currentSeason: number,
  targetWeek: number,
  priorLeagueQbRushingYardsPerGame: number,
): {
  adjustedYardsAllowedPerGame: number;
  currentSeasonGames: number;
} {
  const defenseGameTotals = new Map<string, number>();

  for (const row of rows) {
    if (
      row.season !== currentSeason ||
      row.week >= targetWeek ||
      row.opponent !== opponent ||
      !row.team
    ) {
      continue;
    }

    const key = [
      row.season,
      row.week,
      row.team,
      row.opponent,
    ].join(":");

    defenseGameTotals.set(
      key,
      (defenseGameTotals.get(key) ?? 0) +
        (row.rushing_yards ?? 0),
    );
  }

  const currentSeasonGames = defenseGameTotals.size;

  const currentSeasonYards = Array.from(
    defenseGameTotals.values(),
  ).reduce((sum, yards) => sum + yards, 0);

  const adjustedYardsAllowedPerGame =
    (
      currentSeasonYards +
      priorLeagueQbRushingYardsPerGame *
        QB_RUSH_DEFENSE_PRIOR_GAMES
    ) /
    (
      currentSeasonGames +
      QB_RUSH_DEFENSE_PRIOR_GAMES
    );

  return {
    adjustedYardsAllowedPerGame,
    currentSeasonGames,
  };
}

export async function getNflQbRushYardsProjections(
  inputs: NflQbRushProjectionInput[],
  currentSeason: number,
  targetWeek: number,
  client?: SupabaseClient,
): Promise<Map<string, NflQbRushYardsProjection>> {
  const uniqueInputs = Array.from(
    new Map(
      inputs
        .filter(
          (input) =>
            Boolean(input.externalPlayerId) &&
            Boolean(input.opponent),
        )
        .map((input) => [
          input.externalPlayerId,
          input,
        ]),
    ).values(),
  );

  if (uniqueInputs.length === 0) {
    return new Map();
  }

  const rows = await loadQbRushProjectionHistory(
    currentSeason,
    targetWeek,
    client,
  );

  const priorLeagueQbRushingYardsPerGame =
    calculatePriorLeagueQbRushingYardsPerGame(
      rows,
      currentSeason - 1,
    );

  if (priorLeagueQbRushingYardsPerGame === null) {
    return new Map();
  }

  const projections =
    new Map<string, NflQbRushYardsProjection>();

  for (const input of uniqueInputs) {
    const playerRows = rows.filter(
      (row) =>
        row.external_player_id === input.externalPlayerId,
    );

    const currentRows = playerRows.filter(
      (row) =>
        row.season === currentSeason &&
        row.week < targetWeek,
    );

    if (currentRows.length === 0) {
      continue;
    }

    const priorRows = playerRows.filter(
      (row) => row.season === currentSeason - 1,
    );

    const currentSeasonRushingYards =
      currentRows.reduce(
        (sum, row) => sum + (row.rushing_yards ?? 0),
        0,
      );

    const currentSeasonRushingYardsPerGame =
      currentSeasonRushingYards / currentRows.length;

    const priorSeasonRushingYardsPerGame =
      priorRows.length > 0
        ? priorRows.reduce(
            (sum, row) =>
              sum + (row.rushing_yards ?? 0),
            0,
          ) / priorRows.length
        : null;

    const priorSeasonAnchorApplied =
      priorSeasonRushingYardsPerGame !== null;

    const baselineRushingYards =
      priorSeasonAnchorApplied
        ? (
            currentSeasonRushingYardsPerGame *
              currentRows.length +
            priorSeasonRushingYardsPerGame *
              QB_RUSH_PRIOR_PLAYER_ANCHOR_GAMES
          ) /
          (
            currentRows.length +
            QB_RUSH_PRIOR_PLAYER_ANCHOR_GAMES
          )
        : currentSeasonRushingYardsPerGame;

    const opponentAllowance =
      calculatePregameOpponentQbRushAllowance(
        rows,
        input.opponent,
        currentSeason,
        targetWeek,
        priorLeagueQbRushingYardsPerGame,
      );

    const matchupMultiplier =
      opponentAllowance.adjustedYardsAllowedPerGame /
      priorLeagueQbRushingYardsPerGame;

    const fullMatchupProjection =
      baselineRushingYards * matchupMultiplier;

    const projectedRushingYards =
      baselineRushingYards *
        (1 - QB_RUSH_MATCHUP_WEIGHT) +
      fullMatchupProjection *
        QB_RUSH_MATCHUP_WEIGHT;

    projections.set(input.externalPlayerId, {
      externalPlayerId: input.externalPlayerId,
      modelVersion: NFL_QB_RUSH_YDS_MODEL_VERSION,

      projectedRushingYards,

      currentSeasonGames: currentRows.length,
      currentSeasonRushingYardsPerGame,

      priorSeasonGames: priorRows.length,
      priorSeasonRushingYardsPerGame,
      priorSeasonAnchorApplied,

      baselineRushingYards,

      opponent: input.opponent,
      opponentCurrentSeasonGames:
        opponentAllowance.currentSeasonGames,
      opponentAdjustedQbRushingYardsAllowedPerGame:
        opponentAllowance.adjustedYardsAllowedPerGame,
      priorLeagueQbRushingYardsPerGame,
      matchupMultiplier,
    });
  }

  return projections;
}
