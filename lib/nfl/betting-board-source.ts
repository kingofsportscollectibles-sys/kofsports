import { assessPregameEvidence, type EvidenceGame, type EvidenceStat } from "./pregame-evidence";
import { loadPassingEvidenceSources } from "./pregame-evidence-source";
import { calculateKofConfidence } from "@/lib/nfl/kof-confidence";
import type { SupabaseClient } from "@supabase/supabase-js";
import { enrichNflPlayerPropTrends, mapPropTrend, NFL_PROP_MARKETS, type PropTrendRow } from "@/lib/nfl/prop-trends";
import { buildBettingBoard, BOARD_QUOTE_MAX_AGE_MS, finiteNumber, resolveBoardGame,
  sortBoardRows, selectBoardHistory, normalizeNflTeam, type BoardGame, type BoardPlayer, type BoardStat, type BoardDvp, type BoardScore } from "@/lib/nfl/betting-board";

// Explicit client injection permits read-only CLI verification. This is not a Server Action/API.
// Only the authorized server-only DAL imports this loader in the application.
async function paged<T>(query: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { code?: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw new Error(`Board source query failed (${error.code ?? "unknown"}).`);
    rows.push(...(data ?? []) as T[]);
    if (!data || data.length < 1000) return rows;
  }
}

