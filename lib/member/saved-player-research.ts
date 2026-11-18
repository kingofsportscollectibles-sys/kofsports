import type { SupabaseClient } from "@supabase/supabase-js";
import { getNhlPlayerSlug } from "@/lib/nhl/player-links";

export const SPORT_TOOLS = {
  nfl: { label: "NFL", href: "/nfl-player-prop-trends" },
  nba: { label: "NBA", href: "/nba/player-prop-trends" },
  nhl: { label: "NHL", href: "/nhl/player-prop-trends" },
} as const;
export type SavedSport = keyof typeof SPORT_TOOLS;
export type SavedPlayerRecord = { id: string; sport: string; player_id: string };
export type ResearchAverage = {
  market: string;
  label: string;
  value: number;
  games: number;
  throughDate: string;
};
export type PlayerResearch = {
  opponent: string | null;
  startsAt: string;
  fetchedAt: string;
  averages: ResearchAverage[];
};
export type SavedPlayer = SavedPlayerRecord & {
  playerName: string;
  team: string | null;
  position: string | null;
  profileHref: string | null;
  research: PlayerResearch | null;
};
export type ResearchRow = {
  market: string;
  upcoming_opponent: string | null;
  commence_time: string;
  fetched_at: string | null;
  avg_l5: number | string | null;
  l5_games: number | string;
  last_ten: unknown;
};

// Explicitly refreshed snapshots, never a live feed. Drop stale matchups on the client too.
export const RESEARCH_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export function isResearchCurrent(research: Pick<PlayerResearch, "startsAt" | "fetchedAt">, now: number) {
  const fetched = Date.parse(research.fetchedAt);
  return Date.parse(research.startsAt) > now &&
    Number.isFinite(fetched) && fetched <= now && now - fetched <= RESEARCH_MAX_AGE_MS;
}

const MARKETS: Record<SavedSport, Record<string, string>> = {
  nfl: {
    player_pass_yds: "Passing yards", player_rush_yds: "Rushing yards",
    player_reception_yds: "Receiving yards", player_receptions: "Receptions",
  },
  nba: {
    player_points: "Points", player_rebounds: "Rebounds", player_assists: "Assists",
    player_threes: "3-pointers made", player_points_rebounds_assists: "Points + rebounds + assists",
  },
  nhl: {
    player_shots_on_goal: "Shots on goal", player_points: "Points",
    player_assists: "Assists", player_total_saves: "Goalie saves",
  },
};

export function selectPlayerResearch(sport: SavedSport, rows: ResearchRow[], now: number): PlayerResearch | null {
  const current = rows.filter((row) => Object.hasOwn(MARKETS[sport], row.market) &&
    isResearchCurrent({ startsAt: row.commence_time, fetchedAt: row.fetched_at ?? "" }, now))
    .sort((a, b) => Date.parse(a.commence_time) - Date.parse(b.commence_time) ||
      Date.parse(b.fetched_at!) - Date.parse(a.fetched_at!));
  if (!current.length) return null;
  const next = current[0];
  const nextGame = current.filter((row) => row.commence_time === next.commence_time);
  const averages: ResearchAverage[] = [];
  let fetchedAt = next.fetched_at!;
  for (const [market, label] of Object.entries(MARKETS[sport])) {
    const row = nextGame.find((item) => item.market === market);
    if (!row || row.avg_l5 === null || row.avg_l5 === "" || !Array.isArray(row.last_ten)) continue;
    const value = Number(row.avg_l5);
    const games = Number(row.l5_games);
    if (!Number.isFinite(value) || !Number.isInteger(games) || games <= 0 || games > 5) continue;
    // Existing views use snake_case for NFL/NHL and camelCase for NBA history.
    const dates = row.last_ten.flatMap((game) => {
      if (!game || typeof game !== "object") return [];
      const date = game.game_date ?? game.gameDate;
      return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        Number.isFinite(Date.parse(date)) && Date.parse(date) <= now ? [date] : [];
    }).sort().reverse();
    if (dates.length < games) continue;
    averages.push({ market, label, value, games, throughDate: dates[0] });
    if (Date.parse(row.fetched_at!) < Date.parse(fetchedAt)) fetchedAt = row.fetched_at!;
    if (averages.length === 2) break;
  }
  return {
    opponent: next.upcoming_opponent,
    startsAt: next.commence_time,
    fetchedAt,
    averages,
  };
}

