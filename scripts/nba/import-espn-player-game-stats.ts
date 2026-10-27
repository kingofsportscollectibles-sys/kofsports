import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_SEASON = 2026;
const GAME_TYPE = "regular";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

type EspnPlayer = {
  id?: string;
  displayName?: string;
  position?: {
    abbreviation?: string;
  };
};

type EspnAthleteRow = {
  athlete?: EspnPlayer;
  stats?: string[];
};

type EspnStatisticsGroup = {
  labels?: string[];
  athletes?: EspnAthleteRow[];
};

type EspnTeamBlock = {
  team?: {
    abbreviation?: string;
  };
  statistics?: EspnStatisticsGroup[];
};

type EspnSummary = {
  header?: {
    competitions?: Array<{
      id?: string;
      date?: string;
      neutralSite?: boolean;
      competitors?: Array<{
        homeAway?: "home" | "away";
        team?: {
          abbreviation?: string;
        };
      }>;
    }>;
  };
  boxscore?: {
    players?: EspnTeamBlock[];
  };
};

type EspnScoreboard = {
  events?: Array<{
    id?: string;
    status?: {
      type?: {
        name?: string;
      };
    };
  }>;
};

function normalizeTeam(team: string): string {
  const aliases: Record<string, string> = {
    GS: "GSW",
    NO: "NOP",
    UTAH: "UTA",
    NY: "NYK",
    SA: "SAS",
    WSH: "WAS",
  };

  return aliases[team] ?? team;
}

function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+jr$/, "")
    .replace(/\s+sr$/, "");
}

function parseMadeAttempted(value: string | undefined): [number, number] {
  if (!value) return [0, 0];

  const [made, attempted] = value.split("-").map(Number);

  if (!Number.isFinite(made) || !Number.isFinite(attempted)) {
    throw new Error(`Invalid ESPN made-attempted stat: ${value}`);
  }

  return [made, attempted];
}

