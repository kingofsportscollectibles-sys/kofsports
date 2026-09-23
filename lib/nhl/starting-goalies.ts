import { createClient } from "@/lib/supabase/server";

export type NhlStartingGoalieStatus =
  | "unconfirmed"
  | "likely"
  | "confirmed";

export type NhlStartingGoalie = {
  team: string;
  opponent: string;
  isHome: boolean;
  goalieId: number | null;
  goalieName: string | null;
  headshotUrl: string | null;
  status: NhlStartingGoalieStatus;
  sourceStatus: string | null;
  sourceUpdatedAt: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceDetails: string | null;
  fetchedAt: string;
};

export type NhlStartingGoalieMatchup = {
  gameId: number;
  gameDate: string;
  commenceTime: string;
  awayTeam: string;
  homeTeam: string;
  awayGoalie: NhlStartingGoalie | null;
  homeGoalie: NhlStartingGoalie | null;
};

type GoaliePlayerJoin = {
  headshot_url: string | null;
};

type StartingGoalieRow = {
  game_id: number;
  game_date: string;
  commence_time: string;
  team: string;
  opponent: string;
  is_home: boolean;
  goalie_id: number | null;
  goalie_name: string | null;
  status: string;
  source_status: string | null;
  source_updated_at: string | null;
  source_name: string | null;
  source_url: string | null;
  source_details: string | null;
  fetched_at: string;
  nhl_players:
    | GoaliePlayerJoin
    | GoaliePlayerJoin[]
    | null;
};

function getHeadshotUrl(
  player:
    | GoaliePlayerJoin
    | GoaliePlayerJoin[]
    | null,
): string | null {
  if (!player) {
    return null;
  }

  if (Array.isArray(player)) {
    return player[0]?.headshot_url ?? null;
  }

  return player.headshot_url;
}

function mapGoalie(
  row: StartingGoalieRow,
): NhlStartingGoalie {
  return {
    team: row.team,
    opponent: row.opponent,
    isHome: row.is_home,
    goalieId:
      row.goalie_id === null
        ? null
        : Number(row.goalie_id),
    goalieName: row.goalie_name,
    headshotUrl: getHeadshotUrl(row.nhl_players),
    status:
      row.status as NhlStartingGoalieStatus,
    sourceStatus: row.source_status,
    sourceUpdatedAt: row.source_updated_at,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    sourceDetails: row.source_details,
    fetchedAt: row.fetched_at,
  };
}

export async function getNhlStartingGoalies(
  gameDate?: string,
): Promise<NhlStartingGoalieMatchup[]> {
  const supabase = await createClient();

  const requestedDate =
    gameDate ??
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  const { data, error } = await supabase
    .from("nhl_starting_goalies")
    .select(
      `
        game_id,
        game_date,
        commence_time,
        team,
        opponent,
        is_home,
        goalie_id,
        goalie_name,
        status,
        source_status,
        source_updated_at,
        source_name,
        source_url,
        source_details,
        fetched_at,
        nhl_players!nhl_starting_goalies_goalie_id_fkey (
          headshot_url
        )
      `,
    )
    .eq("game_date", requestedDate)
    .order("commence_time", { ascending: true })
    .order("is_home", { ascending: true });

  if (error) {
    console.error(
      "Failed to load NHL starting goalies:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NHL starting goalies: ${error.message}`,
    );
  }

  const rows = (data ?? []) as StartingGoalieRow[];

  const matchups = new Map<
    number,
    NhlStartingGoalieMatchup
  >();

  for (const row of rows) {
    const existing = matchups.get(row.game_id);

    const matchup =
      existing ?? {
        gameId: Number(row.game_id),
        gameDate: row.game_date,
        commenceTime: row.commence_time,
        awayTeam: row.is_home
          ? row.opponent
          : row.team,
        homeTeam: row.is_home
          ? row.team
          : row.opponent,
        awayGoalie: null,
        homeGoalie: null,
      };

    const goalie = mapGoalie(row);

    if (row.is_home) {
      matchup.homeGoalie = goalie;
    } else {
      matchup.awayGoalie = goalie;
    }

    matchups.set(row.game_id, matchup);
  }

  return Array.from(matchups.values()).sort(
    (a, b) =>
      new Date(a.commenceTime).getTime() -
      new Date(b.commenceTime).getTime(),
  );
}
