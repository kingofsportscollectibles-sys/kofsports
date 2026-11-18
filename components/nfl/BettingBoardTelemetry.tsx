"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { trackBettingBoardEvent } from "@/lib/growth/events/betting-board";

export function BettingBoardTelemetry({ pro }: { pro: boolean }) {
  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    trackBettingBoardEvent("betting_board_view");
    if (!pro) trackBettingBoardEvent("betting_board_locked_preview_view");
  }, [pro]);
  return null;
}

export function BettingBoardUpgradeLink({
  personalized = false,
  view,
}: { personalized?: boolean; view?: "all" | "saved" } = {}) {
  return (
    <Link
      href={`/pro?utm_source=${personalized ? "betting_board_saved" : "betting_board"}`}
      onClick={() => {
        try {
          sessionStorage.setItem(
            "kof_acquisition_source_v1",
            personalized ? "betting_board_saved" : "betting_board",
          );
        } catch {
          /* Optional attribution. */
        }
        trackBettingBoardEvent(
          personalized
            ? "betting_board_saved_upgrade_click"
            : "betting_board_upgrade_click",
          {
            view:
              view ??
              (new URLSearchParams(window.location.search).get("view") ===
              "saved"
                ? "saved"
                : "all"),
          },
        );
      }}
      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
    >
      Unlock KofSports Pro{" "}
      <span aria-hidden="true" className="ml-3">
        →
      </span>
    </Link>
  );
}
