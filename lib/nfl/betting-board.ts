import type { PublicNflInjuryContext } from "./injury-context";
import type { BoardAvailability } from "./availability";
import type { NflPregameEvidence, PublicPregameEvidence } from "./pregame-evidence";
import type { KofConfidence } from "@/lib/nfl/kof-confidence-types";
import type { NflPlayerPropTrend, NflPropMarket } from "@/lib/nfl/prop-trends";
import { getDvpAllowanceRank, getDvpRankBand } from "@/lib/nfl/dvp-ranking";

export const BOARD_MARKETS = {
  player_pass_yds: { label: "Passing yards", short: "Pass yards", unit: "yds", field: "passing_yards", dvp: "passing_yards_per_game" },
  player_rush_yds: { label: "Rushing yards", short: "Rush yards", unit: "yds", field: "rushing_yards", dvp: "rushing_yards_per_game" },
  player_reception_yds: { label: "Receiving yards", short: "Rec yards", unit: "yds", field: "receiving_yards", dvp: "receiving_yards_per_game" },
  player_receptions: { label: "Receptions", short: "Receptions", unit: "rec", field: "receptions", dvp: "receptions_per_game" },
} as const;
export const BOARD_QUOTE_MAX_AGE_MS = 48 * 60 * 60 * 1000;
export const BOARD_PROJECTION_MAX_AGE_MS = 15 * 60 * 1000;
export type BoardDirection = "over" | "under" | "none";
export type BoardGame = { id: number; season: number; week: number; game_type: string; commence_time: string; game_date: string; home_team: string; away_team: string; home_score: number | null; away_score: number | null };
export type BoardPlayer = { gsis_id: string; slug: string; season: number; team: string; position: string; status: string | null; updated_at?: string };
export type BoardStat = { id: number; game_id: number; external_player_id: string; season: number; week: number; team: string; updated_at: string; passing_attempts?: number | null; passing_yards: number | null; rushing_yards: number | null; receiving_yards: number | null; receptions: number | null };
export type BoardDvp = { season: number; defense: string; position: string; games: number; passing_yards_per_game: number | string | null; rushing_yards_per_game: number | string | null; receiving_yards_per_game: number | string | null; receptions_per_game: number | string | null };
export type BoardScore = { prop_id: number; external_event_id: string | null; external_player_id: string | null; market: string; bookmaker: string; line: number | string; fetched_at: string | null; kof_over_score: number | string | null; usage_baseline_season: number | null; red_zone_baseline_season: number | null; dvp_baseline_season: number | null };
export type BoardRecentGame = { gameId: number; season: number; date: string; opponent: string; value: number; result: "over" | "under" | "push" };
export type BoardL5 = { games: number; overs: number; unders: number; pushes: number; settled: number; overRate: number | null; recent: BoardRecentGame[] };
export type BoardMatchup = { label: "Favorable" | "Neutral" | "Difficult" | "Unavailable"; rank: number | null; allowed: number | null; games: number | null; season: number; reason?: string };
export type BettingBoardRow = {
  id: number; playerId: string; player: string; team: string; position: string; profileHref: string;
  gameId: number; game: string; opponent: string; season: number; week: number; kickoff: string;
  market: NflPropMarket; line: number; projection: number; edge: number; direction: BoardDirection; modelVersion: string;
  bookmaker: string; overPrice: number | null; underPrice: number | null; lineUpdatedAt: string; calculatedAt: string;
  injury?: PublicNflInjuryContext;
  availability?: BoardAvailability;
  pregameEvidence?: NflPregameEvidence; confidence?: KofConfidence; legacyKofOverScore?: number | null; kofScore: number | null; kofBaselineSeasons: number[]; l5: BoardL5; matchup: BoardMatchup; rosterStatus: string | null;
};
export type BettingBoardData = { calculatedAt: string; sourceLatestQuoteAt?: string | null; sourceFreshQuotes?: number; rows: BettingBoardRow[]; coverage: { sourceRows: number; displayed: number; excluded: Record<string, number>; missingScores: number; missingMatchups: number; limitedHistory: number }; logsUpdatedAt: string | null; warnings: string[] };
// Browser contract excludes model identifiers and all proprietary scoring diagnostics.
export type BoardPublicRow = Omit<BettingBoardRow, "modelVersion" | "confidence" | "legacyKofOverScore" | "kofBaselineSeasons" | "pregameEvidence" | "availability"> & {
  availability?: Omit<BoardAvailability, "sourceUrl">;
  pregame?: PublicPregameEvidence;
  research?: { recentGames: number | null; seasonGames: number | null; h2hGames: number | null; scoreNote: string | null };
};
export type BoardPublicData = Omit<BettingBoardData, "rows"> & { rows: BoardPublicRow[] };
export type BoardInputs = { props: NflPlayerPropTrend[]; games: BoardGame[]; players: BoardPlayer[]; stats: BoardStat[]; dvp: BoardDvp[]; scores: BoardScore[]; calculatedAt: string; warnings?: string[] };
export type BoardSortKey = "kofScore" | "edge" | "absoluteEdge" | "projection" | "line" | "l5";
export type BoardFilters = { position: string; market: string; game: string; direction: string; search: string };

