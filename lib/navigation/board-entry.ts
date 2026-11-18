import {
  cleanAnalyticsPage,
  cleanAnalyticsUuid,
} from "@/lib/growth/events/free-account-policy";
export const BOARD_ENTRY_PLACEMENTS = [
  "desktop_header",
  "mobile_menu",
  "tools_menu",
  "homepage_hero",
  "homepage_feature",
  "homepage_tools",
  "nfl_research",
  "account",
  "account_saved",
] as const;
export type BoardEntryPlacement = (typeof BOARD_ENTRY_PLACEMENTS)[number];
export const BOARD_ENTRY_LABELS: Record<BoardEntryPlacement, string> = {
  desktop_header: "Desktop header",
  mobile_menu: "Mobile menu",
  tools_menu: "NFL Tools menu",
  homepage_hero: "Homepage hero button",
  homepage_feature: "Homepage feature card",
  homepage_tools: "Homepage research card",
  nfl_research: "NFL research pages",
  account: "My KofSports",
  account_saved: "Saved-player watchlist",
};
export const BOARD_ENTRY_TTL_MS = 30 * 60_000;
export type BoardEntry = {
  placement: BoardEntryPlacement;
  sourcePage: string;
  funnelId: string;
  at: number;
};
// Board discovery supports every existing NFL research route without changing the
// separate registration/save-context allowlist or requiring a database migration.
export function cleanBoardEntrySource(value: unknown): string | undefined {
  const shared = cleanAnalyticsPage(value);
  if (shared) return shared;
  if (typeof value !== "string") return undefined;
  const path = value.split(/[?#]/)[0];
  return /^\/nfl-(?:player-prop-records|betting-power-rankings|anytime-touchdown-rankings|snap-counts|red-zone-targets|prop-research)$/.test(
    path,
  )
    ? path
    : undefined;
}
export function parseBoardEntry(
  raw: string | null,
  now = Date.now(),
): BoardEntry | null {
  try {
    const value = JSON.parse(raw ?? "null");
    if (
      !value ||
      !BOARD_ENTRY_PLACEMENTS.includes(value.placement) ||
      !Number.isFinite(value.at) ||
      value.at > now ||
      now - value.at > BOARD_ENTRY_TTL_MS
    )
      return null;
    const sourcePage = cleanBoardEntrySource(value.sourcePage),
      funnelId = cleanAnalyticsUuid(value.funnelId);
    return sourcePage && funnelId
      ? { placement: value.placement, sourcePage, funnelId, at: value.at }
      : null;
  } catch {
    return null;
  }
}
