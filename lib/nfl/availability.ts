// Reviewed, game-specific evidence. A roster import is not an injury report.
import { normalizeNflTeam, type BettingBoardData } from "./betting-board";

export type AvailabilityReport = {
  playerId: string;
  gameId: number;
  team: string;
  status: "out" | "inactive" | "questionable" | "doubtful" | "active";
  workload: "unrestricted" | "limited" | "unknown";
  sourceUrl: string;
  reportedAt: string;
  reviewedAt: string;
  expiresAt: string;
  // Explicitly reviewed dependencies, not inferred beneficiaries or a usage boost.
  affectedPlayerIds: string[];
};
export type BoardAvailability = {
  status: AvailabilityReport["status"] | "unverified" | "conflicting";
  ratingWithheld: boolean;
  note: string;
  reviewedAt: string | null;
  sourceUrl: string | null;
};
const HOUR = 3_600_000;
const status = new Set(["out", "inactive", "questionable", "doubtful", "active"]);
const workload = new Set(["unrestricted", "limited", "unknown"]);
export function parseAvailabilityReports(value: unknown): AvailabilityReport[] {
  if (!Array.isArray(value)) throw new Error("Availability reports must be an array.");
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Invalid availability report.");
    const r = item as AvailabilityReport;
    let url: URL;
    try { url = new URL(r.sourceUrl); } catch { throw new Error("Missing report source URL."); }
    if (!r.playerId || typeof r.playerId !== "string" || !Number.isSafeInteger(r.gameId) || r.gameId <= 0 ||
      typeof r.team !== "string" || !/^[A-Z]{2,3}$/.test(r.team) || !status.has(r.status) || !workload.has(r.workload) ||
      url.protocol !== "https:" || url.username || url.password ||
      ![r.reportedAt, r.reviewedAt, r.expiresAt].every(t => typeof t === "string" && Number.isFinite(Date.parse(t))) ||
      !Array.isArray(r.affectedPlayerIds) || !r.affectedPlayerIds.every(id => typeof id === "string" && id.length > 0))
      throw new Error("Invalid availability report fields.");
    if (Date.parse(r.reportedAt) > Date.parse(r.reviewedAt) || Date.parse(r.reviewedAt) >= Date.parse(r.expiresAt))
      throw new Error("Invalid availability report chronology.");
    return r;
  });
}

// Expired reports cannot turn a player into an Under, or silently certify health.
// Six-hour review freshness is an operational check, not a medical prediction.
export function applyBoardAvailability(board: BettingBoardData, reports: AvailabilityReport[], now: number): BettingBoardData {
  const excluded = { ...board.coverage.excluded };
  const rows = board.rows.flatMap(row => {
    const relevant = reports.filter(r => r.gameId === row.gameId && normalizeNflTeam(r.team) === normalizeNflTeam(row.team));
    const direct = relevant.filter(r => r.playerId === row.playerId);
    const fresh = (r: AvailabilityReport) => Date.parse(r.reportedAt) <= now && Date.parse(r.reviewedAt) <= now &&
      now - Date.parse(r.reviewedAt) <= 6 * HOUR && Date.parse(r.expiresAt) > now && now < Date.parse(row.kickoff) &&
      Date.parse(r.reviewedAt) < Date.parse(row.kickoff);
    const latest = direct.filter(fresh).sort((a,b) => Date.parse(b.reportedAt) - Date.parse(a.reportedAt) || Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt));
    const report = latest[0];
    // Contradictory reports at the same report time require explicit resolution.
    const conflict = !!report && latest.some(r => Date.parse(r.reportedAt) === Date.parse(report.reportedAt) && (r.status !== report.status || r.workload !== report.workload));
    if (report && !conflict && (report.status === "out" || report.status === "inactive")) {
      excluded["Verified unavailable"] = (excluded["Verified unavailable"] ?? 0) + 1;
      return [];
    }
    const dependencies = relevant.filter(r => r.playerId !== row.playerId && r.affectedPlayerIds.includes(row.playerId));
    const dependencyRisk = [...new Set(dependencies.map(r => r.playerId))].some(id => {
      const history = dependencies.filter(r => r.playerId === id && fresh(r))
        .sort((a,b) => Date.parse(b.reportedAt) - Date.parse(a.reportedAt) || Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt));
      const latest = history[0];
      return !latest || latest.status !== "active" || latest.workload !== "unrestricted" ||
        history.some(r => Date.parse(r.reportedAt) === Date.parse(latest.reportedAt) && (r.status !== latest.status || r.workload !== latest.workload));
    });
    const ownRisk = conflict || (report ? report.status !== "active" || report.workload !== "unrestricted" : direct.length > 0);
    const ratingWithheld = ownRisk || dependencyRisk;
    const note = conflict ? "Conflicting availability reports. KOFScore withheld pending review." :
      !report && direct.length ? "Availability report needs a fresh review. KOFScore withheld." :
      ownRisk ? "Availability or workload is unresolved. The projection assumes a normal role; KOFScore withheld." :
      dependencyRisk ? "A teammate availability change may affect this role. The projection has not been adjusted; KOFScore withheld pending role review." :
      report ? "Reviewed active with no reported workload restriction. This does not confirm the starting role." :
      "Game-day availability has not been verified. Roster status does not confirm health.";
    const availability: BoardAvailability = { status: conflict ? "conflicting" : report?.status ?? "unverified", ratingWithheld, note,
      reviewedAt: report?.reviewedAt ?? null, sourceUrl: report?.sourceUrl ?? null };
    return [{ ...row, availability, kofScore: ratingWithheld ? null : row.kofScore }];
  });
  return { ...board, rows, coverage: { ...board.coverage, excluded, displayed: rows.length,
    missingScores: rows.filter(r => r.kofScore === null).length,
    missingMatchups: rows.filter(r => r.matchup.rank === null).length,
    limitedHistory: rows.filter(r => r.l5.games < 5).length } };
}
