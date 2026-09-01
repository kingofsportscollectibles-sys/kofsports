import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

// =========================================================
// KOFSPORTS NFL PLAYER STATS IMPORTER
//
// Usage:
//
// PASSING:
// npx tsx --env-file=.env.local scripts/nfl/import-player-stats.ts \
//   passing data/nfl/2025-qb-passing.csv
//
// RUSHING:
// npx tsx --env-file=.env.local scripts/nfl/import-player-stats.ts \
//   rushing data/nfl/2025-rushing.csv
//
// RECEIVING:
// npx tsx --env-file=.env.local scripts/nfl/import-player-stats.ts \
//   receiving data/nfl/2025-receiving.csv
//
// Historical CSV dates may represent a weekly anchor rather
// than the player's literal game date.
//
// Existing player/game rows are PATCHED by stat category.
// A rushing import will not erase previously imported
// passing stats, etc.
// =========================================================

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL in the environment.",
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY in the environment.",
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

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

type DatasetType =
  | "passing"
  | "rushing"
  | "receiving";

type CsvRow =
  Record<string, string | undefined>;

type NflGame = {
  id: number;
  season: number;
  week: number | null;
  game_date: string;
  home_team: string;
  away_team: string;
  game_type: string;
};

type NormalizedStatRow = {
  player_name: string;
  team: string;
  source_date: string;

  passing_completions: number | null;
  passing_attempts: number | null;
  passing_yards: number | null;
  passing_touchdowns: number | null;
  interceptions: number | null;

  rushing_attempts: number | null;
  rushing_yards: number | null;
  rushing_touchdowns: number | null;

  targets: number | null;
  receptions: number | null;
  receiving_yards: number | null;
  receiving_touchdowns: number | null;

  fumbles: number | null;
  fumbles_lost: number | null;
};

type MatchResult = {
  game: NflGame | null;
  method: "exact" | "week" | "none";
};

type ResolvedRow = {
  game_id: number;
  player_name: string;
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

  rushing_attempts: number | null;
  rushing_yards: number | null;
  rushing_touchdowns: number | null;

  targets: number | null;
  receptions: number | null;
  receiving_yards: number | null;
  receiving_touchdowns: number | null;

  fumbles: number | null;
  fumbles_lost: number | null;
};

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

function clean(value: unknown): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function getValue(
  row: CsvRow,
  possibleHeaders: string[],
): string {
  const entries = Object.entries(row);

  for (const wantedHeader of possibleHeaders) {
    const normalizedWanted =
      wantedHeader
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const match = entries.find(
      ([header]) => {
        const normalizedHeader =
          header
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

        return (
          normalizedHeader ===
          normalizedWanted
        );
      },
    );

    if (match) {
      return clean(match[1]);
    }
  }

  return "";
}

