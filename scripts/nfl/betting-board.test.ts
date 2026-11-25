import assert from "node:assert/strict";
import test from "node:test";
import { buildBettingBoard, finiteNumber, selectBoardL5, getBoardMatchup, filterBoardRows, sortBoardRows, isBoardRowCurrent,
  type BoardInputs, type BoardGame, type BoardStat, type BoardDvp, type BettingBoardRow } from "../../lib/nfl/betting-board";
import type { NflPlayerPropTrend } from "../../lib/nfl/prop-trends";
import { readAuthorizedBoard } from "../../lib/nfl/betting-board-access";
import { BETTING_BOARD_EVENTS, bettingBoardEventInput, sanitizeBettingBoardMetadata } from "../../lib/growth/events/betting-board-policy";

const now = Date.parse("2026-11-05T22:00:00Z");
function fixture(): BoardInputs {
  const game: BoardGame = { id: 99, season: 2026, week: 9, game_type: "REG", game_date: "2026-11-08", commence_time: "2026-11-08T18:00:00Z", home_team: "KC", away_team: "BUF", home_score: null, away_score: null };
  const props: NflPlayerPropTrend[] = [{ propId: 1, externalEventId: "event", externalPlayerId: "p", playerSlug: "player", playerName: "Test Player", playerTeam: "KC", position: "WR", market: "player_receptions", line: 4.5, overPrice: -110, underPrice: -110, bookmaker: "draftkings", homeTeam: "KC", awayTeam: "BUF", upcomingOpponent: "BUF", commenceTime: game.commence_time, fetchedAt: new Date(now - 3600_000).toISOString(),
    l5Games: 0, l5Overs: 0, l5Unders: 0, l5Pushes: 0, l5OverPct: null, avgL5: null, l10Games: 0, l10Overs: 0, l10Unders: 0, l10Pushes: 0, l10OverPct: null, avgL10: null, seasonGames: 0, seasonOvers: 0, seasonOverPct: null, h2hGames: 0, h2hOvers: 0, h2hOverPct: null, avgH2h: null, lastTen: [], passingProjection: null, rushingProjection: null, receivingProjection: null, receptionsProjection: { projectedReceptions: 4.2, projectedTargets: 7, expectedCatchRate: 0.6, modelVersion: "nfl_receptions_v1.0" } }];
  const games: BoardGame[] = [game], stats: BoardStat[] = [];
  [7, null, 5, 0, 4, 3].forEach((value, i) => {
    const date = new Date(Date.parse("2026-11-01T18:00:00Z") - i * 7 * 86_400_000);
    games.push({ ...game, id: i + 1, week: 8 - i, game_date: date.toISOString().slice(0, 10), commence_time: date.toISOString(), home_score: 20, away_score: 10 });
    stats.push({ id: i + 1, game_id: i + 1, external_player_id: "p", season: 2026, week: 8 - i, team: "KC", updated_at: "2026-11-03T12:00:00Z", receptions: value, passing_yards: null, receiving_yards: value === null ? null : value * 10, rushing_yards: 0 });
  });
  const dvp: BoardDvp[] = Array.from({ length: 32 }, (_, i) => ({ season: 2026, defense: i === 0 ? "BUF" : `T${i}`, position: "WR", games: 8, receptions_per_game: 32 - i, receiving_yards_per_game: i, rushing_yards_per_game: 0, passing_yards_per_game: 0 }));
  return { props, games, stats, dvp, calculatedAt: new Date(now).toISOString(), players: [{ gsis_id: "p", slug: "test-player", season: 2026, team: "KC", position: "WR", status: "ACT" }],
    scores: [{ prop_id: 1, external_event_id: "event", external_player_id: "p", market: "player_receptions", line: 4.5, bookmaker: "draftkings", fetched_at: props[0].fetchedAt, kof_over_score: "89.2", usage_baseline_season: 2025, red_zone_baseline_season: 2025, dvp_baseline_season: 2025 }] };
}
const first = () => buildBettingBoard(fixture(), now).rows[0];

