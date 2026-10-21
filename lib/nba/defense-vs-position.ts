import { createClient } from "@/lib/supabase/server";

export const NBA_DVP_POSITIONS = ["G", "F", "C"] as const;

export type NbaDvpPosition =
  (typeof NBA_DVP_POSITIONS)[number];

export type NbaDefenseVsPosition = {
  season: number;
  defense: string;
  positionGroup: NbaDvpPosition;

  seasonGames: number;
  pointsAllowedPerGame: number;
  reboundsAllowedPerGame: number;
  assistsAllowedPerGame: number;
  threesAllowedPerGame: number;

  last5Games: number;
  last5PointsAllowedPerGame: number | null;
  last5ReboundsAllowedPerGame: number | null;
  last5AssistsAllowedPerGame: number | null;
  last5ThreesAllowedPerGame: number | null;

  last10Games: number;
  last10PointsAllowedPerGame: number | null;
  last10ReboundsAllowedPerGame: number | null;
  last10AssistsAllowedPerGame: number | null;
  last10ThreesAllowedPerGame: number | null;

  throughDate: string;
};

type DefenseVsPositionRow = {
  season: number | string;
  defense: string;
  position_group: string;

  season_games: number | string;
  points_allowed_per_game: number | string;
  rebounds_allowed_per_game: number | string;
  assists_allowed_per_game: number | string;
  threes_allowed_per_game: number | string;

  last_5_games: number | string;
  last_5_points_allowed_per_game: number | string | null;
  last_5_rebounds_allowed_per_game: number | string | null;
  last_5_assists_allowed_per_game: number | string | null;
  last_5_threes_allowed_per_game: number | string | null;

  last_10_games: number | string;
  last_10_points_allowed_per_game: number | string | null;
  last_10_rebounds_allowed_per_game: number | string | null;
  last_10_assists_allowed_per_game: number | string | null;
  last_10_threes_allowed_per_game: number | string | null;

  through_date: string;
};

function numberValue(
  value: number | string,
): number {
  return Number(value);
}

function nullableNumber(
  value: number | string | null,
): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function isNbaDvpPosition(
  value: string,
): value is NbaDvpPosition {
  return NBA_DVP_POSITIONS.includes(
    value as NbaDvpPosition,
  );
}

function mapDefenseVsPosition(
  row: DefenseVsPositionRow,
): NbaDefenseVsPosition | null {
  if (!isNbaDvpPosition(row.position_group)) {
    return null;
  }

  return {
    season: numberValue(row.season),
    defense: row.defense,
    positionGroup: row.position_group,

    seasonGames: numberValue(row.season_games),
    pointsAllowedPerGame: numberValue(
      row.points_allowed_per_game,
    ),
    reboundsAllowedPerGame: numberValue(
      row.rebounds_allowed_per_game,
    ),
    assistsAllowedPerGame: numberValue(
      row.assists_allowed_per_game,
    ),
    threesAllowedPerGame: numberValue(
      row.threes_allowed_per_game,
    ),

    last5Games: numberValue(row.last_5_games),
    last5PointsAllowedPerGame: nullableNumber(
      row.last_5_points_allowed_per_game,
    ),
    last5ReboundsAllowedPerGame: nullableNumber(
      row.last_5_rebounds_allowed_per_game,
    ),
    last5AssistsAllowedPerGame: nullableNumber(
      row.last_5_assists_allowed_per_game,
    ),
    last5ThreesAllowedPerGame: nullableNumber(
      row.last_5_threes_allowed_per_game,
    ),

    last10Games: numberValue(row.last_10_games),
    last10PointsAllowedPerGame: nullableNumber(
      row.last_10_points_allowed_per_game,
    ),
    last10ReboundsAllowedPerGame: nullableNumber(
      row.last_10_rebounds_allowed_per_game,
    ),
    last10AssistsAllowedPerGame: nullableNumber(
      row.last_10_assists_allowed_per_game,
    ),
    last10ThreesAllowedPerGame: nullableNumber(
      row.last_10_threes_allowed_per_game,
    ),

    throughDate: row.through_date,
  };
}

export async function getNbaDefenseVsPosition(): Promise<
  NbaDefenseVsPosition[]
> {
  const supabase = await createClient();

  const { data: latestSeasonRow, error: seasonError } =
    await supabase
      .from("nba_defense_vs_position")
      .select("season")
      .order("season", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (seasonError) {
    console.error(
      "Failed to determine latest NBA DvP season:",
      {
        message: seasonError.message,
        details: seasonError.details,
        hint: seasonError.hint,
        code: seasonError.code,
      },
    );

    throw new Error(
      `Unable to determine latest NBA DvP season: ${seasonError.message}`,
    );
  }

  if (!latestSeasonRow) {
    return [];
  }

  const season = Number(latestSeasonRow.season);

  const { data, error } = await supabase
    .from("nba_defense_vs_position")
    .select("*")
    .eq("season", season)
    .order("defense", { ascending: true })
    .order("position_group", { ascending: true });

  if (error) {
    console.error(
      "Failed to load NBA defense vs position:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NBA defense vs position: ${error.message}`,
    );
  }

  return ((data ?? []) as DefenseVsPositionRow[])
    .map(mapDefenseVsPosition)
    .filter(
      (
        row,
      ): row is NbaDefenseVsPosition => row !== null,
    );
}

export type NbaDvpMatchupProp = {
  propId: number;
  playerId: number;
  playerSlug: string | null;
  positionGroup: NbaDvpPosition | null;
  playerName: string;
  playerTeam: string | null;
  opponent: string;
  market:
    | "player_points"
    | "player_rebounds"
    | "player_assists"
    | "player_threes";
  line: number;
  l5Games: number;
  l5Overs: number;
};

export async function getNbaDvpMatchupProps(): Promise<
  NbaDvpMatchupProp[]
> {
  const [
    { getNbaPlayerPropTrends },
    { getNbaPlayerResearchMetadataByIds },
  ] = await Promise.all([
    import("@/lib/nba/prop-trends"),
    import("@/lib/nba/player-pages"),
  ]);

  const props = await getNbaPlayerPropTrends();

  const supportedProps = props.filter(
    (
      prop,
    ): prop is typeof prop & {
      upcomingOpponent: string;
      market:
        | "player_points"
        | "player_rebounds"
        | "player_assists"
        | "player_threes";
    } =>
      prop.upcomingOpponent !== null &&
      (
        prop.market === "player_points" ||
        prop.market === "player_rebounds" ||
        prop.market === "player_assists" ||
        prop.market === "player_threes"
      ),
  );

  const playerMetadata = await getNbaPlayerResearchMetadataByIds(
    supportedProps.map((prop) => prop.playerId),
  );

  return supportedProps.map((prop) => ({
    propId: prop.propId,
    playerId: prop.playerId,
    playerSlug: playerMetadata.get(prop.playerId)?.slug ?? null,
    positionGroup:
      playerMetadata.get(prop.playerId)?.positionGroup ?? null,
    playerName: prop.playerName,
    playerTeam: prop.playerTeam,
    opponent: prop.upcomingOpponent,
    market: prop.market,
    line: prop.line,
    l5Games: prop.l5Games,
    l5Overs: prop.l5Overs,
  }));
}