function toNumber(
  value: string,
): number | null {
  const cleaned = value
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  if (
    cleaned === "" ||
    cleaned === "-" ||
    cleaned.toLowerCase() === "n/a" ||
    cleaned.toLowerCase() === "null"
  ) {
    return null;
  }

  const parsed = Number(cleaned);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function toInteger(
  value: string,
): number | null {
  const number = toNumber(value);

  if (number === null) {
    return null;
  }

  return Math.round(number);
}

function normalizeTeam(
  team: string,
): string {
  const raw =
    team.trim().toUpperCase();

  const aliases:
    Record<string, string> = {
      ARIZONA: "ARI",
      ATLANTA: "ATL",
      BALTIMORE: "BAL",
      BUFFALO: "BUF",
      CAROLINA: "CAR",
      CHICAGO: "CHI",
      CINCINNATI: "CIN",
      CLEVELAND: "CLE",
      DALLAS: "DAL",
      DENVER: "DEN",
      DETROIT: "DET",
      GREENBAY: "GB",
      HOUSTON: "HOU",
      INDIANAPOLIS: "IND",

      JACKSONVILLE: "JAX",
      JAC: "JAX",

      KANSASCITY: "KC",
      LASVEGAS: "LV",

      LACHARGERS: "LAC",
      LOSANGELESCHARGERS: "LAC",

      LARAMS: "LA",
      LOSANGELESRAMS: "LA",
      LAR: "LA",

      MIAMI: "MIA",
      MINNESOTA: "MIN",
      NEWENGLAND: "NE",
      NEWORLEANS: "NO",

      NYGIANTS: "NYG",
      NEWYORKGIANTS: "NYG",

      NYJETS: "NYJ",
      NEWYORKJETS: "NYJ",

      PHILADELPHIA: "PHI",
      PITTSBURGH: "PIT",
      SANFRANCISCO: "SF",
      SEATTLE: "SEA",
      TAMPA: "TB",
      TAMPABAY: "TB",
      TENNESSEE: "TEN",
      WASHINGTON: "WAS",
    };

  const compact = raw.replace(
    /[^A-Z]/g,
    "",
  );

  return aliases[compact] ?? raw;
}

function normalizeDate(
  value: string,
): string {
  const raw = value.trim();

  if (!raw) {
    throw new Error(
      "Missing game date",
    );
  }

  const isoMatch = raw.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  );

  if (isoMatch) {
    const [
      ,
      year,
      month,
      day,
    ] = isoMatch;

    return [
      year,
      month.padStart(2, "0"),
      day.padStart(2, "0"),
    ].join("-");
  }

  const fullUsMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  );

  if (fullUsMatch) {
    const [
      ,
      month,
      day,
      year,
    ] = fullUsMatch;

    return [
      year,
      month.padStart(2, "0"),
      day.padStart(2, "0"),
    ].join("-");
  }

  const shortUsMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})$/,
  );

  if (shortUsMatch) {
    const [
      ,
      monthText,
      dayText,
    ] = shortUsMatch;

    const month =
      Number(monthText);

    const year =
      month <= 2
        ? 2026
        : 2025;

    return [
      String(year),
      monthText.padStart(2, "0"),
      dayText.padStart(2, "0"),
    ].join("-");
  }

  throw new Error(
    `Unsupported date format: "${value}"`,
  );
}

function parseIsoDate(
  date: string,
): Date {
  return new Date(
    `${date}T12:00:00Z`,
  );
}

// ---------------------------------------------------------
// NORMALIZE CSV ROW
// ---------------------------------------------------------

