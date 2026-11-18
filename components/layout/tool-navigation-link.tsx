"use client";
import Link from "next/link";
import type { ToolNavigationItem } from "@/lib/navigation/tools";
import { BettingBoardEntryLink } from "@/components/nfl/BettingBoardEntryLink";
export function ToolNavigationLink({
  tool,
  compact = false,
  onNavigate,
}: {
  tool: ToolNavigationItem;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const className = compact
    ? "block min-h-11 py-2 text-sm font-bold text-zinc-400 transition hover:text-brand"
    : "block rounded-lg px-3 py-2.5 transition hover:bg-white/[0.06]";
  const content = (
    <>
      <span className={compact ? "" : "block text-sm font-bold text-white"}>
        {tool.name}
      </span>
      {(!compact || tool.href === "/betting-board") && (
        <span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">
          {tool.description}
        </span>
      )}
    </>
  );
  return tool.href === "/betting-board" ? (
    <BettingBoardEntryLink
      placement="tools_menu"
      onNavigate={onNavigate}
      className={className}
    >
      {content}
    </BettingBoardEntryLink>
  ) : (
    <Link href={tool.href} onClick={onNavigate} className={className}>
      {content}
    </Link>
  );
}