export async function loadNflBettingBoardSource(client: SupabaseClient, now = Date.now()) {
  const warnings: string[] = [];
  const raw = await paged<PropTrendRow>((from, to) => client.from("nfl_player_prop_trends_with_identity").select("*")
    .eq("bookmaker", "draftkings").in("market", NFL_PROP_MARKETS).gt("commence_time", new Date(now).toISOString()).order("prop_id").range(from, to));
  const mapped = raw.map((row) => ({ ...mapPropTrend(row), line: finiteNumber(row.line) ?? NaN }));
  if (!mapped.length) return buildBettingBoard({ props: [], games: [], players: [], stats: [], scores: [], dvp: [], calculatedAt: new Date(now).toISOString() }, now);
  const ids = [...new Set(mapped.flatMap((p) => p.externalPlayerId ? [p.externalPlayerId] : []))];
  const games = await paged<BoardGame & EvidenceGame>((from, to) => client.from("nfl_games").select("id,external_game_id,season,week,game_type,game_date,commence_time,home_team,away_team,home_score,away_score,updated_at")
    .gte("season", new Date(now).getUTCFullYear() - 2).eq("game_type", "REG").order("id").range(from, to));
  const seasons = [...new Set(mapped.flatMap((p) => { const game = resolveBoardGame(p, games); return game ? [game.season] : []; }))];
  const historySeasons = [...new Set(seasons.flatMap((season) => [season - 1, season]))];
  const [players, scores, dvp, stats] = await Promise.all([
    ids.length ? paged<BoardPlayer>((from, to) => client.from("nfl_player_pages").select("gsis_id,slug,season,team,position,status")
      .in("gsis_id", ids).order("gsis_id").range(from, to)) : [],
    paged<BoardScore>((from, to) => client.from("nfl_prop_research_scored").select("prop_id,external_event_id,external_player_id,market,bookmaker,line,fetched_at,kof_over_score,usage_baseline_season,red_zone_baseline_season,dvp_baseline_season")
      .eq("bookmaker", "draftkings").in("market", NFL_PROP_MARKETS).gt("commence_time", new Date(now).toISOString()).order("prop_id").range(from, to))
      .catch(() => { warnings.push("Legacy KOF comparison scores are temporarily unavailable."); return [] as BoardScore[]; }),
    seasons.length ? paged<BoardDvp>((from, to) => client.from("nfl_defense_vs_position").select("season,defense,position,games,passing_yards_per_game,rushing_yards_per_game,receiving_yards_per_game,receptions_per_game")
      .in("season", seasons).order("season").order("position").order("defense").range(from, to))
      .catch(() => { warnings.push("Matchup data is temporarily unavailable."); return [] as BoardDvp[]; }) : [],
    Promise.all(Array.from({ length: Math.ceil(ids.length / 80) }, (_, i) => ids.slice(i * 80, (i + 1) * 80)).map((batch) => historySeasons.length ?
      paged<BoardStat>((from, to) => client.from("nfl_player_game_stats").select("id,game_id,external_player_id,season,week,team,updated_at,passing_attempts,passing_yards,rushing_yards,receiving_yards,receptions")
        .in("external_player_id", batch).in("season", historySeasons).order("id").range(from, to)) : [])).then((batches) => batches.flat()),
  ]);
  const slugs = new Map(players.map((p) => [p.gsis_id, p.slug]));
  const eligible = mapped.filter((p) => p.externalPlayerId && finiteNumber(p.line) !== null && p.fetchedAt &&
    Date.parse(p.fetchedAt) <= now && now - Date.parse(p.fetchedAt) <= BOARD_QUOTE_MAX_AGE_MS);
  // Reuse the existing projection models, batched by season/week. Confidence is calculated separately below.
  const enriched = await enrichNflPlayerPropTrends(eligible, slugs, client);
  const enrichedBySource = new Map(eligible.map((p, i) => [p, enriched[i]]));
  const finished = Date.now();
  const board = buildBettingBoard({ props: mapped.map((p) => enrichedBySource.get(p) ?? p), players, games, stats, scores, dvp,
    warnings, calculatedAt: new Date(finished).toISOString() }, finished);
  const gameMap = new Map(games.map((game) => [game.id, game]));
  const histories = new Map<string, BoardStat[]>();
  for (const stat of stats) histories.set(stat.external_player_id, [...(histories.get(stat.external_player_id) ?? []), stat]);
  board.rows = board.rows.map((row) => {
    const history = selectBoardHistory(histories.get(row.playerId) ?? [], gameMap, row.market, row.line, gameMap.get(row.gameId)!, finished)
      .map((game) => ({ ...game, opponent: normalizeNflTeam(game.opponent) }));
    const confidence = calculateKofConfidence({ projection: row.projection, line: row.line, season: row.season,
      opponent: normalizeNflTeam(row.opponent), history, matchup: row.matchup });
    return { ...row, legacyKofOverScore: row.kofScore, kofScore: confidence.score, confidence };
  });
  const passingRows=board.rows.filter(row=>row.market==="player_pass_yds");
  if(passingRows.length){
    const evidenceSource=await loadPassingEvidenceSources(client,{
      playerIds:[...new Set(passingRows.map(row=>row.playerId))],
      teams:[...new Set(passingRows.map(row=>normalizeNflTeam(row.team)))],
      seasons:[...new Set(passingRows.map(row=>row.season))],
    });
    // Source queries overlap for positive-attempt target players. Deduplicate by
    // database row ID only, preserving ambiguous player/game rows with different IDs.
    const passingIds=new Set(passingRows.map(row=>row.playerId));
    const evidenceStats=new Map<number,EvidenceStat>(evidenceSource.stats.map(s=>[s.id,s]));
    for(const s of stats)if(passingIds.has(s.external_player_id) && !evidenceStats.has(s.id))evidenceStats.set(s.id,{...s,passing_attempts:s.passing_attempts??null});
    const checkedAt=Date.now();
    board.rows=board.rows.map(row=>{
      if(row.market!=="player_pass_yds")return row;
      const pregameEvidence=assessPregameEvidence({playerId:row.playerId,team:row.team,
        target:gameMap.get(row.gameId)!,asOf:checkedAt,games,stats:[...evidenceStats.values()],
        usage:evidenceSource.usage,rosters:evidenceSource.rosters,sourceErrors:evidenceSource.errors});
      return {...row,pregameEvidence};
    });
  }
  board.rows = sortBoardRows(board.rows, "kofScore", "desc");
  board.coverage.missingScores = board.rows.filter((row) => row.kofScore === null).length;
  return board;
}
