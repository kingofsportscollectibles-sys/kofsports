import { createClient } from "@/lib/supabase/server";

export type NflPlayerPage = {
  gsisId: string;
  playerName: string;
  slug: string;
  team: string;
  position: "QB" | "RB" | "WR" | "TE";
  status: string | null;
  season: number;
  sleeperId: string | null;
  headshotUrl: string | null;
};

type NflPlayerPageRow = {
  gsis_id: string;
  player_name: string;
  slug: string;
  team: string;
  position: "QB" | "RB" | "WR" | "TE";
  status: string | null;
  season: number;
  sleeper_id: string | null;
  headshot_url: string | null;
};

function mapPlayerPage(
  row: NflPlayerPageRow,
): NflPlayerPage {
  return {
    gsisId: row.gsis_id,
    playerName: row.player_name,
    slug: row.slug,
    team: row.team,
    position: row.position,
    status: row.status,
    season: row.season,
    sleeperId: row.sleeper_id,
    headshotUrl: row.headshot_url,
  };
}

export async function getNflPlayerBySlug(
  slug: string,
): Promise<NflPlayerPage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_pages")
    .select(
      `
        gsis_id,
        player_name,
        slug,
        team,
        position,
        status,
        season,
        sleeper_id,
        headshot_url
      `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load NFL player page:",
      {
        slug,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NFL player page: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  return mapPlayerPage(
    data as NflPlayerPageRow,
  );
}

export async function getNflPlayerPageSlugs(): Promise<
  string[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_pages")
    .select("slug")
    .order("slug", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load NFL player page slugs:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NFL player page slugs: ${error.message}`,
    );
  }

  return (data ?? [])
    .map((row) => row.slug)
    .filter(
      (slug): slug is string =>
        typeof slug === "string" &&
        slug.length > 0,
    );
}

export type NflPlayerSeasonStats = {
  games: number;
  passingCompletions: number;
  passingAttempts: number;
  passingYards: number;
  passingTouchdowns: number;
  interceptions: number;
  rushingAttempts: number;
  rushingYards: number;
  rushingTouchdowns: number;
  targets: number;
  receptions: number;
  receivingYards: number;
  receivingTouchdowns: number;
};

type NflPlayerGameStatRow = {
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
};

export async function getNflPlayerSeasonStats(
  gsisId: string,
  season = 2026,
): Promise<NflPlayerSeasonStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_game_stats")
    .select(
      `
        passing_completions,
        passing_attempts,
        passing_yards,
        passing_touchdowns,
        interceptions,
        rushing_attempts,
        rushing_yards,
        rushing_touchdowns,
        targets,
        receptions,
        receiving_yards,
        receiving_touchdowns
      `,
    )
    .eq("external_player_id", gsisId)
    .eq("season", season);

  if (error) {
    console.error(
      "Failed to load NFL player season stats:",
      {
        gsisId,
        season,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NFL player season stats: ${error.message}`,
    );
  }

  const rows = (data ?? []) as NflPlayerGameStatRow[];

  return rows.reduce<NflPlayerSeasonStats>(
    (stats, row) => ({
      games: stats.games + 1,
      passingCompletions:
        stats.passingCompletions +
        (row.passing_completions ?? 0),
      passingAttempts:
        stats.passingAttempts +
        (row.passing_attempts ?? 0),
      passingYards:
        stats.passingYards +
        (row.passing_yards ?? 0),
      passingTouchdowns:
        stats.passingTouchdowns +
        (row.passing_touchdowns ?? 0),
      interceptions:
        stats.interceptions +
        (row.interceptions ?? 0),
      rushingAttempts:
        stats.rushingAttempts +
        (row.rushing_attempts ?? 0),
      rushingYards:
        stats.rushingYards +
        (row.rushing_yards ?? 0),
      rushingTouchdowns:
        stats.rushingTouchdowns +
        (row.rushing_touchdowns ?? 0),
      targets:
        stats.targets +
        (row.targets ?? 0),
      receptions:
        stats.receptions +
        (row.receptions ?? 0),
      receivingYards:
        stats.receivingYards +
        (row.receiving_yards ?? 0),
      receivingTouchdowns:
        stats.receivingTouchdowns +
        (row.receiving_touchdowns ?? 0),
    }),
    {
      games: 0,
      passingCompletions: 0,
      passingAttempts: 0,
      passingYards: 0,
      passingTouchdowns: 0,
      interceptions: 0,
      rushingAttempts: 0,
      rushingYards: 0,
      rushingTouchdowns: 0,
      targets: 0,
      receptions: 0,
      receivingYards: 0,
      receivingTouchdowns: 0,
    },
  );
}

