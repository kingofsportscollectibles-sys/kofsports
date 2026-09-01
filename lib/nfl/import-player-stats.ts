import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";

const NFLVERSE_PLAYER_STATS_BASE_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/stats_player";

const BATCH_SIZE = 500;

const ELIGIBLE_POSITIONS = new Set([
  "QB",
  "RB",
  "FB",
  "WR",
  "TE",
]);

type NflversePlayerStatRow = {
  player_id?: string;
  player_name?: string;
  player_display_name?: string;
  position?: string;
  position_group?: string;
  season?: string;
  week?: string;
  season_type?: string;
  game_id?: string;
  team?: string;
  opponent_team?: string;

  completions?: string;
  attempts?: string;
  passing_yards?: string;
  passing_tds?: string;
  passing_interceptions?: string;

  carries?: string;
  rushing_yards?: string;
  rushing_tds?: string;

  targets?: string;
  receptions?: string;
  receiving_yards?: string;
  receiving_tds?: string;

  fumbles_total?: string;
  fumbles_lost_total?: string;
};

type NflGame = {
  id: number;
  external_game_id: string | null;
  season: number;
  week: number | null;
  game_date: string;
  home_team: string;
  away_team: string;
  game_type: string | null;
};

type PlayerStatInsert = {
  game_id: number;
  external_player_id: string;
  player_name: string;
  position: string | null;
  team: string;
  opponent: string;
  season: number;
  week: number | null;
  game_date: string;
  is_home: boolean;

  passing_completions: number | null;
  passing_attempts: number | null;
  passing_yards: number | null;
  passing_touchdowns: number | null;
  interceptions: number | null;

  rushing_attempts: number;
  rushing_yards: number;
  rushing_touchdowns: number;

  targets: number;
  receptions: number;
  receiving_yards: number;
  receiving_touchdowns: number;

  fumbles: number;
  fumbles_lost: number;

  updated_at: string;
};

export type NflPlayerStatsImportResult = {
  season: number;
  sourceRows: number;
  eligibleRows: number;
  gamesMatched: number;
  rowsUpserted: number;
  latestWeek: number | null;
  sourceAvailable: boolean;
};

function normalizeTeam(team: string | undefined): string {
  const value = (team ?? "").trim().toUpperCase();

  const aliases: Record<string, string> = {
    JAC: "JAX",
    LAR: "LA",
  };

  return aliases[value] ?? value;
}

function parseInteger(
  value: string | undefined,
  fallback = 0,
): number {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function parseNullableInteger(
  value: string | undefined,
): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.trunc(parsed);
}

function hasPassingActivity(row: NflversePlayerStatRow): boolean {
  return (
    parseInteger(row.attempts) > 0 ||
    parseInteger(row.completions) > 0 ||
    parseInteger(row.passing_yards) !== 0 ||
    parseInteger(row.passing_tds) > 0 ||
    parseInteger(row.passing_interceptions) > 0
  );
}

function isEligiblePlayer(row: NflversePlayerStatRow): boolean {
  const position = (row.position ?? "").trim().toUpperCase();

  if (ELIGIBLE_POSITIONS.has(position)) {
    return true;
  }

  // Preserve unusual offensive participation such as a non-QB
  // attempting a pass or another position recording rush/receiving work.
  return (
    hasPassingActivity(row) ||
    parseInteger(row.carries) > 0 ||
    parseInteger(row.targets) > 0 ||
    parseInteger(row.receptions) > 0 ||
    parseInteger(row.rushing_yards) !== 0 ||
    parseInteger(row.receiving_yards) !== 0
  );
}

function buildPlayerStatRow(
  source: NflversePlayerStatRow,
  game: NflGame,
): PlayerStatInsert {
  const playerName = (source.player_display_name ?? "").trim();
  const externalPlayerId = (source.player_id ?? "").trim();
  const position = (source.position ?? "").trim().toUpperCase() || null;
  const team = normalizeTeam(source.team);
  const opponent = normalizeTeam(source.opponent_team);

  const shouldStorePassing =
    position === "QB" || hasPassingActivity(source);

  return {
    game_id: game.id,
    external_player_id: externalPlayerId,
    player_name: playerName,
    position,
    team,
    opponent,
    season: game.season,
    week: game.week,
    game_date: game.game_date,
    is_home: game.home_team === team,

    passing_completions: shouldStorePassing
      ? parseNullableInteger(source.completions) ?? 0
      : null,
    passing_attempts: shouldStorePassing
      ? parseNullableInteger(source.attempts) ?? 0
      : null,
    passing_yards: shouldStorePassing
      ? parseNullableInteger(source.passing_yards) ?? 0
      : null,
    passing_touchdowns: shouldStorePassing
      ? parseNullableInteger(source.passing_tds) ?? 0
      : null,
    interceptions: shouldStorePassing
      ? parseNullableInteger(source.passing_interceptions) ?? 0
      : null,

    rushing_attempts: parseInteger(source.carries),
    rushing_yards: parseInteger(source.rushing_yards),
    rushing_touchdowns: parseInteger(source.rushing_tds),

    targets: parseInteger(source.targets),
    receptions: parseInteger(source.receptions),
    receiving_yards: parseInteger(source.receiving_yards),
    receiving_touchdowns: parseInteger(source.receiving_tds),

    fumbles: parseInteger(source.fumbles_total),
    fumbles_lost: parseInteger(source.fumbles_lost_total),

    updated_at: new Date().toISOString(),
  };
}

