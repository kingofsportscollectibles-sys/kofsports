import type { Metadata } from "next";

import NflSnapCountsExplorer from "@/components/nfl/NflSnapCountsExplorer";
import { getNflSnapCounts } from "@/lib/nfl/snap-counts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NFL Snap Counts & Player Snap Percentages | KofSports",
  description:
    "View NFL snap counts, player snap percentages, recent usage trends, and season averages for quarterbacks, running backs, wide receivers, and tight ends.",
  alternates: {
    canonical: "/nfl-snap-counts",
  },
};

export default async function NflSnapCountsPage() {
  const players = await getNflSnapCounts(2025);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            NFL Research Tools
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            NFL Snap Counts & Player Snap Percentages
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Track NFL snap counts for quarterbacks, running backs, wide
            receivers, and tight ends. Compare each player&apos;s latest snap
            percentage with their recent and season-long usage to identify
            changing roles before they show up in the box score.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-400">
            <span>Latest Snap %</span>
            <span>•</span>
            <span>Last 3 Games</span>
            <span>•</span>
            <span>Last 5 Games</span>
            <span>•</span>
            <span>Season Usage</span>
            <span>•</span>
            <span>Week-over-Week Change</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <NflSnapCountsExplorer players={players} />
      </section>

      <section className="border-t border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-3xl font-bold">
            How to Use NFL Snap Counts
          </h2>

          <div className="mt-6 space-y-5 text-slate-300">
            <p>
              NFL snap counts show how often a player is actually on the field.
              A rising snap percentage can signal a larger offensive role before
              that increased opportunity is fully reflected in carries, targets,
              touchdowns, or betting markets.
            </p>

            <p>
              The most useful way to evaluate NFL player snap counts is to
              compare current usage with recent averages. KofSports shows each
              player&apos;s latest offensive snap percentage alongside their
              last-three-game, last-five-game, and season averages.
            </p>

            <p>
              Snap counts can be especially useful for identifying running back
              committee changes, emerging wide receivers, tight ends earning
              larger roles, quarterback changes, and players returning from
              injuries.
            </p>
          </div>

          <h2 className="mt-12 text-3xl font-bold">
            Why Snap Percentage Matters for NFL Betting
          </h2>

          <div className="mt-6 space-y-5 text-slate-300">
            <p>
              Opportunity is one of the most important inputs when researching
              NFL player props. A player cannot accumulate rushing yards,
              receiving yards, targets, or touchdowns without being on the
              field.
            </p>

            <p>
              Changes in snap share can help reveal shifts in workload that may
              not yet be fully reflected in sportsbook player prop lines. Snap
              counts should not be used alone, but they become more valuable
              when combined with carries, targets, red-zone usage, matchup data,
              and current betting lines.
            </p>
          </div>

          <h2 className="mt-12 text-3xl font-bold">
            NFL Snap Count Definitions
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-semibold text-white">Snaps</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The number of offensive plays in which the player was on the
                field during their most recent game.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-semibold text-white">Snap %</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The percentage of the team&apos;s offensive snaps played by the
                player in their most recent game.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-semibold text-white">L3 / L5</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The player&apos;s average offensive snap percentage across
                their last three or five games played.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-semibold text-white">Change</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The difference between the player&apos;s latest snap percentage
                and their previous game&apos;s snap percentage.
              </p>
            </div>
          </div>

          <p className="mt-10 text-sm leading-6 text-slate-500">
            Snap-count data is provided for research and informational purposes.
            Historical usage does not guarantee future playing time or betting
            outcomes.
          </p>
        </div>
      </section>
    </main>
  );
}