function normalizeRow(
  row: CsvRow,
  datasetType: DatasetType,
): NormalizedStatRow {
  const playerName = getValue(
    row,
    [
      "player_name",
      "player",
      "name",
    ],
  );

  const team = normalizeTeam(
    getValue(
      row,
      [
        "team",
        "tm",
      ],
    ),
  );

  const sourceDate =
    normalizeDate(
      getValue(
        row,
        [
          "game_date",
          "date",
        ],
      ),
    );

  if (!playerName) {
    throw new Error(
      "Missing player name",
    );
  }

  if (!team) {
    throw new Error(
      `Missing team for ${playerName}`,
    );
  }

  const result:
    NormalizedStatRow = {
      player_name: playerName,
      team,
      source_date: sourceDate,

      passing_completions: null,
      passing_attempts: null,
      passing_yards: null,
      passing_touchdowns: null,
      interceptions: null,

      rushing_attempts: null,
      rushing_yards: null,
      rushing_touchdowns: null,

      targets: null,
      receptions: null,
      receiving_yards: null,
      receiving_touchdowns: null,

      fumbles: null,
      fumbles_lost: null,
    };

  if (datasetType === "passing") {
    result.passing_completions =
      toInteger(
        getValue(
          row,
          [
            "passing_completions",
            "pass completions",
            "completions",
            "comp",
            "cmp",
          ],
        ),
      );

    result.passing_attempts =
      toInteger(
        getValue(
          row,
          [
            "passing_attempts",
            "pass attempts",
            "attempts",
            "att",
          ],
        ),
      );

    result.passing_yards =
      toInteger(
        getValue(
          row,
          [
            "passing_yards",
            "passing yds",
            "pass yds",
            "pass yards",
            "yds",
          ],
        ),
      );

    result.passing_touchdowns =
      toInteger(
        getValue(
          row,
          [
            "passing_touchdowns",
            "passing tds",
            "pass td",
            "pass tds",
            "td",
          ],
        ),
      );

    result.interceptions =
      toInteger(
        getValue(
          row,
          [
            "interceptions",
            "ints",
            "int",
          ],
        ),
      );
  }

  if (datasetType === "rushing") {
    result.rushing_attempts =
      toInteger(
        getValue(
          row,
          [
            "rushing_attempts",
            "rush attempts",
            "rush att",
            "carries",
            "att",
          ],
        ),
      );

    result.rushing_yards =
      toInteger(
        getValue(
          row,
          [
            "rushing_yards",
            "rushing yds",
            "rush yds",
            "rush yards",
            "yds",
          ],
        ),
      );

    result.rushing_touchdowns =
      toInteger(
        getValue(
          row,
          [
            "rushing_touchdowns",
            "rushing tds",
            "rush td",
            "rush tds",
            "td",
          ],
        ),
      );
  }

  if (datasetType === "receiving") {
    result.targets =
      toInteger(
        getValue(
          row,
          [
            "targets",
            "tgt",
          ],
        ),
      );

    result.receptions =
      toInteger(
        getValue(
          row,
          [
            "receptions",
            "rec",
          ],
        ),
      );

    result.receiving_yards =
      toInteger(
        getValue(
          row,
          [
            "receiving_yards",
            "receiving yds",
            "rec yds",
            "rec yards",
            "yds",
          ],
        ),
      );

    result.receiving_touchdowns =
      toInteger(
        getValue(
          row,
          [
            "receiving_touchdowns",
            "receiving tds",
            "rec td",
            "rec tds",
            "td",
          ],
        ),
      );
  }

  // Fumbles exist in multiple source files.
  result.fumbles =
    toInteger(
      getValue(
        row,
        [
          "fumbles",
          "fumb",
        ],
      ),
    );

  result.fumbles_lost =
    toInteger(
      getValue(
        row,
        [
          "fumbles_lost",
          "fumbles lost",
          "fuml",
          "fum l",
        ],
      ),
    );

  return result;
}

// ---------------------------------------------------------
// LOAD NFL GAMES
// ---------------------------------------------------------

async function getGames():
Promise<NflGame[]> {
  const { data, error } =
    await supabase
      .from("nfl_games")
      .select(`
        id,
        season,
        week,
        game_date,
        home_team,
        away_team,
        game_type
      `)
      .eq("season", 2025)
      .order("game_date");

  if (error) {
    throw new Error(
      `Could not load nfl_games: ${error.message}`,
    );
  }

  return (
    data ?? []
  ) as NflGame[];
}

// ---------------------------------------------------------
// GAME MATCHING
// ---------------------------------------------------------

function teamIsInGame(
  team: string,
  game: NflGame,
): boolean {
  return (
    game.home_team === team ||
    game.away_team === team
  );
}

function resolveWeekFromSourceDate(
  sourceDate: string,
  games: NflGame[],
): {
  season: number;
  week: number;
} | null {
  const weekRanges =
    new Map<
      string,
      {
        season: number;
        week: number;
        minDate: string;
        maxDate: string;
      }
    >();

  for (const game of games) {
    if (game.week === null) {
      continue;
    }

    const key =
      `${game.season}-${game.week}`;

    const existing =
      weekRanges.get(key);

    if (!existing) {
      weekRanges.set(
        key,
        {
          season: game.season,
          week: game.week,
          minDate: game.game_date,
          maxDate: game.game_date,
        },
      );

      continue;
    }

    if (
      game.game_date <
      existing.minDate
    ) {
      existing.minDate =
        game.game_date;
    }

    if (
      game.game_date >
      existing.maxDate
    ) {
      existing.maxDate =
        game.game_date;
    }
  }

  const sourceTime =
    parseIsoDate(
      sourceDate,
    ).getTime();

  const candidates = [
    ...weekRanges.values(),
  ].filter((range) => {
    const minTime =
      parseIsoDate(
        range.minDate,
      ).getTime();

    const maxTime =
      parseIsoDate(
        range.maxDate,
      ).getTime();

    const oneDayAfterMax =
      maxTime +
      24 * 60 * 60 * 1000;

    return (
      sourceTime >= minTime &&
      sourceTime <=
        oneDayAfterMax
    );
  });

  if (
    candidates.length !== 1
  ) {
    return null;
  }

  return {
    season:
      candidates[0].season,
    week:
      candidates[0].week,
  };
}