export async function importNflPlayerStats(
  season = 2026,
): Promise<NflPlayerStatsImportResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const sourceUrl =
    `${NFLVERSE_PLAYER_STATS_BASE_URL}/stats_player_week_${season}.csv`;

  const response = await fetch(sourceUrl, {
    cache: "no-store",
  });

  // Before the first completed games of a season, nflverse may not
  // have published the season's weekly player-stat file yet.
  if (response.status === 404) {
    return {
      season,
      sourceRows: 0,
      eligibleRows: 0,
      gamesMatched: 0,
      rowsUpserted: 0,
      latestWeek: null,
      sourceAvailable: false,
    };
  }

  if (!response.ok) {
    throw new Error(
      `Unable to download nflverse player stats: ${response.status} ${response.statusText}`,
    );
  }

  const csv = await response.text();

  const parsedRows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as NflversePlayerStatRow[];

  const seasonRows = parsedRows.filter((row) => {
    const rowSeason = parseInteger(row.season, -1);
    const seasonType = (row.season_type ?? "").trim().toUpperCase();

    return (
      rowSeason === season &&
      (seasonType === "REG" || seasonType === "POST")
    );
  });

  const eligibleRows = seasonRows.filter((row) => {
    const playerId = (row.player_id ?? "").trim();
    const playerName = (row.player_display_name ?? "").trim();
    const externalGameId = (row.game_id ?? "").trim();
    const team = normalizeTeam(row.team);
    const opponent = normalizeTeam(row.opponent_team);

    return (
      Boolean(playerId) &&
      Boolean(playerName) &&
      Boolean(externalGameId) &&
      Boolean(team) &&
      Boolean(opponent) &&
      isEligiblePlayer(row)
    );
  });

  const { data: games, error: gamesError } = await supabase
    .from("nfl_games")
    .select(
      "id, external_game_id, season, week, game_date, home_team, away_team, game_type",
    )
    .eq("season", season);

  if (gamesError) {
    throw new Error(
      `Unable to load NFL games for ${season}: ${gamesError.message}`,
    );
  }

  const gameMap = new Map<string, NflGame>();

  for (const game of (games ?? []) as NflGame[]) {
    if (game.external_game_id) {
      gameMap.set(game.external_game_id, game);
    }
  }

  const unmatchedGameIds = new Set<string>();

  for (const row of eligibleRows) {
    const externalGameId = (row.game_id ?? "").trim();

    if (!gameMap.has(externalGameId)) {
      unmatchedGameIds.add(externalGameId);
    }
  }

  if (unmatchedGameIds.size > 0) {
    const examples = Array.from(unmatchedGameIds)
      .slice(0, 10)
      .join(", ");

    throw new Error(
      [
        `Found ${unmatchedGameIds.size} nflverse game IDs that do not exist in nfl_games.`,
        `Examples: ${examples}`,
        "Import stopped before writing any player stats.",
      ].join(" "),
    );
  }

  const now = new Date().toISOString();

  const rowsToUpsert: PlayerStatInsert[] = eligibleRows.map((source) => {
    const externalGameId = (source.game_id ?? "").trim();
    const game = gameMap.get(externalGameId);

    if (!game) {
      throw new Error(
        `Unexpected missing game after validation: ${externalGameId}`,
      );
    }

    return {
      ...buildPlayerStatRow(source, game),
      updated_at: now,
    };
  });

  // Protect against unexpected duplicate player/game rows in the source.
  const dedupedRows = Array.from(
    new Map(
      rowsToUpsert.map((row) => [
        `${row.game_id}|${row.external_player_id}`,
        row,
      ]),
    ).values(),
  );

  let rowsUpserted = 0;

  for (let index = 0; index < dedupedRows.length; index += BATCH_SIZE) {
    const batch = dedupedRows.slice(index, index + BATCH_SIZE);

    const { error } = await supabase
      .from("nfl_player_game_stats")
      .upsert(batch as any, {
        onConflict: "game_id,external_player_id",
      });

    if (error) {
      throw new Error(
        `Unable to upsert NFL player stats batch: ${error.message}`,
      );
    }

    rowsUpserted += batch.length;
  }

  const weeks = eligibleRows
    .map((row) => parseInteger(row.week, -1))
    .filter((week) => week >= 0);

  const latestWeek =
    weeks.length > 0 ? Math.max(...weeks) : null;

  const matchedGameIds = new Set(
    eligibleRows.map((row) => (row.game_id ?? "").trim()),
  );

  return {
    season,
    sourceRows: seasonRows.length,
    eligibleRows: eligibleRows.length,
    gamesMatched: matchedGameIds.size,
    rowsUpserted,
    latestWeek,
    sourceAvailable: true,
  };
}