import { createClient } from "@supabase/supabase-js";

const SPORT = "americanfootball_nfl";

const MARKETS = [
  "player_pass_yds",
  "player_rush_yds",
  "player_reception_yds",
] as const;

const BOOKMAKER = "draftkings";

// Opening week of the 2026 NFL regular season.
const WEEK_START = new Date("2026-09-09T00:00:00Z");
const WEEK_END = new Date("2026-09-16T00:00:00Z");

// Ask for the historical snapshot five minutes before kickoff.
const SNAPSHOT_OFFSET_MS = 5 * 60 * 1000;

type Event = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
};

type Outcome = {
  name: string;
  description?: string;
  price: number;
  point?: number;
};

type Market = {
  key: string;
  last_update?: string;
  outcomes: Outcome[];
};

type Bookmaker = {
  key: string;
  title: string;
  last_update?: string;
  markets: Market[];
};

type EventOdds = Event & {
  bookmakers: Bookmaker[];
};

type HistoricalEventsResponse = {
  timestamp: string;
  previous_timestamp?: string;
  next_timestamp?: string;
  data: Event[];
};

type HistoricalEventOddsResponse = {
  timestamp: string;
  previous_timestamp?: string;
  next_timestamp?: string;
  data: EventOdds;
};

type HistoryRow = {
  external_event_id: string;
  player_name: string;
  market: string;
  line: number;
  over_price: number | null;
  under_price: number | null;
  bookmaker: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  fetched_at: string;
};

const oddsApiKey = process.env.ODDS_API_KEY;

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!oddsApiKey) {
  throw new Error(
    "ODDS_API_KEY is not configured.",
  );
}

if (
  !supabaseUrl ||
  !supabaseServiceRoleKey
) {
  throw new Error(
    "Supabase environment variables are not configured.",
  );
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
);

function snapshotDateForEvent(
  event: Event,
): string {
  return new Date(
  new Date(event.commence_time).getTime() -
    SNAPSHOT_OFFSET_MS,
)
  .toISOString()
  .replace(".000Z", "Z");
}

async function getHistoricalEvents(): Promise<Event[]> {
  const date =
  "2026-09-06T12:00:00Z";

  const url =
    `https://api.the-odds-api.com/v4/historical/sports/${SPORT}/events` +
    `?apiKey=${oddsApiKey}` +
    `&date=${encodeURIComponent(date)}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Historical events request failed (${response.status}): ${body}`,
    );
  }

  const payload =
    (await response.json()) as HistoricalEventsResponse;

  return payload.data
    .filter((event) => {
      const kickoff =
        new Date(event.commence_time);

      return (
        kickoff >= WEEK_START &&
        kickoff < WEEK_END
      );
    })
    .sort(
      (a, b) =>
        new Date(a.commence_time).getTime() -
        new Date(b.commence_time).getTime(),
    );
}

