import {
  BOARD_ENTRY_PLACEMENTS,
  cleanBoardEntrySource,
} from "@/lib/navigation/board-entry";
import { cleanAnalyticsUuid } from "./free-account-policy";
export const BETTING_BOARD_EVENTS = [
  "betting_board_view",
  "betting_board_navigation_click",
  "betting_board_filter",
  "betting_board_sort",
  "betting_board_player_click",
  "betting_board_upgrade_click",
  "betting_board_locked_preview_view",
  "betting_board_my_players_click",
  "betting_board_preference_change",
  "betting_board_saved_view",
  "betting_board_saved_upgrade_click",
] as const;
export type BettingBoardEvent = (typeof BETTING_BOARD_EVENTS)[number];
const markets = [
  "all",
  "player_pass_yds",
  "player_rush_yds",
  "player_reception_yds",
  "player_receptions",
];
const positions = ["all", "QB", "RB", "WR", "TE"];
export function sanitizeBettingBoardMetadata(
  metadata: Record<string, unknown> | undefined,
  registered: boolean,
  pro: boolean,
) {
  const pick = (key: string, values: readonly string[]) =>
    typeof metadata?.[key] === "string" &&
    values.includes(metadata[key] as string)
      ? metadata[key]
      : undefined;
  return {
    version: "betting_board_v1",
    sport: "nfl",
    logged_in: registered,
    access_tier: pro ? "pro" : registered ? "free" : "anonymous",
    market: pick("market", markets),
    position: pick("position", positions),
    filter: pick("filter", [
      "position",
      "market",
      "game",
      "direction",
      "search",
      "reset",
      "view",
    ]),
    selection: pick("selection", [
      ...markets,
      ...positions,
      "selected",
      "over",
      "under",
      "none",
      "active",
      "empty",
      "saved",
    ]),
    sort: pick("sort", [
      "kofScore",
      "edge",
      "absoluteEdge",
      "projection",
      "line",
      "l5",
    ]),
    sort_direction: pick("sort_direction", ["asc", "desc"]),
    view: pick("view", ["all", "saved"]),
    preference: pick("preference", [
      "position",
      "market",
      "direction",
      "sort",
      "order",
      "view",
      "reset",
    ]),
    direction: pick("direction", ["all", "over", "under", "none"]),
    placement: pick("placement", BOARD_ENTRY_PLACEMENTS),
    entry_placement: pick("entry_placement", BOARD_ENTRY_PLACEMENTS),
    funnel_id: cleanAnalyticsUuid(metadata?.funnel_id),
    source_page: cleanBoardEntrySource(metadata?.source_page),
  };
}
export function bettingBoardEventInput(
  eventType: BettingBoardEvent,
  body: {
    eventId?: unknown;
    sessionId?: unknown;
    anonymousId?: unknown;
    metadata?: Record<string, unknown>;
  },
  registered: boolean,
  pro: boolean,
) {
  return {
    eventType,
    eventId: cleanAnalyticsUuid(body.eventId),
    page: "/betting-board",
    sessionId: cleanAnalyticsUuid(body.sessionId),
    anonymousId: cleanAnalyticsUuid(body.anonymousId),
    metadata: sanitizeBettingBoardMetadata(body.metadata, registered, pro),
  };
}
