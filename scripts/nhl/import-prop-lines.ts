import { createClient } from "@supabase/supabase-js";

const SPORT = "icehockey_nhl";

const MARKETS = [
  "player_shots_on_goal",
  "player_points",
  "player_assists",
  "player_total_saves",
] as const;

type Market = (typeof MARKETS)[number];

const NHL_TEAM_ABBREVIATIONS: Record<string, string> = {
  "Anaheim Ducks": "ANA",
  "Boston Bruins": "BOS",
  "Buffalo Sabres": "BUF",
  "Calgary Flames": "CGY",
  "Carolina Hurricanes": "CAR",
  "Chicago Blackhawks": "CHI",
  "Colorado Avalanche": "COL",
  "Columbus Blue Jackets": "CBJ",
  "Dallas Stars": "DAL",
  "Detroit Red Wings": "DET",
  "Edmonton Oilers": "EDM",
  "Florida Panthers": "FLA",
  "Los Angeles Kings": "LAK",
  "Minnesota Wild": "MIN",
  "Montreal Canadiens": "MTL",
  "Nashville Predators": "NSH",
  "New Jersey Devils": "NJD",
  "New York Islanders": "NYI",
  "New York Rangers": "NYR",
  "Ottawa Senators": "OTT",
  "Philadelphia Flyers": "PHI",
  "Pittsburgh Penguins": "PIT",
  "San Jose Sharks": "SJS",
  "Seattle Kraken": "SEA",
  "St. Louis Blues": "STL",
  "Tampa Bay Lightning": "TBL",
  "Toronto Maple Leafs": "TOR",
  "Utah Mammoth": "UTA",
  "Vancouver Canucks": "VAN",
  "Vegas Golden Knights": "VGK",
  "Washington Capitals": "WSH",
  "Winnipeg Jets": "WPG",
};

function getTeamAbbreviation(teamName: string): string {
  const abbreviation = NHL_TEAM_ABBREVIATIONS[teamName];

  if (!abbreviation) {
    throw new Error(
      `Unknown Odds API NHL team: ${teamName}`,
    );
  }

  return abbreviation;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const oddsApiKey = process.env.ODDS_API_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
}

