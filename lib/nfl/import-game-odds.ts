import { createClient } from "@supabase/supabase-js";

const SPORT = "americanfootball_nfl";
const MARKETS = "spreads,totals";
const REGIONS = "us";
const ODDS_FORMAT = "american";

type OddsOutcome = {
  name: string;
  price: number;
  point?: number;
};

type OddsMarket = {
  key: string;
  last_update?: string;
  outcomes: OddsOutcome[];
};

type Bookmaker = {
  key: string;
  title: string;
  markets: OddsMarket[];
};

type OddsEvent = {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
};

type GameOddsRow = {
  external_event_id: string;
  bookmaker: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  home_spread: number | null;
  home_spread_price: number | null;
  away_spread: number | null;
  away_spread_price: number | null;
  game_total: number | null;
  over_price: number | null;
  under_price: number | null;
  market_last_update: string | null;
  fetched_at: string;
  updated_at: string;
};

export async function importNflGameOdds() {
  const apiKey = process.env.ODDS_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey) {
    throw new Error("Missing ODDS_API_KEY");
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const params = new URLSearchParams({
    apiKey,
    regions: REGIONS,
    markets: MARKETS,
    oddsFormat: ODDS_FORMAT,
    dateFormat: "iso",
  });

  const url =
    `https://api.the-odds-api.com/v4/sports/${SPORT}/odds/?` +
    params.toString();

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `The Odds API request failed: ${response.status} ${body}`
    );
  }

  const events = (await response.json()) as OddsEvent[];

  const requestsUsed = response.headers.get("x-requests-used");
  const requestsRemaining = response.headers.get("x-requests-remaining");

  console.log(`NFL events returned: ${events.length}`);
  console.log("Odds API quota:", {
    used: requestsUsed,
    remaining: requestsRemaining,
  });

  const fetchedAt = new Date().toISOString();
  const rows: GameOddsRow[] = [];

  for (const event of events) {
    for (const bookmaker of event.bookmakers ?? []) {
      const spreadMarket = bookmaker.markets?.find(
        (market) => market.key === "spreads"
      );

      const totalMarket = bookmaker.markets?.find(
        (market) => market.key === "totals"
      );

      if (!spreadMarket && !totalMarket) {
        continue;
      }

      const homeSpreadOutcome = spreadMarket?.outcomes?.find(
        (outcome) => outcome.name === event.home_team
      );

      const awaySpreadOutcome = spreadMarket?.outcomes?.find(
        (outcome) => outcome.name === event.away_team
      );

      const overOutcome = totalMarket?.outcomes?.find(
        (outcome) => outcome.name === "Over"
      );

      const underOutcome = totalMarket?.outcomes?.find(
        (outcome) => outcome.name === "Under"
      );

      const marketLastUpdate =
        [spreadMarket?.last_update, totalMarket?.last_update]
          .filter((value): value is string => Boolean(value))
          .sort()
          .at(-1) ?? null;

      rows.push({
        external_event_id: event.id,
        bookmaker: bookmaker.key,
        home_team: event.home_team,
        away_team: event.away_team,
        commence_time: event.commence_time,

        home_spread: homeSpreadOutcome?.point ?? null,
        home_spread_price: homeSpreadOutcome?.price ?? null,

        away_spread: awaySpreadOutcome?.point ?? null,
        away_spread_price: awaySpreadOutcome?.price ?? null,

        game_total: overOutcome?.point ?? underOutcome?.point ?? null,
        over_price: overOutcome?.price ?? null,
        under_price: underOutcome?.price ?? null,

        market_last_update: marketLastUpdate,
        fetched_at: fetchedAt,
        updated_at: fetchedAt,
      });
    }
  }

  if (rows.length === 0) {
    console.log("No NFL game odds rows found.");

    return {
      eventsProcessed: events.length,
      totalRows: 0,
      requestsUsed,
      requestsRemaining,
    };
  }

  const eventIds = [...new Set(rows.map((row) => row.external_event_id))];

  const { error: deleteError } = await supabase
    .from("nfl_game_odds")
    .delete()
    .in("external_event_id", eventIds);

  if (deleteError) {
    throw new Error(
      `Failed deleting existing NFL game odds: ${deleteError.message}`
    );
  }

  const batchSize = 500;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const { error } = await supabase
      .from("nfl_game_odds")
      .insert(batch);

    if (error) {
      throw new Error(`NFL game odds insert failed: ${error.message}`);
    }
  }

  console.log("NFL game odds import complete:", {
    eventsProcessed: events.length,
    totalRows: rows.length,
  });

  return {
    eventsProcessed: events.length,
    totalRows: rows.length,
    requestsUsed,
    requestsRemaining,
  };
}
