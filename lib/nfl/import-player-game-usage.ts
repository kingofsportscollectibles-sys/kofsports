import { gunzipSync } from "node:zlib";

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";

const BATCH_SIZE = 500;

const SKILL_POSITIONS = new Set(["QB", "RB", "WR", "TE"]);

const NFLVERSE_SNAP_BASE_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/snap_counts";

const NFLVERSE_PBP_BASE_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/pbp";

const NFLVERSE_PLAYERS_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/players/players.csv";

type SnapRow = {
  game_id?: string;
  season?: string;
  game_type?: string;
  week?: string;
  player?: string;
  pfr_player_id?: string;
  position?: string;
  team?: string;
  opponent?: string;
  offense_snaps?: string;
  offense_pct?: string;
};

type PbpRow = {
  game_id?: string;
  week?: string;
  posteam?: string;
  defteam?: string;
  yardline_100?: string;
  rush_attempt?: string;
  pass_attempt?: string;
  rusher_player_id?: string;
  rusher_player_name?: string;
  receiver_player_id?: string;
  receiver_player_name?: string;
  complete_pass?: string;
  rush_touchdown?: string;
  pass_touchdown?: string;
};

type PlayerRow = {
  gsis_id?: string;
  pfr_id?: string;
  display_name?: string;
  position?: string;
};

type UsageRow = {
  external_game_id: string;
  external_player_id: string;
  season: number;
  week: number;
  game_type: string | null;
  player_name: string | null;
  position: string | null;
  team: string | null;
  opponent: string | null;
  offensive_snaps: number | null;
  offensive_snap_pct: number | null;
  carries: number;
  targets: number;
  receptions: number;
  red_zone_carries: number;
  red_zone_targets: number;
  inside_10_carries: number;
  inside_10_targets: number;
  inside_5_carries: number;
  inside_5_targets: number;
  rushing_tds: number;
  receiving_tds: number;
  total_tds: number;
};

type PbpUsage = {
  external_game_id: string;
  external_player_id: string;
  week: number | null;
  player_name: string | null;
  position: string | null;
  team: string | null;
  opponent: string | null;
  carries: number;
  targets: number;
  receptions: number;
  red_zone_carries: number;
  red_zone_targets: number;
  inside_10_carries: number;
  inside_10_targets: number;
  inside_5_carries: number;
  inside_5_targets: number;
  rushing_tds: number;
  receiving_tds: number;
};

export type NflPlayerGameUsageImportResult = {
  season: number;
  snapRows: number;
  matchedSnapRows: number;
  unmatchedSnapRows: number;
  pbpRows: number;
  usageRows: number;
  rowsWithSnapData: number;
  pbpOnlyRows: number;
  rowsUpserted: number;
  latestWeek: number | null;
  sourceAvailable: boolean;
};

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function normalizeTeam(value: string | undefined): string {
  const team = clean(value).toUpperCase();

  const aliases: Record<string, string> = {
    JAC: "JAX",
    LAR: "LA",
  };

  return aliases[team] ?? team;
}

function numberValue(
  value: string | undefined,
  fallback = 0,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(
  value: string | undefined,
): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function isOne(value: string | undefined): boolean {
  return numberValue(value) === 1;
}

function usageKey(
  gameId: string,
  playerId: string,
): string {
  return `${gameId}|${playerId}`;
}

async function fetchText(
  url: string,
): Promise<string | null> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Unable to download ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
}

async function fetchGzipText(
  url: string,
): Promise<string | null> {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Unable to download ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const compressed = Buffer.from(
    await response.arrayBuffer(),
  );

  return gunzipSync(compressed).toString("utf8");
}

function createEmptyPbpUsage(
  gameId: string,
  playerId: string,
): PbpUsage {
  return {
    external_game_id: gameId,
    external_player_id: playerId,
    week: null,
    player_name: null,
    position: null,
    team: null,
    opponent: null,
    carries: 0,
    targets: 0,
    receptions: 0,
    red_zone_carries: 0,
    red_zone_targets: 0,
    inside_10_carries: 0,
    inside_10_targets: 0,
    inside_5_carries: 0,
    inside_5_targets: 0,
    rushing_tds: 0,
    receiving_tds: 0,
  };
}