if (!oddsApiKey) {
  throw new Error("ODDS_API_KEY is not configured.");
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

type OddsEvent = {
  id: string;
  sport_key: string;
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

type MarketResponse = {
  key: string;
  last_update?: string;
  outcomes: Outcome[];
};

type Bookmaker = {
  key: string;
  last_update?: string;
  markets: MarketResponse[];
};

type EventOdds = OddsEvent & {
  bookmakers?: Bookmaker[];
};

type PlayerRow = {
  id: number;
  player_name: string;
};

type PlayerMap = Map<string, PlayerRow[]>;

type PropRow = {
  event_id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmaker: string;
  market: Market;
  player_name: string;
  player_id: number | null;
  line: number;
  over_price: number | null;
  under_price: number | null;
  bookmaker_last_update: string | null;
  fetched_at: string;
};

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.'’\-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function fetchJson<T>(
  url: string,
): Promise<{
  data: T;
  headers: Headers;
}> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Odds API request failed ${response.status}: ${body}`,
    );
  }

  return {
    data: (await response.json()) as T,
    headers: response.headers,
  };
}

async function getPlayerMap(): Promise<PlayerMap> {
  const map: PlayerMap = new Map();
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("nhl_players")
      .select("id,player_name")
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(
        `Unable to load NHL players: ${error.message}`,
      );
    }

    const players = data ?? [];

    for (const player of players) {
      if (
        typeof player.id !== "number" ||
        typeof player.player_name !== "string"
      ) {
        continue;
      }

      const key = normalizeName(
        player.player_name,
      );
      const existing = map.get(key) ?? [];

      existing.push(player as PlayerRow);
      map.set(key, existing);
    }

    if (players.length < pageSize) {
      break;
    }
  }

  return map;
}

function buildRows(
  event: EventOdds,
  playerMap: PlayerMap,
): PropRow[] {
  const rows: PropRow[] = [];
  const fetchedAt = new Date().toISOString();

  for (const bookmaker of event.bookmakers ?? []) {
    for (const market of bookmaker.markets ?? []) {
      if (
        !MARKETS.includes(
          market.key as Market,
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
        const playerName = outcome.description?.trim();

        if (
          !playerName ||
          typeof outcome.point !== "number"
        ) {
          continue;
        }

        const key =
          `${normalizeName(playerName)}|${outcome.point}`;

        const existing = grouped.get(key) ?? {
          playerName,
          line: outcome.point,
          overPrice: null,
          underPrice: null,
        };

        if (outcome.name === "Over") {
          existing.overPrice = outcome.price;
        }

        if (outcome.name === "Under") {
          existing.underPrice = outcome.price;
        }

        grouped.set(key, existing);
      }

      for (const prop of grouped.values()) {
        const playerCandidates =
          playerMap.get(
            normalizeName(prop.playerName),
          ) ?? [];

        const player =
          playerCandidates.length === 1
            ? playerCandidates[0]
            : null;

        if (playerCandidates.length > 1) {
          console.warn(
            `  Ambiguous NHL player identity: ` +
              `${prop.playerName} ` +
              `(${playerCandidates
                .map((candidate) => candidate.id)
                .join(", ")})`,
          );
        }

        rows.push({
          event_id: event.id,
          commence_time: event.commence_time,
          home_team: event.home_team,
          away_team: event.away_team,
          bookmaker: bookmaker.key,
          market: market.key as Market,
          player_name: prop.playerName,
          player_id: player?.id ?? null,
          line: prop.line,
          over_price: prop.overPrice,
          under_price: prop.underPrice,
          bookmaker_last_update:
            market.last_update ??
            bookmaker.last_update ??
            null,
          fetched_at: fetchedAt,
        });
      }
    }
  }

  return rows;
}

async function replaceReturnedLines(
  eventId: string,
  rows: PropRow[],
): Promise<void> {
  if (rows.length === 0) {
    console.log(
      `  No prop rows returned for ${eventId}; ` +
        `preserving existing lines.`,
    );

    return;
  }

  const combinations = Array.from(
    new Map(
      rows.map((row) => [
        `${row.bookmaker}|${row.market}`,
        {
          bookmaker: row.bookmaker,
          market: row.market,
        },
      ]),
    ).values(),
  );

  for (const combination of combinations) {
    const { error } = await supabase
      .from("nhl_prop_lines")
      .delete()
      .eq("event_id", eventId)
      .eq("bookmaker", combination.bookmaker)
      .eq("market", combination.market);

    if (error) {
      throw new Error(
        `Unable to clear ${eventId} ` +
          `${combination.bookmaker} ` +
          `${combination.market}: ${error.message}`,
      );
    }
  }

  const { error } = await supabase
    .from("nhl_prop_lines")
    .insert(rows);

  if (error) {
    throw new Error(
      `Unable to insert NHL prop lines for ` +
        `${eventId}: ${error.message}`,
    );
  }
}

async function main(): Promise<void> {
  const playerMap = await getPlayerMap();

  const playerIdentityCount = Array.from(
    playerMap.values(),
  ).reduce(
    (total, players) => total + players.length,
    0,
  );

  console.log(
    `Loaded ${playerIdentityCount} NHL player identities ` +
      `across ${playerMap.size} unique names.`,
  );

  const eventsUrl =
    `https://api.the-odds-api.com/v4/sports/` +
    `${SPORT}/events?apiKey=${oddsApiKey}`;

  const eventsResponse =
    await fetchJson<OddsEvent[]>(eventsUrl);

 const allEvents = eventsResponse.data;

const now = Date.now();
const cutoff =
  now + 48 * 60 * 60 * 1000;

const events = allEvents.filter((event) => {
  const commenceTime =
    new Date(event.commence_time).getTime();

  return (
    Number.isFinite(commenceTime) &&
    commenceTime >= now &&
    commenceTime <= cutoff
  );
});

console.log(
  `Found ${allEvents.length} upcoming NHL events.`,
);

console.log(
  `${events.length} events begin within the next 48 hours.`,
);

  let totalRows = 0;
  let eventsWithProps = 0;

  for (const event of events) {
    console.log(
      `${event.away_team} @ ${event.home_team}`,
    );

    const oddsUrl =
      `https://api.the-odds-api.com/v4/sports/` +
      `${SPORT}/events/${event.id}/odds` +
      `?apiKey=${oddsApiKey}` +
      `&regions=us` +
      `&markets=${MARKETS.join(",")}` +
      `&oddsFormat=american`;

    try {
      const response =
        await fetchJson<EventOdds>(oddsUrl);

      const rows = buildRows(
        response.data,
        playerMap,
      );

      await replaceReturnedLines(
        event.id,
        rows,
      );

      if (rows.length > 0) {
        eventsWithProps += 1;
        totalRows += rows.length;
      }

      const remaining =
        response.headers.get(
          "x-requests-remaining",
        );

      console.log(
        `  ${rows.length} rows` +
          (remaining
            ? ` | quota remaining: ${remaining}`
            : ""),
      );
    } catch (error) {
      console.error(
        `  Failed event ${event.id}:`,
        error,
      );
    }
  }

  console.log("");
  console.log("NHL prop line import complete.");
  console.log(`Events processed: ${events.length}`);
  console.log(`Events with props: ${eventsWithProps}`);
  console.log(`Rows inserted: ${totalRows}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
