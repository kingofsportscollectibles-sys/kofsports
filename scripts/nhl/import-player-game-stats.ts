import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const DEFAULT_SEASONS = [
  20232024,
  20242025,
  20252026,
] as const;

type NhlPlayer = {
  id: number;
  player_name: string;
  position: string;
};

type NhlGameLogEntry = {
  gameId?: number;
  teamAbbrev?: string;
  homeRoadFlag?: string;
  gameDate?: string;
  opponentAbbrev?: string;

  goals?: number;
  assists?: number;
  points?: number;
  plusMinus?: number;
  powerPlayGoals?: number;
  powerPlayPoints?: number;
  gameWinningGoals?: number;
  otGoals?: number;
  shots?: number;
  shifts?: number;
  shorthandedGoals?: number;
  shorthandedPoints?: number;
  pim?: number;
  toi?: string;

  gamesStarted?: number;
  decision?: string;
  shotsAgainst?: number;
  goalsAgainst?: number;
  savePctg?: number;
  shutouts?: number;
};

type NhlGameLogResponse = {
  seasonId?: number;
  gameTypeId?: number;
  gameLog?: NhlGameLogEntry[];
};

function toiToSeconds(value?: string): number | null {
  if (!value) {
    return null;
  }

  const parts = value.split(":").map(Number);

  if (
    parts.length !== 2 ||
    parts.some((part) => !Number.isFinite(part))
  ) {
    return null;
  }

  return parts[0] * 60 + parts[1];
}

async function fetchGameLog(
  playerId: number,
  season: number
): Promise<NhlGameLogResponse> {
  const url =
    `https://api-web.nhle.com/v1/player/` +
    `${playerId}/game-log/${season}/2`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `NHL game log request failed for player ` +
        `${playerId}, season ${season}: ` +
        `${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as NhlGameLogResponse;
}

async function getPlayers(
  playerId?: number
): Promise<NhlPlayer[]> {
  let query = supabase
    .from("nhl_players")
    .select("id,player_name,position")
    .order("id");

  if (playerId) {
    query = query.eq("id", playerId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Unable to load NHL players: ${error.message}`
    );
  }

  return (data ?? []) as NhlPlayer[];
}

async function importPlayerSeason(
  player: NhlPlayer,
  season: number
): Promise<number> {
  const response = await fetchGameLog(
    player.id,
    season
  );

  const entries = response.gameLog ?? [];

  if (entries.length === 0) {
    return 0;
  }

  const rows = entries.flatMap((game) => {
    if (
      !game.gameId ||
      !game.gameDate ||
      !game.teamAbbrev ||
      !game.opponentAbbrev
    ) {
      return [];
    }

    const isGoalie = player.position === "G";

    const shotsAgainst =
      game.shotsAgainst ?? null;

    const goalsAgainst =
      game.goalsAgainst ?? null;

    const saves =
      isGoalie &&
      shotsAgainst !== null &&
      goalsAgainst !== null
        ? shotsAgainst - goalsAgainst
        : null;

    return [
      {
        game_id: game.gameId,
        player_id: player.id,
        season,
        game_type: 2,
        game_date: game.gameDate,
        player_name: player.player_name,
        team: game.teamAbbrev,
        opponent: game.opponentAbbrev,
        position: player.position,
        is_home: game.homeRoadFlag === "H",

        goals: game.goals ?? null,
        assists: game.assists ?? null,
        points: game.points ?? null,
        plus_minus: game.plusMinus ?? null,
        power_play_goals:
          game.powerPlayGoals ?? null,
        power_play_points:
          game.powerPlayPoints ?? null,
        game_winning_goals:
          game.gameWinningGoals ?? null,
        overtime_goals: game.otGoals ?? null,
        shots: game.shots ?? null,
        shifts: game.shifts ?? null,
        shorthanded_goals:
          game.shorthandedGoals ?? null,
        shorthanded_points:
          game.shorthandedPoints ?? null,
        penalty_minutes: game.pim ?? null,
        time_on_ice_seconds:
          toiToSeconds(game.toi),

        games_started:
          game.gamesStarted ?? null,
        decision: game.decision ?? null,
        shots_against: shotsAgainst,
        goals_against: goalsAgainst,
        saves,
        save_percentage:
          game.savePctg ?? null,
        shutouts: game.shutouts ?? null,

        updated_at: new Date().toISOString(),
      },
    ];
  });

  if (rows.length === 0) {
    return 0;
  }

  const { error } = await supabase
    .from("nhl_player_game_stats")
    .upsert(rows, {
      onConflict: "game_id,player_id",
    });

  if (error) {
    throw new Error(
      `Failed to upsert ${player.player_name} ` +
        `${season}: ${error.message}`
    );
  }

  return rows.length;
}

async function main() {
  const playerArg = process.argv.find(
    (arg) => arg.startsWith("--player=")
  );

  const seasonArg = process.argv.find(
    (arg) => arg.startsWith("--season=")
  );

  const playerId = playerArg
    ? Number(playerArg.split("=")[1])
    : undefined;

  const seasons = seasonArg
    ? [Number(seasonArg.split("=")[1])]
    : [...DEFAULT_SEASONS];

  if (
    playerId !== undefined &&
    !Number.isFinite(playerId)
  ) {
    throw new Error("Invalid --player value");
  }

  if (
    seasons.some(
      (season) => !Number.isFinite(season)
    )
  ) {
    throw new Error("Invalid --season value");
  }

  const players = await getPlayers(playerId);

  console.log(
    `Importing ${players.length} NHL players ` +
      `across ${seasons.length} season(s)...`
  );

  let totalRows = 0;
  let completed = 0;

  for (const player of players) {
    let playerRows = 0;

    for (const season of seasons) {
      try {
        const rows = await importPlayerSeason(
          player,
          season
        );

        playerRows += rows;
        totalRows += rows;
      } catch (error) {
        console.error(
          `Failed ${player.player_name} (${player.id}) ` +
            `season ${season}:`,
          error
        );
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 100)
      );
    }

    completed += 1;

    console.log(
      `[${completed}/${players.length}] ` +
        `${player.player_name} (${player.id}): ` +
        `${playerRows} games`
    );
  }

  console.log(
    `\nNHL player game stat import complete: ` +
      `${totalRows} rows`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
