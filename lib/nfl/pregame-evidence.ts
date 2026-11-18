// Evidence quality, not a prediction model. Import timestamps are not injury reports.
import { normalizeNflTeam } from "./betting-board";

export const PREGAME_EVIDENCE_VERSION = "nfl_passing_evidence_v1";
export type EvidenceGame = {
  id: number;
  external_game_id: string;
  season: number;
  week: number;
  game_type: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  updated_at: string;
};
export type EvidenceStat = {
  id: number;
  game_id: number;
  external_player_id: string;
  season: number;
  week: number;
  team: string;
  passing_attempts: number | null;
  updated_at: string;
};
export type EvidenceUsage = {
  external_game_id: string;
  external_player_id: string;
  season: number;
  week: number;
  game_type: string | null;
  team: string | null;
  offensive_snap_pct: number | null;
  updated_at: string;
};
export type EvidenceRoster = {
  gsis_id: string | null;
  team: string;
  season: number;
  roster_week: number | null;
  game_type: string | null;
  status: string | null;
  updated_at: string;
};
export type PregameParticipation = {
  gameId: number;
  week: number;
  date: string;
  attempts: number | null;
  recordedTeamAttempts: number | null;
  offensiveSnapPct: number | null;
  statsImportedAt: string | null;
  snapsImportedAt: string | null;
  majority: boolean | null;
};
export type NflPregameEvidence = {
  version: string;
  evaluatedAt: string;
  roleStatus: "supported" | "uncertain" | "unavailable";
  starterStatus: "unverified";
  injuryStatus: "unverified";
  leanEligible: boolean;
  reasons: string[];
  participation: PregameParticipation[];
  roster: {
    status: string | null;
    importedAt: string | null;
    week: number | null;
  };
};
export type PublicPregameEvidence = {
  checkedAt: string;
  roleLabel: string;
  starter: "Unverified";
  injury: "Unverified";
  ratingWithheld: boolean;
  ratingNote: string;
  rosterStatus: string | null;
  rosterNote: string;
  rosterImportedAt: string | null;
  recent: {
    week: number;
    date: string;
    attempts: number | null;
    recordedTeamAttempts: number | null;
    offensiveSnapPct: number | null;
    statsImportedAt: string | null;
    snapsImportedAt: string | null;
  }[];
};
export type PregameEvidenceInput = {
  playerId: string;
  team: string;
  target: EvidenceGame;
  asOf: number;
  games: EvidenceGame[];
  stats: EvidenceStat[];
  usage: EvidenceUsage[];
  rosters: EvidenceRoster[];
  sourceErrors?: string[];
};
const count = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 0;
const validTime = (value: string | null | undefined, asOf: number) =>
  !!value && Number.isFinite(Date.parse(value)) && Date.parse(value) <= asOf;
const sameTeam = (a: string | null, b: string) =>
  normalizeNflTeam(a ?? "") === normalizeNflTeam(b);
const duplicate = <T>(rows: T[], key: (row: T) => string | number) =>
  new Set(rows.map(key)).size !== rows.length;

