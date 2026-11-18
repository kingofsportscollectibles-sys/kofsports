"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { BoardEntryPlacement } from "@/lib/navigation/board-entry";
import { rememberBoardEntry } from "@/lib/growth/events/board-entry";
import { trackBettingBoardEvent } from "@/lib/growth/events/betting-board";
export function BettingBoardEntryLink({
  placement,
  view,
  children,
  className,
  onNavigate,
}: {
  placement: BoardEntryPlacement;
  view?: "all" | "saved";
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <Link
      href={view ? `/betting-board?view=${view}` : "/betting-board"}
      aria-current={pathname === "/betting-board" ? "page" : undefined}
      data-board-placement={placement}
      className={className}
      onClick={() => {
        const entry = rememberBoardEntry(
          placement,
          pathname || window.location.pathname,
        );
        trackBettingBoardEvent("betting_board_navigation_click", {
          placement,
          source_page: pathname || window.location.pathname,
          view,
          ...(entry ? { funnel_id: entry.funnelId } : {}),
        });
        onNavigate?.();
      }}
    >
      {children}
    </Link>
  );
}
