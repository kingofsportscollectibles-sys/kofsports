import { createClient } from "@supabase/supabase-js";

const SOURCE = "daily_faceoff";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is not configured.",
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is not configured.",
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

type PlayerRow = {
  id: number;
  player_name: string;
  team: string;
  position: string;
};

type PlayerMap = Map<string, PlayerRow[]>;

type GameRow = {
  id: number;
  game_date: string;
  commence_time: string | null;
  home_team: string;
  away_team: string;
};

type DfoGame = {
  homeTeamName?: string | null;
  awayTeamName?: string | null;

  homeGoalieId?: number | null;
  awayGoalieId?: number | null;

  homeGoalieName?: string | null;
  awayGoalieName?: string | null;

  homeNewsStrengthId?: number | null;
  awayNewsStrengthId?: number | null;

  homeNewsStrengthName?: string | null;
  awayNewsStrengthName?: string | null;

  homeNewsCreatedAt?: string | null;
  awayNewsCreatedAt?: string | null;

  homeNewsSourceName?: string | null;
  awayNewsSourceName?: string | null;

  homeNewsSourceUrl?: string | null;
  awayNewsSourceUrl?: string | null;

  homeNewsDetails?: string | null;
  awayNewsDetails?: string | null;

  date?: string | null;
  dateGmt?: string | null;
};

