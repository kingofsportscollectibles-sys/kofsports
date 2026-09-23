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

const SEASONS = [
  {
    season: 20232024,
    startDate: "2023-10-01",
    endDate: "2024-06-30",
  },
  {
    season: 20242025,
    startDate: "2024-10-01",
    endDate: "2025-06-30",
  },
  {
    season: 20252026,
    startDate: "2025-10-01",
    endDate: "2026-06-30",
  },
  {
    season: 20262027,
    startDate: "2026-09-01",
    endDate: "2027-06-30",
  },
] as const;

type NhlScheduleTeam = {
  abbrev?: string;
};

type NhlScheduleGame = {
  id?: number;
  season?: number;
  gameType?: number;
  startTimeUTC?: string;
  awayTeam?: NhlScheduleTeam;
  homeTeam?: NhlScheduleTeam;
};

type NhlScheduleDay = {
  date?: string;
  games?: NhlScheduleGame[];
};

type NhlScheduleResponse = {
  nextStartDate?: string;
  gameWeek?: NhlScheduleDay[];
};

type NhlGameRow = {
  id: number;
  season: number;
  game_type: number;
  game_date: string;
  commence_time: string | null;
  home_team: string;
  away_team: string;
  updated_at: string;
};

async function fetchSchedule(
  date: string
): Promise<NhlScheduleResponse> {
  const url =
    `https://api-web.nhle.com/v1/schedule/${date}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `NHL schedule request failed for ${date}: ` +
        `${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as NhlScheduleResponse;
}

async function importSeason(
  season: number,
  startDate: string,
  endDate: string
) {
  console.log(`\nImporting NHL season ${season}...`);

  const games = new Map<number, NhlGameRow>();
  let cursor = startDate;
  let requests = 0;

  while (cursor <= endDate) {
    console.log(`Fetching schedule week ${cursor}...`);

    const response = await fetchSchedule(cursor);
    requests += 1;

    for (const day of response.gameWeek ?? []) {
      if (!day.date) {
        continue;
      }

      for (const game of day.games ?? []) {
        const homeTeam = game.homeTeam?.abbrev;
        const awayTeam = game.awayTeam?.abbrev;

        if (
          !game.id ||
          game.season !== season ||
          game.gameType !== 2 ||
          !homeTeam ||
          !awayTeam
        ) {
          continue;
        }

        games.set(game.id, {
          id: game.id,
          season,
          game_type: game.gameType,
          game_date: day.date,
          commence_time: game.startTimeUTC ?? null,
          home_team: homeTeam,
          away_team: awayTeam,
          updated_at: new Date().toISOString(),
        });
      }
    }

    const next = response.nextStartDate;

    if (!next || next <= cursor) {
      break;
    }

    cursor = next;
  }

  const rows = Array.from(games.values()).filter(
    (game) =>
      game.game_date >= startDate &&
      game.game_date <= endDate
  );

  if (rows.length === 0) {
    console.warn(
      `Season ${season}: no games returned.`
    );
    return;
  }

  const batchSize = 250;

  for (
    let index = 0;
    index < rows.length;
    index += batchSize
  ) {
    const batch = rows.slice(index, index + batchSize);

    const { error } = await supabase
      .from("nhl_games")
      .upsert(batch, {
        onConflict: "id",
      });

    if (error) {
      throw new Error(
        `Failed to upsert NHL games for ${season}: ` +
          error.message
      );
    }
  }

  const byType = rows.reduce<Record<number, number>>(
    (counts, game) => {
      counts[game.game_type] =
        (counts[game.game_type] ?? 0) + 1;
      return counts;
    },
    {}
  );

  console.log(
    `Season ${season}: ${rows.length} games imported ` +
      `from ${requests} schedule requests.`
  );

  console.log("Game types:", byType);
}

async function main() {
  for (const season of SEASONS) {
    await importSeason(
      season.season,
      season.startDate,
      season.endDate
    );
  }

  console.log("\nNHL schedule import complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
