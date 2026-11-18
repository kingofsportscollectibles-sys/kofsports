import test from "node:test";
import assert from "node:assert/strict";
import {
  previewDay,
  selectPreviewPlayers,
  trimFreePreview,
} from "../../lib/nfl/betting-board-preview";
import { readAuthorizedBoard } from "../../lib/nfl/betting-board-access";
import type {
  BettingBoardData,
  BoardPublicData,
  BettingBoardRow,
} from "../../lib/nfl/betting-board";
const now = Date.parse("2026-11-06T16:00:00Z");
function fixture(): BettingBoardData {
  const rows = Array.from(
    { length: 20 },
    (_, i) =>
      ({
        id: i + 1,
        playerId: `p${Math.floor(i / 2)}`,
        player: `Player ${Math.floor(i / 2)}`,
        team: "KC",
        position: "WR",
        profileHref: "/nfl/players/test-player",
        gameId: 99,
        game: "BUF at KC",
        opponent: "BUF",
        season: 2026,
        week: 9,
        line: 4.5,
        projection: 5,
        edge: 0.5,
        direction: "over",
        bookmaker: "draftkings",
        overPrice: -110,
        underPrice: -110,
        rosterStatus: "ACT",
        kofBaselineSeasons: [2025],
        kickoff: "2026-11-08T18:00:00Z",
        lineUpdatedAt: new Date(now - 3600_000).toISOString(),
        calculatedAt: new Date(now).toISOString(),
        kofScore: 70,
        modelVersion: "PRIVATE_MODEL",
        confidence: {
          version: "PRIVATE_VERSION",
          score: 70,
          direction: "over",
          reason: null,
          historyGames: 8,
          currentSeasonGames: 8,
          variabilityScale: 77,
          sampleReliability: 0.8,
          components: null,
        },
        matchup: {
          label: "Favorable",
          rank: 1,
          allowed: 5,
          games: 8,
          season: 2026,
        },
        l5: {
          games: 5,
          overs: 4,
          unders: 1,
          pushes: 0,
          settled: 5,
          overRate: 80,
          recent: [],
        },
        market: i % 2 ? "player_receptions" : "player_reception_yds",
      }) as BettingBoardRow,
  );
  return {
    rows,
    calculatedAt: new Date(now).toISOString(),
    logsUpdatedAt: null,
    warnings: ["full board warning"],
    coverage: {
      sourceRows: 999,
      displayed: 20,
      excluded: { privateFullBoardCount: 900 },
      missingScores: 88,
      missingMatchups: 77,
      limitedHistory: 66,
    },
  };
}
test("sample selects three unique players rather than three prop rows", () => {
  const b = fixture(),
    ids = selectPreviewPlayers(b, "2026-11-06", now),
    sample = trimFreePreview(b, ids, now);
  assert.equal(ids.length, 3);
  assert.equal(new Set(sample.rows.map((r) => r.playerId)).size, 3);
  assert.equal(sample.rows.length, 6);
});
test("daily draw is independent of input ordering, score and repeated loads", () => {
  const b = fixture(),
    ids = selectPreviewPlayers(b, "2026-11-06", now);
  b.rows.reverse();
  b.rows.forEach((r) => (r.kofScore = 1));
  assert.deepEqual(selectPreviewPlayers(b, "2026-11-06", now), ids);
});
test("day rotates in Eastern time including DST boundaries", () => {
  assert.equal(previewDay(Date.parse("2026-11-06T04:59:00Z")), "2026-11-05");
  assert.equal(previewDay(Date.parse("2026-11-06T05:00:00Z")), "2026-11-06");
  assert.equal(previewDay(Date.parse("2026-07-06T04:00:00Z")), "2026-07-06");
});
test("draw changes across days on a large fixed population", () => {
  const b = fixture();
  assert.notDeepEqual(
    selectPreviewPlayers(b, "2026-11-06", now),
    selectPreviewPlayers(b, "2026-11-07", now),
  );
});
test("DTO contains selected rows and only sample coverage, without mutating source", () => {
  const b = fixture(),
    json = JSON.stringify(b),
    sample = trimFreePreview(b, ["p0", "p1", "p2"], now);
  assert.ok(sample.rows.every((r) => ["p0", "p1", "p2"].includes(r.playerId)));
  assert.equal(sample.coverage.sourceRows, 6);
  assert.deepEqual(sample.coverage.excluded, {});
  assert.deepEqual(sample.warnings, []);
  assert.equal(JSON.stringify(b), json);
  assert.ok(!JSON.stringify(sample).includes("privateFullBoardCount"));
});
test("server cap holds even for an oversized selection", () => {
  const sample = trimFreePreview(
    fixture(),
    Array.from({ length: 10 }, (_, i) => `p${i}`),
    now,
  );
  assert.equal(new Set(sample.rows.map((r) => r.playerId)).size, 3);
});
test("expired/started selected players are removed without replacements", () => {
  const b = fixture();
  b.rows
    .filter((r) => r.playerId === "p0")
    .forEach((r) => (r.kickoff = new Date(now - 1).toISOString()));
  b.rows
    .filter((r) => r.playerId === "p1")
    .forEach(
      (r) => (r.lineUpdatedAt = new Date(now - 49 * 3600_000).toISOString()),
    );
  const sample = trimFreePreview(b, ["p0", "p1", "p2"], now);
  assert.deepEqual([...new Set(sample.rows.map((r) => r.playerId))], ["p2"]);
});
test("insufficient or no fresh data never invents sample rows", () => {
  const b = fixture();
  b.rows = b.rows.slice(0, 2);
  assert.equal(selectPreviewPlayers(b, "day", now).length, 1);
  const empty = trimFreePreview(b, ["missing"], now);
  assert.equal(empty.rows.length, 0);
  assert.ok(empty.warnings.length);
});
test("registration gate is evaluated before preview data/cache is read", async () => {
  let reads = 0;
  assert.equal(
    await readAuthorizedBoard(
      async () => false,
      async () => {
        reads++;
        return fixture();
      },
    ),
    null,
  );
  assert.equal(reads, 0);
  const sample = await readAuthorizedBoard(
    async () => true,
    async () => {
      reads++;
      return trimFreePreview(fixture(), ["p0", "p1", "p2"], now);
    },
  );
  assert.equal(reads, 1);
  assert.equal(sample!.rows.length, 6);
});

