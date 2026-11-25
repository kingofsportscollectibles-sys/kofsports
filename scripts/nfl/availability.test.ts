import test from "node:test";
import assert from "node:assert/strict";
import { applyBoardAvailability, parseAvailabilityReports, type AvailabilityReport } from "../../lib/nfl/availability";
import { toPublicBettingBoard } from "../../lib/nfl/betting-board-display";
import type { BettingBoardData } from "../../lib/nfl/betting-board";
const now = Date.parse("2026-11-23T17:00:00Z");
const report: AvailabilityReport = { playerId: "a", gameId: 10, team: "NE", status: "out", workload: "unknown", sourceUrl: "https://www.patriots.com/news/example", reportedAt: "2026-11-23T15:00:00Z", reviewedAt: "2026-11-23T16:00:00Z", expiresAt: "2026-11-23T19:00:00Z", affectedPlayerIds: [] };
function board(): BettingBoardData {
  const row = { id: 1, playerId: "a", player: "Example", team: "NE", gameId: 10, kickoff: "2026-11-23T20:00:00Z", market: "player_reception_yds", projection: 70, edge: 10, direction: "over", kofScore: 75,
    matchup: { rank: null }, l5: { games: 5, recent: [] }, calculatedAt: new Date(now).toISOString() };
  return { rows: [row], coverage: { sourceRows: 1, displayed: 1, excluded: {}, missingScores: 0, missingMatchups: 1, limitedHistory: 0 }, warnings: [], calculatedAt: new Date(now).toISOString(), logsUpdatedAt: null } as unknown as BettingBoardData;
}
test("verified out/inactive removes every market without creating an Under or mutating source", () => {
 for (const status of ["out", "inactive"] as const) {
  const b = board(); b.rows.push({ ...b.rows[0], id: 2, market: "player_receptions" });
  const result = applyBoardAvailability(b, [{ ...report, status }], now);
  assert.equal(result.rows.length, 0); assert.equal(result.coverage.excluded["Verified unavailable"], 2);
  assert.equal(b.rows.length, 2); assert.equal(b.rows[0].projection, 70);
 }
});
test("questionable, doubtful and limited roles withhold ratings without inventing projections", () => {
 for (const r of [{ ...report, status: "questionable" }, { ...report, status: "doubtful" }, { ...report, status: "active", workload: "limited" }] as AvailabilityReport[]) {
  const row = applyBoardAvailability(board(), [r], now).rows[0];
  assert.equal(row.kofScore, null); assert.equal(row.projection, 70); assert.equal(row.direction, "over");
  assert.equal(toPublicBettingBoard({ ...board(), rows: [row] }).rows[0].research?.scoreNote, row.availability?.note);
 }
});
test("stale, expired and future reports cannot confirm availability or remove a player", () => {
 for (const patch of [{ reviewedAt: "2026-11-23T09:00:00Z" }, { expiresAt: "2026-11-23T16:00:00Z" }, { reportedAt: "2026-11-23T18:00:00Z" }, { reviewedAt: "2026-11-23T18:00:00Z" }]) {
  const row = applyBoardAvailability(board(), [{ ...report, ...patch }], now).rows[0];
  assert.equal(row.availability?.status, "unverified"); assert.equal(row.kofScore, null);
 }
});
test("wrong game, team or player cannot affect another player", () => {
 for (const patch of [{ gameId: 11 }, { team: "BUF" }, { playerId: "b" }]) {
  const row = applyBoardAvailability(board(), [{ ...report, ...patch }], now).rows[0];
  assert.equal(row.kofScore, 75); assert.equal(row.availability?.status, "unverified");
 }
});
test("latest active update supersedes old out report but does not unlock passing evidence", () => {
 const b = board(); b.rows[0].market = "player_pass_yds";
 const r = applyBoardAvailability(b, [report, { ...report, status: "active", workload: "unrestricted", reportedAt: "2026-11-23T16:00:00Z" }], now);
 assert.equal(r.rows.length, 1); assert.equal(r.rows[0].availability?.status, "active");
 assert.equal(toPublicBettingBoard(r).rows[0].kofScore, null);
});
test("equal-time contradictory reports withhold rather than guessing", () => {
 const row = applyBoardAvailability(board(), [report, { ...report, status: "active" }], now).rows[0];
 assert.equal(row.availability?.status, "conflicting"); assert.equal(row.kofScore, null);
});
test("only explicitly reviewed teammate dependencies withhold; no volume redistribution", () => {
 const row = applyBoardAvailability(board(), [{ ...report, playerId: "b", affectedPlayerIds: ["a"] }], now).rows[0];
 assert.equal(row.kofScore, null); assert.equal(row.projection, 70); assert.match(row.availability!.note, /teammate/);
});
test("missing reports stay explicitly unverified and do not falsely certify health", () => {
 const row = applyBoardAvailability(board(), [], now).rows[0];
 assert.equal(row.availability?.status, "unverified"); assert.equal(row.availability?.sourceUrl, null);
});
test("parser rejects malformed sources, missing fields and reversed chronology", () => {
 assert.deepEqual(parseAvailabilityReports([report]), [report]);
 for (const value of [{}, [{ ...report, sourceUrl: "javascript:alert(1)" }], [{ ...report, reviewedAt: "2026-11-23T14:00:00Z" }], [{ ...report, affectedPlayerIds: null }], [{ ...report, gameId: "10" }]])
   assert.throws(() => parseAvailabilityReports(value));
});

test("latest unrestricted teammate update clears the old dependency warning", () => {
 const old = { ...report, playerId: "b", affectedPlayerIds: ["a"] };
 const active: AvailabilityReport = { ...old, status: "active", workload: "unrestricted", reportedAt: "2026-11-23T16:00:00Z" };
 assert.equal(applyBoardAvailability(board(), [old, active], now).rows[0].kofScore, 75);
});
