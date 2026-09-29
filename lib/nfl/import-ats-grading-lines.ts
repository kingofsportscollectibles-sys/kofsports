import { createClient } from "@supabase/supabase-js";

const SPORT = "americanfootball_nfl";
const BOOKMAKER = "draftkings";
const CAPTURE_WINDOW_MINUTES = 90;

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
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
};

type TeamIdentity = {
  team_abbr: string;
  team_name: string;
};

type NflGame = {
  id: number;
  season: number;
  week: number | null;
  commence_time: string | null;
  home_team: string;
  away_team: string;
};

export async function importNflAtsGradingLines() {
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
    regions: "us",
    markets: "spreads",
    bookmakers: BOOKMAKER,
    oddsFormat: "american",
    dateFormat: "iso",
  });

  const url =
    `https://api.the-odds-api.com/v4/sports/${SPORT}/odds/?` +
    params.toString();

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `The Odds API request failed: ${response.status} ${body}`,
    );
  }

  const events = (await response.json()) as OddsEvent[];

  const requestsUsed = response.headers.get("x-requests-used");
  const requestsRemaining = response.headers.get(
    "x-requests-remaining",
  );

  console.log(`NFL ATS events returned: ${events.length}`);
  console.log("Odds API quota:", {
    used: requestsUsed,
    remaining: requestsRemaining,
  });

  const { data: identities, error: identityError } =
    await supabase
      .from("nfl_team_identity")
      .select("team_abbr, team_name");

  if (identityError) {
    throw new Error(
      `Failed loading NFL team identities: ${identityError.message}`,
    );
  }

  const teamMap = new Map(
    ((identities ?? []) as TeamIdentity[]).map((team) => [
      team.team_name,
      team.team_abbr,
    ]),
  );

  const now = new Date();
  const captureWindowEnd = new Date(
    now.getTime() +
      CAPTURE_WINDOW_MINUTES * 60 * 1000,
  );

  const captureEligibleEvents = events.filter((event) => {
    const kickoff = new Date(event.commence_time);

    return (
      kickoff > now &&
      kickoff <= captureWindowEnd
    );
  });

  if (captureEligibleEvents.length === 0) {
    console.log("No upcoming NFL events available for ATS capture.");

    return {
      eventsReturned: events.length,
      captureEligibleEvents: 0,
      captured: 0,
      skipped: 0,
      requestsUsed,
      requestsRemaining,
    };
  }

  const earliestKickoff = captureEligibleEvents
    .map((event) => event.commence_time)
    .sort()[0];

  const latestKickoff = captureEligibleEvents
    .map((event) => event.commence_time)
    .sort()
    .at(-1)!;

  const { data: games, error: gamesError } = await supabase
    .from("nfl_games")
    .select(
      "id, season, week, commence_time, home_team, away_team",
    )
    .eq("game_type", "REG")
    .gte("commence_time", earliestKickoff)
    .lte("commence_time", latestKickoff);

  if (gamesError) {
    throw new Error(
      `Failed loading NFL games: ${gamesError.message}`,
    );
  }

  const nflGames = (games ?? []) as NflGame[];

  let captured = 0;
  let skipped = 0;

  for (const event of captureEligibleEvents) {
    const homeAbbr = teamMap.get(event.home_team);
    const awayAbbr = teamMap.get(event.away_team);

    if (!homeAbbr || !awayAbbr) {
      console.warn(
        `Skipping unmapped teams: ${event.away_team} @ ${event.home_team}`,
      );
      skipped += 1;
      continue;
    }

    const eventKickoff =
      new Date(event.commence_time).getTime();

    const game = nflGames.find((candidate) => {
      if (
        candidate.home_team !== homeAbbr ||
        candidate.away_team !== awayAbbr ||
        candidate.commence_time == null
      ) {
        return false;
      }

      const kickoffDifferenceMs = Math.abs(
        new Date(candidate.commence_time).getTime() -
          eventKickoff,
      );

      return kickoffDifferenceMs <= 30 * 60 * 1000;
    });

    if (!game) {
      console.warn(
        `Skipping unmatched game: ${awayAbbr} @ ${homeAbbr} ${event.commence_time}`,
      );
      skipped += 1;
      continue;
    }

    if (
      !game.commence_time ||
      new Date(game.commence_time) <= new Date()
    ) {
      console.warn(
        `Skipping started game: ${awayAbbr} @ ${homeAbbr}`,
      );
      skipped += 1;
      continue;
    }

    const bookmaker = event.bookmakers?.find(
      (book) => book.key === BOOKMAKER,
    );

    const spreadMarket = bookmaker?.markets?.find(
      (market) => market.key === "spreads",
    );

    const homeOutcome = spreadMarket?.outcomes?.find(
      (outcome) => outcome.name === event.home_team,
    );

    const awayOutcome = spreadMarket?.outcomes?.find(
      (outcome) => outcome.name === event.away_team,
    );

    if (
      homeOutcome?.point == null ||
      awayOutcome?.point == null
    ) {
      console.warn(
        `Skipping missing DraftKings spread: ${awayAbbr} @ ${homeAbbr}`,
      );
      skipped += 1;
      continue;
    }

    if (homeOutcome.point !== -awayOutcome.point) {
      console.warn(
        `Skipping invalid spread pair: ${awayAbbr} ${awayOutcome.point} @ ${homeAbbr} ${homeOutcome.point}`,
      );
      skipped += 1;
      continue;
    }

    const capturedAt = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from("nfl_ats_grading_lines")
      .upsert(
        {
          game_id: game.id,
          external_event_id: event.id,
          bookmaker: BOOKMAKER,
          home_team: homeAbbr,
          away_team: awayAbbr,
          commence_time: event.commence_time,
          home_spread: homeOutcome.point,
          away_spread: awayOutcome.point,
          market_last_update:
            spreadMarket?.last_update ?? null,
          captured_at: capturedAt,
        },
        {
          onConflict: "game_id,bookmaker",
        },
      );

    if (upsertError) {
      throw new Error(
        `ATS grading line upsert failed for ${awayAbbr} @ ${homeAbbr}: ${upsertError.message}`,
      );
    }

    console.log(
      `Captured ${awayAbbr} ${awayOutcome.point} @ ${homeAbbr} ${homeOutcome.point}`,
    );

    captured += 1;
  }

  console.log("NFL ATS grading line capture complete:", {
    eventsReturned: events.length,
    captureEligibleEvents: captureEligibleEvents.length,
    captured,
    skipped,
  });

  return {
    eventsReturned: events.length,
    captureEligibleEvents: captureEligibleEvents.length,
    captured,
    skipped,
    requestsUsed,
    requestsRemaining,
  };
}
