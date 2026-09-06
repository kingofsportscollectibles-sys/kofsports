import { createClient } from "@/lib/supabase/server";

export type NflPropResearchRow = {
  propId: number;
  externalEventId: string | null;

  playerName: string;
  playerTeam: string | null;
  position: string | null;
  upcomingOpponent: string | null;

  market: string;
  line: number | null;
  overPrice: number | null;
  underPrice: number | null;
  bookmaker: string;

  commenceTime: string;
  fetchedAt: string | null;

  l5Games: number;
  l10Games: number;

  l5OverPct: number | null;
  l10OverPct: number | null;
  seasonOverPct: number | null;
  h2hOverPct: number | null;

  avgL5: number | null;
  avgL10: number | null;
  avgH2h: number | null;

  l5EdgePct: number | null;
  l10EdgePct: number | null;

  trendScore: number | null;
  edgeScore: number | null;
  matchupScore: number | null;
  roleScore: number | null;

  kofOverScore: number | null;
  kofScoreTier: string | null;

  dvpMarketRank: number | null;
  dvpStatAllowedPerGame: number | null;

  l5SnapPct: number | null;
  seasonSnapPct: number | null;

  lastTen: unknown;
};

function toNumber(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

export async function getNflPropResearch(): Promise<
  NflPropResearchRow[]
> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("nfl_prop_research_scored")
    .select(`
      prop_id,
      external_event_id,
      player_name,
      player_team,
      position,
      upcoming_opponent,
      market,
      line,
      over_price,
      under_price,
      bookmaker,
      commence_time,
      fetched_at,
      l5_games,
      l10_games,
      l5_over_pct,
      l10_over_pct,
      season_over_pct,
      h2h_over_pct,
      avg_l5,
      avg_l10,
      avg_h2h,
      l5_edge_pct,
      l10_edge_pct,
      trend_score,
      edge_score,
      matchup_score,
      role_score,
      kof_over_score,
      kof_score_tier,
      dvp_market_rank,
      dvp_stat_allowed_per_game,
      l5_snap_pct,
      season_snap_pct,
      last_ten
    `)
    .eq("bookmaker", "draftkings")
    .gte("commence_time", now)
    .order("kof_over_score", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    console.error(
      "Failed to load NFL prop research:",
      error,
    );

    return [];
  }

  return (data ?? []).map((row) => ({
    propId: Number(row.prop_id),
    externalEventId:
      row.external_event_id ?? null,

    playerName: row.player_name,
    playerTeam: row.player_team ?? null,
    position: row.position ?? null,
    upcomingOpponent:
      row.upcoming_opponent ?? null,

    market: row.market,
    line: toNumber(row.line),
    overPrice: toNumber(row.over_price),
    underPrice: toNumber(row.under_price),
    bookmaker: row.bookmaker,

    commenceTime: row.commence_time,
    fetchedAt: row.fetched_at ?? null,

    l5Games: Number(row.l5_games ?? 0),
    l10Games: Number(row.l10_games ?? 0),

    l5OverPct: toNumber(row.l5_over_pct),
    l10OverPct: toNumber(row.l10_over_pct),
    seasonOverPct: toNumber(
      row.season_over_pct,
    ),
    h2hOverPct: toNumber(row.h2h_over_pct),

    avgL5: toNumber(row.avg_l5),
    avgL10: toNumber(row.avg_l10),
    avgH2h: toNumber(row.avg_h2h),

    l5EdgePct: toNumber(row.l5_edge_pct),
    l10EdgePct: toNumber(row.l10_edge_pct),

    trendScore: toNumber(row.trend_score),
    edgeScore: toNumber(row.edge_score),
    matchupScore: toNumber(
      row.matchup_score,
    ),
    roleScore: toNumber(row.role_score),

    kofOverScore: toNumber(
      row.kof_over_score,
    ),
    kofScoreTier:
      row.kof_score_tier ?? null,

    dvpMarketRank: toNumber(
      row.dvp_market_rank,
    ),
    dvpStatAllowedPerGame: toNumber(
      row.dvp_stat_allowed_per_game,
    ),

    l5SnapPct: toNumber(row.l5_snap_pct),
    seasonSnapPct: toNumber(
      row.season_snap_pct,
    ),

    lastTen: row.last_ten,
  }));
}
