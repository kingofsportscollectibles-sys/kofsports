import { createClient } from "@/lib/supabase/server";

export type NflAnytimeTdRanking = {
  externalEventId: string;
  externalPlayerId: string;
  playerName: string;
  position: string;
  team: string;
  opponent: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;

  books: number;
  bestPrice: number | null;
  bestBookmaker: string | null;
  consensusProbability: number | null;
  medianProbability: number | null;

  historicalGames: number | null;

  marketScore: number;
  redZoneScore: number;
  usageScore: number;
  recentScore: number;
  matchupScore: number;
  environmentScore: number;

  kofScore: number;
};

type NflAnytimeTdScoreRow = {
  external_event_id: string;
  external_player_id: string | null;
  player_name: string;
  position: string;
  team: string;
  opponent: string;
  home_team: string;
  away_team: string;
  commence_time: string;

  books: number | string | null;
  best_price: number | string | null;
  consensus_probability: number | string | null;
  median_probability: number | string | null;

  historical_games: number | string | null;

  market_score: number | string | null;
  red_zone_score: number | string | null;
  usage_score: number | string | null;
  recent_score: number | string | null;
  matchup_score: number | string | null;
  environment_score: number | string | null;

  kof_score: number | string | null;
};

type AnytimeTdBestPriceRow = {
  external_event_id: string;
  external_player_id: string | null;
  best_bookmaker: string | null;
  best_price: number | string | null;
};

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function oddsKey(externalEventId: string, externalPlayerId: string) {
  return `${externalEventId}:${externalPlayerId}`;
}

export async function getNflAnytimeTdRankings(): Promise<
  NflAnytimeTdRanking[]
> {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const [
    { data: scoreData, error: scoreError },
    { data: oddsData, error: oddsError },
  ] = await Promise.all([
    supabase
      .from("nfl_kof_td_scores")
      .select(
        [
          "external_event_id",
          "external_player_id",
          "player_name",
          "position",
          "team",
          "opponent",
          "home_team",
          "away_team",
          "commence_time",
          "books",
          "best_price",
          "consensus_probability",
          "median_probability",
          "historical_games",
          "market_score",
          "red_zone_score",
          "usage_score",
          "recent_score",
          "matchup_score",
          "environment_score",
          "kof_score",
        ].join(",")
      )
      .gt("commence_time", now)
      .not("external_player_id", "is", null)
      .not("kof_score", "is", null)
      .order("kof_score", { ascending: false })
      .limit(500),

    supabase
      .from("nfl_anytime_td_best_prices")
      .select("external_event_id,external_player_id,best_bookmaker,best_price")
      .not("external_player_id", "is", null)
      .limit(500),
  ]);

  if (scoreError) {
    console.error("Failed to load NFL anytime TD rankings:", scoreError);
    return [];
  }

  if (oddsError) {
    console.error("Failed to load NFL anytime TD sportsbook prices:", oddsError);
  }

  const bestBookmakerByPlayer = new Map<
    string,
    {
      price: number;
      bookmaker: string | null;
    }
  >();

  for (const row of (oddsData ?? []) as AnytimeTdBestPriceRow[]) {
    const price = numberOrNull(row.best_price);

    if (price === null || !row.external_player_id) {
      continue;
    }

    const key = oddsKey(
      row.external_event_id,
      row.external_player_id
    );

    bestBookmakerByPlayer.set(key, {
      price,
      bookmaker: row.best_bookmaker,
    });
  }

  return ((scoreData ?? []) as unknown as NflAnytimeTdScoreRow[])
    .map((row) => {
      const marketScore = numberOrNull(row.market_score);
      const redZoneScore = numberOrNull(row.red_zone_score);
      const usageScore = numberOrNull(row.usage_score);
      const recentScore = numberOrNull(row.recent_score);
      const matchupScore = numberOrNull(row.matchup_score);
      const environmentScore = numberOrNull(row.environment_score);
      const kofScore = numberOrNull(row.kof_score);

      if (
        !row.external_player_id ||
        marketScore === null ||
        redZoneScore === null ||
        usageScore === null ||
        recentScore === null ||
        matchupScore === null ||
        environmentScore === null ||
        kofScore === null
      ) {
        return null;
      }

      const bestBook = bestBookmakerByPlayer.get(
        oddsKey(row.external_event_id, row.external_player_id)
      );

      return {
        externalEventId: row.external_event_id,
        externalPlayerId: row.external_player_id,
        playerName: row.player_name,
        position: row.position,
        team: row.team,
        opponent: row.opponent,
        homeTeam: row.home_team,
        awayTeam: row.away_team,
        commenceTime: row.commence_time,

        books: numberOrNull(row.books) ?? 0,
        bestPrice: numberOrNull(row.best_price),
        bestBookmaker: bestBook?.bookmaker ?? null,
        consensusProbability: numberOrNull(row.consensus_probability),
        medianProbability: numberOrNull(row.median_probability),

        historicalGames: numberOrNull(row.historical_games),

        marketScore,
        redZoneScore,
        usageScore,
        recentScore,
        matchupScore,
        environmentScore,

        kofScore,
      };
    })
    .filter(
      (ranking): ranking is NflAnytimeTdRanking => ranking !== null
    );
}