export async function importNflPlayerGameUsage(
  season = 2026,
): Promise<NflPlayerGameUsageImportResult> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL.",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const snapUrl =
    `${NFLVERSE_SNAP_BASE_URL}/snap_counts_${season}.csv`;

  const pbpUrl =
    `${NFLVERSE_PBP_BASE_URL}/play_by_play_${season}.csv.gz`;

  const [snapCsv, pbpCsv, playersCsv] =
    await Promise.all([
      fetchText(snapUrl),
      fetchGzipText(pbpUrl),
      fetchText(NFLVERSE_PLAYERS_URL),
    ]);

  if (!snapCsv || !pbpCsv) {
    return {
      season,
      snapRows: 0,
      matchedSnapRows: 0,
      unmatchedSnapRows: 0,
      pbpRows: 0,
      usageRows: 0,
      rowsWithSnapData: 0,
      pbpOnlyRows: 0,
      rowsUpserted: 0,
      latestWeek: null,
      sourceAvailable: false,
    };
  }

  if (!playersCsv) {
    throw new Error(
      "NFLverse player identity file is unavailable.",
    );
  }

  const snapRows = parse(snapCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as SnapRow[];

  const pbpRows = parse(pbpCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as PbpRow[];

  const playerRows = parse(playersCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as PlayerRow[];

  const pfrToPlayer = new Map<
    string,
    {
      gsisId: string;
      displayName: string | null;
    }
  >();

  const gsisToPlayer = new Map<
    string,
    {
      displayName: string | null;
      position: string | null;
    }
  >();

  for (const player of playerRows) {
    const gsisId = clean(player.gsis_id);
    const pfrId = clean(player.pfr_id);
    const displayName =
      clean(player.display_name) || null;
    const position =
      clean(player.position).toUpperCase() || null;

    if (!gsisId) {
      continue;
    }

    if (!gsisToPlayer.has(gsisId)) {
      gsisToPlayer.set(gsisId, {
        displayName,
        position,
      });
    }

    if (pfrId && !pfrToPlayer.has(pfrId)) {
      pfrToPlayer.set(pfrId, {
        gsisId,
        displayName,
      });
    }
  }

  const usageMap = new Map<string, UsageRow>();

  let eligibleSnapRows = 0;
  let matchedSnapRows = 0;
  let unmatchedSnapRows = 0;

  for (const snap of snapRows) {
    const position =
      clean(snap.position).toUpperCase();

    if (!SKILL_POSITIONS.has(position)) {
      continue;
    }

    eligibleSnapRows += 1;

    const gameId = clean(snap.game_id);
    const pfrPlayerId = clean(
      snap.pfr_player_id,
    );

    if (!gameId || !pfrPlayerId) {
      unmatchedSnapRows += 1;
      continue;
    }

    const identity = pfrToPlayer.get(
      pfrPlayerId,
    );

    if (!identity) {
      unmatchedSnapRows += 1;
      continue;
    }

    matchedSnapRows += 1;

    const week = numberValue(
      snap.week,
      -1,
    );

    if (week < 0) {
      continue;
    }

    const key = usageKey(
      gameId,
      identity.gsisId,
    );

    usageMap.set(key, {
      external_game_id: gameId,
      external_player_id:
        identity.gsisId,
      season,
      week,
      game_type:
        clean(snap.game_type) || "REG",
      player_name:
        identity.displayName ||
        clean(snap.player) ||
        null,
      position,
      team:
        normalizeTeam(snap.team) || null,
      opponent:
        normalizeTeam(snap.opponent) ||
        null,
      offensive_snaps: nullableNumber(
        snap.offense_snaps,
      ),
      offensive_snap_pct:
        nullableNumber(snap.offense_pct),
      carries: 0,
      targets: 0,
      receptions: 0,
      red_zone_carries: 0,
      red_zone_targets: 0,
      inside_10_carries: 0,
      inside_10_targets: 0,
      inside_5_carries: 0,
      inside_5_targets: 0,
      rushing_tds: 0,
      receiving_tds: 0,
      total_tds: 0,
    });
  }

  const pbpUsageMap =
    new Map<string, PbpUsage>();

  for (const play of pbpRows) {
    const gameId = clean(play.game_id);

    if (!gameId) {
      continue;
    }

    const weekNumber = numberValue(
      play.week,
      -1,
    );

    const team =
      normalizeTeam(play.posteam) || null;

    const opponent =
      normalizeTeam(play.defteam) || null;

    const yardline =
      nullableNumber(play.yardline_100);

    if (
      isOne(play.rush_attempt) &&
      clean(play.rusher_player_id)
    ) {
      const playerId = clean(
        play.rusher_player_id,
      );

      const key = usageKey(
        gameId,
        playerId,
      );

      const current =
        pbpUsageMap.get(key) ??
        createEmptyPbpUsage(
          gameId,
          playerId,
        );

      current.week =
        weekNumber >= 0
          ? weekNumber
          : current.week;

      current.team =
        current.team ?? team;

      current.opponent =
        current.opponent ?? opponent;

      current.player_name =
        current.player_name ??
        clean(
          play.rusher_player_name,
        ) ??
        null;

      current.carries += 1;

      if (
        yardline !== null &&
        yardline <= 20
      ) {
        current.red_zone_carries += 1;
      }

      if (
        yardline !== null &&
        yardline <= 10
      ) {
        current.inside_10_carries += 1;
      }

      if (
        yardline !== null &&
        yardline <= 5
      ) {
        current.inside_5_carries += 1;
      }

      if (isOne(play.rush_touchdown)) {
        current.rushing_tds += 1;
      }

      pbpUsageMap.set(key, current);
    }

    if (
      isOne(play.pass_attempt) &&
      clean(play.receiver_player_id)
    ) {
      const playerId = clean(
        play.receiver_player_id,
      );

      const key = usageKey(
        gameId,
        playerId,
      );

      const current =
        pbpUsageMap.get(key) ??
        createEmptyPbpUsage(
          gameId,
          playerId,
        );

      current.week =
        weekNumber >= 0
          ? weekNumber
          : current.week;

      current.team =
        current.team ?? team;

      current.opponent =
        current.opponent ?? opponent;

      current.player_name =
        current.player_name ??
        clean(
          play.receiver_player_name,
        ) ??
        null;

      current.targets += 1;

      if (isOne(play.complete_pass)) {
        current.receptions += 1;
      }

      if (
        yardline !== null &&
        yardline <= 20
      ) {
        current.red_zone_targets += 1;
      }

      if (
        yardline !== null &&
        yardline <= 10
      ) {
        current.inside_10_targets += 1;
      }

      if (
        yardline !== null &&
        yardline <= 5
      ) {
        current.inside_5_targets += 1;
      }

      if (isOne(play.pass_touchdown)) {
        current.receiving_tds += 1;
      }

      pbpUsageMap.set(key, current);
    }
  }

  for (const [key, pbpUsage] of pbpUsageMap) {
    const identity =
      gsisToPlayer.get(
        pbpUsage.external_player_id,
      );

    const position =
      identity?.position?.toUpperCase() ??
      null;

    const existing =
      usageMap.get(key);

    if (existing) {
      existing.carries =
        pbpUsage.carries;

      existing.targets =
        pbpUsage.targets;

      existing.receptions =
        pbpUsage.receptions;

      existing.red_zone_carries =
        pbpUsage.red_zone_carries;

      existing.red_zone_targets =
        pbpUsage.red_zone_targets;

      existing.inside_10_carries =
        pbpUsage.inside_10_carries;

      existing.inside_10_targets =
        pbpUsage.inside_10_targets;

      existing.inside_5_carries =
        pbpUsage.inside_5_carries;

      existing.inside_5_targets =
        pbpUsage.inside_5_targets;

      existing.rushing_tds =
        pbpUsage.rushing_tds;

      existing.receiving_tds =
        pbpUsage.receiving_tds;

      existing.total_tds =
        pbpUsage.rushing_tds +
        pbpUsage.receiving_tds;

      continue;
    }

    if (
      !position ||
      !SKILL_POSITIONS.has(position) ||
      pbpUsage.week === null
    ) {
      continue;
    }

    usageMap.set(key, {
      external_game_id:
        pbpUsage.external_game_id,
      external_player_id:
        pbpUsage.external_player_id,
      season,
      week: pbpUsage.week,
      game_type: "REG",
      player_name:
        identity?.displayName ??
        pbpUsage.player_name,
      position,
      team: pbpUsage.team,
      opponent: pbpUsage.opponent,
      offensive_snaps: null,
      offensive_snap_pct: null,
      carries: pbpUsage.carries,
      targets: pbpUsage.targets,
      receptions: pbpUsage.receptions,
      red_zone_carries:
        pbpUsage.red_zone_carries,
      red_zone_targets:
        pbpUsage.red_zone_targets,
      inside_10_carries:
        pbpUsage.inside_10_carries,
      inside_10_targets:
        pbpUsage.inside_10_targets,
      inside_5_carries:
        pbpUsage.inside_5_carries,
      inside_5_targets:
        pbpUsage.inside_5_targets,
      rushing_tds:
        pbpUsage.rushing_tds,
      receiving_tds:
        pbpUsage.receiving_tds,
      total_tds:
        pbpUsage.rushing_tds +
        pbpUsage.receiving_tds,
    });
  }

  const usageRows =
    Array.from(usageMap.values());

  const rowsWithSnapData =
    usageRows.filter(
      (row) =>
        row.offensive_snaps !== null,
    ).length;

  const pbpOnlyRows =
    usageRows.length -
    rowsWithSnapData;

  let rowsUpserted = 0;

  for (
    let index = 0;
    index < usageRows.length;
    index += BATCH_SIZE
  ) {
    const batch = usageRows.slice(
      index,
      index + BATCH_SIZE,
    );

    const { error } = await supabase
      .from("nfl_player_game_usage")
      .upsert(batch, {
        onConflict:
          "external_game_id,external_player_id",
      });

    if (error) {
      throw new Error(
        `Unable to upsert NFL player-game usage batch: ${error.message}`,
      );
    }

    rowsUpserted += batch.length;
  }

  const weeks = usageRows
    .map((row) => row.week)
    .filter((week) => week >= 0);

  const latestWeek =
    weeks.length > 0
      ? Math.max(...weeks)
      : null;

  return {
    season,
    snapRows: eligibleSnapRows,
    matchedSnapRows,
    unmatchedSnapRows,
    pbpRows: pbpRows.length,
    usageRows: usageRows.length,
    rowsWithSnapData,
    pbpOnlyRows,
    rowsUpserted,
    latestWeek,
    sourceAvailable: true,
  };
}