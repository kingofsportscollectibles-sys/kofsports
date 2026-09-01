import { createClient } from "@/lib/supabase/server";

export const NFL_PROP_MARKETS = [
  "player_pass_yds",
  "player_rush_yds",
  "player_reception_yds",
] as const;

export type NflPropMarket = (typeof NFL_PROP_MARKETS)[number];

export type NflPropGameResult = {
  game_date: string;
  opponent: string | null;
  value: number;
  is_home: boolean | null;
  result: "over" | "under" | "push";
};

export type NflPlayerPropTrend = {
  propId: number;
  externalEventId: string | null;

  playerName: string;
  playerTeam: string | null;

  market: NflPropMarket;
  line: number;

  overPrice: number | null;
  underPrice: number | null;

  bookmaker: string;

  homeTeam: string;
  awayTeam: string;
  upcomingOpponent: string | null;

  commenceTime: string;
  fetchedAt: string | null;

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

  h2hGames: number;
  h2hOvers: number;
  h2hOverPct: number | null;
  avgH2h: number | null;

  lastTen: NflPropGameResult[];
};

type PropTrendRow = {
  prop_id: number;
  external_event_id: string | null;

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
  fetched_at: string | null;

  l5_games: number;
  l5_overs: number;
  l5_unders: number;
  l5_pushes: number;
  l5_over_pct: number | string | null;
  avg_l5: number | string | null;

  l10_games: number;
  l10_overs: number;
  l10_unders: number;
  l10_pushes: number;
  l10_over_pct: number | string | null;
  avg_l10: number | string | null;

  season_games: number;
  season_overs: number;
  season_over_pct: number | string | null;

  h2h_games: number;
  h2h_overs: number;
  h2h_over_pct: number | string | null;
  avg_h2h: number | string | null;

  last_ten: NflPropGameResult[] | null;
};

function nullableNumber(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function mapPropTrend(row: PropTrendRow): NflPlayerPropTrend {
  return {
    propId: row.prop_id,
    externalEventId: row.external_event_id,

    playerName: row.player_name,
    playerTeam: row.player_team,

    market: row.market as NflPropMarket,
    line: Number(row.line),

    overPrice: row.over_price,
    underPrice: row.under_price,

    bookmaker: row.bookmaker,

    homeTeam: row.home_team,
    awayTeam: row.away_team,
    upcomingOpponent: row.upcoming_opponent,

    commenceTime: row.commence_time,
    fetchedAt: row.fetched_at,

    l5Games: row.l5_games,
    l5Overs: row.l5_overs,
    l5Unders: row.l5_unders,
    l5Pushes: row.l5_pushes,
    l5OverPct: nullableNumber(row.l5_over_pct),
    avgL5: nullableNumber(row.avg_l5),

    l10Games: row.l10_games,
    l10Overs: row.l10_overs,
    l10Unders: row.l10_unders,
    l10Pushes: row.l10_pushes,
    l10OverPct: nullableNumber(row.l10_over_pct),
    avgL10: nullableNumber(row.avg_l10),

    seasonGames: row.season_games,
    seasonOvers: row.season_overs,
    seasonOverPct: nullableNumber(row.season_over_pct),

    h2hGames: row.h2h_games,
    h2hOvers: row.h2h_overs,
    h2hOverPct: nullableNumber(row.h2h_over_pct),
    avgH2h: nullableNumber(row.avg_h2h),

    lastTen: Array.isArray(row.last_ten) ? row.last_ten : [],
  };
}

export async function getNflPlayerPropTrends(): Promise<
  NflPlayerPropTrend[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_player_prop_trends")
    .select("*")
    .eq("bookmaker", "draftkings")
    .in("market", NFL_PROP_MARKETS)
    .gte("commence_time", new Date().toISOString())
    .order("commence_time", { ascending: true })
    .order("player_name", { ascending: true });

if (error) {
  console.error("Failed to load NFL player prop trends:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  throw new Error(
    `Unable to load NFL player prop trends: ${error.message}`,
  );
}

  return ((data ?? []) as PropTrendRow[]).map(mapPropTrend);
}