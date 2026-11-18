export type KofConfidenceComponent = { score: number; weight: number; observedGames: number | null; available: boolean; explanation: string };
export type KofConfidence = {
  version: string; score: number | null; direction: "over" | "under" | "none";
  reason: string | null; historyGames: number; currentSeasonGames: number;
  variabilityScale: number | null; sampleReliability: number;
  components: { model: KofConfidenceComponent; history: KofConfidenceComponent; matchup: KofConfidenceComponent; h2h: KofConfidenceComponent } | null;
};
