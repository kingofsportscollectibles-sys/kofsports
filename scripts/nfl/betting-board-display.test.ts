import test from "node:test";
import assert from "node:assert/strict";
import { toPublicBettingBoard } from "../../lib/nfl/betting-board-display";
import type {
  BettingBoardData,
  BettingBoardRow,
} from "../../lib/nfl/betting-board";
import { calculateKofConfidence } from "../../lib/nfl/kof-confidence";
function fixture(): BettingBoardData {
  const confidence = calculateKofConfidence({
    projection: 80,
    line: 65,
    season: 2026,
    opponent: "BUF",
    history: Array.from({ length: 8 }, (_, i) => ({
      gameId: i,
      value: 70 + i * 5,
      season: 2026,
      opponent: "BUF",
    })),
    matchup: { rank: 5, games: 8, season: 2026 },
  });
  const row = {
    id: 1,
    playerId: "player",
    player: "Test Player",
    team: "KC",
    position: "WR",
    profileHref: "/nfl/players/test-player",
    gameId: 99,
    game: "KC at BUF",
    opponent: "BUF",
    season: 2026,
    week: 9,
    kickoff: "2026-11-08T18:00:00Z",
    market: "player_reception_yds",
    line: 65,
    projection: 80,
    edge: 15,
    direction: "over",
    modelVersion: "PRIVATE_MODEL_ID",
    bookmaker: "draftkings",
    overPrice: -110,
    underPrice: -110,
    lineUpdatedAt: "2026-11-06T16:00:00Z",
    calculatedAt: "2026-11-06T16:01:00Z",
    confidence,
    legacyKofOverScore: 88,
    kofScore: confidence.score,
    kofBaselineSeasons: [2025],
    rosterStatus: "ACT",
    l5: {
      games: 5,
      overs: 4,
      unders: 1,
      pushes: 0,
      settled: 5,
      overRate: 80,
      recent: [
        {
          gameId: 1,
          season: 2026,
          date: "2026-11-01",
          opponent: "BUF",
          value: 90,
          result: "over",
          futureDiagnostic: "PRIVATE_LOG",
        },
      ],
    },
    matchup: {
      label: "Favorable",
      rank: 5,
      allowed: 85,
      games: 8,
      season: 2026,
      futureDiagnostic: "PRIVATE_MATCHUP",
    },
    futureDiagnostic: "PRIVATE_ROW",
  } as unknown as BettingBoardRow;
  return {
    rows: [row],
    calculatedAt: row.calculatedAt,
    logsUpdatedAt: row.lineUpdatedAt,
    warnings: ["PRIVATE_WARNING.ts"],
    coverage: {
      sourceRows: 1,
      displayed: 1,
      missingScores: 0,
      missingMatchups: 0,
      limitedHistory: 0,
      excluded: { "PRIVATE_EXCLUSION.ts": 10 },
    },
    futureDiagnostic: "PRIVATE_BOARD",
  } as BettingBoardData;
}
test("browser DTO excludes proprietary fields and future diagnostics at every nesting level", () => {
  const b = fixture(),
    before = JSON.stringify(b),
    out = toPublicBettingBoard(b),
    json = JSON.stringify(out);
  for (const token of [
    "PRIVATE_",
    "modelVersion",
    "confidence",
    "legacyKofOverScore",
    "kofBaselineSeasons",
    "components",
    "weight",
    "sampleReliability",
    "variabilityScale",
    "kof_directional_confidence_v1",
    "futureDiagnostic",
  ])
    assert.ok(!json.includes(token), `leaked ${token}`);
  assert.equal(JSON.stringify(b), before);
  assert.deepEqual(out.coverage.excluded, {});
});
test("stats, projection, KOFScore, prices, sample counts and freshness survive", () => {
  const b = fixture(),
    r = toPublicBettingBoard(b).rows[0];
  assert.equal(r.kofScore, b.rows[0].kofScore);
  assert.equal(r.projection, 80);
  assert.equal(r.edge, 15);
  assert.equal(r.line, 65);
  assert.equal(r.overPrice, -110);
  assert.equal(r.lineUpdatedAt, b.rows[0].lineUpdatedAt);
  assert.equal(r.l5.recent[0].value, 90);
  assert.equal(r.matchup.allowed, 85);
  assert.equal(r.research!.recentGames, 8);
  assert.equal(r.research!.h2hGames, 5);
});
test("unavailable scores explain evidence without disclosing internal thresholds", () => {
  const b = fixture();
  b.rows[0].kofScore = null;
  b.rows[0].confidence!.reason = "PRIVATE_THRESHOLD";
  b.rows[0].matchup.reason = "PRIVATE_REASON";
  const r = toPublicBettingBoard(b).rows[0];
  assert.ok(r.research!.scoreNote?.includes("not enough reliable evidence"));
  assert.equal(
    r.matchup.reason,
    "Reliable current-season matchup data is unavailable.",
  );
  assert.ok(!JSON.stringify(r).includes("PRIVATE_"));
});
test("empty/no-lean boards preserve truthful unavailability", () => {
  const b = fixture();
  b.rows[0].direction = "none";
  b.rows[0].kofScore = null;
  assert.equal(
    toPublicBettingBoard(b).rows[0].research!.scoreNote,
    "There is no directional lean for this prop.",
  );
  b.rows = [];
  assert.deepEqual(toPublicBettingBoard(b).rows, []);
});

test("injury-conditional browser rows withhold scores and expose only allowed injury context", () => {
  const board = fixture();
  board.rows[0].injury = { state: "uncertain", label: "Questionable", note: "Normal-role projection; rating withheld.",
    suppressProjection: false, ratingWithheld: true, season: 2026, week: 9,
    sourceUrl: "https://github.com/nflverse/nflverse-data", fetchedAt: board.calculatedAt, sourceUpdatedAt: board.calculatedAt,
    futureDiagnostic: "PRIVATE_INJURY" } as unknown as NonNullable<BettingBoardRow["injury"]>;
  const result = toPublicBettingBoard(board);
  assert.equal(result.rows[0].kofScore, null);
  assert.equal(result.rows[0].projection, 80);
  assert.equal(result.rows[0].research?.scoreNote, "Normal-role projection; rating withheld.");
  assert.ok(!JSON.stringify(result).includes("PRIVATE_INJURY"));
});
