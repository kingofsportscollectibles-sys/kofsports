import { createClient } from "@/lib/supabase/server";

export type NbaPlayerPage = {
  playerId: number;
  playerName: string;
  slug: string;
  team: string | null;
  active: boolean;
  headshotUrl: string;
};

type NbaPlayerPageRow = {
  player_id: number;
  player_name: string;
  slug: string;
  team: string | null;
  active: boolean;
};

function getNbaHeadshotUrl(playerId: number): string {
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`;
}

function mapPlayerPage(row: NbaPlayerPageRow): NbaPlayerPage {
  return {
    playerId: row.player_id,
    playerName: row.player_name,
    slug: row.slug,
    team: row.team,
    active: row.active,
    headshotUrl: getNbaHeadshotUrl(row.player_id),
  };
}

export async function getNbaPlayerBySlug(
  slug: string,
): Promise<NbaPlayerPage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nba_player_pages")
    .select(
      `
        player_id,
        player_name,
        slug,
        team,
        active
      `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load NBA player page:", {
      slug,
      error,
    });
    throw new Error("Failed to load NBA player page");
  }

  if (!data) {
    return null;
  }

  return mapPlayerPage(data as NbaPlayerPageRow);
}

export async function getNbaPlayerPageSlugs(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nba_player_pages")
    .select("slug")
    .order("slug", { ascending: true });

  if (error) {
    console.error("Failed to load NBA player page slugs:", error);
    throw new Error("Failed to load NBA player page slugs");
  }

  return (data ?? [])
    .map((row) => row.slug)
    .filter(
      (slug): slug is string =>
        typeof slug === "string" && slug.length > 0,
    );
}


export async function getNbaPlayerLatestRegularSeason(
  playerId: number,
): Promise<number | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nba_player_game_stats")
    .select("season")
    .eq("player_id", playerId)
    .eq("game_type", "regular")
    .order("season", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to resolve NBA player season:", {
      playerId,
      error,
    });
    throw new Error("Failed to resolve NBA player season");
  }

  return data?.season ?? null;
}


export type NbaPlayerSeasonStats = {
  games: number;
  minutes: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  points: number;
  plusMinus: number;
};

type NbaPlayerSeasonStatsRow = {
  minutes: number | string | null;
  field_goals_made: number | null;
  field_goals_attempted: number | null;
  three_pointers_made: number | null;
  three_pointers_attempted: number | null;
  free_throws_made: number | null;
  free_throws_attempted: number | null;
  offensive_rebounds: number | null;
  defensive_rebounds: number | null;
  rebounds: number | null;
  assists: number | null;
  steals: number | null;
  blocks: number | null;
  turnovers: number | null;
  personal_fouls: number | null;
  points: number | null;
  plus_minus: number | null;
};

export async function getNbaPlayerSeasonStats(
  playerId: number,
  season: number,
): Promise<NbaPlayerSeasonStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nba_player_game_stats")
    .select(
      `
        minutes,
        field_goals_made,
        field_goals_attempted,
        three_pointers_made,
        three_pointers_attempted,
        free_throws_made,
        free_throws_attempted,
        offensive_rebounds,
        defensive_rebounds,
        rebounds,
        assists,
        steals,
        blocks,
        turnovers,
        personal_fouls,
        points,
        plus_minus
      `,
    )
    .eq("player_id", playerId)
    .eq("season", season)
    .eq("game_type", "regular");

  if (error) {
    console.error("Failed to load NBA player season stats:", {
      playerId,
      season,
      error,
    });
    throw new Error("Failed to load NBA player season stats");
  }

  const rows = (data ?? []) as NbaPlayerSeasonStatsRow[];

  return rows.reduce<NbaPlayerSeasonStats>(
    (totals, row) => ({
      games: totals.games + 1,
      minutes: totals.minutes + Number(row.minutes ?? 0),
      fieldGoalsMade:
        totals.fieldGoalsMade + (row.field_goals_made ?? 0),
      fieldGoalsAttempted:
        totals.fieldGoalsAttempted + (row.field_goals_attempted ?? 0),
      threePointersMade:
        totals.threePointersMade + (row.three_pointers_made ?? 0),
      threePointersAttempted:
        totals.threePointersAttempted +
        (row.three_pointers_attempted ?? 0),
      freeThrowsMade:
        totals.freeThrowsMade + (row.free_throws_made ?? 0),
      freeThrowsAttempted:
        totals.freeThrowsAttempted + (row.free_throws_attempted ?? 0),
      offensiveRebounds:
        totals.offensiveRebounds + (row.offensive_rebounds ?? 0),
      defensiveRebounds:
        totals.defensiveRebounds + (row.defensive_rebounds ?? 0),
      rebounds: totals.rebounds + (row.rebounds ?? 0),
      assists: totals.assists + (row.assists ?? 0),
      steals: totals.steals + (row.steals ?? 0),
      blocks: totals.blocks + (row.blocks ?? 0),
      turnovers: totals.turnovers + (row.turnovers ?? 0),
      personalFouls:
        totals.personalFouls + (row.personal_fouls ?? 0),
      points: totals.points + (row.points ?? 0),
      plusMinus: totals.plusMinus + (row.plus_minus ?? 0),
    }),
    {
      games: 0,
      minutes: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      offensiveRebounds: 0,
      defensiveRebounds: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      personalFouls: 0,
      points: 0,
      plusMinus: 0,
    },
  );
}


export type NbaPlayerGameLog = {
  gameId: string;
  gameDate: string;
  team: string;
  opponent: string;
  isHome: boolean;
  minutes: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  points: number;
  plusMinus: number;
};

type NbaPlayerGameLogRow = {
  game_id: string;
  game_date: string;
  team: string;
  opponent: string;
  is_home: boolean;
  minutes: number | string | null;
  field_goals_made: number | null;
  field_goals_attempted: number | null;
  three_pointers_made: number | null;
  three_pointers_attempted: number | null;
  free_throws_made: number | null;
  free_throws_attempted: number | null;
  rebounds: number | null;
  assists: number | null;
  steals: number | null;
  blocks: number | null;
  turnovers: number | null;
  points: number | null;
  plus_minus: number | null;
};

export async function getNbaPlayerGameLog(
  playerId: number,
  season: number,
): Promise<NbaPlayerGameLog[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nba_player_game_stats")
    .select(
      `
        game_id,
        game_date,
        team,
        opponent,
        is_home,
        minutes,
        field_goals_made,
        field_goals_attempted,
        three_pointers_made,
        three_pointers_attempted,
        free_throws_made,
        free_throws_attempted,
        rebounds,
        assists,
        steals,
        blocks,
        turnovers,
        points,
        plus_minus
      `,
    )
    .eq("player_id", playerId)
    .eq("season", season)
    .eq("game_type", "regular")
    .order("game_date", { ascending: false });

  if (error) {
    console.error("Failed to load NBA player game log:", {
      playerId,
      season,
      error,
    });
    throw new Error("Failed to load NBA player game log");
  }

  return ((data ?? []) as NbaPlayerGameLogRow[]).map((row) => ({
    gameId: row.game_id,
    gameDate: row.game_date,
    team: row.team,
    opponent: row.opponent,
    isHome: row.is_home,
    minutes: Number(row.minutes ?? 0),
    fieldGoalsMade: row.field_goals_made ?? 0,
    fieldGoalsAttempted: row.field_goals_attempted ?? 0,
    threePointersMade: row.three_pointers_made ?? 0,
    threePointersAttempted: row.three_pointers_attempted ?? 0,
    freeThrowsMade: row.free_throws_made ?? 0,
    freeThrowsAttempted: row.free_throws_attempted ?? 0,
    rebounds: row.rebounds ?? 0,
    assists: row.assists ?? 0,
    steals: row.steals ?? 0,
    blocks: row.blocks ?? 0,
    turnovers: row.turnovers ?? 0,
    points: row.points ?? 0,
    plusMinus: row.plus_minus ?? 0,
  }));
}
