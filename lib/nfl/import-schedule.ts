import { createClient } from "@supabase/supabase-js";

// =========================================================
// KOFSPORTS NFL SCHEDULE IMPORTER
//
// Usage:
// npx tsx --env-file=.env.local scripts/nfl/import-schedule.ts 2025
//
// Source:
// nflverse schedules dataset
//
// Imports:
// Regular season + postseason
//
// Does NOT import preseason.
// =========================================================

const NFLVERSE_SCHEDULE_URL =
  "https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL in environment.",
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY in environment.",
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

type CsvRow = Record<string, string | undefined>;

type ScheduleRow = {
  external_game_id: string;
  season: number;
  week: number | null;
  game_date: string;
  commence_time: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  game_type: "REG" | "POST";
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];

  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);

  return values;
}

function parseCsv(csv: string): CsvRow[] {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    return row;
  });
}

function clean(
  value: string | undefined,
): string {
  return String(value ?? "").trim();
}

function toNumber(
  value: string | undefined,
): number | null {
  const cleaned = clean(value);

  if (!cleaned) {
    return null;
  }

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : null;
}

function normalizeGameType(
  gameType: string,
): "REG" | "POST" | null {
  if (gameType === "REG") {
    return "REG";
  }

  if (
    gameType === "WC" ||
    gameType === "DIV" ||
    gameType === "CON" ||
    gameType === "SB"
  ) {
    return "POST";
  }

  return null;
}

function normalizeDate(
  value: string,
): string {
  const raw = value.trim();

  if (!raw) {
    throw new Error(
      "Schedule row is missing gameday.",
    );
  }

  const isoMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (isoMatch) {
    return raw;
  }

  const usMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  );

  if (usMatch) {
    const [, month, day, year] = usMatch;

    return `${year}-${month.padStart(
      2,
      "0",
    )}-${day.padStart(2, "0")}`;
  }

  throw new Error(
    `Unsupported schedule date: ${value}`,
  );
}

function buildCommenceTime(
  row: CsvRow,
): string | null {
  const gameday = clean(row.gameday);
  const gametime = clean(row.gametime);

  if (!gameday || !gametime) {
    return null;
  }

  const date = normalizeDate(gameday);

  const timeMatch = gametime.match(
    /^(\d{1,2}):(\d{2})$/,
  );

  if (!timeMatch) {
    throw new Error(
      `Unsupported schedule time: ${gametime}`,
    );
  }

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error(
      `Invalid schedule time: ${gametime}`,
    );
  }

  const [year, month, day] = date
    .split("-")
    .map(Number);

  const desiredLocalAsUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
  );

  let candidate = desiredLocalAsUtc;

  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      },
    ).formatToParts(new Date(candidate));

    const values = Object.fromEntries(
      parts.map((part) => [
        part.type,
        part.value,
      ]),
    );

    const representedLocalAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
    );

    const difference =
      desiredLocalAsUtc -
      representedLocalAsUtc;

    candidate += difference;

    if (difference === 0) {
      break;
    }
  }

  return new Date(candidate).toISOString();
}

function normalizeScheduleRow(
  row: CsvRow,
): ScheduleRow | null {
  const season = toNumber(row.season);

  if (season === null) {
    return null;
  }

  const originalGameType = clean(
    row.game_type,
  );

  const gameType =
    normalizeGameType(originalGameType);

  // Skip preseason and anything unexpected.
  if (!gameType) {
    return null;
  }

  const externalGameId = clean(
    row.game_id,
  );

  const homeTeam = clean(
    row.home_team,
  ).toUpperCase();

  const awayTeam = clean(
    row.away_team,
  ).toUpperCase();

  const gameDate = normalizeDate(
    clean(row.gameday),
  );

  const week = toNumber(row.week);

  if (!externalGameId) {
    throw new Error(
      `Missing game_id for ${awayTeam} @ ${homeTeam}`,
    );
  }

  if (!homeTeam || !awayTeam) {
    throw new Error(
      `Missing teams for ${externalGameId}`,
    );
  }

  return {
    external_game_id: externalGameId,

    season,

    week:
      week === null
        ? null
        : Math.round(week),

    game_date: gameDate,

    commence_time:
      buildCommenceTime(row),

    home_team: homeTeam,
    away_team: awayTeam,
    home_score: toNumber(row.home_score),
    away_score: toNumber(row.away_score),

    game_type: gameType,
  };
}