export function isSavedSport(sport: string): sport is SavedSport {
  return Object.hasOwn(SPORT_TOOLS, sport);
}

type Identity = { playerName: string; team: string | null; position: string | null; profileHref: string | null };
type ProfileRow = {
  gsis_id?: string; player_id?: number; id?: number;
  player_name: string; slug?: string; team: string | null; position?: string | null;
};
type IdentifiedResearchRow = ResearchRow & { external_player_id?: string; player_id?: number };

export async function loadSavedPlayerResearch(client: SupabaseClient, userId: string, now = Date.now()) {
  const { data, error } = await client.from("saved_players")
    .select("id, sport, player_id").eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load saved players.");
  const saved = (data ?? []) as SavedPlayerRecord[];
  const identities = new Map<string, Identity>();
  const research = new Map<string, PlayerResearch>();
  let partial = false;

  // At most seven enrichment queries, regardless of the number of saved players.
  await Promise.all((Object.keys(SPORT_TOOLS) as SavedSport[]).map(async (sport) => {
    const ids = [...new Set(saved.filter((player) => player.sport === sport).map((player) => player.player_id))];
    if (!ids.length) return;
    const profileQuery = sport === "nfl"
      ? client.from("nfl_player_pages").select("gsis_id, player_name, slug, team, position, season").in("gsis_id", ids).order("season", { ascending: false })
      : sport === "nba"
        ? client.from("nba_player_pages").select("player_id, player_name, slug, team").in("player_id", ids)
        : client.from("nhl_players").select("id, player_name, team, position").in("id", ids);
    const idColumn = sport === "nfl" ? "external_player_id" : "player_id";
    const view = sport === "nfl" ? "nfl_player_prop_trends_with_identity" : `${sport}_player_prop_trends`;
    const averageColumn = sport === "nba" ? "avg_l5:l5_avg" : "avg_l5";
    const researchColumns = `market, upcoming_opponent, commence_time, fetched_at, ${averageColumn}, l5_games, last_ten`;
    const trendQuery = client.from(view).select(`${idColumn}, ${researchColumns}`)
      .in(idColumn, ids).eq("bookmaker", "draftkings")
      .in("market", Object.keys(MARKETS[sport]))
      .gt("commence_time", new Date(now).toISOString())
      .gte("fetched_at", new Date(now - RESEARCH_MAX_AGE_MS).toISOString())
      .order("commence_time", { ascending: true });
    const results = await Promise.allSettled([
      profileQuery, trendQuery,
      ...(sport === "nba" ? [client.from("nba_players").select("id, position").in("id", ids)] : []),
    ]);
    const rows: unknown[][] = results.map((result) => {
      if (result.status === "rejected" || result.value.error) { partial = true; return []; }
      return result.value.data ?? [];
    });
    const positionRows = (rows[2] ?? []) as { id: number; position: string | null }[];
    const positions = new Map(positionRows.map((row) => [String(row.id), row.position]));
    for (const row of rows[0] as ProfileRow[]) {
      const id = String(sport === "nfl" ? row.gsis_id : sport === "nba" ? row.player_id : row.id);
      const key = `${sport}:${id}`;
      if (identities.has(key)) continue;
      const slug = sport === "nhl" ? getNhlPlayerSlug(Number(row.id), row.player_name) : row.slug;
      identities.set(key, {
        playerName: row.player_name, team: row.team ?? null,
        position: sport === "nba" ? positions.get(id) ?? null : row.position ?? null,
        profileHref: slug ? `/${sport}/players/${slug}` : null,
      });
    }
    const grouped = new Map<string, ResearchRow[]>();
    for (const row of rows[1] as IdentifiedResearchRow[]) {
      const id = String(row[idColumn]);
      grouped.set(id, [...(grouped.get(id) ?? []), row as ResearchRow]);
    }
    for (const [id, trends] of grouped) {
      const selected = selectPlayerResearch(sport, trends, now);
      if (selected) research.set(`${sport}:${id}`, selected);
    }
  }));

  return {
    partial,
    players: saved.map((player): SavedPlayer => ({
      ...player,
      ...(identities.get(`${player.sport}:${player.player_id}`) ?? {
        playerName: "Saved player", team: null, position: null, profileHref: null,
      }),
      research: research.get(`${player.sport}:${player.player_id}`) ?? null,
    })),
  };
}