test("valid row preserves model output, exact raw negative edge, source score and real profile format", () => {
  const r = first(); assert.equal(r.projection, 4.2); assert.ok(Math.abs(r.edge + 0.3) < 1e-10); assert.equal(r.direction, "under");
  assert.equal(r.kofScore, 89.2); assert.deepEqual(r.kofBaselineSeasons, [2025]); assert.equal(r.profileHref, "/nfl/players/test-player");
});
test("positive, zero and zero-line edges use raw units without probability transforms", () => {
  for (const [line, expected] of [[3, "over"], [4.2, "none"], [0, "over"]] as const) {
    const input = fixture(); input.props[0].line = line; const r = buildBettingBoard(input, now).rows[0]; assert.equal(r.direction, expected); assert.equal(r.edge, 4.2 - line);
  }
});
test("zero projection is valid; missing numbers are never coerced to zero", () => {
  for (const value of [null, undefined, "", " ", false, [], NaN, Infinity]) assert.equal(finiteNumber(value), null);
  assert.equal(finiteNumber("0"), 0); const input = fixture(); input.props[0].receptionsProjection!.projectedReceptions = 0; assert.equal(buildBettingBoard(input, now).rows[0].projection, 0);
});
test("L5 skips missing values, retains actual zero and compares with the currently displayed line", () => {
  const input = fixture(); const r = first(); assert.deepEqual(r.l5.recent.map((g) => g.value), [7, 5, 0, 4, 3]); assert.equal(r.l5.overs, 2); assert.equal(r.l5.games, 5);
  const l5 = selectBoardL5(input.stats, new Map(input.games.map((g) => [g.id, g])), "player_receptions", 5, input.games[0], now);
  assert.equal(l5.pushes, 1); assert.equal(l5.settled, 4); assert.equal(l5.overRate, 0.25);
});
test("incomplete and all-push samples have explicit sample counts and no fabricated rate", () => {
  const input = fixture(); input.stats = input.stats.slice(0, 1); input.props[0].line = 7; const r = buildBettingBoard(input, now).rows[0];
  assert.equal(r.l5.games, 1); assert.equal(r.l5.pushes, 1); assert.equal(r.l5.overRate, null);
});
test("future, current-week, unfinished, postseason and duplicate game logs are excluded", () => {
  const input = fixture(); input.games[1].home_score = null; input.games[3].game_type = "POST";
  input.stats.push({ ...input.stats[3] }); // ambiguous exact player/game
  input.stats.push({ ...input.stats[0], id: 50, game_id: 99, week: 9, receptions: 1000 });
  const r = buildBettingBoard(input, now).rows[0]; assert.deepEqual(r.l5.recent.map((g) => g.value), [4, 3]);
});
test("market/position-specific allowance ranks use current season and follow the lean", () => {
  const i = fixture(), g = i.games[0];
  assert.deepEqual([getBoardMatchup(i.dvp, g, "WR", "BUF", "player_receptions", "over").rank, getBoardMatchup(i.dvp, g, "WR", "BUF", "player_receptions", "over").label], [1, "Favorable"]);
  assert.equal(getBoardMatchup(i.dvp, g, "WR", "BUF", "player_receptions", "under").label, "Difficult");
  assert.equal(getBoardMatchup(i.dvp, g, "WR", "BUF", "player_reception_yds", "over").rank, 32);
  assert.equal(getBoardMatchup(i.dvp, g, "QB", "BUF", "player_receptions", "over").label, "Unavailable");
  assert.equal(getBoardMatchup(i.dvp.map((d) => ({ ...d, season: 2025 })), g, "WR", "BUF", "player_receptions", "over").label, "Unavailable");
});
test("incomplete or duplicate defensive coverage is never favorable; equal allowances share rank", () => {
  const i = fixture(), g = i.games[0]; assert.equal(getBoardMatchup(i.dvp.slice(0, 31), g, "WR", "BUF", "player_receptions", "over").rank, null);
  i.dvp[1].receptions_per_game = 32; assert.equal(getBoardMatchup(i.dvp, g, "WR", "T1", "player_receptions", "over").rank, 1);
});
test("strict player/market/book/line/event/quote joins never attach an unrelated KOF score", () => {
  for (const mutate of [(s: BoardInputs) => { s.scores[0].line = 99; }, (s: BoardInputs) => { s.scores[0].external_event_id = "other"; }, (s: BoardInputs) => { s.scores[0].external_player_id = "other"; }, (s: BoardInputs) => { s.scores[0].market = "player_rush_yds"; }, (s: BoardInputs) => { s.scores[0].fetched_at = "2026-01-01T00:00:00Z"; }]) {
    const i = fixture(); mutate(i); assert.equal(buildBettingBoard(i, now).rows[0].kofScore, null);
  }
});
test("no score or matchup still permits a valid projection/line with explicit unavailable fields", () => {
  const i = fixture(); i.scores = []; i.dvp = []; const r = buildBettingBoard(i, now); assert.equal(r.rows.length, 1); assert.equal(r.coverage.missingScores, 1); assert.equal(r.rows[0].matchup.label, "Unavailable");
});
test("missing projections, mismatched teams, inactive and ambiguous profiles are not actionable rows", () => {
  for (const mutate of [(i: BoardInputs) => { i.props[0].receptionsProjection = null; }, (i: BoardInputs) => { i.players[0].team = "NYJ"; }, (i: BoardInputs) => { i.players[0].status = "RES"; }, (i: BoardInputs) => { i.players.push({ ...i.players[0] }); }, (i: BoardInputs) => { i.props[0].line = NaN; }]) {
    const i = fixture(); mutate(i); assert.equal(buildBettingBoard(i, now).rows.length, 0);
  }
});
test("stale/unknown/future quotes and stale projections are hidden, including in an open client board", () => {
  for (const fetched of [null, new Date(now - 48 * 3600_000 - 1).toISOString(), new Date(now + 1).toISOString()]) {
    const i = fixture(); i.props[0].fetchedAt = fetched; assert.equal(buildBettingBoard(i, now).rows.length, 0);
  }
  const r = first(); assert.equal(isBoardRowCurrent(r, now + 15 * 60_000 + 1), false);
});
test("started or score-bearing target games and ambiguous schedules are excluded", () => {
  for (const mutate of [(i: BoardInputs) => { i.games[0].home_score = 0; }, (i: BoardInputs) => { i.games.push({ ...i.games[0], id: 100 }); }, (i: BoardInputs) => { i.games[0].commence_time = i.props[0].commenceTime = new Date(now).toISOString(); }]) {
    const i = fixture(); mutate(i); assert.equal(buildBettingBoard(i, now).rows.length, 0);
  }
});
test("duplicate event/player/market/book rows retain only the freshest quote", () => {
  const i = fixture(); i.props.push({ ...i.props[0], propId: 2, fetchedAt: new Date(now - 1000).toISOString() }); const b = buildBettingBoard(i, now);
  assert.equal(b.rows.length, 1); assert.equal(b.rows[0].id, 2); assert.equal(b.coverage.excluded["Duplicate quote"], 1);
});
test("numeric sorting handles scores, absolute negative edges and unavailable values", () => {
  const r = first(), rows: BettingBoardRow[] = [{ ...r, id: 1, kofScore: 9, edge: 3 }, { ...r, id: 2, kofScore: 100, edge: -12 }, { ...r, id: 3, kofScore: null, edge: 1 }];
  assert.deepEqual(sortBoardRows(rows, "kofScore", "desc").map((x) => x.id), [2, 1, 3]);
  assert.deepEqual(sortBoardRows(rows, "kofScore", "asc").map((x) => x.id), [1, 2, 3]);
  assert.deepEqual(sortBoardRows(rows, "absoluteEdge", "desc").map((x) => x.id), [2, 1, 3]);
});
test("position, market, game, direction and case-insensitive search combine without mutation", () => {
  const r = first(), rows = [r, { ...r, id: 2, position: "RB", player: "Other" }];
  const filters = { position: "WR", market: "player_receptions", game: "99", direction: "under", search: " TEST " };
  assert.equal(filterBoardRows(rows, filters, now).length, 1); assert.equal(filterBoardRows(rows, { ...filters, market: "player_rush_yds" }, now).length, 0); assert.equal(rows.length, 2);
});
test("anonymous/free/expired access never invokes the protected read; authorized access does", async () => {
  let reads = 0; const read = async () => { reads++; return { private: true }; };
  for (let i = 0; i < 3; i++) assert.equal(await readAuthorizedBoard(async () => false, read), null);
  assert.equal(reads, 0); assert.deepEqual(await readAuthorizedBoard(async () => true, read), { private: true }); assert.equal(reads, 1);
});
test("analytics scrub identities/search/URLs and derive tier/registration exclusively from server facts", () => {
  const input = { market: "player_receptions", position: "WR", search: "person@example.com", player_name: "Private Name", access_tier: "admin", logged_in: true, source_page: "/pro?email=secret" };
  const clean = sanitizeBettingBoardMetadata(input, false, false); assert.equal(clean.access_tier, "anonymous"); assert.equal(clean.logged_in, false); assert.equal(clean.source_page, "/pro");
  assert.ok(!JSON.stringify(clean).includes("Private Name")); assert.ok(!JSON.stringify(clean).includes("secret"));
  const event = bettingBoardEventInput("betting_board_view", { metadata: input, eventId: "invalid" }, true, true); assert.equal(event.page, "/betting-board"); assert.equal(event.eventId, undefined); assert.equal(event.metadata.access_tier, "pro");
  assert.equal(new Set(BETTING_BOARD_EVENTS).size, BETTING_BOARD_EVENTS.length);
  assert.ok(BETTING_BOARD_EVENTS.includes("betting_board_saved_view"));
});

