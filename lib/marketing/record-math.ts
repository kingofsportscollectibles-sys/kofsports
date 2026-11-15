export type PublicDecision = { id: string; sport: string; status: string };
export function aggregatePublicDecisions(rows: PublicDecision[]) {
  const seen = new Set<string>();
  const sports = new Map<
    string,
    { sport: string; wins: number; losses: number }
  >();
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    const status = row.status?.trim().toLowerCase();
    if (!["won", "lost"].includes(status)) continue;
    const raw = row.sport?.trim().toUpperCase() || "OTHER";
    const sport =
      ({ NCAAF: "CFB", NCAAB: "CBB" } as Record<string, string>)[raw] ?? raw;
    const current = sports.get(sport) ?? { sport, wins: 0, losses: 0 };
    if (status === "won") current.wins++;
    else current.losses++;
    sports.set(sport, current);
  }
  return [...sports.values()];
}

export type PublicPickExample = {
  id: string;
  sport: string;
  selection: string;
  odds: number;
  units: number;
  status: "won" | "lost";
  profit_loss: number;
  game_time: string;
  best_sportsbook: string | null;
  analysis: string | null;
};
export function sanitizePublicPickExample(
  value: unknown,
  now: number,
): PublicPickExample | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Record<string, unknown>;
  const finite = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);
  if (
    r.is_published !== true ||
    r.is_premium !== true ||
    typeof r.id !== "string" ||
    typeof r.selection !== "string" ||
    !r.selection.trim() ||
    (r.status !== "won" && r.status !== "lost") ||
    typeof r.game_time !== "string" ||
    !Number.isFinite(Date.parse(r.game_time)) ||
    Date.parse(r.game_time) >= now ||
    !finite(r.odds) ||
    Math.abs(r.odds) < 100 ||
    !finite(r.units) ||
    r.units <= 0 ||
    !finite(r.profit_loss)
  )
    return null;
  return {
    id: r.id,
    sport: typeof r.sport === "string" ? r.sport : "Sports",
    selection: r.selection,
    odds: r.odds,
    units: r.units,
    status: r.status,
    profit_loss: r.profit_loss,
    game_time: r.game_time,
    analysis:
      typeof r.analysis === "string" && r.analysis.trim() ? r.analysis : null,
    best_sportsbook:
      typeof r.best_sportsbook === "string" ? r.best_sportsbook : null,
  };
}