type StartingGoalieRow = {
  game_id: number;
  team: string;
  opponent: string;
  is_home: boolean;
  goalie_id: number | null;
  goalie_name: string | null;
  status: "unconfirmed" | "likely" | "confirmed";
  source: string;
  source_goalie_id: number | null;
  source_status_id: number | null;
  source_status: string | null;
  source_updated_at: string | null;
  source_name: string | null;
  source_url: string | null;
  source_details: string | null;
  game_date: string;
  commence_time: string;
  fetched_at: string;
  updated_at: string;
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

function getTeamAbbreviation(
  teamName: string,
): string {
  const abbreviation =
    NHL_TEAM_ABBREVIATIONS[teamName];

  if (!abbreviation) {
    throw new Error(
      `Unknown Daily Faceoff NHL team: ${teamName}`,
    );
  }

  return abbreviation;
}

function normalizeStatus(
  sourceStatusId: number | null | undefined,
  sourceStatus: string | null | undefined,
): "unconfirmed" | "likely" | "confirmed" {
  if (
    sourceStatusId === 2 ||
    sourceStatus?.toLowerCase() === "confirmed"
  ) {
    return "confirmed";
  }

  if (
    sourceStatusId === 3 ||
    sourceStatus?.toLowerCase() === "likely"
  ) {
    return "likely";
  }

  if (
    sourceStatusId != null ||
    (sourceStatus != null &&
      sourceStatus.trim() !== "")
  ) {
    console.warn(
      `Unknown Daily Faceoff goalie status: ` +
        `id=${String(sourceStatusId)} ` +
        `name=${String(sourceStatus)}`,
    );
  }

  return "unconfirmed";
}

async function getPlayerMap(): Promise<PlayerMap> {
  const map: PlayerMap = new Map();
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from("nhl_players")
      .select("id,player_name,team,position")
      .eq("position", "G")
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(
        `Unable to load NHL goalies: ${error.message}`,
      );
    }

    const players = data ?? [];

    for (const player of players) {
      if (
        typeof player.id !== "number" ||
        typeof player.player_name !== "string" ||
        typeof player.team !== "string" ||
        typeof player.position !== "string"
      ) {
        continue;
      }

      const key = normalizeName(player.player_name);
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

async function getGames(
  gameDate: string,
): Promise<GameRow[]> {
  const { data, error } = await supabase
    .from("nhl_games")
    .select(
      "id,game_date,commence_time,home_team,away_team",
    )
    .eq("game_date", gameDate)
    .order("commence_time", { ascending: true });

  if (error) {
    throw new Error(
      `Unable to load NHL games for ${gameDate}: ` +
        error.message,
    );
  }

  return (data ?? []) as GameRow[];
}

async function fetchDailyFaceoff(
  gameDate: string,
): Promise<DfoGame[]> {
  const url =
    `https://www.dailyfaceoff.com/starting-goalies/` +
    gameDate;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Daily Faceoff request failed ` +
        `${response.status}: ${response.statusText}`,
    );
  }

  const html = await response.text();

  const match = html.match(
    /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );

  if (!match?.[1]) {
    throw new Error(
      "Daily Faceoff __NEXT_DATA__ payload not found.",
    );
  }

  const payload = JSON.parse(match[1]) as {
    props?: {
      pageProps?: {
        data?: DfoGame[];
      };
    };
  };

  return payload.props?.pageProps?.data ?? [];
}

function resolveGoalie(
  goalieName: string | null | undefined,
  team: string,
  playerMap: PlayerMap,
): PlayerRow | null {
  if (!goalieName) {
    return null;
  }

  const candidates =
    playerMap.get(normalizeName(goalieName)) ?? [];

  if (candidates.length === 0) {
    console.warn(
      `  Unmatched NHL goalie: ${goalieName} (${team})`,
    );
    return null;
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  const teamCandidates = candidates.filter(
    (candidate) => candidate.team === team,
  );

  if (teamCandidates.length === 1) {
    return teamCandidates[0];
  }

  console.warn(
    `  Ambiguous NHL goalie identity: ` +
      `${goalieName} (${team}) ` +
      `(${candidates
        .map((candidate) => candidate.id)
        .join(", ")})`,
  );

  return null;
}

function findGame(
  games: GameRow[],
  homeTeam: string,
  awayTeam: string,
): GameRow | null {
  const matches = games.filter(
    (game) =>
      game.home_team === homeTeam &&
      game.away_team === awayTeam,
  );

  if (matches.length === 1) {
    return matches[0];
  }

  if (matches.length > 1) {
    console.warn(
      `  Multiple canonical NHL games found for ` +
        `${awayTeam} @ ${homeTeam}.`,
    );
  }

  return null;
}

function buildGoalieRow(args: {
  game: GameRow;
  team: string;
  opponent: string;
  isHome: boolean;
  goalieName: string | null | undefined;
  sourceGoalieId: number | null | undefined;
  sourceStatusId: number | null | undefined;
  sourceStatus: string | null | undefined;
  sourceUpdatedAt: string | null | undefined;
  sourceName: string | null | undefined;
  sourceUrl: string | null | undefined;
  sourceDetails: string | null | undefined;
  playerMap: PlayerMap;
  fetchedAt: string;
}): StartingGoalieRow | null {
  if (!args.game.commence_time) {
    console.warn(
      `  Game ${args.game.id} has no commence_time; skipping.`,
    );
    return null;
  }

  const goalie = resolveGoalie(
    args.goalieName,
    args.team,
    args.playerMap,
  );

  return {
    game_id: args.game.id,
    team: args.team,
    opponent: args.opponent,
    is_home: args.isHome,
    goalie_id: goalie?.id ?? null,
    goalie_name: args.goalieName?.trim() || null,
    status: normalizeStatus(
      args.sourceStatusId,
      args.sourceStatus,
    ),
    source: SOURCE,
    source_goalie_id: args.sourceGoalieId ?? null,
    source_status_id: args.sourceStatusId ?? null,
    source_status: args.sourceStatus ?? null,
    source_updated_at: args.sourceUpdatedAt ?? null,
    source_name: args.sourceName ?? null,
    source_url: args.sourceUrl ?? null,
    source_details: args.sourceDetails ?? null,
    game_date: args.game.game_date,
    commence_time: args.game.commence_time,
    fetched_at: args.fetchedAt,
    updated_at: args.fetchedAt,
  };
}

async function main(): Promise<void> {
  const requestedDate =
    process.argv[2] ??
    new Date().toISOString().slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
    throw new Error(
      "Usage: import-starting-goalies.ts YYYY-MM-DD",
    );
  }

  console.log(
    `Importing NHL starting goalies for ${requestedDate}...`,
  );

  const [playerMap, games, dfoGames] =
    await Promise.all([
      getPlayerMap(),
      getGames(requestedDate),
      fetchDailyFaceoff(requestedDate),
    ]);

  const playerIdentityCount = Array.from(
    playerMap.values(),
  ).reduce(
    (total, players) => total + players.length,
    0,
  );

  console.log(
    `Loaded ${playerIdentityCount} canonical NHL goalies.`,
  );
  console.log(
    `Found ${games.length} canonical NHL games.`,
  );
  console.log(
    `Daily Faceoff returned ${dfoGames.length} games.`,
  );

  if (dfoGames.length === 0) {
    console.log(
      "No Daily Faceoff goalie data returned; " +
        "preserving existing rows.",
    );
    return;
  }

  const fetchedAt = new Date().toISOString();
  const rows: StartingGoalieRow[] = [];

  for (const dfoGame of dfoGames) {
    if (
      !dfoGame.homeTeamName ||
      !dfoGame.awayTeamName
    ) {
      console.warn(
        "Skipping Daily Faceoff game with missing teams.",
      );
      continue;
    }

    let homeTeam: string;
    let awayTeam: string;

    try {
      homeTeam = getTeamAbbreviation(
        dfoGame.homeTeamName,
      );
      awayTeam = getTeamAbbreviation(
        dfoGame.awayTeamName,
      );
    } catch (error) {
      console.warn(error);
      continue;
    }

    console.log(`${awayTeam} @ ${homeTeam}`);

    const game = findGame(
      games,
      homeTeam,
      awayTeam,
    );

    if (!game) {
      console.warn(
        `  No canonical NHL game match found; skipping.`,
      );
      continue;
    }

    const homeRow = buildGoalieRow({
      game,
      team: homeTeam,
      opponent: awayTeam,
      isHome: true,
      goalieName: dfoGame.homeGoalieName,
      sourceGoalieId: dfoGame.homeGoalieId,
      sourceStatusId:
        dfoGame.homeNewsStrengthId,
      sourceStatus:
        dfoGame.homeNewsStrengthName,
      sourceUpdatedAt:
        dfoGame.homeNewsCreatedAt,
      sourceName: dfoGame.homeNewsSourceName,
      sourceUrl: dfoGame.homeNewsSourceUrl,
      sourceDetails: dfoGame.homeNewsDetails,
      playerMap,
      fetchedAt,
    });

    const awayRow = buildGoalieRow({
      game,
      team: awayTeam,
      opponent: homeTeam,
      isHome: false,
      goalieName: dfoGame.awayGoalieName,
      sourceGoalieId: dfoGame.awayGoalieId,
      sourceStatusId:
        dfoGame.awayNewsStrengthId,
      sourceStatus:
        dfoGame.awayNewsStrengthName,
      sourceUpdatedAt:
        dfoGame.awayNewsCreatedAt,
      sourceName: dfoGame.awayNewsSourceName,
      sourceUrl: dfoGame.awayNewsSourceUrl,
      sourceDetails: dfoGame.awayNewsDetails,
      playerMap,
      fetchedAt,
    });

    if (homeRow) {
      rows.push(homeRow);
    }

    if (awayRow) {
      rows.push(awayRow);
    }
  }

  if (rows.length === 0) {
    console.log(
      "No valid goalie rows built; preserving existing rows.",
    );
    return;
  }

  const { error } = await supabase
    .from("nhl_starting_goalies")
    .upsert(rows, {
      onConflict: "game_id,team",
    });

  if (error) {
    throw new Error(
      `Unable to upsert NHL starting goalies: ` +
        error.message,
    );
  }

  const resolved = rows.filter(
    (row) => row.goalie_id !== null,
  ).length;

  const confirmed = rows.filter(
    (row) => row.status === "confirmed",
  ).length;

  const likely = rows.filter(
    (row) => row.status === "likely",
  ).length;

  console.log("");
  console.log("NHL starting goalie import complete.");
  console.log(`Rows upserted: ${rows.length}`);
  console.log(
    `Canonical goalie IDs resolved: ` +
      `${resolved}/${rows.length}`,
  );
  console.log(`Confirmed: ${confirmed}`);
  console.log(`Likely: ${likely}`);
  console.log(
    `Unconfirmed: ${rows.length - confirmed - likely}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
