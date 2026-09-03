import { createClient } from "@supabase/supabase-js";

const SPORT = "americanfootball_nfl";
const MARKET = "player_anytime_td";

type Event = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
};

type Outcome = {
  name: string;
  description?: string;
  price: number;
};

type Market = {
  key: string;
  last_update?: string;
  outcomes: Outcome[];
};

type Bookmaker = {
  key: string;
  title: string;
  markets: Market[];
};

type EventOdds = Event & {
  bookmakers: Bookmaker[];
};

type AnytimeTdRow = {
  external_event_id: string;
  player_name: string;
  external_player_id: string | null;
  bookmaker: string;
  yes_price: number | null;
  no_price: number | null;
  home_team: string;
  away_team: string;
  commence_time: string;
  market_last_update: string | null;
  fetched_at: string;
  updated_at: string;
};

export type NflAnytimeTdImportResult = {
  eventsProcessed: number;
  eventsWithOdds: number;
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
    throw new Error(`Unknown NFL team name from Odds API: ${team}`);
  }

  return normalized;
}

function isPlayerOutcome(name: string): boolean {
  const normalized = name.toLowerCase();

  if (normalized === "no scorer") {
    return false;
  }

  if (
    normalized.includes("defense") ||
    normalized.includes("d/st")
  ) {
    return false;
  }

  return true;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  const remaining = response.headers.get("x-requests-remaining");
  const used = response.headers.get("x-requests-used");

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

function parseEventOdds(event: EventOdds): AnytimeTdRow[] {
  const fetchedAt = new Date().toISOString();

  const homeTeam = normalizeTeam(event.home_team);
  const awayTeam = normalizeTeam(event.away_team);

  const rows: AnytimeTdRow[] = [];

  for (const bookmaker of event.bookmakers ?? []) {
    for (const market of bookmaker.markets ?? []) {
      if (market.key !== MARKET) {
        continue;
      }

      const players = new Map<
        string,
        {
          playerName: string;
          yesPrice: number | null;
          noPrice: number | null;
        }
      >();

      for (const outcome of market.outcomes ?? []) {
        const playerName = outcome.description?.trim();

        if (!playerName) {
          continue;
        }

        if (!isPlayerOutcome(playerName)) {
          continue;
        }

        if (outcome.name !== "Yes" && outcome.name !== "No") {
          continue;
        }

        let player = players.get(playerName);

        if (!player) {
          player = {
            playerName,
            yesPrice: null,
            noPrice: null,
          };

          players.set(playerName, player);
        }

        if (outcome.name === "Yes") {
          player.yesPrice = outcome.price;
        }

        if (outcome.name === "No") {
          player.noPrice = outcome.price;
        }
      }

      for (const player of players.values()) {
        if (player.yesPrice === null && player.noPrice === null) {
          continue;
        }

        rows.push({
          external_event_id: event.id,
          player_name: player.playerName,
          external_player_id: null,
          bookmaker: bookmaker.key,
          yes_price: player.yesPrice,
          no_price: player.noPrice,
          home_team: homeTeam,
          away_team: awayTeam,
          commence_time: event.commence_time,
          market_last_update: market.last_update ?? null,
          fetched_at: fetchedAt,
          updated_at: fetchedAt,
        });
      }
    }
  }

  return rows;
}

export async function importNflAnytimeTdOdds(): Promise<NflAnytimeTdImportResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const oddsApiKey = process.env.ODDS_API_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!oddsApiKey) {
    throw new Error("Missing ODDS_API_KEY");
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

  const getUpcomingEvents = async (): Promise<Event[]> => {
    const url =
      `https://api.the-odds-api.com/v4/sports/${SPORT}/events` +
      `?apiKey=${encodeURIComponent(oddsApiKey)}`;

    return fetchJson<Event[]>(url);
  };

  const getEventOdds = async (
    eventId: string,
  ): Promise<EventOdds> => {
    const url =
      `https://api.the-odds-api.com/v4/sports/${SPORT}/events/${eventId}/odds` +
      `?apiKey=${encodeURIComponent(oddsApiKey)}` +
      `&regions=us` +
      `&markets=${MARKET}` +
      `&oddsFormat=american`;

    return fetchJson<EventOdds>(url);
  };

  const replaceEventOdds = async (
    eventId: string,
    rows: AnytimeTdRow[],
  ): Promise<void> => {
    const { error: deleteError } = await supabase
      .from("nfl_anytime_td_odds")
      .delete()
      .eq("external_event_id", eventId);

    if (deleteError) {
      throw new Error(
        `Could not clear old Anytime TD odds for event ${eventId}: ${deleteError.message}`,
      );
    }

    if (rows.length === 0) {
      return;
    }

    const { error: insertError } = await supabase
      .from("nfl_anytime_td_odds")
      .insert(rows);

    if (insertError) {
      throw new Error(
        `Could not insert Anytime TD odds for event ${eventId}: ${insertError.message}`,
      );
    }
  };

  console.log("Fetching upcoming NFL events...");

  const events = await getUpcomingEvents();

  const now = Date.now();

  const futureEvents = events
    .filter(
      (event) =>
        new Date(event.commence_time).getTime() > now,
    )
    .sort(
      (a, b) =>
        new Date(a.commence_time).getTime() -
        new Date(b.commence_time).getTime(),
    );

  if (futureEvents.length === 0) {
    console.log("No upcoming NFL events found.");

    return {
      eventsProcessed: 0,
      eventsWithOdds: 0,
      totalRows: 0,
    };
  }

  const firstKickoff = new Date(
    futureEvents[0].commence_time,
  ).getTime();

  const slateEnd =
    firstKickoff + 6 * 24 * 60 * 60 * 1000;

  const upcomingEvents = futureEvents.filter(
    (event) =>
      new Date(event.commence_time).getTime() <= slateEnd,
  );

  console.log(
    `Upcoming NFL events returned: ${upcomingEvents.length}`,
  );

  let eventsProcessed = 0;
  let eventsWithOdds = 0;
  let totalRows = 0;

  for (const event of upcomingEvents) {
    const away = normalizeTeam(event.away_team);
    const home = normalizeTeam(event.home_team);

    console.log(
      `Fetching Anytime TD: ${away} @ ${home} — ${event.commence_time}`,
    );

    const eventOdds = await getEventOdds(event.id);
    const rows = parseEventOdds(eventOdds);

    console.log(
      `Books: ${eventOdds.bookmakers?.length ?? 0} | TD rows: ${rows.length}`,
    );

    await replaceEventOdds(event.id, rows);

    eventsProcessed += 1;

    if (rows.length > 0) {
      eventsWithOdds += 1;
      totalRows += rows.length;
    }
  }

  return {
    eventsProcessed,
    eventsWithOdds,
    totalRows,
  };
}