function parseInteger(value: string | undefined): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ESPN integer stat: ${value}`);
  }

  return parsed;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`ESPN request failed: ${response.status} ${url}`);
  }

  return (await response.json()) as T;
}

async function resolveGameId({
  espnEventId,
  season,
  gameDate,
  homeTeam,
  awayTeam,
}: {
  espnEventId: string;
  season: number;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
}): Promise<{ gameId: string; existing: boolean }> {
  const { data, error } = await supabase
    .from("nba_games")
    .select("id")
    .eq("season", season)
    .eq("game_type", GAME_TYPE)
    .eq("game_date", gameDate)
    .eq("home_team", homeTeam)
    .eq("away_team", awayTeam);

  if (error) {
    throw error;
  }

  if ((data ?? []).length > 1) {
    throw new Error(
      `Multiple NBA games matched ${gameDate} ${awayTeam} @ ${homeTeam}`,
    );
  }

  if (data?.length === 1) {
    return {
      gameId: data[0].id,
      existing: true,
    };
  }

  return {
    gameId: `espn_${espnEventId}`,
    existing: false,
  };
}

export async function importEspnNbaPlayerGameStats({
  dateArg,
  writeMode = true,
  allowEmpty = false,
}: {
  dateArg: string;
  writeMode?: boolean;
  allowEmpty?: boolean;
}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
    throw new Error(
      `Invalid ESPN NBA import date: ${dateArg}`,
    );
  }

  const espnDate = dateArg.replaceAll("-", "");

  console.log(
    writeMode
      ? "WRITE MODE ENABLED: database changes are allowed."
      : "DRY RUN: no database changes will be made.",
  );
  console.log(`Loading ESPN NBA scoreboard for ${dateArg}...`);

  const scoreboard = await fetchJson<EspnScoreboard>(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${espnDate}`,
  );

  const finalEvents = (scoreboard.events ?? []).filter(
    (event) => event.status?.type?.name === "STATUS_FINAL" && event.id,
  );

  console.log(`Final ESPN games: ${finalEvents.length}`);

  if (finalEvents.length === 0 && allowEmpty) {
    console.log(
      `No final NBA games found for ${dateArg}; skipping because --allow-empty is enabled.`,
    );
    return;
  }

  const { data: dbPlayers, error: playerError } = await supabase
    .from("nba_players")
    .select("id,player_name,team");

  if (playerError) {
    throw playerError;
  }

  const playersByNormalizedName = new Map<
    string,
    Array<{ id: number; player_name: string; team: string | null }>
  >();

  for (const player of dbPlayers ?? []) {
    const key = normalizePlayerName(player.player_name);
    const existing = playersByNormalizedName.get(key) ?? [];
    existing.push(player);
    playersByNormalizedName.set(key, existing);
  }

  let playerRows = 0;
  let matchedPlayers = 0;
  let comparedRows = 0;
  let mismatchedRows = 0;
  const unmatchedPlayers = new Map<
    string,
    { espnId: string; name: string; team: string }
  >();

  const gamePayloads: Array<{
    id: string;
    season: number;
    game_type: string;
    game_date: string;
    commence_time: null;
    home_team: string;
    away_team: string;
    is_neutral: boolean;
  }> = [];

  const statPayloads: Array<Record<string, string | number | boolean>> = [];

  for (const event of finalEvents) {
    const summary = await fetchJson<EspnSummary>(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${event.id}`,
    );

    const competition = summary.header?.competitions?.[0];

    if (!competition) {
      console.warn(`Skipping ESPN game ${event.id}: missing competition`);
      continue;
    }

    const home = competition.competitors?.find(
      (team) => team.homeAway === "home",
    );
    const away = competition.competitors?.find(
      (team) => team.homeAway === "away",
    );

    const homeTeam = home?.team?.abbreviation
      ? normalizeTeam(home.team.abbreviation)
      : null;
    const awayTeam = away?.team?.abbreviation
      ? normalizeTeam(away.team.abbreviation)
      : null;

    if (!event.id || !competition.date || !homeTeam || !awayTeam) {
      console.warn(
        `Skipping ESPN game ${event.id ?? "unknown"}: incomplete game identity`,
      );
      continue;
    }

    // The ESPN scoreboard query is keyed to the NBA's local schedule date.
    // Do not derive game_date from competition.date because that timestamp is
    // UTC and evening NBA games can fall on the following UTC calendar date.
    const gameDate = dateArg;

    const resolvedGame = await resolveGameId({
      espnEventId: event.id,
      season: DEFAULT_SEASON,
      gameDate,
      homeTeam,
      awayTeam,
    });

    console.log(
      `Game ${event.id}: ${awayTeam} @ ${homeTeam} -> ${resolvedGame.gameId} (${resolvedGame.existing ? "existing" : "new ESPN ID"})`,
    );

    gamePayloads.push({
      id: resolvedGame.gameId,
      season: DEFAULT_SEASON,
      game_type: GAME_TYPE,
      game_date: gameDate,
      commence_time: null,
      home_team: homeTeam,
      away_team: awayTeam,
      is_neutral: competition.neutralSite ?? false,
    });

    for (const teamBlock of summary.boxscore?.players ?? []) {
      const team = teamBlock.team?.abbreviation
        ? normalizeTeam(teamBlock.team.abbreviation)
        : null;

      if (!team) continue;

      for (const group of teamBlock.statistics ?? []) {
        console.log(
          `  ${team}: labels=${JSON.stringify(group.labels ?? [])} athletes=${group.athletes?.length ?? 0}`,
        );

        for (const row of group.athletes ?? []) {
          const athlete = row.athlete;

          if (!athlete?.id || !athlete.displayName) continue;

          const minutes = row.stats?.[0];

          if (
            minutes === undefined ||
            minutes === "" ||
            !Number.isFinite(Number(minutes))
          ) {
            continue;
          }

          playerRows++;

          const candidates =
            playersByNormalizedName.get(
              normalizePlayerName(athlete.displayName),
            ) ?? [];

          if (candidates.length === 1) {
            matchedPlayers++;

            const labels = group.labels ?? [];
            const stats = row.stats ?? [];
            const values = Object.fromEntries(
              labels.map((label, index) => [label, stats[index]]),
            );

            const [fieldGoalsMade, fieldGoalsAttempted] =
              parseMadeAttempted(values.FG);
            const [threePointersMade, threePointersAttempted] =
              parseMadeAttempted(values["3PT"]);
            const [freeThrowsMade, freeThrowsAttempted] =
              parseMadeAttempted(values.FT);

            const parsed = {
              minutes: Number(values.MIN),
              field_goals_made: fieldGoalsMade,
              field_goals_attempted: fieldGoalsAttempted,
              three_pointers_made: threePointersMade,
              three_pointers_attempted: threePointersAttempted,
              free_throws_made: freeThrowsMade,
              free_throws_attempted: freeThrowsAttempted,
              offensive_rebounds: parseInteger(values.OREB),
              defensive_rebounds: parseInteger(values.DREB),
              rebounds: parseInteger(values.REB),
              assists: parseInteger(values.AST),
              steals: parseInteger(values.STL),
              blocks: parseInteger(values.BLK),
              turnovers: parseInteger(values.TO),
              personal_fouls: parseInteger(values.PF),
              points: parseInteger(values.PTS),
              plus_minus: parseInteger(values["+/-"]),
            };

            const opponent = team === homeTeam ? awayTeam : homeTeam;
            const isHome = team === homeTeam;

            if (team !== homeTeam && team !== awayTeam) {
              throw new Error(
                `ESPN box-score team ${team} does not match ${awayTeam} @ ${homeTeam}`,
              );
            }

            statPayloads.push({
              game_id: resolvedGame.gameId,
              player_id: candidates[0].id,
              season: DEFAULT_SEASON,
              game_type: GAME_TYPE,
              game_date: gameDate,
              player_name: candidates[0].player_name,
              team,
              opponent,
              is_home: isHome,
              ...parsed,
            });

            const { data: existingStat, error: existingStatError } =
              await supabase
                .from("nba_player_game_stats")
                .select(
                  "minutes,field_goals_made,field_goals_attempted,three_pointers_made,three_pointers_attempted,free_throws_made,free_throws_attempted,offensive_rebounds,defensive_rebounds,rebounds,assists,steals,blocks,turnovers,personal_fouls,points,plus_minus",
                )
                .eq("player_id", candidates[0].id)
                .eq("game_date", dateArg)
                .maybeSingle();

            if (existingStatError) {
              throw existingStatError;
            }

            if (existingStat) {
              comparedRows++;

              const differences = Object.entries(parsed).filter(
                ([key, value]) =>
                  Number(
                    existingStat[
                      key as keyof typeof existingStat
                    ],
                  ) !== value,
              );

              if (differences.length > 0) {
                mismatchedRows++;

                console.log(
                  `STAT MISMATCH: ${athlete.displayName} (${team})`,
                  Object.fromEntries(
                    differences.map(([key, espnValue]) => [
                      key,
                      {
                        espn: espnValue,
                        nba: existingStat[
                          key as keyof typeof existingStat
                        ],
                      },
                    ]),
                  ),
                );
              }
            }

            continue;
          }

          unmatchedPlayers.set(athlete.id, {
            espnId: athlete.id,
            name: athlete.displayName,
            team,
          });
        }
      }
    }
  }

  console.log("");
  console.log(`ESPN athlete rows: ${playerRows}`);
  console.log(`Matched athlete rows: ${matchedPlayers}`);
  console.log(`Unmatched unique players: ${unmatchedPlayers.size}`);
  console.log(`Compared with NBA.com rows: ${comparedRows}`);
  console.log(`Stat rows with differences: ${mismatchedRows}`);
  console.log(`Prospective game payloads: ${gamePayloads.length}`);
  console.log(`Prospective stat payloads: ${statPayloads.length}`);
  console.log(
    `New ESPN game IDs: ${gamePayloads.filter((game) => game.id.startsWith("espn_")).length}`,
  );

  const uniqueGameIds = new Set(gamePayloads.map((game) => game.id));
  const uniquePlayerGames = new Set(
    statPayloads.map((row) => `${row.game_id}:${row.player_id}`),
  );

  console.log(`Unique game IDs: ${uniqueGameIds.size}`);
  console.log(`Unique player-game keys: ${uniquePlayerGames.size}`);

  if (uniqueGameIds.size !== gamePayloads.length) {
    throw new Error("Duplicate game IDs found in prospective payloads.");
  }

  if (uniquePlayerGames.size !== statPayloads.length) {
    throw new Error("Duplicate player-game keys found in prospective payloads.");
  }

  if (unmatchedPlayers.size > 0) {
    console.table([...unmatchedPlayers.values()]);
  }

  if (writeMode) {
    if (unmatchedPlayers.size > 0) {
      throw new Error(
        `Refusing to write: ${unmatchedPlayers.size} ESPN players could not be matched to canonical NBA players.`,
      );
    }

    if (gamePayloads.length === 0) {
      throw new Error("Refusing to write: no final ESPN games were found.");
    }

    if (statPayloads.length === 0) {
      throw new Error("Refusing to write: no player-game stat rows were built.");
    }

    console.log("");
    console.log(`Upserting ${gamePayloads.length} NBA games...`);

    const { error: gameUpsertError } = await supabase
      .from("nba_games")
      .upsert(gamePayloads, {
        onConflict: "id",
      });

    if (gameUpsertError) {
      throw gameUpsertError;
    }

    console.log(`Upserting ${statPayloads.length} NBA player-game stat rows...`);

    const { error: statUpsertError } = await supabase
      .from("nba_player_game_stats")
      .upsert(statPayloads, {
        onConflict: "game_id,player_id",
      });

    if (statUpsertError) {
      throw statUpsertError;
    }

    console.log(
      `Write completed: ${gamePayloads.length} games, ${statPayloads.length} player-game rows.`,
    );
  }

  console.log("");
  console.log(
    writeMode
      ? `Write mode completed. Season=${DEFAULT_SEASON}, game_type=${GAME_TYPE}`
      : `Dry run completed: no rows were written. Season=${DEFAULT_SEASON}, game_type=${GAME_TYPE}`,
  );
}

if (require.main === module) {
  const dateArg = process.argv[2];
  const writeMode = process.argv.includes("--write");
  const allowEmpty = process.argv.includes("--allow-empty");

  if (!dateArg) {
    throw new Error(
      "Usage: npx tsx --env-file=.env.local scripts/nba/import-espn-player-game-stats.ts YYYY-MM-DD",
    );
  }

  importEspnNbaPlayerGameStats({
    dateArg,
    writeMode,
    allowEmpty,
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