export type NflPlayerGameLog = {
  week: number;
  gameDate: string;
  team: string;
  opponent: string;
  isHome: boolean;
  passingCompletions: number;
  passingAttempts: number;
  passingYards: number;
  passingTouchdowns: number;
  interceptions: number;
  rushingAttempts: number;
  rushingYards: number;
  rushingTouchdowns: number;
  targets: number;
  receptions: number;
  receivingYards: number;
  receivingTouchdowns: number;
};

type NflPlayerGameLogRow = {
  week: number;
  game_date: string;
  team: string;
  opponent: string;
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
};

export async function getNflPlayerGameLog(
  gsisId: string,
  season = 2026,
): Promise<NflPlayerGameLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_game_stats")
    .select(
      `
        week,
        game_date,
        team,
        opponent,
        is_home,
        passing_completions,
        passing_attempts,
        passing_yards,
        passing_touchdowns,
        interceptions,
        rushing_attempts,
        rushing_yards,
        rushing_touchdowns,
        targets,
        receptions,
        receiving_yards,
        receiving_touchdowns
      `,
    )
    .eq("external_player_id", gsisId)
    .eq("season", season)
    .order("week", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Failed to load NFL player game log:",
      {
        gsisId,
        season,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NFL player game log: ${error.message}`,
    );
  }

  return (
    (data ?? []) as NflPlayerGameLogRow[]
  ).map((row) => ({
    week: row.week,
    gameDate: row.game_date,
    team: row.team,
    opponent: row.opponent,
    isHome: row.is_home,
    passingCompletions:
      row.passing_completions ?? 0,
    passingAttempts:
      row.passing_attempts ?? 0,
    passingYards: row.passing_yards ?? 0,
    passingTouchdowns:
      row.passing_touchdowns ?? 0,
    interceptions: row.interceptions ?? 0,
    rushingAttempts:
      row.rushing_attempts ?? 0,
    rushingYards: row.rushing_yards ?? 0,
    rushingTouchdowns:
      row.rushing_touchdowns ?? 0,
    targets: row.targets ?? 0,
    receptions: row.receptions ?? 0,
    receivingYards:
      row.receiving_yards ?? 0,
    receivingTouchdowns:
      row.receiving_touchdowns ?? 0,
  }));
}

export type NflPlayerUpcomingGame = {
  week: number;
  gameDate: string;
  opponent: string;
  isHome: boolean;
};

export async function getNflPlayerUpcomingGame(
  team: string,
  season: number,
): Promise<NflPlayerUpcomingGame | null> {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("nfl_games")
    .select(
      "week, game_date, home_team, away_team",
    )
    .eq("season", season)
    .gte("game_date", today)
    .order("game_date", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load NFL player upcoming game:",
      {
        team,
        season,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    return null;
  }

  const game = (data ?? []).find(
    (row) =>
      row.home_team === team ||
      row.away_team === team,
  );

  if (!game) {
    return null;
  }

  const isHome = game.home_team === team;

  return {
    week: game.week,
    gameDate: game.game_date,
    opponent: isHome
      ? game.away_team
      : game.home_team,
    isHome,
  };
}

export async function getNflPlayerSlugMap(
  gsisIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(
    new Set(gsisIds.filter(Boolean)),
  );

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_pages")
    .select("gsis_id,slug")
    .in("gsis_id", uniqueIds);

  if (error) {
    console.error(
      "Failed to load NFL player slug map:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NFL player slug map: ${error.message}`,
    );
  }

  return new Map(
    (data ?? [])
      .filter(
        (row) =>
          typeof row.gsis_id === "string" &&
          typeof row.slug === "string" &&
          row.slug.length > 0,
      )
      .map((row) => [row.gsis_id, row.slug]),
  );
}
