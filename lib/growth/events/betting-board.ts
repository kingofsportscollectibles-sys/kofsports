"use client";

import { getBoardEntry } from "./board-entry";
import { getAnonymousId, getGrowthSession } from "./session";
import { trackGrowthEvent } from "./trackEvent";
import type { BettingBoardEvent } from "./betting-board-policy";
import { cleanBoardEntrySource } from "@/lib/navigation/board-entry";

export function trackBettingBoardEvent(
  eventType: BettingBoardEvent,
  metadata: Record<string, unknown> = {},
) {
  try {
    const entry = getBoardEntry();
    let source =
      cleanBoardEntrySource(metadata.source_page) ?? entry?.sourcePage;
    try {
      source ??= document.referrer
        ? cleanBoardEntrySource(new URL(document.referrer).pathname)
        : undefined;
    } catch {
      /* Optional attribution. */
    }
    let anonymousId: string | undefined, sessionId: string | undefined;
    try {
      anonymousId = getAnonymousId() ?? undefined;
    } catch {
      /* Optional identifiers. */
    }
    try {
      sessionId = getGrowthSession() ?? undefined;
    } catch {
      /* Optional identifiers. */
    }
    void trackGrowthEvent({
      eventId: crypto.randomUUID(),
      eventType,
      page: "/betting-board",
      sessionId,
      anonymousId,
      metadata: {
        ...(entry
          ? { entry_placement: entry.placement, funnel_id: entry.funnelId }
          : {}),
        ...metadata,
        source_page: source,
      },
    });
  } catch {
    /* Analytics never blocks filtering, navigation or upgrades. */
  }
}
