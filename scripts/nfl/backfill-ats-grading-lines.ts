import { createClient } from "@supabase/supabase-js";

const SPORT = "americanfootball_nfl";
const BOOKMAKER = "draftkings";
const SEASON = 2026;
const FIRST_WEEK = 1;
const LAST_WEEK = 3;
const MINUTES_BEFORE_KICKOFF = 5;

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
  last_update?: string;
  markets: OddsMarket[];
};

type OddsEvent = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
};

type HistoricalResponse = {
  timestamp: string;
  previous_timestamp?: string;
  next_timestamp?: string;
  data: OddsEvent[];
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
  home_score: number | null;
  away_score: number | null;
};

async function main() {
  const apiKey = process.env.ODDS_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey) {
    throw new Error("Missing ODDS_API_KEY");
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

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

  const { data: gameRows, error: gamesError } =
    await supabase
      .from("nfl_games")
      .select(
        "id, season, week, commence_time, home_team, away_team, home_score, away_score",
      )
      .eq("season", SEASON)
      .eq("game_type", "REG")
      .gte("week", FIRST_WEEK)
      .lte("week", LAST_WEEK)
      .not("commence_time", "is", null)
      .order("commence_time");

  if (gamesError) {
    throw new Error(
      `Failed loading NFL games: ${gamesError.message}`,
    );
  }

  const now = new Date();

  const startedGames = ((gameRows ?? []) as NflGame[]).filter(
    (game) =>
      game.commence_time != null &&
      new Date(game.commence_time) < now,
  );

  const { data: existingRows, error: existingError } =
    await supabase
      .from("nfl_ats_grading_lines")
      .select("game_id")
      .eq("bookmaker", BOOKMAKER);

  if (existingError) {
    throw new Error(
      `Failed loading existing ATS grading lines: ${existingError.message}`,
    );
  }

  const existingGameIds = new Set(
    (existingRows ?? []).map((row) => row.game_id),
  );

  const games = startedGames.filter(
    (game) => !existingGameIds.has(game.id),
  );

  console.log(
    `Historical ATS backfill: ${games.length} missing started games`,
  );

  const kickoffGroups = new Map<string, NflGame[]>();

  for (const game of games) {
    if (!game.commence_time) continue;

    const existing =
      kickoffGroups.get(game.commence_time) ?? [];

    existing.push(game);
    kickoffGroups.set(game.commence_time, existing);
  }

  console.log(
    `Historical kickoff clusters: ${kickoffGroups.size}`,
  );

  let captured = 0;
  let skipped = 0;
  let requests = 0;

  for (const [kickoff, clusterGames] of kickoffGroups) {
    const requestedSnapshot = new Date(
      new Date(kickoff).getTime() -
        MINUTES_BEFORE_KICKOFF * 60 * 1000,
    )
      .toISOString()
      .replace(".000Z", "Z");

    const params = new URLSearchParams({
      apiKey,
      regions: "us",
      markets: "spreads",
      bookmakers: BOOKMAKER,
      oddsFormat: "american",
      dateFormat: "iso",
      date: requestedSnapshot,
    });

    const url =
      `https://api.the-odds-api.com/v4/historical/sports/${SPORT}/odds?` +
      params.toString();

    console.log(
      `\nWeek ${clusterGames[0]?.week} | kickoff ${kickoff}`,
    );
    console.log(
      `Requesting historical snapshot: ${requestedSnapshot}`,
    );

    const response = await fetch(url);
    requests += 1;

    const requestsUsed =
      response.headers.get("x-requests-used");
    const requestsRemaining =
      response.headers.get("x-requests-remaining");

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `Historical Odds API request failed: ${response.status} ${body}`,
      );
    }

    const historical =
      (await response.json()) as HistoricalResponse;

    console.log(
      `Snapshot returned: ${historical.timestamp}`,
    );
    console.log("Odds API quota:", {
      used: requestsUsed,
      remaining: requestsRemaining,
    });

    for (const game of clusterGames) {
      const event = historical.data.find((candidate) => {
        const homeAbbr =
          teamMap.get(candidate.home_team);
        const awayAbbr =
          teamMap.get(candidate.away_team);

        const kickoffDifferenceMs = Math.abs(
          new Date(candidate.commence_time).getTime() -
            new Date(game.commence_time!).getTime(),
        );

        return (
          homeAbbr === game.home_team &&
          awayAbbr === game.away_team &&
          kickoffDifferenceMs <= 30 * 60 * 1000
        );
      });

      if (!event) {
        console.warn(
          `Skipping missing historical event: ${game.away_team} @ ${game.home_team}`,
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

      const homeOutcome =
        spreadMarket?.outcomes?.find(
          (outcome) =>
            outcome.name === event.home_team,
        );

      const awayOutcome =
        spreadMarket?.outcomes?.find(
          (outcome) =>
            outcome.name === event.away_team,
        );

      if (
        homeOutcome?.point == null ||
        awayOutcome?.point == null
      ) {
        console.warn(
          `Skipping missing DraftKings spread: ${game.away_team} @ ${game.home_team}`,
        );
        skipped += 1;
        continue;
      }

      if (homeOutcome.point !== -awayOutcome.point) {
        console.warn(
          `Skipping invalid spread pair: ${game.away_team} ${awayOutcome.point} @ ${game.home_team} ${homeOutcome.point}`,
        );
        skipped += 1;
        continue;
      }

      const snapshotTime = historical.timestamp;

      if (
        new Date(snapshotTime) >=
        new Date(game.commence_time!)
      ) {
        console.warn(
          `Skipping post-kickoff snapshot: ${game.away_team} @ ${game.home_team}`,
        );
        skipped += 1;
        continue;
      }

      const { error: upsertError } = await supabase
        .from("nfl_ats_grading_lines")
        .upsert(
          {
            game_id: game.id,
            external_event_id: event.id,
            bookmaker: BOOKMAKER,
            home_team: game.home_team,
            away_team: game.away_team,
            commence_time: event.commence_time,
            home_spread: homeOutcome.point,
            away_spread: awayOutcome.point,
            market_last_update:
              spreadMarket?.last_update ??
              bookmaker?.last_update ??
              null,
            captured_at: snapshotTime,
          },
          {
            onConflict: "game_id,bookmaker",
          },
        );

      if (upsertError) {
        throw new Error(
          `ATS grading line upsert failed for ${game.away_team} @ ${game.home_team}: ${upsertError.message}`,
        );
      }

      console.log(
        `Captured ${game.away_team} ${awayOutcome.point} @ ${game.home_team} ${homeOutcome.point}`,
      );

      captured += 1;
    }
  }

  console.log("\nHistorical ATS backfill complete:", {
    season: SEASON,
    weeks: `${FIRST_WEEK}-${LAST_WEEK}`,
    gamesConsidered: games.length,
    kickoffClusters: kickoffGroups.size,
    requests,
    captured,
    skipped,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