export async function importNflSchedule(
  targetSeason: number,
) {
  if (
    !Number.isInteger(targetSeason) ||
    targetSeason < 1999 ||
    targetSeason > 2100
  ) {
    throw new Error(
      `Invalid NFL season: ${targetSeason}`,
    );
  }

  console.log("");
  console.log(
    `🏈 KofSports NFL ${targetSeason} Schedule Import`,
  );

  console.log(
    "----------------------------------------",
  );

  console.log(
    "Downloading nflverse schedule...",
  );

  const response = await fetch(
    NFLVERSE_SCHEDULE_URL,
  );

  if (!response.ok) {
    throw new Error(
      `Could not download nflverse schedule: ${response.status} ${response.statusText}`,
    );
  }

  const csv = await response.text();

  const rawRows = parseCsv(csv);

  console.log(
    `Downloaded ${rawRows.length} total NFL schedule rows.`,
  );

  const seasonRows = rawRows.filter(
    (row) =>
      Number(clean(row.season)) ===
      targetSeason,
  );

  console.log(
    `Found ${seasonRows.length} rows for ${targetSeason}.`,
  );

  const normalized: ScheduleRow[] = [];

  for (const row of seasonRows) {
    const game =
      normalizeScheduleRow(row);

    if (game) {
      normalized.push(game);
    }
  }

  if (normalized.length === 0) {
    throw new Error(
      `No regular-season/postseason games found for ${targetSeason}.`,
    );
  }

  const regularSeason =
    normalized.filter(
      (game) =>
        game.game_type === "REG",
    );

  const postseason =
    normalized.filter(
      (game) =>
        game.game_type === "POST",
    );

  let inserted = 0;
  let updated = 0;

  for (const game of normalized) {
    const {
      data: existing,
      error: lookupError,
    } = await supabase
      .from("nfl_games")
      .select("id")
      .eq("season", game.season)
      .eq(
        "game_date",
        game.game_date,
      )
      .eq(
        "home_team",
        game.home_team,
      )
      .eq(
        "away_team",
        game.away_team,
      )
      .maybeSingle();

    if (lookupError) {
      throw new Error(
        `Could not check ${game.external_game_id}: ${lookupError.message}`,
      );
    }

    if (existing) {
      const { error } =
        await supabase
          .from("nfl_games")
          .update({
            external_game_id:
              game.external_game_id,

            week:
              game.week,

            commence_time:
              game.commence_time,

            game_type:
              game.game_type,

            ...(game.home_score !== null &&
            game.away_score !== null
              ? {
                  home_score:
                    game.home_score,
                  away_score:
                    game.away_score,
                }
              : {}),

            updated_at:
              new Date().toISOString(),
          })
          .eq("id", existing.id);

      if (error) {
        throw new Error(
          `Could not update ${game.external_game_id}: ${error.message}`,
        );
      }

      updated++;
    } else {
      const { error } =
        await supabase
          .from("nfl_games")
          .insert({
            ...game,

            updated_at:
              new Date().toISOString(),
          });

      if (error) {
        throw new Error(
          `Could not insert ${game.external_game_id}: ${error.message}`,
        );
      }

      inserted++;
    }
  }

  const result = {
    season: targetSeason,
    regularSeason:
      regularSeason.length,
    postseason:
      postseason.length,
    total: normalized.length,
    inserted,
    updated,
  };

  console.log(
    "NFL schedule import complete:",
    result,
  );

  return result;
}
