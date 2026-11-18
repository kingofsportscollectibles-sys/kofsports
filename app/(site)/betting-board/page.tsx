import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  BoardAuthPrompt,
  BoardAuthLink,
} from "@/components/nfl/BoardAccountLinks";
import NflBettingBoard, {
  BettingBoardRefreshButton,
} from "@/components/nfl/NflBettingBoard";
import {
  BettingBoardTelemetry,
  BettingBoardUpgradeLink,
} from "@/components/nfl/BettingBoardTelemetry";
import {
  getBettingBoardAccess,
  getBettingBoardData,
  getFreeBettingBoardData,
} from "@/lib/nfl/betting-board-data";
import { BOARD_MARKETS } from "@/lib/nfl/betting-board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "NFL Betting Board | KofSports Pro",
  description:
    "Compare NFL player prop projections, proprietary KOFScore ratings, recent results and matchup data in the KofSports Pro Betting Board.",
  alternates: { canonical: "/betting-board" },
};

function LockedBoard() {
  return (
    <section
      aria-label="KofSports Pro Betting Board preview"
      className="space-y-8"
    >
      <BoardAuthPrompt />
      <div className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-slate-900 to-slate-950">
        <div className="grid gap-10 p-6 sm:p-9 lg:grid-cols-[1.1fr_1fr] lg:p-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Your next layer of NFL research
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              The projection.
              <br />
              The line.
              <br />
              <span className="text-emerald-400">The research behind it.</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400">
              Create a free account to explore available props for three daily
              sample players, including projections, KOFScore and research
              details. Pro unlocks the full board.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <BoardAuthLink
                mode="signup"
                className="inline-flex min-h-12 items-center rounded-xl bg-emerald-400 px-6 py-3 text-sm font-black text-slate-950 hover:bg-emerald-300"
              >
                Create a free account
              </BoardAuthLink>
              <BettingBoardUpgradeLink />
            </div>
            <p className="mt-4 text-xs leading-6 text-slate-500">
              Active Premium Picks members and existing eligible Pro members
              already have access.{" "}
              <BoardAuthLink
                mode="login"
                className="font-semibold text-slate-300 underline decoration-slate-600 underline-offset-4"
              >
                Sign in
              </BoardAuthLink>{" "}
              to use your membership.
            </p>
          </div>
          <div className="self-center rounded-2xl border border-slate-700/80 bg-slate-950 p-5 shadow-2xl shadow-black/30 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Board layout preview
              </span>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                PRO
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <span>Prop market</span>
              <span>Projection / line</span>
              <span>KOFScore</span>
            </div>
            {Object.values(BOARD_MARKETS).map((market) => (
              <div
                key={market.label}
                className="grid grid-cols-3 items-center gap-2 border-b border-slate-800/70 py-5 text-xs last:border-0"
              >
                <span className="font-semibold text-slate-300">
                  {market.label}
                </span>
                <span className="text-slate-600">Pro research</span>
                <span className="text-slate-600">Where available</span>
              </div>
            ))}
            <p className="mt-4 text-[11px] leading-5 text-slate-600">
              Layout only. No current player rows or proprietary values are
              loaded for this preview.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          [
            "01",
            "Compare projection and line",
            "Raw edge is the projected stat minus the displayed sportsbook line, in yards or receptions. Positive means the projection is above the line; negative means below.",
          ],
          [
            "02",
            "Check the research",
            "L5 compares completed game logs with the displayed line. Current-season Defense vs Position adds context; missing data stays unavailable.",
          ],
          [
            "03",
            "Follow the player",
            "Filter by market, position and game, then open the existing NFL player profile to examine the stats and role behind the projection.",
          ],
        ].map(([step, title, copy]) => (
          <article
            key={step}
            className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6"
          >
            <span className="font-mono text-sm text-emerald-500/70">
              {step}
            </span>
            <h3 className="mt-4 font-bold text-white">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{copy}</p>
          </article>
        ))}
      </div>
      <p className="text-center text-sm text-slate-500">
        Start with free research:{" "}
        <Link
          href="/nfl-player-prop-trends"
          className="font-semibold text-emerald-400 hover:text-emerald-300"
        >
          NFL Player Prop Trends →
        </Link>
      </p>
    </section>
  );
}