export function assessPregameEvidence(
  input: PregameEvidenceInput,
): NflPregameEvidence {
  const { target, asOf } = input;
  const result: NflPregameEvidence = {
    version: PREGAME_EVIDENCE_VERSION,
    evaluatedAt: Number.isFinite(asOf) ? new Date(asOf).toISOString() : "",
    roleStatus: "unavailable",
    starterStatus: "unverified",
    injuryStatus: "unverified",
    // No timestamped pregame starter/injury source exists in the current schema.
    // Historical majority participation and ACT roster status cannot unlock this gate.
    leanEligible: false,
    reasons: [],
    participation: [],
    roster: { status: null, importedAt: null, week: null },
  };
  if (
    !Number.isFinite(asOf) ||
    !Number.isFinite(Date.parse(target.commence_time)) ||
    asOf >= Date.parse(target.commence_time) ||
    target.game_type !== "REG" ||
    target.home_score !== null ||
    target.away_score !== null ||
    ![target.home_team, target.away_team].some((t) => sameTeam(t, input.team))
  ) {
    result.reasons.push("invalid_pregame_target");
    return result;
  }
  result.reasons.push("starter_unverified", "injury_unverified");
  const roster = input.rosters.filter(
    (r) => r.gsis_id === input.playerId && r.season === target.season,
  );
  if (
    roster.length === 1 &&
    sameTeam(roster[0].team, input.team) &&
    roster[0].game_type === "REG" &&
    validTime(roster[0].updated_at, asOf) &&
    count(roster[0].roster_week) &&
    roster[0].roster_week <= target.week
  ) {
    result.roster = {
      status: roster[0].status,
      importedAt: roster[0].updated_at,
      week: roster[0].roster_week,
    };
    if (roster[0].status !== "ACT") result.reasons.push("roster_not_active");
    if (
      target.week - roster[0].roster_week > 1 ||
      asOf - Date.parse(roster[0].updated_at) > 7 * 86400000
    )
      result.reasons.push("roster_stale");
  } else result.reasons.push("roster_unavailable_or_ambiguous");
  if (input.sourceErrors?.length) result.reasons.push("source_unavailable");
  const targetMatches = input.games.filter(
    (g) => g.id === target.id || g.external_game_id === target.external_game_id,
  );
  if (
    targetMatches.length !== 1 ||
    targetMatches[0].season !== target.season ||
    targetMatches[0].week !== target.week ||
    !sameTeam(targetMatches[0].home_team, target.home_team) ||
    !sameTeam(targetMatches[0].away_team, target.away_team) ||
    Date.parse(targetMatches[0].commence_time) !==
      Date.parse(target.commence_time) ||
    !validTime(target.updated_at, asOf)
  ) {
    result.reasons.push("ambiguous_target_identity");
    return result;
  }
  const past = input.games
    .filter(
      (g) =>
        g.season === target.season &&
        g.week < target.week &&
        g.game_type === "REG" &&
        [g.home_team, g.away_team].some((t) => sameTeam(t, input.team)) &&
        Number.isFinite(Date.parse(g.commence_time)) &&
        Date.parse(g.commence_time) < asOf,
    )
    .sort((a, b) => Date.parse(b.commence_time) - Date.parse(a.commence_time));
  // Inspect the actual latest team games; never skip a bad row for an older good row.
  if (
    duplicate(past, (g) => g.id) ||
    duplicate(past, (g) => g.external_game_id)
  ) {
    result.reasons.push("ambiguous_schedule");
    return result;
  }
  for (const g of past.slice(0, 2)) {
    const rows = input.stats.filter(
      (s) => s.game_id === g.id && sameTeam(s.team, input.team),
    );
    const player = rows.filter((s) => s.external_player_id === input.playerId);
    const gameValid =
      count(g.home_score) &&
      count(g.away_score) &&
      validTime(g.updated_at, asOf);
    const statsValid =
      !input.sourceErrors?.includes("stats") &&
      gameValid &&
      rows.length > 0 &&
      !duplicate(rows, (s) => s.external_player_id) &&
      rows.every(
        (s) =>
          s.season === g.season &&
          s.week === g.week &&
          count(s.passing_attempts) &&
          validTime(s.updated_at, asOf),
      );
    const teamAttempts = statsValid
      ? rows.reduce((sum, s) => sum + s.passing_attempts!, 0)
      : null;
    const attempts =
      statsValid && player.length === 1 ? player[0].passing_attempts : null;
    const usage = input.usage.filter(
      (u) =>
        u.external_game_id === g.external_game_id &&
        u.external_player_id === input.playerId,
    );
    const snap =
      gameValid &&
      usage.length === 1 &&
      usage[0].season === g.season &&
      usage[0].week === g.week &&
      usage[0].game_type === "REG" &&
      sameTeam(usage[0].team, input.team) &&
      validTime(usage[0].updated_at, asOf) &&
      typeof usage[0].offensive_snap_pct === "number" &&
      Number.isFinite(usage[0].offensive_snap_pct) &&
      usage[0].offensive_snap_pct >= 0 &&
      usage[0].offensive_snap_pct <= 1
        ? usage[0]
        : null;
    result.participation.push({
      gameId: g.id,
      week: g.week,
      date: g.commence_time,
      attempts,
      recordedTeamAttempts: teamAttempts,
      offensiveSnapPct: snap?.offensive_snap_pct ?? null,
      statsImportedAt: attempts === null ? null : player[0].updated_at,
      snapsImportedAt: snap?.updated_at ?? null,
      majority:
        attempts !== null && teamAttempts !== null && teamAttempts >= 15
          ? attempts / teamAttempts >= 0.5
          : null,
    });
  }
  if (
    result.participation.length < 2 ||
    result.participation.some((p) => p.majority === null)
  )
    result.reasons.push("participation_unavailable_or_limited");
  else if (result.participation.some((p) => p.majority === false))
    result.roleStatus = "uncertain";
  else result.roleStatus = "supported";
  if (past[0] && asOf - Date.parse(past[0].commence_time) > 21 * 86400000) {
    result.roleStatus = "unavailable";
    result.reasons.push("participation_stale");
  }
  if (input.sourceErrors?.length) result.roleStatus = "unavailable";
  return result;
}

export function unavailablePregameEvidence(
  calculatedAt: string,
): NflPregameEvidence {
  return {
    version: PREGAME_EVIDENCE_VERSION,
    evaluatedAt: validTime(calculatedAt, Date.now()) ? calculatedAt : "",
    roleStatus: "unavailable",
    starterStatus: "unverified",
    injuryStatus: "unverified",
    leanEligible: false,
    reasons: ["evidence_not_loaded"],
    participation: [],
    roster: { status: null, importedAt: null, week: null },
  };
}

export function toPublicPregameEvidence(
  evidence: NflPregameEvidence,
): PublicPregameEvidence {
  return {
    checkedAt: evidence.evaluatedAt,
    roleLabel:
      evidence.roleStatus === "supported"
        ? "Recent passing role supported"
        : evidence.roleStatus === "uncertain"
          ? "Recent passing role uncertain"
          : "Recent passing role unavailable",
    starter: "Unverified",
    injury: "Unverified",
    ratingWithheld: !evidence.leanEligible,
    ratingNote:
      "Passing KOFScore is withheld while game-day starter and injury status are unverified. The projection and raw edge remain available for research.",
    rosterStatus: evidence.roster.status,
    rosterNote: evidence.reasons.includes("roster_stale")
      ? "Roster snapshot is outdated; current availability is unknown."
      : evidence.roster.importedAt
        ? "Roster status is not a starter or injury confirmation."
        : "A reliable current roster observation is unavailable.",
    rosterImportedAt: evidence.roster.importedAt,
    recent: evidence.participation.map((p) => ({
      week: p.week,
      date: p.date,
      attempts: p.attempts,
      recordedTeamAttempts: p.recordedTeamAttempts,
      offensiveSnapPct: p.offensiveSnapPct,
      statsImportedAt: p.statsImportedAt,
      snapsImportedAt: p.snapsImportedAt,
    })),
  };
}

export function isPassingRatingWithheld(row: {
  market: string;
  pregameEvidence?: NflPregameEvidence;
}): boolean {
  return row.market === "player_pass_yds" && !row.pregameEvidence?.leanEligible;
}
