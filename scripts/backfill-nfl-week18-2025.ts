import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

const NFLVERSE_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2025.csv";

type CsvRow = Record<string, string>;

type GameRow = {
  id: number;
  season: number;
  week: number;
  game_date: string;
  home_team: string;
  away_team: string;
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];

  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (
        insideQuotes &&
        i + 1 < line.length &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);

  return result;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

function toNullableInt(value?: string): number | null {
  if (
    value === undefined ||
    value === null ||
    value.trim() === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.trunc(parsed);
}

function normalizeTeam(team: string): string {
  const mapping: Record<string, string> = {
    LAR: "LA",
    JAC: "JAX",
  };

  return mapping[team] ?? team;
}

function buildGameMap(games: GameRow[]) {
  const map = new Map<
    string,
    {
      gameId: number;
      gameDate: string;
      opponent: string;
      isHome: boolean;
    }
  >();

  for (const game of games) {
    const home = normalizeTeam(game.home_team);
    const away = normalizeTeam(game.away_team);

    map.set(home, {
      gameId: game.id,
      gameDate: game.game_date,
      opponent: away,
      isHome: true,
    });

    map.set(away, {
      gameId: game.id,
      gameDate: game.game_date,
      opponent: home,
      isHome: false,
    });
  }

  return map;
}

async function main() {
  console.log("Downloading nflverse 2025 player stats...");

  const response = await fetch(NFLVERSE_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to download nflverse stats: ${response.status} ${response.statusText}`,
    );
  }

  const csvText = await response.text();
  const rows = parseCsv(csvText);

  console.log(`Downloaded ${rows.length} total rows.`);

  const week18 = rows.filter((row) => {
    return (
      Number(row.season) === 2025 &&
      Number(row.week) === 18 &&
      row.season_type === "REG"
    );
  });

  console.log(
    `Found ${week18.length} Week 18 REG player rows.`,
  );

  if (!week18.length) {
    throw new Error(
      "No 2025 Week 18 REG rows found in nflverse dataset.",
    );
  }

  const { data: games, error: gamesError } =
    await supabase
      .from("nfl_games")
      .select(
        "id,season,week,game_date,home_team,away_team",
      )
      .eq("season", 2025)
      .eq("week", 18);

  if (gamesError) {
    throw gamesError;
  }

  if (!games || games.length !== 16) {
    throw new Error(
      `Expected 16 Week 18 games, found ${games?.length ?? 0}`,
    );
  }

  const gameMap = buildGameMap(
    games as GameRow[],
  );

  const inserts = week18
    .filter((row) => {
      const team = normalizeTeam(row.team ?? "");

      return (
        team &&
        gameMap.has(team) &&
        ["QB", "RB", "WR", "TE"].includes(
          row.position,
        )
      );
    })
    .map((row) => {
      const team = normalizeTeam(row.team);
      const game = gameMap.get(team);

      if (!game) {
        throw new Error(
          `No Week 18 game found for ${team}`,
        );
      }

      return {
        game_id: game.gameId,

        external_player_id:
          row.player_id || null,

        player_name:
          row.player_display_name ||
          row.player_name,

        team,

        opponent: game.opponent,

        season: 2025,
        week: 18,

        game_date: game.gameDate,

        is_home: game.isHome,

        position:
          row.position || null,

        passing_completions:
          toNullableInt(row.completions),

        passing_attempts:
          toNullableInt(row.attempts),

        passing_yards:
          toNullableInt(row.passing_yards),

        passing_touchdowns:
          toNullableInt(row.passing_tds),

        interceptions:
          toNullableInt(
            row.passing_interceptions,
          ),

        rushing_attempts:
          toNullableInt(row.carries),

        rushing_yards:
          toNullableInt(row.rushing_yards),

        rushing_touchdowns:
          toNullableInt(row.rushing_tds),

        targets:
          toNullableInt(row.targets),

        receptions:
          toNullableInt(row.receptions),

        receiving_yards:
          toNullableInt(row.receiving_yards),

        receiving_touchdowns:
          toNullableInt(row.receiving_tds),

        fumbles:
          toNullableInt(row.fumbles),

        fumbles_lost:
          toNullableInt(row.fumbles_lost),

        updated_at:
          new Date().toISOString(),
      };
    });

  console.log(
    `Prepared ${inserts.length} QB/RB/WR/TE rows.`,
  );

  const playerIds = new Set(
    inserts
      .map((row) => row.external_player_id)
      .filter(Boolean),
  );

  const teams = new Set(
    inserts.map((row) => row.team),
  );

  console.log(
    `Players: ${playerIds.size}`,
  );

  console.log(
    `Teams represented: ${teams.size}`,
  );

  if (teams.size !== 32) {
    throw new Error(
      `Expected 32 teams, found ${teams.size}. Aborting before insert.`,
    );
  }

  /*
   * Safety check:
   * We know Week 18 is currently empty.
   * Abort if anything is already there so the
   * script can't accidentally duplicate data.
   */

  const {
    count: existingCount,
    error: countError,
  } = await supabase
    .from("nfl_player_game_stats")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("season", 2025)
    .eq("week", 18);

  if (countError) {
    throw countError;
  }

  if ((existingCount ?? 0) > 0) {
    throw new Error(
      `Week 18 already contains ${existingCount} rows. Aborting.`,
    );
  }

  /*
   * Insert in chunks.
   */

  const chunkSize = 250;

  for (
    let i = 0;
    i < inserts.length;
    i += chunkSize
  ) {
    const chunk = inserts.slice(
      i,
      i + chunkSize,
    );

    const { error } = await supabase
      .from("nfl_player_game_stats")
      .insert(chunk);

    if (error) {
      throw error;
    }

    console.log(
      `Inserted ${Math.min(
        i + chunkSize,
        inserts.length,
      )}/${inserts.length}`,
    );
  }

  console.log(
    "Week 18 backfill complete.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});