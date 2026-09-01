import { createClient } from "@supabase/supabase-js";

const SPORT = "americanfootball_nfl";

const MARKETS = [
  "player_pass_yds",
  "player_rush_yds",
  "player_reception_yds",
] as const;

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

type PropRow = {
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
  updated_at: string;
};

export type NflPropImportResult = {
  eventsProcessed: number;
  eventsWithProps: number;
  totalRows: number;
};

const TEAM_MAP: Record<string, string> = {
  "Arizona Cardinals": "ARI",
  "Atlanta Falcons": "ATL",
  "Baltimore Ravens": "BAL",
  "Buffalo Bills": "BUF",
  "Carolina Panthers": "CAR",
  "Chicago Bears": "CHI",
  "Cincinnati Bengals": "CIN",
  "Cleveland Browns": "CLE",
  "Dallas Cowboys": "DAL",
  "Denver Broncos": "DEN",
  "Detroit Lions": "DET",
  "Green Bay Packers": "GB",
  "Houston Texans": "HOU",
  "Indianapolis Colts": "IND",
  "Jacksonville Jaguars": "JAX",
  "Kansas City Chiefs": "KC",
  "Las Vegas Raiders": "LV",
  "Los Angeles Chargers": "LAC",
  "Los Angeles Rams": "LA",
  "Miami Dolphins": "MIA",
  "Minnesota Vikings": "MIN",
  "New England Patriots": "NE",
  "New Orleans Saints": "NO",
  "New York Giants": "NYG",
  "New York Jets": "NYJ",
  "Philadelphia Eagles": "PHI",
  "Pittsburgh Steelers": "PIT",
  "San Francisco 49ers": "SF",
  "Seattle Seahawks": "SEA",
  "Tampa Bay Buccaneers": "TB",
  "Tennessee Titans": "TEN",
  "Washington Commanders": "WAS",
};

function normalizeTeam(team: string): string {
  const normalized = TEAM_MAP[team];

  if (!normalized) {
    throw new Error(
      `Unknown NFL team name from Odds API: ${team}`,
    );
  }

  return normalized;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  const remaining = response.headers.get(
    "x-requests-remaining",
  );

  const used = response.headers.get(
    "x-requests-used",
  );

  if (used !== null || remaining !== null) {
    console.log(
      `API quota — used: ${used ?? "?"}, remaining: ${remaining ?? "?"}`,
    );
  }

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Odds API request failed (${response.status}): ${body}`,
    );
  }

  return (await response.json()) as T;
}

function parseEventOdds(
  event: EventOdds,
): PropRow[] {
  const fetchedAt = new Date().toISOString();

  const homeTeam = normalizeTeam(
    event.home_team,
  );

  const awayTeam = normalizeTeam(
    event.away_team,
  );

  const rows: PropRow[] = [];

  for (const bookmaker of event.bookmakers ?? []) {
    for (const market of bookmaker.markets ?? []) {
      if (
        !MARKETS.includes(
          market.key as (typeof MARKETS)[number],
        )
      ) {
        continue;
      }

      const grouped = new Map<
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

        const line = outcome.point;

        if (!playerName) {
          continue;
        }

        if (typeof line !== "number") {
          continue;
        }

        if (
          outcome.name !== "Over" &&
          outcome.name !== "Under"
        ) {
          continue;
        }

        const key = `${playerName}|||${line}`;

        let pair = grouped.get(key);

        if (!pair) {
          pair = {
            playerName,
            line,
            overPrice: null,
            underPrice: null,
          };

          grouped.set(key, pair);
        }

        if (outcome.name === "Over") {
          pair.overPrice = outcome.price;
        }

        if (outcome.name === "Under") {
          pair.underPrice = outcome.price;
        }
      }

      for (const pair of grouped.values()) {
        rows.push({
          external_event_id: event.id,
          player_name: pair.playerName,
          market: market.key,
          line: pair.line,
          over_price: pair.overPrice,
          under_price: pair.underPrice,
          bookmaker: bookmaker.key,
          home_team: homeTeam,
          away_team: awayTeam,
          commence_time: event.commence_time,
          fetched_at: fetchedAt,
          updated_at: fetchedAt,
        });
      }
    }
  }

  return rows;
}

export async function importNflPropLines(): Promise<NflPropImportResult> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

 const oddsApiKey =
  process.env.ODDS_API_KEY;

if (!oddsApiKey) {
  throw new Error("Missing ODDS_API_KEY");
}

const validatedOddsApiKey = oddsApiKey;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL",
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY",
    );
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

 async function getUpcomingEvents(): Promise<Event[]> {
  const url =
    `https://api.the-odds-api.com/v4/sports/${SPORT}/events` +
    `?apiKey=${encodeURIComponent(validatedOddsApiKey)}`;

  return fetchJson<Event[]>(url);
}

