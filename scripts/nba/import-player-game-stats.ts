import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const NBA_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  Accept: "application/json",
  Referer: "https://www.nba.com/",
  Origin: "https://www.nba.com",
};

const SEASON = process.argv[2] ?? "2025-26";
const SEASON_START_YEAR = Number(SEASON.slice(0, 4));
const GAME_TYPE = "regular";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

type NbaResultSet = {
  name: string;
  headers: string[];
  rowSet: unknown[][];
};

type NbaResponse = {
  resultSets: NbaResultSet[];
};

function value(
  row: unknown[],
  headers: string[],
  column: string
): unknown {
  const index = headers.indexOf(column);

  if (index === -1) {
    throw new Error(`NBA response missing column: ${column}`);
  }

  return row[index];
}

function numberOrNull(input: unknown): number | null {
  if (input === null || input === undefined || input === "") {
    return null;
  }

  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerOrNull(input: unknown): number | null {
  const parsed = numberOrNull(input);
  return parsed === null ? null : Math.trunc(parsed);
}

function parseMatchup(matchup: string) {
  const match = matchup.match(/^([A-Z]{2,3}) (vs\.|@) ([A-Z]{2,3})$/);

  if (!match) {
    throw new Error(`Unexpected NBA matchup format: ${matchup}`);
  }

  return {
    team: match[1],
    opponent: match[3],
    isHome: match[2] === "vs.",
  };
}

async function fetchLeagueGameLog(): Promise<NbaResultSet> {
  const params = new URLSearchParams({
    Counter: "0",
    DateFrom: "",
    DateTo: "",
    Direction: "DESC",
    LeagueID: "00",
    PlayerOrTeam: "P",
    Season: SEASON,
    SeasonType: "Regular Season",
    Sorter: "DATE",
  });

  const url = `https://stats.nba.com/stats/leaguegamelog?${params.toString()}`;

  console.log(`Fetching NBA ${SEASON} regular-season player game logs...`);

  const response = await fetch(url, {
    headers: NBA_HEADERS,
  });

  if (!response.ok) {
    throw new Error(
      `NBA API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as NbaResponse;
  const resultSet = data.resultSets?.find(
    (result) => result.name === "LeagueGameLog"
  );

  if (!resultSet) {
    throw new Error("NBA API response missing LeagueGameLog result set");
  }

  return resultSet;
}

async function upsertInChunks(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
  chunkSize = 500
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    const { error } = await supabase
      .from(table)
      .upsert(chunk as any[], { onConflict });

    if (error) {
      throw new Error(
        `${table} upsert failed at rows ${i}-${i + chunk.length - 1}: ${error.message}`
      );
    }

    console.log(
      `${table}: ${Math.min(i + chunk.length, rows.length)}/${rows.length}`
    );
  }
}

async function main() {
  const resultSet = await fetchLeagueGameLog();
  const { headers, rowSet } = resultSet;

  console.log(`NBA rows returned: ${rowSet.length}`);

  const players = new Map<number, Record<string, unknown>>();
  const games = new Map<string, Record<string, unknown>>();
  const stats: Record<string, unknown>[] = [];

  for (const row of rowSet) {
    const playerId = Number(value(row, headers, "PLAYER_ID"));
    const playerName = String(value(row, headers, "PLAYER_NAME"));
    const gameId = String(value(row, headers, "GAME_ID"));
    const gameDate = String(value(row, headers, "GAME_DATE"));
    const matchup = String(value(row, headers, "MATCHUP"));

    const { team, opponent, isHome } = parseMatchup(matchup);

    if (!Number.isFinite(playerId)) {
      throw new Error(`Invalid PLAYER_ID for ${playerName}`);
    }

    players.set(playerId, {
      id: playerId,
      player_name: playerName,
      team,
      active: true,
      updated_at: new Date().toISOString(),
    });

    const existingGame = games.get(gameId);

    if (!existingGame) {
      games.set(gameId, {
        id: gameId,
        season: SEASON_START_YEAR,
        game_type: GAME_TYPE,
        game_date: gameDate,
        home_team: isHome ? team : opponent,
        away_team: isHome ? opponent : team,
        is_neutral: false,
        updated_at: new Date().toISOString(),
      });
    } else {
      if (existingGame.game_date !== gameDate) {
        throw new Error(`Conflicting game date for GAME_ID ${gameId}`);
      }

      const sameOrientation =
        existingGame.home_team === (isHome ? team : opponent) &&
        existingGame.away_team === (isHome ? opponent : team);

      const reversedAwayOrientation =
        !isHome &&
        existingGame.home_team === team &&
        existingGame.away_team === opponent;

      if (!sameOrientation && reversedAwayOrientation) {
        const teams = [team, opponent].sort();

        existingGame.home_team = teams[0];
        existingGame.away_team = teams[1];
        existingGame.is_neutral = true;
      } else if (!sameOrientation && !existingGame.is_neutral) {
        throw new Error(`Conflicting game metadata for GAME_ID ${gameId}`);
      }
    }

    stats.push({
      game_id: gameId,
      player_id: playerId,
      season: SEASON_START_YEAR,
      game_type: GAME_TYPE,
      game_date: gameDate,
      player_name: playerName,
      team,
      opponent,
      is_home: isHome,

      minutes: numberOrNull(value(row, headers, "MIN")),

      field_goals_made: integerOrNull(value(row, headers, "FGM")),
      field_goals_attempted: integerOrNull(value(row, headers, "FGA")),
      three_pointers_made: integerOrNull(value(row, headers, "FG3M")),
      three_pointers_attempted: integerOrNull(value(row, headers, "FG3A")),
      free_throws_made: integerOrNull(value(row, headers, "FTM")),
      free_throws_attempted: integerOrNull(value(row, headers, "FTA")),

      offensive_rebounds: integerOrNull(value(row, headers, "OREB")),
      defensive_rebounds: integerOrNull(value(row, headers, "DREB")),
      rebounds: integerOrNull(value(row, headers, "REB")),
      assists: integerOrNull(value(row, headers, "AST")),
      steals: integerOrNull(value(row, headers, "STL")),
      blocks: integerOrNull(value(row, headers, "BLK")),
      turnovers: integerOrNull(value(row, headers, "TOV")),
      personal_fouls: integerOrNull(value(row, headers, "PF")),
      points: integerOrNull(value(row, headers, "PTS")),
      plus_minus: integerOrNull(value(row, headers, "PLUS_MINUS")),

      updated_at: new Date().toISOString(),
    });
  }

  const neutralGameIds = new Set(
    [...games.entries()]
      .filter(([, game]) => game.is_neutral === true)
      .map(([gameId]) => gameId)
  );

  for (const stat of stats) {
    if (neutralGameIds.has(String(stat.game_id))) {
      stat.is_home = null;
    }
  }

  console.log(`Unique players: ${players.size}`);
  console.log(`Unique games: ${games.size}`);
  console.log(`Neutral/special-site games: ${neutralGameIds.size}`);
  console.log(`Player-game stats: ${stats.length}`);

  await upsertInChunks(
    "nba_players",
    [...players.values()],
    "id"
  );

  await upsertInChunks(
    "nba_games",
    [...games.values()],
    "id"
  );

  await upsertInChunks(
    "nba_player_game_stats",
    stats,
    "game_id,player_id"
  );

  console.log("NBA player game stats import complete.");
}

main().catch((error) => {
  console.error("NBA player game stats import failed:");
  console.error(error);
  process.exit(1);
});
