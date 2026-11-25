export type NflInjuryContext = {
  state: "out" | "uncertain" | "practice_full" | "not_listed" | "unavailable";
  label: string; note: string; suppressProjection: boolean; ratingWithheld: boolean;
  season: number; week: number; sourceUrl: string;
  fetchedAt: string | null; sourceUpdatedAt: string | null;
};

// Browser-facing contract intentionally excludes provider identity and source URLs.
export type PublicNflInjuryContext = Omit<NflInjuryContext, "sourceUrl" | "sourceUpdatedAt">;
export function publicInjuryContext(injury: PublicNflInjuryContext): PublicNflInjuryContext {
  return { state: injury.state, label: injury.label, note: injury.note,
    suppressProjection: injury.suppressProjection, ratingWithheld: injury.ratingWithheld,
    season: injury.season, week: injury.week, fetchedAt: injury.fetchedAt };
}
export function showInjuryCallout(injury: PublicNflInjuryContext): boolean {
  return injury.state === "out" || injury.state === "uncertain";
}
