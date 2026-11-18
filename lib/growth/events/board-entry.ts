"use client";
import {
  parseBoardEntry,
  cleanBoardEntrySource,
  type BoardEntry,
  type BoardEntryPlacement,
} from "@/lib/navigation/board-entry";
import { freeAccountContext } from "./free-account";
const KEY = "kof_board_entry_v1";
export function rememberBoardEntry(
  placement: BoardEntryPlacement,
  source: string,
): BoardEntry | null {
  try {
    const sourcePage = cleanBoardEntrySource(source);
    if (!sourcePage) return null;
    // Reuse the existing signup funnel ID. Preserve external acquisition source independently.
    const flow = freeAccountContext("/betting-board", true);
    const entry = {
      placement,
      sourcePage,
      funnelId: flow.funnelId,
      at: Date.now(),
    };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(entry));
    } catch {
      /* Click tracking still works without persistent context. */
    }
    return entry;
  } catch {
    return null;
  }
}
export function getBoardEntry(): BoardEntry | null {
  try {
    return parseBoardEntry(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}
