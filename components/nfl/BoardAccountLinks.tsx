"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  boardViewUrl,
  parseBoardView,
  type BoardView,
} from "@/lib/nfl/board-preferences";
import { trackBettingBoardEvent } from "@/lib/growth/events/betting-board";
export function BoardViewTabs({
  view,
  onChange,
  disabled = false,
}: {
  view: BoardView;
  onChange: (view: BoardView) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label="Choose player view" className="flex gap-2">
      {(["all", "saved"] as const).map((value) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50 ${view === value ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-slate-700 text-slate-300 hover:border-emerald-400"}`}
        >
          {value === "all" ? "All Players" : "My Players"}
        </button>
      ))}
    </div>
  );
}
export function BoardAuthPrompt() {
  const params = useSearchParams();
  const view = parseBoardView(params.get("view")) ?? "all";
  const destination = boardViewUrl("saved");
  function change(value: BoardView) {
    if (value === "saved")
      trackBettingBoardEvent("betting_board_my_players_click", {
        view: "saved",
      });
    window.history.replaceState(
      null,
      "",
      boardViewUrl(value, params.toString()),
    );
  }
  return (
    <section className="mb-6 rounded-2xl border border-slate-800 p-5">
      <BoardViewTabs view={view} onChange={change} />
      {view === "saved" && (
        <div className="mt-4">
          <h2 className="text-xl font-bold text-white">
            Your players, together.
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Create a free account or sign in to save NFL players and personalize
            your research.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href={`/signup?redirect=${encodeURIComponent(destination)}`}
              className="inline-flex min-h-11 items-center font-semibold text-emerald-300"
            >
              Create a free account →
            </Link>
            <Link
              href={`/login?redirect=${encodeURIComponent(destination)}`}
              className="inline-flex min-h-11 items-center font-semibold text-slate-300"
            >
              Sign in →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export function BoardAuthLink({
  mode,
  className,
  children,
}: {
  mode: "signup" | "login";
  className?: string;
  children: import("react").ReactNode;
}) {
  const params = useSearchParams();
  const view = parseBoardView(params.get("view"));
  const destination = view ? boardViewUrl(view) : "/betting-board";
  return (
    <Link
      href={`/${mode}?redirect=${encodeURIComponent(destination)}`}
      className={className}
    >
      {children}
    </Link>
  );
}
