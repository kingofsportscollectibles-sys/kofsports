export type DvpRankBand = "best" | "favorable" | "neutral" | "difficult" | "worst" | "unavailable";

// Existing DvP table bands: #1 allows the most, #32 the least.
export function getDvpRankBand(rank: number | null): DvpRankBand {
  if (rank === null || !Number.isInteger(rank) || rank < 1 || rank > 32) return "unavailable";
  if (rank <= 5) return "best";
  if (rank <= 12) return "favorable";
  if (rank >= 28) return "worst";
  if (rank >= 21) return "difficult";
  return "neutral";
}

export function rankDvpAllowance<T>(rows: T[], getValue: (row: T) => number) {
  return [...rows].sort((a, b) => getValue(b) - getValue(a));
}

// Competition rank makes equal allowances share a rank.
export function getDvpAllowanceRank<T>(row: T, rows: T[], getValue: (row: T) => number) {
  return 1 + rows.filter((other) => getValue(other) > getValue(row)).length;
}