test("actual DAL rechecks free registration before cached preview and keeps full reads Pro-only", async () => {
  const fs = await import("node:fs"),
    vm = await import("node:vm"),
    ts = await import("typescript");
  let registered = true,
    pro = false,
    reads = 0,
    adminClients = 0;
  const mocks: Record<string, unknown> = {
    "server-only": {},
    react: { cache: (fn: unknown) => fn },
    "next/cache": {
      unstable_cache: (fn: (...args: unknown[]) => Promise<unknown>) => {
        const saved = new Map<string, unknown>();
        return async (...args: unknown[]) => {
          const key = JSON.stringify(args);
          if (!saved.has(key)) saved.set(key, await fn(...args));
          return saved.get(key);
        };
      },
    },
    "@/lib/auth/entitlements": { hasKofSportsProAccess: async () => pro },
    "@/lib/supabase/admin": {
      createAdminClient: () => {
        adminClients++;
        return {};
      },
    },
    "@/lib/supabase/server": {
      createClient: async () => ({
        auth: {
          getUser: async () => ({
            data: { user: registered ? { id: "verified" } : null },
            error: null,
          }),
        },
      }),
    },
    "@/lib/nfl/betting-board-access": { readAuthorizedBoard },
    "@/lib/nfl/betting-board-display":
      await import("../../lib/nfl/betting-board-display"),
    "@/lib/nfl/betting-board-source": {
      loadNflBettingBoardSource: async () => {
        reads++;
        return fixture();
      },
    },
    "@/lib/nfl/betting-board-preview": {
      previewDay: () => "2026-11-06",
      selectPreviewPlayers: (b: BettingBoardData, d: string) =>
        selectPreviewPlayers(b, d, now),
      trimFreePreview: (b: BettingBoardData, ids: string[]) =>
        trimFreePreview(b, ids, now),
    },
  };
  const exports: Record<string, () => Promise<BoardPublicData | null>> = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync("lib/nfl/betting-board-data.ts", "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      },
    ).outputText,
    { exports, require: (name: string) => mocks[name] },
  );
  assert.equal(await exports.getBettingBoardData(), null);
  assert.equal(reads, 0);
  const free = await exports.getFreeBettingBoardData();
  assert.equal(new Set(free!.rows.map((r) => r.playerId)).size, 3);
  assert.equal(reads, 1);
  registered = false;
  assert.equal(await exports.getFreeBettingBoardData(), null);
  assert.equal(reads, 1);
  assert.equal(adminClients, 1);
  registered = true;
  await exports.getFreeBettingBoardData();
  assert.equal(reads, 1, "reuse only the shared preview source/selection");
  pro = true;
  const full = await exports.getBettingBoardData();
  assert.equal(full!.rows.length, 20);
  assert.equal(reads, 2);
  for (const payload of [free, full]) {
    assert.ok(!JSON.stringify(payload).includes("modelVersion"));
    assert.ok(!JSON.stringify(payload).includes("components"));
  }
});
