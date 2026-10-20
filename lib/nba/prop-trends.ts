import { createClient } from "@/lib/supabase/server";

export const NBA_PROP_MARKETS = [
  "player_points",
  "player_rebounds",
  "player_assists",
  "player_threes",
  "player_points_rebounds_assists",
] as const;

export type NbaPropMarket =
  (typeof NBA_PROP_MARKETS)[number];

export type NbaPropGameResult = {
  gameId: string;
  gameDate: string;
  opponent: string | null;
  value: number;
};

export type NbaPlayerPropTrend = {
  propId: number;
  eventId: string;
  playerId: number;
  playerName: string;
  playerTeam: string | null;
  market: NbaPropMarket;
  line: number;
  overPrice: number | null;
  underPrice: number | null;
  bookmaker: string;
  homeTeam: string;
  awayTeam: string;
  upcomingOpponent: string | null;
  commenceTime: string;
  fetchedAt: string;

  l5Games: number;
  l5Overs: number;
  l5Unders: number;
  l5Pushes: number;
  l5OverPct: number | null;
  avgL5: number | null;

  l10Games: number;
  l10Overs: number;
  l10Unders: number;
  l10Pushes: number;
  l10OverPct: number | null;
  avgL10: number | null;

  seasonGames: number;
  seasonOvers: number;
  seasonUnders: number;
  seasonPushes: number;
  seasonOverPct: number | null;
  avgSeason: number | null;

  h2hGames: number;
  h2hOvers: number;
  h2hUnders: number;
  h2hPushes: number;
  h2hOverPct: number | null;
  avgH2h: number | null;

  lastTen: NbaPropGameResult[];
};

type PropTrendRow = {
  prop_id: number | string;
  event_id: string;
  player_id: number | string;
  player_name: string;
  player_team: string | null;
  market: string;
  line: number | string;
  over_price: number | null;
  under_price: number | null;
  bookmaker: string;
  home_team: string;
  away_team: string;
  upcoming_opponent: string | null;
  commence_time: string;
  fetched_at: string;

  l5_games: number | string;
  l5_overs: number | string;
  l5_unders: number | string;
  l5_pushes: number | string;
  l5_over_pct: number | string | null;
  l5_avg: number | string | null;

  l10_games: number | string;
  l10_overs: number | string;
  l10_unders: number | string;
  l10_pushes: number | string;
  l10_over_pct: number | string | null;
  l10_avg: number | string | null;

  season_games: number | string;
  season_overs: number | string;
  season_unders: number | string;
  season_pushes: number | string;
  season_over_pct: number | string | null;
  season_avg: number | string | null;

  h2h_games: number | string;
  h2h_overs: number | string;
  h2h_unders: number | string;
  h2h_pushes: number | string;
  h2h_over_pct: number | string | null;
  h2h_avg: number | string | null;

  last_ten: unknown;
};

function nullableNumber(
  value: number | string | null,
): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function numberValue(
  value: number | string,
): number {
  return Number(value);
}

function mapLastTen(
  value: unknown,
): NbaPropGameResult[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null
    ) {
      return [];
    }

    const row = item as Record<string, unknown>;

    if (
      typeof row.gameId !== "string" ||
      typeof row.gameDate !== "string"
    ) {
      return [];
    }

    const statValue = Number(row.value);

    if (!Number.isFinite(statValue)) {
      return [];
    }

    return [
      {
        gameId: row.gameId,
        gameDate: row.gameDate,
        opponent:
          typeof row.opponent === "string"
            ? row.opponent
            : null,
        value: statValue,
      },
    ];
  });
}

function mapPropTrend(
  row: PropTrendRow,
): NbaPlayerPropTrend {
  return {
    propId: numberValue(row.prop_id),
    eventId: row.event_id,
    playerId: numberValue(row.player_id),
    playerName: row.player_name,
    playerTeam: row.player_team,
    market: row.market as NbaPropMarket,
    line: numberValue(row.line),
    overPrice: row.over_price,
    underPrice: row.under_price,
    bookmaker: row.bookmaker,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    upcomingOpponent: row.upcoming_opponent,
    commenceTime: row.commence_time,
    fetchedAt: row.fetched_at,

    l5Games: numberValue(row.l5_games),
    l5Overs: numberValue(row.l5_overs),
    l5Unders: numberValue(row.l5_unders),
    l5Pushes: numberValue(row.l5_pushes),
    l5OverPct: nullableNumber(row.l5_over_pct),
    avgL5: nullableNumber(row.l5_avg),

    l10Games: numberValue(row.l10_games),
    l10Overs: numberValue(row.l10_overs),
    l10Unders: numberValue(row.l10_unders),
    l10Pushes: numberValue(row.l10_pushes),
    l10OverPct: nullableNumber(
      row.l10_over_pct,
    ),
    avgL10: nullableNumber(row.l10_avg),

    seasonGames: numberValue(row.season_games),
    seasonOvers: numberValue(row.season_overs),
    seasonUnders: numberValue(row.season_unders),
    seasonPushes: numberValue(row.season_pushes),
    seasonOverPct: nullableNumber(
      row.season_over_pct,
    ),
    avgSeason: nullableNumber(row.season_avg),

    h2hGames: numberValue(row.h2h_games),
    h2hOvers: numberValue(row.h2h_overs),
    h2hUnders: numberValue(row.h2h_unders),
    h2hPushes: numberValue(row.h2h_pushes),
    h2hOverPct: nullableNumber(
      row.h2h_over_pct,
    ),
    avgH2h: nullableNumber(row.h2h_avg),

    lastTen: mapLastTen(row.last_ten),
  };
}

export async function getNbaPlayerPropTrends(): Promise<
  NbaPlayerPropTrend[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nba_player_prop_trends")
    .select("*")
    .eq("bookmaker", "draftkings")
    .in("market", NBA_PROP_MARKETS)
    .gte(
      "commence_time",
      new Date().toISOString(),
    )
    .order("commence_time", {
      ascending: true,
    })
    .order("player_name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load NBA player prop trends:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NBA player prop trends: ${error.message}`,
    );
  }

  return ((data ?? []) as PropTrendRow[]).map(
    mapPropTrend,
  );
}

export async function getNbaPlayerPropTrendsByPlayer(
  playerId: number,
): Promise<NbaPlayerPropTrend[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nba_player_prop_trends")
    .select("*")
    .eq("player_id", playerId)
    .eq("bookmaker", "draftkings")
    .in("market", NBA_PROP_MARKETS)
    .gte("commence_time", new Date().toISOString())
    .order("commence_time", {
      ascending: true,
    })
    .order("market", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Failed to load NBA player prop trends by player:",
      {
        playerId,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NBA player prop trends: ${error.message}`,
    );
  }

  return ((data ?? []) as PropTrendRow[]).map(
    mapPropTrend,
  );
}
