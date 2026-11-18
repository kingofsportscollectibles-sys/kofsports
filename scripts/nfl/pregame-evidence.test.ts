import test from "node:test";
import assert from "node:assert/strict";
import {
  assessPregameEvidence,
  toPublicPregameEvidence,
  type PregameEvidenceInput,
} from "../../lib/nfl/pregame-evidence";
import { loadPassingEvidenceSources } from "../../lib/nfl/pregame-evidence-source";
import { toPublicBettingBoard } from "../../lib/nfl/betting-board-display";
import type { SupabaseClient } from "@supabase/supabase-js";

function fixture(): PregameEvidenceInput {
  const past = Array.from({ length: 3 }, (_, i) => ({
    id: i + 1,
    external_game_id: `g${i + 1}`,
    season: 2026,
    week: 9 - i,
    game_type: "REG",
    commence_time: `2026-11-${String(8 - i * 2).padStart(2, "0")}T18:00:00Z`,
    home_team: "BUF",
    away_team: "KC",
    home_score: 20,
    away_score: 21,
    updated_at: "2026-11-09T12:00:00Z",
  }));
  const target = {
    ...past[0],
    id: 99,
    external_game_id: "target",
    week: 10,
    commence_time: "2026-11-15T18:00:00Z",
    home_score: null,
    away_score: null,
  };
  return {
    playerId: "qb",
    team: "BUF",
    target,
    asOf: Date.parse("2026-11-11T16:00:00Z"),
    games: [target, ...past],
    stats: past.flatMap((g) => [
      ...[
        { id: g.id * 10, external_player_id: "qb", passing_attempts: 30 },
        {
          id: g.id * 10 + 1,
          external_player_id: "backup",
          passing_attempts: 2,
        },
      ].map((s) => ({
        ...s,
        game_id: g.id,
        season: 2026,
        week: g.week,
        team: "BUF",
        updated_at: g.updated_at,
      })),
    ]),
    usage: past.map((g) => ({
      external_game_id: g.external_game_id,
      external_player_id: "qb",
      season: 2026,
      week: g.week,
      game_type: "REG",
      team: "BUF",
      offensive_snap_pct: 0.9,
      updated_at: g.updated_at,
    })),
    rosters: [
      {
        gsis_id: "qb",
        team: "BUF",
        season: 2026,
        roster_week: 10,
        game_type: "REG",
        status: "ACT",
        updated_at: "2026-11-10T12:00:00Z",
      },
    ],
  };
}
test("stable observed role is never a verified starter/injury report or scoring permission", () => {
  const r = assessPregameEvidence(fixture());
  assert.equal(r.roleStatus, "supported");
  assert.equal(r.leanEligible, false);
  assert.equal(r.starterStatus, "unverified");
  assert.equal(r.injuryStatus, "unverified");
  assert.equal(r.participation[0].attempts, 30);
  assert.equal(r.participation[0].recordedTeamAttempts, 32);
});
test("known zeros are retained and missing appearances never turn into zeros", () => {
  const x = fixture();
  x.stats[0].passing_attempts = 0;
  x.stats[1].passing_attempts = 32;
  const zero = assessPregameEvidence(x);
  assert.equal(zero.participation[0].attempts, 0);
  assert.equal(zero.roleStatus, "uncertain");
  x.stats.shift();
  const missing = assessPregameEvidence(x);
  assert.equal(missing.participation[0].attempts, null);
  assert.equal(missing.roleStatus, "unavailable");
});
test("latest invalid provenance blocks evidence rather than silently selecting older game", () => {
  for (const change of [
    (x: PregameEvidenceInput) => {
      x.stats[0].updated_at = "2026-11-12T12:00:00Z";
    },
    (x: PregameEvidenceInput) => {
      x.games[1].updated_at = "2026-11-12T12:00:00Z";
    },
    (x: PregameEvidenceInput) => {
      x.stats[0].week = 1;
    },
    (x: PregameEvidenceInput) => {
      x.stats[0].passing_attempts = null;
    },
  ]) {
    const x = fixture();
    change(x);
    const r = assessPregameEvidence(x);
    assert.equal(r.roleStatus, "unavailable");
    assert.equal(r.participation[0].gameId, 1);
  }
});
test("duplicate schedule or player/game rows are not evidence", () => {
  const x = fixture();
  x.games.push({ ...x.games[1] });
  assert.equal(assessPregameEvidence(x).roleStatus, "unavailable");
  const y = fixture();
  y.stats.push({ ...y.stats[0], id: 999 });
  assert.equal(assessPregameEvidence(y).roleStatus, "unavailable");
});
test("team transitions cannot borrow participation from the old team", () => {
  const x = fixture();
  x.stats[0].team = "KC";
  assert.equal(assessPregameEvidence(x).participation[0].attempts, null);
  x.rosters[0].team = "KC";
  assert.equal(assessPregameEvidence(x).roster.status, null);
});
test("unknown snaps remain null, true zero is retained, percentage-scale values rejected", () => {
  const x = fixture();
  x.usage[0].offensive_snap_pct = 0;
  assert.equal(assessPregameEvidence(x).participation[0].offensiveSnapPct, 0);
  x.usage[0].offensive_snap_pct = 90;
  assert.equal(
    assessPregameEvidence(x).participation[0].offensiveSnapPct,
    null,
  );
  x.usage[0].offensive_snap_pct = 0.9;
  x.usage[0].team = "KC";
  assert.equal(
    assessPregameEvidence(x).participation[0].offensiveSnapPct,
    null,
  );
});
test("low recorded team totals cannot certify majority role", () => {
  const x = fixture();
  x.stats[0].passing_attempts = 3;
  x.stats[1].passing_attempts = 0;
  assert.equal(assessPregameEvidence(x).roleStatus, "unavailable");
});
test("target outcomes, postseason, unknown scores and future rows cannot enter history", () => {
  const x = fixture();
  x.stats.push({
    ...x.stats[0],
    id: 999,
    game_id: 99,
    week: 10,
    passing_attempts: 99,
  });
  const r = assessPregameEvidence(x);
  assert.equal(r.participation.length, 2);
  assert.equal(r.participation[0].attempts, 30);
  x.target.home_score = 1;
  assert.equal(assessPregameEvidence(x).roleStatus, "unavailable");
  const y = fixture();
  y.games[1].game_type = "POST";
  assert.equal(assessPregameEvidence(y).participation[0].gameId, 2);
  const z = fixture();
  z.asOf = Date.parse(z.target.commence_time);
  assert.equal(assessPregameEvidence(z).roleStatus, "unavailable");
});
test("roster import timestamps are exposed honestly and not treated as medical status", () => {
  const x = fixture();
  x.rosters[0].updated_at = "2026-11-12T00:00:00Z";
  const r = assessPregameEvidence(x);
  assert.equal(r.roster.importedAt, null);
  assert.equal(r.injuryStatus, "unverified");
  x.rosters.push({ ...x.rosters[0] });
  assert.equal(assessPregameEvidence(x).roster.status, null);
});
test("source failures fail closed and public DTO excludes proprietary diagnostics", () => {
  const x = fixture();
  x.sourceErrors = ["PRIVATE_QUERY"];
  const evidence = assessPregameEvidence(x);
  assert.equal(evidence.roleStatus, "unavailable");
  assert.equal(evidence.leanEligible, false);
  const json = JSON.stringify(
    toPublicPregameEvidence({
      ...evidence,
      secret: "PRIVATE_SECRET",
    } as typeof evidence),
  );
  for (const token of [
    "PRIVATE_",
    "reasons",
    "leanEligible",
    "version",
    "gameId",
  ])
    assert.ok(!json.includes(token), token);
});
test("batched loader uses three reads for multiple players and does not fetch for an empty cohort", async () => {
  const names: string[] = [];
  const client = {
    from(name: string) {
      names.push(name);
      const q = {
        select() {
          return q;
        },
        in() {
          return q;
        },
        gt() {
          return q;
        },
        order() {
          return q;
        },
        range() {
          return Promise.resolve({ data: [], error: null });
        },
      };
      return q;
    },
  } as unknown as SupabaseClient;
  await loadPassingEvidenceSources(client, {
    playerIds: ["qb", "other"],
    teams: ["BUF", "KC"],
    seasons: [2026],
  });
  assert.equal(names.length, 3);
  await loadPassingEvidenceSources(client, {
    playerIds: [],
    teams: [],
    seasons: [],
  });
  assert.equal(names.length, 3);
});
test("failed evidence queries return unavailable flags and no partial page", async () => {
  const client = {
    from() {
      const q = {
        select() {
          return q;
        },
        in() {
          return q;
        },
        gt() {
          return q;
        },
        order() {
          return q;
        },
        range() {
          return Promise.resolve({ data: null, error: { code: "FAIL" } });
        },
      };
      return q;
    },
  } as unknown as SupabaseClient;
  const r = await loadPassingEvidenceSources(client, {
    playerIds: ["qb"],
    teams: ["BUF"],
    seasons: [2026],
  });
  assert.equal(r.errors.length, 3);
  assert.deepEqual(r.stats, []);
});