function matchGame(
  stat: NormalizedStatRow,
  games: NflGame[],
): MatchResult {
  const exactMatches =
    games.filter(
      (game) =>
        game.game_date ===
          stat.source_date &&
        teamIsInGame(
          stat.team,
          game,
        ),
    );

  if (
    exactMatches.length > 1
  ) {
    throw new Error(
      `Multiple exact games matched ${stat.player_name}, ${stat.team}, ${stat.source_date}`,
    );
  }

  if (
    exactMatches.length === 1
  ) {
    return {
      game: exactMatches[0],
      method: "exact",
    };
  }

  const resolvedWeek =
    resolveWeekFromSourceDate(
      stat.source_date,
      games,
    );

  if (!resolvedWeek) {
    return {
      game: null,
      method: "none",
    };
  }

  const weekMatches =
    games.filter(
      (game) =>
        game.season ===
          resolvedWeek.season &&
        game.week ===
          resolvedWeek.week &&
        teamIsInGame(
          stat.team,
          game,
        ),
    );

  if (
    weekMatches.length > 1
  ) {
    throw new Error(
      `Multiple week games matched ${stat.player_name}, ${stat.team}, ${stat.source_date}, week ${resolvedWeek.week}`,
    );
  }

  if (
    weekMatches.length === 0
  ) {
    return {
      game: null,
      method: "none",
    };
  }

  return {
    game: weekMatches[0],
    method: "week",
  };
}

// ---------------------------------------------------------
// BUILD CATEGORY-SAFE UPDATE
// ---------------------------------------------------------

function buildCategoryPatch(
  row: ResolvedRow,
  datasetType: DatasetType,
) {
  const base = {
    team: row.team,
    opponent: row.opponent,
    season: row.season,
    week: row.week,
    game_date: row.game_date,
    is_home: row.is_home,
    updated_at:
      new Date().toISOString(),
  };

  if (datasetType === "passing") {
    return {
      ...base,
      position: "QB",

      passing_completions:
        row.passing_completions,

      passing_attempts:
        row.passing_attempts,

      passing_yards:
        row.passing_yards,

      passing_touchdowns:
        row.passing_touchdowns,

      interceptions:
        row.interceptions,

      fumbles:
        row.fumbles,

      fumbles_lost:
        row.fumbles_lost,
    };
  }

  if (datasetType === "rushing") {
    return {
      ...base,

      rushing_attempts:
        row.rushing_attempts,

      rushing_yards:
        row.rushing_yards,

      rushing_touchdowns:
        row.rushing_touchdowns,

      fumbles:
        row.fumbles,

      fumbles_lost:
        row.fumbles_lost,
    };
  }

  return {
    ...base,

    targets:
      row.targets,

    receptions:
      row.receptions,

    receiving_yards:
      row.receiving_yards,

    receiving_touchdowns:
      row.receiving_touchdowns,

    fumbles:
      row.fumbles,

    fumbles_lost:
      row.fumbles_lost,
  };
}

// ---------------------------------------------------------
// MAIN
// ---------------------------------------------------------