async function getEventProps(
  eventId: string,
): Promise<EventOdds> {
  const url =
    `https://api.the-odds-api.com/v4/sports/${SPORT}/events/${eventId}/odds` +
    `?apiKey=${encodeURIComponent(validatedOddsApiKey)}` +
    `&regions=us` +
    `&markets=${MARKETS.join(",")}` +
    `&oddsFormat=american`;

  return fetchJson<EventOdds>(url);
}

  async function replaceEventLines(
    eventId: string,
    rows: PropRow[],
  ): Promise<void> {
    const { error: deleteError } =
      await supabase
        .from("nfl_prop_lines")
        .delete()
        .eq(
          "external_event_id",
          eventId,
        );

    if (deleteError) {
      throw new Error(
        `Could not clear old prop lines for event ${eventId}: ${deleteError.message}`,
      );
    }

    if (rows.length === 0) {
      return;
    }

    const { error: insertError } =
      await supabase
        .from("nfl_prop_lines")
        .insert(rows);

    if (insertError) {
      throw new Error(
        `Could not insert prop lines for event ${eventId}: ${insertError.message}`,
      );
    }
  }

  console.log(
    "Fetching upcoming NFL events...",
  );

  const events =
    await getUpcomingEvents();

  const now = Date.now();

  const futureEvents = events
    .filter(
      (event) =>
        new Date(
          event.commence_time,
        ).getTime() > now,
    )
    .sort(
      (a, b) =>
        new Date(
          a.commence_time,
        ).getTime() -
        new Date(
          b.commence_time,
        ).getTime(),
    );

  if (futureEvents.length === 0) {
    console.log(
      "No upcoming NFL events found.",
    );

    return {
      eventsProcessed: 0,
      eventsWithProps: 0,
      totalRows: 0,
    };
  }

  const firstKickoff = new Date(
    futureEvents[0].commence_time,
  ).getTime();

  const slateEnd =
    firstKickoff +
    6 * 24 * 60 * 60 * 1000;

  const upcomingEvents =
    futureEvents.filter((event) => {
      const commenceTime = new Date(
        event.commence_time,
      ).getTime();

      return commenceTime <= slateEnd;
    });

  console.log(
    `Upcoming NFL events returned: ${upcomingEvents.length}`,
  );

  let eventsProcessed = 0;
  let eventsWithProps = 0;
  let totalRows = 0;

  for (const event of upcomingEvents) {
    const away = normalizeTeam(
      event.away_team,
    );

    const home = normalizeTeam(
      event.home_team,
    );

    console.log(
      `Fetching ${away} @ ${home} — ${event.commence_time}`,
    );

    const eventOdds =
      await getEventProps(event.id);

    const rows =
      parseEventOdds(eventOdds);

    console.log(
      `Books: ${
        eventOdds.bookmakers?.length ?? 0
      } | Prop rows: ${rows.length}`,
    );

    await replaceEventLines(
      event.id,
      rows,
    );

    eventsProcessed += 1;

    if (rows.length > 0) {
      eventsWithProps += 1;
      totalRows += rows.length;
    }
  }

  return {
    eventsProcessed,
    eventsWithProps,
    totalRows,
  };
}