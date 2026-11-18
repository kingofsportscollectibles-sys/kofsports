// Server-side research scoring. Only the protected board source imports this at runtime.
// This version is an experimental evidence index, NOT a calibrated win probability.
import type { KofConfidence, KofConfidenceComponent } from "./kof-confidence-types";

export const KOF_CONFIDENCE_VERSION = "kof_directional_confidence_v1";
export const KOF_CONFIDENCE_WEIGHTS = { model: 0.60, history: 0.25, matchup: 0.10, h2h: 0.05 } as const;
export type ConfidenceHistoryGame = { gameId: number; value: number; season: number; opponent: string };
export type KofConfidenceInput = {
  projection: number; line: number; season: number; opponent: string;
  history: ConfidenceHistoryGame[]; // Caller supplies validated, newest-first completed preweek history.
  matchup: { rank: number | null; games: number | null; season: number };
};
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const round = (value: number) => Math.round(value * 10) / 10;

function sideEvidence(games: ConfidenceHistoryGame[], line: number, direction: "over" | "under", recency = false) {
  let wins = 0, settled = 0, count = 0;
  games.forEach((game, index) => {
    if (game.value === line) return;
    const weight = recency ? 0.9 ** index : 1;
    settled += weight; count++;
    if ((direction === "over" && game.value > line) || (direction === "under" && game.value < line)) wins += weight;
  });
  // Six neutral pseudo-games prevent tiny samples from masquerading as certainty.
  return { score: 100 * (wins + 3) / (settled + 6), settledCount: count };
}

export function calculateKofConfidence(input: KofConfidenceInput): KofConfidence {
  const edge = input.projection - input.line;
  const direction = edge > 0 ? "over" : edge < 0 ? "under" : "none";
  const counts = new Map<number, number>();
  input.history.forEach((game) => counts.set(game.gameId, (counts.get(game.gameId) ?? 0) + 1));
  const history = input.history.filter((game) => Number.isFinite(game.value) && game.season <= input.season && counts.get(game.gameId) === 1);
  const recent = history.slice(0, 10), season = history.filter((game) => game.season === input.season);
  const unavailable = (reason: string): KofConfidence => ({ version: KOF_CONFIDENCE_VERSION, score: null, direction, reason,
    historyGames: recent.length, currentSeasonGames: season.length, variabilityScale: null, sampleReliability: 0, components: null });
  if (!Number.isFinite(input.projection) || !Number.isFinite(input.line) || !Number.isFinite(edge)) return unavailable("Projection or line is unavailable.");
  if (direction === "none") return unavailable("The projection equals the line; there is no directional lean.");
  if (recent.length < 5 || !season.length) return unavailable("At least five eligible games and current-season history are required.");
  const recentEvidence = sideEvidence(recent, input.line, direction, true), seasonEvidence = sideEvidence(season, input.line, direction);
  if (recentEvidence.settledCount < 3) return unavailable("At least three non-push recent results are required.");
  const mean = recent.reduce((sum, game) => sum + game.value, 0) / recent.length;
  const variance = recent.reduce((sum, game) => sum + (game.value - mean) ** 2, 0) / (recent.length - 1);
  const scale = Math.max(Math.sqrt(variance), Math.abs(mean) * 0.10, 1);
  const modelSignal = 50 + 50 * Math.tanh(Math.abs(edge) / scale);
  const historySignal = 0.65 * recentEvidence.score + 0.35 * seasonEvidence.score;
  const headToHead = history.filter((game) => game.opponent === input.opponent).slice(0, 5);
  const h2hEvidence = sideEvidence(headToHead, input.line, direction);
  const matchupValid = input.matchup.season === input.season && input.matchup.rank !== null && Number.isInteger(input.matchup.rank) &&
    input.matchup.rank >= 1 && input.matchup.rank <= 32 && input.matchup.games !== null && Number.isFinite(input.matchup.games) && input.matchup.games > 0;
  const matchupSignal = matchupValid ? 50 + ((16.5 - input.matchup.rank!) / 15.5) * (direction === "over" ? 25 : -25) * Math.min(input.matchup.games! / 8, 1) : 50;
  const reliability = Math.min(1, recent.length / 10, season.length / 5);
  const component = (score: number, weight: number, observedGames: number | null, available: boolean, explanation: string): KofConfidenceComponent =>
    ({ score: round(clamp(score)), weight, observedGames, available, explanation });
  const weighted = modelSignal * KOF_CONFIDENCE_WEIGHTS.model + historySignal * KOF_CONFIDENCE_WEIGHTS.history +
    matchupSignal * KOF_CONFIDENCE_WEIGHTS.matchup + h2hEvidence.score * KOF_CONFIDENCE_WEIGHTS.h2h;
  return { version: KOF_CONFIDENCE_VERSION, score: round(clamp(50 + (weighted - 50) * reliability)), direction, reason: null,
    historyGames: recent.length, currentSeasonGames: season.length, variabilityScale: scale, sampleReliability: reliability,
    components: {
      model: component(modelSignal, KOF_CONFIDENCE_WEIGHTS.model, recent.length, true, "Model/line gap relative to the player's recent statistical variability; not a win probability."),
      history: component(historySignal, KOF_CONFIDENCE_WEIGHTS.history, recent.length, true, "Recency-weighted last ten and current-season results on this lean, shrunk toward neutral; pushes excluded."),
      matchup: component(matchupSignal, KOF_CONFIDENCE_WEIGHTS.matchup, matchupValid ? input.matchup.games : 0, matchupValid,
        matchupValid ? "Current-season position/market allowance rank, adjusted for defensive sample size." : "No reliable current-season matchup; neutral scoring prior, not a fabricated rank."),
      h2h: component(h2hEvidence.score, KOF_CONFIDENCE_WEIGHTS.h2h, headToHead.length, h2hEvidence.settledCount > 0,
        h2hEvidence.settledCount ? "Up to five eligible opponent meetings on this lean, shrunk toward neutral." : "No settled head-to-head sample; neutral scoring prior, not an observed 50% hit rate."),
    } };
}