async function AuthorizedBoard({ pro }: { pro: boolean }) {
  const result = await (pro ? getBettingBoardData() : getFreeBettingBoardData())
    .then((board) => ({ board, failed: false }))
    .catch((error: unknown) => {
      console.error(
        "NFL Betting Board unavailable:",
        error instanceof Error ? error.message : "Unknown source error",
      );
      return { board: null, failed: true };
    });
  if (result.failed)
    return (
      <div
        role="status"
        className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center"
      >
        <h2 className="text-xl font-bold text-white">
          NFL research is temporarily unavailable
        </h2>
        <p className="mx-auto mb-5 mt-3 max-w-xl text-sm leading-6 text-slate-400">
          We couldn&apos;t verify the latest board data. Refresh to try again.
        </p>
        <BettingBoardRefreshButton />
      </div>
    );
  if (!result.board) return <LockedBoard />;
  return (
    <div className="space-y-6">
      {!pro && (
        <section
          aria-label="Free account Betting Board sample"
          className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-5 sm:p-6"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Free account sample
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">
            Three players. Real KOFScore research.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Explore available props for up to three randomly selected players.
            The same sample is shared by free members and rotates daily at
            midnight Eastern. Started games and stale lines are removed.
          </p>
          <div className="mt-4">
            <BettingBoardUpgradeLink />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Pro unlocks every eligible player on the full board.
          </p>
        </section>
      )}
      <NflBettingBoard board={result.board} pro={pro} />
    </div>
  );
}

export default async function BettingBoardPage() {
  const pro = await getBettingBoardAccess();
  return (
    <main className="min-h-screen bg-slate-950">
      <BettingBoardTelemetry pro={pro} />
      <header className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-emerald-950/25 via-slate-950 to-slate-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-40 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl"
        />
        <div
          className={`relative mx-auto max-w-7xl px-5 ${pro ? "py-7" : "py-12"} sm:px-6 sm:py-16`}
        >
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.2em]">
            <span className="text-emerald-400">KofSports NFL</span>
            <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] tracking-wider text-slate-400">
              {pro ? "PRO RESEARCH" : "FREE SAMPLE + PRO"}
            </span>
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            NFL Betting Board
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-400">
            Find the props worth a closer look. Compare KOFScore, model
            projections, recent player results and defensive matchups—all on one board.
          </p>
          <div
            className={`${pro ? "hidden sm:flex" : "flex"} mt-6 flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500`}
          >
            <span>Passing yards</span>
            <span>Rushing yards</span>
            <span>Receiving yards</span>
            <span>Receptions</span>
          </div>
          <details className="mt-5 max-w-3xl text-xs leading-6 text-slate-400">
            <summary className="cursor-pointer py-2 font-semibold text-slate-300">How to read KOFScore and projections</summary>
            KOFScore combines model, usage, recent performance and matchup signals
            into a proprietary research rating out of 100. It is not a win probability.
            Edge vs Line is the projection minus the displayed sportsbook line.
            Check each quote’s timestamp and the price at your sportsbook.
          </details>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
        {pro ? (
          <Suspense
            fallback={
              <div
                role="status"
                className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-sm text-slate-400"
              >
                Loading verified NFL research…
              </div>
            }
          >
            <AuthorizedBoard pro={pro} />
          </Suspense>
        ) : (
          <Suspense
            fallback={
              <div
                role="status"
                className="p-8 text-center text-sm text-slate-400"
              >
                Loading your free sample…
              </div>
            }
          >
            <AuthorizedBoard pro={false} />
          </Suspense>
        )}
      </div>
    </main>
  );
}