export function finiteNumber(value: unknown): number | null {
  if ((typeof value !== "string" && typeof value !== "number") || (typeof value === "string" && value.trim() === "")) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function normalizeNflTeam(value: string) {
  return ({ LAR: "LA", JAC: "JAX", WSH: "WAS", OAK: "LV", SD: "LAC" } as Record<string, string>)[value] ?? value;
}
export function getBoardProjection(prop: NflPlayerPropTrend) {
  switch (prop.market) {
    case "player_pass_yds": return prop.passingProjection && { value: prop.passingProjection.projectedPassingYards, version: prop.passingProjection.modelVersion };
    case "player_rush_yds": return prop.rushingProjection && { value: prop.rushingProjection.projectedRushingYards, version: prop.rushingProjection.modelVersion };
    case "player_reception_yds": return prop.receivingProjection && { value: prop.receivingProjection.projectedReceivingYards, version: prop.receivingProjection.modelVersion };
    case "player_receptions": return prop.receptionsProjection && { value: prop.receptionsProjection.projectedReceptions, version: prop.receptionsProjection.modelVersion };
    default: return null;
  }
}
export function isBoardRowCurrent(row: Pick<BettingBoardRow, "lineUpdatedAt" | "calculatedAt" | "kickoff">, now: number) {
  const quote = Date.parse(row.lineUpdatedAt), calculated = Date.parse(row.calculatedAt), kickoff = Date.parse(row.kickoff);
  return Number.isFinite(quote) && Number.isFinite(calculated) && kickoff > now && quote <= now && calculated <= now &&
    now - quote <= BOARD_QUOTE_MAX_AGE_MS && now - calculated <= BOARD_PROJECTION_MAX_AGE_MS;
}
export function resolveBoardGame(prop: Pick<NflPlayerPropTrend, "homeTeam" | "awayTeam" | "commenceTime">, games: BoardGame[]) {
  const matches = games.filter((game) => game.game_type === "REG" && normalizeNflTeam(game.home_team) === normalizeNflTeam(prop.homeTeam) &&
    normalizeNflTeam(game.away_team) === normalizeNflTeam(prop.awayTeam) && Math.abs(Date.parse(game.commence_time) - Date.parse(prop.commenceTime)) <= 30 * 60 * 1000);
  return matches.length === 1 ? matches[0] : null;
}

// Same current-line Over/Under convention as the prop tools, with strict null and completed-game checks.
export function selectBoardHistory(stats: BoardStat[], games: Map<number, BoardGame>, market: NflPropMarket, line: number, target: BoardGame, now: number): BoardRecentGame[] {
  const counts = new Map<number, number>();
  for (const stat of stats) counts.set(stat.game_id, (counts.get(stat.game_id) ?? 0) + 1);
  const recent = stats.flatMap((stat): (BoardRecentGame & { start: number })[] => {
    const game = games.get(stat.game_id), value = finiteNumber(stat[BOARD_MARKETS[market].field]);
    if (!game || counts.get(stat.game_id) !== 1 || game.game_type !== "REG" || finiteNumber(game.home_score) === null || finiteNumber(game.away_score) === null ||
      stat.season !== game.season || stat.week !== game.week || stat.season > target.season || (stat.season === target.season && stat.week >= target.week) ||
      Date.parse(game.commence_time) >= Math.min(now, Date.parse(target.commence_time)) || !Number.isFinite(Date.parse(game.commence_time)) ||
      ![game.home_team, game.away_team].map(normalizeNflTeam).includes(normalizeNflTeam(stat.team)) || value === null) return [];
    return [{ gameId: game.id, season: game.season, date: game.game_date, start: Date.parse(game.commence_time), opponent: normalizeNflTeam(stat.team) === normalizeNflTeam(game.home_team) ? game.away_team : game.home_team,
      value, result: value > line ? "over" : value < line ? "under" : "push" }];
  }).sort((a, b) => b.start - a.start || b.gameId - a.gameId).map((game) => ({ gameId: game.gameId, season: game.season, date: game.date, opponent: game.opponent, value: game.value, result: game.result }));
  return recent;
}

export function selectBoardL5(stats: BoardStat[], games: Map<number, BoardGame>, market: NflPropMarket, line: number, target: BoardGame, now: number): BoardL5 {
  const recent = selectBoardHistory(stats, games, market, line, target, now).slice(0, 5);
  const overs = recent.filter((game) => game.result === "over").length;
  const unders = recent.filter((game) => game.result === "under").length;
  const pushes = recent.length - overs - unders, settled = overs + unders;
  return { games: recent.length, overs, unders, pushes, settled, overRate: settled ? overs / settled : null, recent };
}

export function getBoardMatchup(dvp: BoardDvp[], game: BoardGame, position: string, opponent: string, market: NflPropMarket, direction: BoardDirection): BoardMatchup {
  const missing = (reason: string): BoardMatchup => ({ label: "Unavailable", rank: null, allowed: null, games: null, season: game.season, reason });
  const metric = BOARD_MARKETS[market].dvp;
  const cohort = dvp.filter((row) => row.season === game.season && row.position === position && finiteNumber(row.games) !== null && Number(row.games) > 0 && finiteNumber(row[metric]) !== null);
  if (cohort.length !== 32 || new Set(cohort.map((r) => normalizeNflTeam(r.defense))).size !== 32) return missing("Current-season market/position coverage is incomplete.");
  const row = cohort.find((r) => normalizeNflTeam(r.defense) === normalizeNflTeam(opponent));
  if (!row) return missing("Opponent not matched.");
  const rank = getDvpAllowanceRank(row, cohort, (r) => Number(r[metric]));
  const band = getDvpRankBand(rank);
  const moreAllowed = band === "best" || band === "favorable", lessAllowed = band === "worst" || band === "difficult";
  const label = direction === "none" || (!moreAllowed && !lessAllowed) ? "Neutral" :
    (direction === "over" ? moreAllowed : lessAllowed) ? "Favorable" : "Difficult";
  return { label, rank, allowed: Number(row[metric]), games: Number(row.games), season: game.season };
}

export function buildBettingBoard(input: BoardInputs, now: number): BettingBoardData {
  const coverage: BettingBoardData["coverage"] = { sourceRows: input.props.length, displayed: 0, excluded: {}, missingScores: 0, missingMatchups: 0, limitedHistory: 0 };
  const reject = (reason: string) => { coverage.excluded[reason] = (coverage.excluded[reason] ?? 0) + 1; };
  const games = new Map(input.games.map((game) => [game.id, game]));
  const players = new Map<string, BoardPlayer[]>(), histories = new Map<string, BoardStat[]>(), scores = new Map<number, BoardScore[]>();
  for (const player of input.players) { const key = `${player.season}:${player.gsis_id}`; players.set(key, [...(players.get(key) ?? []), player]); }
  for (const stat of input.stats) histories.set(stat.external_player_id, [...(histories.get(stat.external_player_id) ?? []), stat]);
  for (const score of input.scores) scores.set(score.prop_id, [...(scores.get(score.prop_id) ?? []), score]);
  const unique = new Map<string, { prop: NflPlayerPropTrend; game: BoardGame; player: BoardPlayer }>();
  for (const prop of input.props) {
    if (!Object.hasOwn(BOARD_MARKETS, prop.market) || prop.bookmaker !== "draftkings") { reject("Unsupported market/book"); continue; }
    if (!prop.externalPlayerId || finiteNumber(prop.line) === null) { reject("Missing identity/line"); continue; }
    const game = resolveBoardGame(prop, input.games);
    if (!game || Date.parse(game.commence_time) <= now || Date.parse(prop.commenceTime) <= now || game.home_score !== null || game.away_score !== null) { reject("Unmatched/started game"); continue; }
    if (!prop.fetchedAt || !isBoardRowCurrent({ lineUpdatedAt: prop.fetchedAt, calculatedAt: input.calculatedAt, kickoff: game.commence_time }, now)) { reject("Stale/unknown quote or projection time"); continue; }
    const found = players.get(`${game.season}:${prop.externalPlayerId}`) ?? [];
    if (found.length !== 1 || !/^[a-z0-9-]+$/.test(found[0].slug)) { reject("Missing/ambiguous profile"); continue; }
    const player = found[0];
    if (!prop.playerTeam || normalizeNflTeam(prop.playerTeam) !== normalizeNflTeam(player.team) || ![game.home_team, game.away_team].map(normalizeNflTeam).includes(normalizeNflTeam(player.team)) || player.position !== prop.position) { reject("Roster/game mismatch"); continue; }
    if (player.status && player.status !== "ACT") { reject("Non-active roster status"); continue; }
    const validPositions = prop.market === "player_pass_yds" ? ["QB"] : prop.market === "player_rush_yds" ? ["QB", "RB"] : ["RB", "WR", "TE"];
    if (!validPositions.includes(player.position)) { reject("Unsupported position/market"); continue; }
    if (prop.injury?.suppressProjection) { reject("Reported unavailable for target game"); continue; }
    const projection = getBoardProjection(prop);
    if (!projection || finiteNumber(projection.value) === null || !Number.isFinite(projection.value - prop.line)) { reject("No model projection"); continue; }
    const key = `${game.id}:${prop.externalPlayerId}:${prop.market}:${prop.bookmaker}`;
    const previous = unique.get(key);
    if (!previous || Date.parse(prop.fetchedAt) > Date.parse(previous.prop.fetchedAt!) || (Date.parse(prop.fetchedAt) === Date.parse(previous.prop.fetchedAt!) && prop.propId > previous.prop.propId)) {
      if (previous) reject("Duplicate quote");
      unique.set(key, { prop, game, player });
    } else reject("Duplicate quote");
  }
  const rows: BettingBoardRow[] = [];
  for (const { prop, game, player } of unique.values()) {
    const projection = getBoardProjection(prop)!;
    const edge = projection.value - prop.line, direction: BoardDirection = edge > 0 ? "over" : edge < 0 ? "under" : "none";
    const opponent = normalizeNflTeam(player.team) === normalizeNflTeam(game.home_team) ? game.away_team : game.home_team;
    const l5 = selectBoardL5(histories.get(player.gsis_id) ?? [], games, prop.market, prop.line, game, now);
    const matchup = getBoardMatchup(input.dvp, game, player.position, opponent, prop.market, direction);
    const matching = (scores.get(prop.propId) ?? []).filter((s) => s.external_player_id === player.gsis_id && s.external_event_id === prop.externalEventId && s.market === prop.market &&
      s.bookmaker === prop.bookmaker && finiteNumber(s.line) === prop.line && s.fetched_at !== null && Date.parse(s.fetched_at) === Date.parse(prop.fetchedAt!));
    const score = matching.length === 1 ? matching[0] : null;
    const value = finiteNumber(score?.kof_over_score);
    const kofScore = value !== null && value >= 0 && value <= 100 ? value : null;
    if (kofScore === null) coverage.missingScores++;
    if (matchup.rank === null) coverage.missingMatchups++;
    if (l5.games < 5) coverage.limitedHistory++;
    rows.push({ id: prop.propId, playerId: player.gsis_id, player: prop.playerName, team: player.team, position: player.position,
      profileHref: `/nfl/players/${player.slug}`, gameId: game.id, game: `${game.away_team} at ${game.home_team}`, opponent, season: game.season, week: game.week, kickoff: game.commence_time,
      market: prop.market, line: prop.line, projection: projection.value, modelVersion: projection.version, edge, direction,
      bookmaker: prop.bookmaker, overPrice: prop.overPrice, underPrice: prop.underPrice, lineUpdatedAt: prop.fetchedAt!, calculatedAt: input.calculatedAt,
      injury: prop.injury,
      kofScore, kofBaselineSeasons: kofScore === null || !score ? [] : [...new Set([score.usage_baseline_season, score.red_zone_baseline_season, score.dvp_baseline_season].filter((s): s is number => Number.isInteger(s)))].sort(),
      l5, matchup, rosterStatus: player.status });
  }
  coverage.displayed = rows.length;
  const latest = input.stats.filter((s) => games.get(s.game_id)?.game_type === "REG" && Date.parse(games.get(s.game_id)!.commence_time) < now).map((s) => s.updated_at).filter((t) => Number.isFinite(Date.parse(t))).sort().at(-1) ?? null;
  const quoteTimes = input.props.map((p) => p.fetchedAt).filter((time): time is string => Boolean(time) && Number.isFinite(Date.parse(time!)) && Date.parse(time!) <= now);
  const sourceLatestQuoteAt = quoteTimes.sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1) ?? null;
  const sourceFreshQuotes = quoteTimes.filter((time) => now - Date.parse(time) <= BOARD_QUOTE_MAX_AGE_MS).length;
  const warnings = [...(input.warnings ?? [])];
  if (input.props.length > 0 && sourceFreshQuotes === 0) warnings.push("The stored sportsbook lines are older than 48 hours or have no verified update time. Fresh source data is needed before props can be shown.");
  return { calculatedAt: input.calculatedAt, sourceLatestQuoteAt, sourceFreshQuotes, rows: sortBoardRows(rows, "kofScore", "desc"), coverage, logsUpdatedAt: latest, warnings };
}

export function sortBoardRows<T extends BoardPublicRow>(rows: T[], key: BoardSortKey, order: "asc" | "desc") {
  const value = (row: BoardPublicRow) => key === "l5" ? row.l5.overRate : key === "absoluteEdge" ? Math.abs(row.edge) : row[key];
  return [...rows].sort((a, b) => {
    const av = value(a), bv = value(b);
    if (av === null) return bv === null ? a.player.localeCompare(b.player) || a.id - b.id : 1;
    if (bv === null) return -1;
    return (order === "asc" ? av - bv : bv - av) || a.player.localeCompare(b.player) || a.id - b.id;
  });
}
export function filterBoardRows<T extends BoardPublicRow>(rows: T[], filters: BoardFilters, now: number) {
  return rows.filter((row) => isBoardRowCurrent(row, now) && (filters.position === "all" || row.position === filters.position) &&
    (filters.market === "all" || row.market === filters.market) && (filters.game === "all" || String(row.gameId) === filters.game) &&
    (filters.direction === "all" || row.direction === filters.direction) && row.player.toLocaleLowerCase().includes(filters.search.trim().toLocaleLowerCase()));
}
