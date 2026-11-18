export const BOARD_PREFERENCES_VERSION = 1;
export const BOARD_POSITIONS = ["all", "QB", "RB", "WR", "TE"] as const;
export const BOARD_PREFERENCE_MARKETS = [
  "all",
  "player_pass_yds",
  "player_rush_yds",
  "player_reception_yds",
  "player_receptions",
] as const;
export const BOARD_SORTS = [
  "kofScore",
  "edge",
  "absoluteEdge",
  "projection",
  "line",
  "l5",
] as const;
export type BoardView = "all" | "saved";
export type BoardPreferences = {
  version: 1;
  position: (typeof BOARD_POSITIONS)[number];
  market: (typeof BOARD_PREFERENCE_MARKETS)[number];
  direction: "all" | "over" | "under" | "none";
  sort: (typeof BOARD_SORTS)[number];
  order: "asc" | "desc";
  view: BoardView;
};
export const DEFAULT_BOARD_PREFERENCES: BoardPreferences = {
  version: 1,
  position: "all",
  market: "all",
  direction: "all",
  sort: "kofScore",
  order: "desc",
  view: "all",
};
export function parseBoardView(value: unknown): BoardView | undefined {
  return value === "saved" || value === "all" ? value : undefined;
}
export function validateBoardPreferences(value: unknown): BoardPreferences {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (value as { version?: unknown }).version !== 1
  )
    return { ...DEFAULT_BOARD_PREFERENCES };
  const input = value as Record<string, unknown>;
  const pick = <T extends string>(
    key: string,
    values: readonly T[],
    fallback: T,
  ): T =>
    typeof input[key] === "string" && values.includes(input[key] as T)
      ? (input[key] as T)
      : fallback;
  return {
    version: 1,
    position: pick("position", BOARD_POSITIONS, "all"),
    market: pick("market", BOARD_PREFERENCE_MARKETS, "all"),
    direction: pick("direction", ["all", "over", "under", "none"], "all"),
    sort: pick("sort", BOARD_SORTS, "kofScore"),
    order: pick("order", ["asc", "desc"], "desc"),
    view: pick("view", ["all", "saved"], "all"),
  };
}
export function readBoardPreferences(raw: string): BoardPreferences {
  try {
    return validateBoardPreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_BOARD_PREFERENCES };
  }
}
export function boardPreferencesKey(userId: string) {
  return `kofsports_board_preferences_v1:${userId}`;
}
export function boardViewUrl(view: BoardView, query: string = "") {
  const params = new URLSearchParams(query);
  params.set("view", view);
  return `/betting-board?${params}`;
}
export function savedNflPlayerIds(keys: ReadonlySet<string>): Set<string> {
  return new Set(
    [...keys]
      .filter((key) => key.startsWith("nfl:"))
      .map((key) => key.slice(4)),
  );
}
export function filterMyBoardPlayers<T extends { playerId: string }>(
  rows: T[],
  view: BoardView,
  saved: ReadonlySet<string>,
): T[] {
  return view === "saved"
    ? rows.filter((row) => saved.has(row.playerId))
    : rows;
}
