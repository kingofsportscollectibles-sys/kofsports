import type { Metadata } from "next";
import Link from "next/link";

import NflSnapCountsExplorer from "@/components/nfl/NflSnapCountsExplorer";
import { getNflSnapCounts } from "@/lib/nfl/snap-counts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NFL Snap Counts 2026: Weekly Snap % by Team",
  description:
    "View NFL snap counts, player snap percentages, recent usage trends, and season averages for quarterbacks, running backs, wide receivers, and tight ends.",
  alternates: {
    canonical: "/nfl-snap-counts",
  },
};

export default async function NflSnapCountsPage() {
  const players = await getNflSnapCounts(2026);

  const latestWeek = players.reduce(
    (maxWeek, player) => Math.max(maxWeek, player.latestWeek),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            NFL Research Tools
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            NFL Snap Counts 2026: Weekly Snap Counts &amp; Snap % by Team
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Track weekly NFL snap counts, snap percentages, and player usage
            for every team. Compare offensive snap share by player and position
            to identify changing roles, playing-time trends, and usage for
            fantasy football and NFL player prop research.
          </p>

          {latestWeek > 0 && (
            <p className="mt-4 text-sm font-semibold text-emerald-400">
              Updated through NFL Week {latestWeek}
            </p>
          )}

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
            NFL Snap Counts by Team
          </h2>

          <div className="mt-6 space-y-5 text-slate-300">
            <p>
              Use the NFL snap count table above to compare weekly playing time
              across all 32 teams. Search by team or player and filter by
              position to see the latest offensive snaps, snap percentage,
              recent averages, season usage, and week-over-week change.
            </p>

            <p>
              Team snap counts are especially useful when depth charts change.
              Injuries, emerging players, committee adjustments, and changes in
              personnel packages can all create meaningful shifts in playing
              time from one week to the next.
            </p>
          </div>

          <h2 className="mt-12 text-3xl font-bold">
            How to Use NFL Snap Counts
          </h2>

          <div className="mt-6 space-y-5 text-slate-300">
            <p>
              NFL snap counts show how many offensive plays a player was on the
              field for during a game. Snap percentage measures that playing
              time as a share of the team&apos;s total offensive snaps.
            </p>

            <p>
              Snap percentage is often more useful when comparing games because
              NFL teams do not run the same number of offensive plays every
              week. A player can record fewer total snaps in a low-volume game
              while still maintaining the same role within the offense.
            </p>

            <p>
              Compare a player&apos;s latest snap percentage with their
              last-three-game, last-five-game, and season averages to identify
              meaningful changes in usage rather than reacting to a single box
              score.
            </p>
          </div>

          <h2 className="mt-12 text-3xl font-bold">
            Why Snap Share Matters for NFL Player Props
          </h2>

          <div className="mt-6 space-y-5 text-slate-300">
            <p>
              Playing time creates opportunity. Changes in snap share can
              precede changes in routes, targets, carries, receptions, yards,
              and touchdown opportunities, making snap counts a useful starting
              point for NFL player prop research.
            </p>

            <p>
              Snap counts are most useful when combined with other usage and
              matchup data. After identifying a changing role, compare
              red-zone opportunities, defensive matchups, recent production,
              and available prop lines before making a betting decision.
            </p>

            <p>
              KofSports&apos;{" "}
              <Link
                href="/nfl-player-prop-trends"
                className="font-semibold text-emerald-400 transition hover:text-emerald-300"
              >
                NFL Player Prop Trends
              </Link>{" "}
              tool can be used alongside snap data to compare recent player
              performance against current prop lines.
            </p>
          </div>

          <h2 className="mt-12 text-3xl font-bold">
            NFL Snap Count Trends and Player Usage
          </h2>

          <div className="mt-6 space-y-5 text-slate-300">
            <p>
              Week-over-week snap changes can help identify rising rookies,
              injury replacements, wide receivers moving into larger roles,
              tight end rotation changes, and running backs gaining or losing
              work within a committee.
            </p>

            <p>
              The Change column above compares each player&apos;s latest snap
              percentage with their previous game. Use it with the L3, L5, and
              season columns to determine whether a usage shift looks like a
              one-week outlier or part of a developing trend.
            </p>
          </div>

          <h2 className="mt-12 text-3xl font-bold">
            Continue Your NFL Research
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Link
              href="/nfl-red-zone-targets"
              className="rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-500/50"
            >
              <h3 className="font-semibold text-white">Red Zone Targets</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Compare scoring-area opportunities after identifying changes
                in playing time.
              </p>
            </Link>

            <Link
              href="/nfl-defense-vs-position"
              className="rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-500/50"
            >
              <h3 className="font-semibold text-white">
                Defense vs Position
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Research how opposing defenses perform against each offensive
                position.
              </p>
            </Link>

            <Link
              href="/nfl-player-prop-trends"
              className="rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:border-emerald-500/50"
            >
              <h3 className="font-semibold text-white">
                Player Prop Trends
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Compare recent player results with current NFL prop lines.
              </p>
            </Link>
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

          <h2 className="mt-12 text-3xl font-bold">
            NFL Snap Counts FAQ
          </h2>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white">
                What are NFL snap counts?
              </h3>
              <p className="mt-2 leading-7 text-slate-300">
                NFL snap counts measure how many offensive plays a player was
                on the field for during a game. They help quantify actual
                playing time beyond traditional box-score statistics.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">
                Where can I find NFL snap counts by team?
              </h3>
              <p className="mt-2 leading-7 text-slate-300">
                The KofSports NFL Snap Counts tool includes players from all 32
                NFL teams. Use the search field above to enter a team
                abbreviation or player name and narrow the table.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">
                What is NFL snap percentage?
              </h3>
              <p className="mt-2 leading-7 text-slate-300">
                Snap percentage is the share of a team&apos;s offensive plays
                that a player participated in. It makes playing time easier to
                compare across games with different numbers of offensive plays.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">
                When are NFL snap counts updated?
              </h3>
              <p className="mt-2 leading-7 text-slate-300">
                KofSports updates the snap count database as new weekly game
                data is processed. The current week available in the database
                is displayed at the top of this page.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">
                How can snap counts help with NFL player props?
              </h3>
              <p className="mt-2 leading-7 text-slate-300">
                Snap counts can reveal changes in playing time that affect a
                player&apos;s opportunity for carries, routes, targets,
                receptions, yards, and touchdowns. They are best used together
                with matchup, usage, and prop-line research.
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