test('expired quote coverage retains source timestamp and explains missing refresh', () => {
  const input = fixture(); input.props[0].fetchedAt = new Date(now - 49 * 3600_000).toISOString();
  const board = buildBettingBoard(input, now);
  assert.equal(board.rows.length, 0); assert.equal(board.sourceLatestQuoteAt, input.props[0].fetchedAt);
  assert.equal(board.sourceFreshQuotes, 0); assert.ok(board.warnings.some((warning) => warning.includes('Fresh source data')));
});

test("48-hour board quote boundary accepts yesterday and expires older quotes", () => {
 for (const hours of [25, 47, 48]) { const input = fixture(); input.props[0].fetchedAt = new Date(now - hours * 3600_000).toISOString(); assert.equal(buildBettingBoard(input, now).rows.length, 1); }
 const input = fixture(); input.props[0].fetchedAt = new Date(now - 48 * 3600_000 - 1).toISOString(); assert.equal(buildBettingBoard(input, now).rows.length, 0);
});

test("current-game Out evidence removes an otherwise valid projection without fabricating an Under", () => {
  const input = fixture();
  input.props[0].injury = { state: "out", label: "Out", note: "Reported unavailable", suppressProjection: true,
    ratingWithheld: true, season: 2026, week: 9, fetchedAt: input.calculatedAt };
  const result = buildBettingBoard(input, now);
  assert.equal(result.rows.length, 0);
  assert.equal(result.coverage.excluded["Reported unavailable for target game"], 1);
  assert.equal(input.props[0].receptionsProjection?.projectedReceptions, 4.2);
});