test("public boundary withholds passing ratings even for a cached row missing evidence, retaining raw research", () => {
  const row = {
    id: 1,
    playerId: "qb",
    player: "QB",
    team: "BUF",
    position: "QB",
    gameId: 99,
    season: 2026,
    week: 10,
    market: "player_pass_yds",
    line: 220.5,
    projection: 250,
    edge: 29.5,
    direction: "over",
    modelVersion: "PRIVATE_MODEL",
    kofScore: 80,
    rosterStatus: "ACT",
    calculatedAt: "2026-11-11T16:00:00Z",
    l5: {
      games: 0,
      overs: 0,
      unders: 0,
      pushes: 0,
      settled: 0,
      overRate: null,
      recent: [],
    },
    matchup: {
      label: "Unavailable",
      rank: null,
      allowed: null,
      games: null,
      season: 2026,
    },
  };
  const board = {
    rows: [row],
    calculatedAt: row.calculatedAt,
    logsUpdatedAt: null,
    warnings: [],
    coverage: {
      sourceRows: 1,
      displayed: 1,
      excluded: {},
      missingScores: 0,
      missingMatchups: 1,
      limitedHistory: 1,
    },
  };
  const typed = board as unknown as Parameters<typeof toPublicBettingBoard>[0];
  const publicRow = toPublicBettingBoard(typed).rows[0];
  assert.equal(publicRow.kofScore, null);
  assert.equal(publicRow.projection, 250);
  assert.equal(publicRow.edge, 29.5);
  assert.equal(row.kofScore, 80);
  assert.equal(publicRow.pregame!.starter, "Unverified");
  assert.ok(publicRow.research!.scoreNote!.includes("withheld"));
  assert.equal(toPublicBettingBoard(typed).coverage.missingScores, 1);
  typed.rows[0].pregameEvidence = assessPregameEvidence(fixture());
  assert.equal(toPublicBettingBoard(typed).rows[0].kofScore, null);
  typed.rows[0].market = "player_reception_yds";
  const receiving = toPublicBettingBoard(typed).rows[0];
  assert.equal(receiving.kofScore, 80);
  assert.equal(receiving.pregame, undefined);
  assert.ok(!JSON.stringify(receiving).includes("PRIVATE_"));
});

test("post-cutoff, duplicate or mismatched target identity is unavailable", () => {
  const x = fixture();
  x.games.push({ ...x.target });
  assert.equal(assessPregameEvidence(x).roleStatus, "unavailable");
  const y = fixture();
  y.target = { ...y.target, week: 11 };
  assert.equal(assessPregameEvidence(y).roleStatus, "unavailable");
});

test("a missing final score in the latest prior team game cannot silently backfill older participation", () => {
  const x = fixture();
  x.games[1].home_score = null;
  const r = assessPregameEvidence(x);
  assert.equal(r.roleStatus, "unavailable");
  assert.equal(r.participation[0].gameId, 1);
  assert.equal(r.participation[0].attempts, null);
  assert.equal(r.participation[0].offensiveSnapPct, null);
});

test("outdated roster status is explicitly flagged rather than presented as current availability", () => {
  const x = fixture();
  x.rosters[0].roster_week = 7;
  x.rosters[0].updated_at = "2026-10-24T12:00:00Z";
  const publicEvidence = toPublicPregameEvidence(assessPregameEvidence(x));
  assert.ok(publicEvidence.rosterNote.includes("outdated"));
  assert.equal(publicEvidence.ratingWithheld, true);
});
