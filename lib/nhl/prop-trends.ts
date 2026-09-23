import { createClient } from "@/lib/supabase/server";

export const NHL_PROP_MARKETS = [
  "player_shots_on_goal",
  "player_points",
  "player_assists",
  "player_total_saves",
] as const;

export type NhlPropMarket = (typeof NHL_PROP_MARKETS)[number];

export type NhlPropGameResult = {
  game_date: string;
  opponent: string | null;
  value: number;
  is_home: boolean | null;
  result: "over" | "under" | "push";
};

export type NhlPlayerPropTrend = {
  propId: number;
  eventId: string;
  playerId: number | null;
  playerName: string;
  playerTeam: string | null;
  position: string | null;
  market: NhlPropMarket;
  line: number;
  overPrice: number | null;
  underPrice: number | null;
  bookmaker: string;
  homeTeam: string;
  awayTeam: string;
  upcomingOpponent: string | null;
  commenceTime: string;
  bookmakerLastUpdate: string | null;
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
  seasonOverPct: number | null;
  avgSeason: number | null;
  h2hGames: number;
  h2hOvers: number;
  h2hOverPct: number | null;
  avgH2h: number | null;
  lastTen: NhlPropGameResult[];
};

type PropTrendRow = {
  prop_id: number;
  event_id: string;
  player_id: number | null;
  player_name: string;
  player_team: string | null;
  position: string | null;
  market: string;
  line: number | string;
  over_price: number | null;
  under_price: number | null;
  bookmaker: string;
  home_team: string;
  away_team: string;
  upcoming_opponent: string | null;
  commence_time: string;
  bookmaker_last_update: string | null;
  fetched_at: string;
  l5_games: number;
  l5_overs: number;
  l5_unders: number;
  l5_pushes: number;
  avg_l5: number | string | null;
  l10_games: number;
  l10_overs: number;
  l10_unders: number;
  l10_pushes: number;
  avg_l10: number | string | null;
  season_games: number;
  season_overs: number;
  avg_season: number | string | null;
  h2h_games: number;
  h2h_overs: number;
  avg_h2h: number | string | null;
  last_ten: NhlPropGameResult[] | null;
  l5_over_pct: number | string | null;
  l10_over_pct: number | string | null;
  season_over_pct: number | string | null;
  h2h_over_pct: number | string | null;
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

function mapPropTrend(
  row: PropTrendRow,
): NhlPlayerPropTrend {
  return {
    propId: Number(row.prop_id),
    eventId: row.event_id,
    playerId:
      row.player_id === null
        ? null
        : Number(row.player_id),
    playerName: row.player_name,
    playerTeam: row.player_team,
    position: row.position,
    market: row.market as NhlPropMarket,
    line: Number(row.line),
    overPrice: row.over_price,
    underPrice: row.under_price,
    bookmaker: row.bookmaker,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    upcomingOpponent: row.upcoming_opponent,
    commenceTime: row.commence_time,
    bookmakerLastUpdate:
      row.bookmaker_last_update,
    fetchedAt: row.fetched_at,
    l5Games: Number(row.l5_games),
    l5Overs: Number(row.l5_overs),
    l5Unders: Number(row.l5_unders),
    l5Pushes: Number(row.l5_pushes),
    l5OverPct: nullableNumber(row.l5_over_pct),
    avgL5: nullableNumber(row.avg_l5),
    l10Games: Number(row.l10_games),
    l10Overs: Number(row.l10_overs),
    l10Unders: Number(row.l10_unders),
    l10Pushes: Number(row.l10_pushes),
    l10OverPct: nullableNumber(row.l10_over_pct),
    avgL10: nullableNumber(row.avg_l10),
    seasonGames: Number(row.season_games),
    seasonOvers: Number(row.season_overs),
    seasonOverPct: nullableNumber(
      row.season_over_pct,
    ),
    avgSeason: nullableNumber(row.avg_season),
    h2hGames: Number(row.h2h_games),
    h2hOvers: Number(row.h2h_overs),
    h2hOverPct: nullableNumber(row.h2h_over_pct),
    avgH2h: nullableNumber(row.avg_h2h),
    lastTen: Array.isArray(row.last_ten)
      ? row.last_ten
      : [],
  };
}

export async function getNhlPlayerPropTrends(): Promise<
  NhlPlayerPropTrend[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nhl_player_prop_trends")
    .select("*")
    .eq("bookmaker", "draftkings")
    .in("market", NHL_PROP_MARKETS)
    .gte("commence_time", new Date().toISOString())
    .order("commence_time", { ascending: true })
    .order("player_name", { ascending: true });

  if (error) {
    console.error(
      "Failed to load NHL player prop trends:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      },
    );

    throw new Error(
      `Unable to load NHL player prop trends: ${error.message}`,
    );
  }

  return ((data ?? []) as PropTrendRow[]).map(
    mapPropTrend,
  );
}