async function getHistoricalProps(
  event: Event,
): Promise<HistoricalEventOddsResponse> {
  const snapshotDate =
    snapshotDateForEvent(event);

  const url =
    `https://api.the-odds-api.com/v4/historical/sports/${SPORT}` +
    `/events/${event.id}/odds` +
    `?apiKey=${oddsApiKey}` +
    `&date=${encodeURIComponent(snapshotDate)}` +
    `&regions=us` +
    `&markets=${MARKETS.join(",")}` +
    `&bookmakers=${BOOKMAKER}` +
    `&oddsFormat=american`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  const remaining =
    response.headers.get(
      "x-requests-remaining",
    );

  const used =
    response.headers.get(
      "x-requests-used",
    );

  console.log(
    `API credits — used: ${used ?? "?"}, remaining: ${
      remaining ?? "?"
    }`,
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Historical prop request failed for ${event.away_team} @ ${event.home_team} (${response.status}): ${body}`,
    );
  }

  return (await response.json()) as HistoricalEventOddsResponse;
}

function parseHistoricalProps(
  payload: HistoricalEventOddsResponse,
): HistoryRow[] {
  const event = payload.data;

  const rows: HistoryRow[] = [];

  for (const bookmaker of event.bookmakers ?? []) {
    if (bookmaker.key !== BOOKMAKER) {
      continue;
    }

    for (const market of bookmaker.markets ?? []) {
      if (
        !MARKETS.includes(
          market.key as (typeof MARKETS)[number],
        )
      ) {
        continue;
      }

      const pairs = new Map<
        string,
        {
          playerName: string;
          line: number;
          overPrice: number | null;
          underPrice: number | null;
        }
      >();

      for (const outcome of market.outcomes ?? []) {
        const playerName =
          outcome.description?.trim();

        if (
          !playerName ||
          typeof outcome.point !== "number"
        ) {
          continue;
        }

        const key =
          `${playerName}|||${outcome.point}`;

        const existing =
          pairs.get(key) ?? {
            playerName,
            line: outcome.point,
            overPrice: null,
            underPrice: null,
          };

        if (outcome.name === "Over") {
          existing.overPrice =
            outcome.price;
        }

        if (outcome.name === "Under") {
          existing.underPrice =
            outcome.price;
        }

        pairs.set(key, existing);
      }

      for (const pair of pairs.values()) {
        rows.push({
          external_event_id: event.id,
          player_name: pair.playerName,
          market: market.key,
          line: pair.line,
          over_price: pair.overPrice,
          under_price: pair.underPrice,
          bookmaker: bookmaker.key,
          home_team: event.home_team,
          away_team: event.away_team,
          commence_time: event.commence_time,

          // This is the actual historical snapshot
          // returned by The Odds API.
          fetched_at: payload.timestamp,
        });
      }
    }
  }

  return rows;
}

async function insertHistoryRows(
  rows: HistoryRow[],
): Promise<number> {
  if (rows.length === 0) {
    return 0;
  }

  const eventId =
    rows[0].external_event_id;

  // Make the backfill safe to rerun.
  // Each historical event should have one canonical
  // pre-kickoff DraftKings snapshot from this script.
  const { error: deleteError } =
    await supabase
      .from("nfl_prop_line_history")
      .delete()
      .eq("external_event_id", eventId)
      .eq("bookmaker", BOOKMAKER)
      .lt(
        "fetched_at",
        rows[0].commence_time,
      );

  if (deleteError) {
    throw new Error(
      `Could not clear existing historical rows for ${eventId}: ${deleteError.message}`,
    );
  }

  const { error: insertError } =
    await supabase
      .from("nfl_prop_line_history")
      .insert(rows);

  if (insertError) {
    throw new Error(
      `Could not insert historical prop rows: ${insertError.message}`,
    );
  }

  return rows.length;
}

async function main(): Promise<void> {
  console.log(
    "Finding 2026 opening-week NFL events...",
  );

  const events =
    await getHistoricalEvents();

  console.log(
    `Found ${events.length} games.`,
  );

  if (events.length === 0) {
    throw new Error(
      "No opening-week games found.",
    );
  }

  let totalRows = 0;

  for (const [index, event] of events.entries()) {
    console.log("");
    console.log(
      `[${index + 1}/${events.length}] ${event.away_team} @ ${event.home_team}`,
    );
    console.log(
      `Kickoff: ${event.commence_time}`,
    );
    console.log(
      `Requested snapshot: ${snapshotDateForEvent(event)}`,
    );

    const payload =
      await getHistoricalProps(event);

    console.log(
      `Returned snapshot: ${payload.timestamp}`,
    );

    const rows =
      parseHistoricalProps(payload);

    console.log(
      `DraftKings prop rows: ${rows.length}`,
    );

    const inserted =
      await insertHistoryRows(rows);

    totalRows += inserted;

    console.log(
      `Inserted: ${inserted}`,
    );
  }

  console.log("");
  console.log(
    `Backfill complete. Inserted ${totalRows} historical DraftKings prop rows.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});