async function main() {
  const datasetArgument =
    process.argv[2];

  const fileArgument =
    process.argv[3];

  if (
    datasetArgument !==
      "passing" &&
    datasetArgument !==
      "rushing" &&
    datasetArgument !==
      "receiving"
  ) {
    console.error("");
    console.error(
      "Dataset type must be passing, rushing, or receiving.",
    );
    console.error("");
    console.error(
      "Example:",
    );
    console.error(
      "npx tsx --env-file=.env.local scripts/nfl/import-player-stats.ts rushing data/nfl/2025-rushing.csv",
    );
    console.error("");

    process.exit(1);
  }

  const datasetType =
    datasetArgument as DatasetType;

  if (!fileArgument) {
    console.error("");
    console.error(
      "Missing CSV file.",
    );
    console.error("");
    process.exit(1);
  }

  const csvPath =
    path.resolve(
      process.cwd(),
      fileArgument,
    );

  if (
    !fs.existsSync(csvPath)
  ) {
    throw new Error(
      `CSV file does not exist: ${csvPath}`,
    );
  }

  console.log("");
  console.log(
    "🏈 KofSports NFL Player Stats Import",
  );
  console.log(
    "------------------------------------",
  );
  console.log(
    `Dataset: ${datasetType}`,
  );
  console.log(
    `File: ${csvPath}`,
  );

  const fileContents =
    fs.readFileSync(
      csvPath,
      "utf8",
    );

  const rawRows = parse(
    fileContents,
    {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
      relax_column_count: true,
    },
  ) as CsvRow[];

  console.log(
    `CSV rows: ${rawRows.length}`,
  );

  if (
    rawRows.length === 0
  ) {
    console.log(
      "No rows found.",
    );
    return;
  }

  const normalizedRows:
    NormalizedStatRow[] = [];

  const normalizationErrors:
    string[] = [];

  rawRows.forEach(
    (row, index) => {
      try {
        normalizedRows.push(
          normalizeRow(
            row,
            datasetType,
          ),
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : String(error);

        normalizationErrors.push(
          `CSV row ${index + 2}: ${message}`,
        );
      }
    },
  );

  console.log(
    `Normalized rows: ${normalizedRows.length}`,
  );

  if (
    normalizationErrors.length >
    0
  ) {
    console.log("");
    console.log(
      `⚠️ ${normalizationErrors.length} row(s) could not be normalized:`,
    );

    for (
      const error of
        normalizationErrors
    ) {
      console.log(
        `  - ${error}`,
      );
    }
  }

  if (
    normalizedRows.length === 0
  ) {
    throw new Error(
      "No valid player rows remain after normalization.",
    );
  }

  const dates =
    normalizedRows
      .map(
        (row) =>
          row.source_date,
      )
      .sort();

  console.log(
    `Source date range: ${dates[0]} → ${dates[dates.length - 1]}`,
  );

  const games =
    await getGames();

  console.log(
    `2025 NFL games available: ${games.length}`,
  );

  const resolvedRows:
    ResolvedRow[] = [];

  const unmatched:
    NormalizedStatRow[] = [];

  let exactMatchCount = 0;
  let weekMatchCount = 0;

  for (
    const stat of
      normalizedRows
  ) {
    const result =
      matchGame(
        stat,
        games,
      );

    const game =
      result.game;

    if (!game) {
      unmatched.push(stat);
      continue;
    }

    if (
      result.method ===
      "exact"
    ) {
      exactMatchCount++;
    }

    if (
      result.method ===
      "week"
    ) {
      weekMatchCount++;
    }

    const opponent =
      game.home_team ===
      stat.team
        ? game.away_team
        : game.home_team;

    const isHome =
      game.home_team ===
      stat.team;

    resolvedRows.push({
      game_id: game.id,
      player_name:
        stat.player_name,
      team: stat.team,
      opponent,
      season: game.season,
      week: game.week,
      game_date:
        game.game_date,
      is_home: isHome,

      passing_completions:
        stat.passing_completions,
      passing_attempts:
        stat.passing_attempts,
      passing_yards:
        stat.passing_yards,
      passing_touchdowns:
        stat.passing_touchdowns,
      interceptions:
        stat.interceptions,

      rushing_attempts:
        stat.rushing_attempts,
      rushing_yards:
        stat.rushing_yards,
      rushing_touchdowns:
        stat.rushing_touchdowns,

      targets:
        stat.targets,
      receptions:
        stat.receptions,
      receiving_yards:
        stat.receiving_yards,
      receiving_touchdowns:
        stat.receiving_touchdowns,

      fumbles:
        stat.fumbles,
      fumbles_lost:
        stat.fumbles_lost,
    });
  }

  console.log("");
  console.log(
    `Exact-date matches: ${exactMatchCount}`,
  );
  console.log(
    `Week-based matches: ${weekMatchCount}`,
  );
  console.log(
    `Matched player rows: ${resolvedRows.length}`,
  );
  console.log(
    `Unmatched player rows: ${unmatched.length}`,
  );

  // -------------------------------------------------------
  // SAFETY CHECK
  // -------------------------------------------------------

  if (
    unmatched.length > 0
  ) {
    console.log("");
    console.log(
      "❌ Import stopped because some player rows could not be safely matched to nfl_games.",
    );
    console.log("");
    console.log(
      "Unmatched examples:",
    );

    for (
      const stat of
        unmatched.slice(0, 30)
    ) {
      console.log(
        `  ${stat.source_date} | ${stat.team} | ${stat.player_name}`,
      );
    }

    if (
      unmatched.length > 30
    ) {
      console.log(
        `  ...and ${unmatched.length - 30} more`,
      );
    }

    console.log("");
    console.log(
      "No player stats were written to Supabase.",
    );

    process.exit(1);
  }

  // -------------------------------------------------------
  // DUPLICATE SAFETY
  // -------------------------------------------------------

  const resolvedKeys =
    new Set<string>();

  const duplicateRows:
    string[] = [];

  for (
    const row of
      resolvedRows
  ) {
    const key =
      `${row.game_id}|${row.player_name.toLowerCase()}`;

    if (
      resolvedKeys.has(key)
    ) {
      duplicateRows.push(
        `${row.game_date} | ${row.team} | ${row.player_name}`,
      );
    }

    resolvedKeys.add(key);
  }

  if (
    duplicateRows.length > 0
  ) {
    console.log("");
    console.log(
      "❌ Import stopped because multiple source rows resolved to the same player/game.",
    );

    for (
      const duplicate of
        duplicateRows.slice(0, 30)
    ) {
      console.log(
        `  ${duplicate}`,
      );
    }

    console.log("");
    console.log(
      "No player stats were written to Supabase.",
    );

    process.exit(1);
  }

  // -------------------------------------------------------
  // INSERT / CATEGORY-SAFE UPDATE
  // -------------------------------------------------------

  let insertedCount = 0;
  let updatedCount = 0;

  for (
    const row of
      resolvedRows
  ) {
    const {
      data: existing,
      error: findError,
    } = await supabase
      .from(
        "nfl_player_game_stats",
      )
      .select("id")
      .eq(
        "game_id",
        row.game_id,
      )
      .ilike(
        "player_name",
        row.player_name,
      )
      .maybeSingle();

    if (findError) {
      throw new Error(
        `Could not check ${row.player_name}: ${findError.message}`,
      );
    }

    const patch =
      buildCategoryPatch(
        row,
        datasetType,
      );

    if (existing) {
      const {
        error: updateError,
      } = await supabase
        .from(
          "nfl_player_game_stats",
        )
        .update(patch)
        .eq(
          "id",
          existing.id,
        );

      if (updateError) {
        throw new Error(
          `Could not update ${row.player_name}: ${updateError.message}`,
        );
      }

      updatedCount++;
    } else {
      const insertRow = {
        game_id:
          row.game_id,
        player_name:
          row.player_name,
        ...patch,
      };

      const {
        error: insertError,
      } = await supabase
        .from(
          "nfl_player_game_stats",
        )
        .insert(insertRow as any);

      if (insertError) {
        throw new Error(
          `Could not insert ${row.player_name}: ${insertError.message}`,
        );
      }

      insertedCount++;
    }
  }

  console.log("");
  console.log(
    "✅ Import complete",
  );
  console.log(
    "------------------",
  );
  console.log(
    `Dataset:  ${datasetType}`,
  );
  console.log(
    `Inserted: ${insertedCount}`,
  );
  console.log(
    `Updated:  ${updatedCount}`,
  );
  console.log(
    `Total:    ${resolvedRows.length}`,
  );
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error(
    "💥 NFL import failed",
  );

  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  console.error("");
  process.exit(1);
});