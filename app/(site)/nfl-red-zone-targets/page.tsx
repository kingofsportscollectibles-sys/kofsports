import type { Metadata } from "next";
import Link from "next/link";

import NflRedZoneTargetsExplorer from "@/components/nfl/NflRedZoneTargetsExplorer";
import { getNflRedZoneTargets } from "@/lib/nfl/red-zone-targets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NFL Red Zone Targets & Carries 2026: RZ Usage Stats",
  description:
    "2026 NFL red zone targets and carries by player. Compare weekly red zone opportunities, inside-10 and inside-5 usage, plus L3, L5 and season averages.",
  alternates: {
    canonical: "/nfl-red-zone-targets",
  },
};

export default async function NflRedZoneTargetsPage() {
  const players = await getNflRedZoneTargets(2026);
  const latestWeek =
    players.length > 0
      ? Math.max(...players.map((player) => player.latestWeek))
      : null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            NFL Research Tools
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            NFL Red Zone Targets & Carries 2026
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Track 2026 NFL red zone targets, red zone carries and scoring
            opportunities by player. Compare weekly red zone usage, inside-10
            and inside-5 opportunities, plus L3, L5 and season averages for
            running backs, wide receivers, and tight ends.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-300">
            <span>2026 Season</span>
            {latestWeek !== null && (
              <>
                <span className="text-slate-600">•</span>
                <span>Updated through Week {latestWeek}</span>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
            <span>Red Zone Opportunities</span>
            <span>•</span>
            <span>Red Zone Carries</span>
            <span>•</span>
            <span>Red Zone Targets</span>
            <span>•</span>
            <span>Inside 10</span>
            <span>•</span>
            <span>Inside 5</span>
            <span>•</span>
            <span>L3 / L5 Usage</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <NflRedZoneTargetsExplorer players={players} />
      </section>

      <section className="border-t border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-3xl font-bold">
            How to Use NFL Red Zone Targets
          </h2>

          <div className="mt-6 space-y-5 text-slate-300">
            <p>
              NFL red zone targets show which pass catchers are earning
              opportunities near the opponent&apos;s goal line, where targets
              are more likely to turn into touchdowns than opportunities from
              other areas of the field.
            </p>

            <p>
              Running backs can create the same scoring opportunity through red
              zone carries, so KofSports combines red zone carries and red zone
              targets into one Red Zone Opportunities metric. This makes it
              easier to compare touchdown opportunity across running backs,
              wide receivers, and tight ends.
            </p>

            <p>
              Recent usage can be especially valuable. A player whose last
              three-game red zone opportunity average is rising above their
              season average may be earning a larger role near the goal line.
            </p>
          </div>

          <h2 className="mt-12 text-3xl font-bold">
            Why Red Zone Usage Matters for NFL Betting
          </h2>

          <div className="mt-6 space-y-5 text-slate-300">
            <p>
              Touchdown scoring is heavily dependent on opportunity. Players
              seeing repeated carries or targets near the goal line often have
              a stronger path to scoring than players relying on long,
              lower-frequency touchdowns.
            </p>

            <p>
              Red zone usage can be useful when researching anytime touchdown
              scorers, receiving props, rushing props, and player role changes.
              It becomes even more valuable when combined with{" "}
              <Link
                href="/nfl-snap-counts"
                className="font-medium text-emerald-400 transition hover:text-emerald-300"
              >
                NFL snap counts
              </Link>
              , defensive matchup data, team scoring environment, and current
              sportsbook odds. For deeper player research, compare usage with{" "}
              <Link
                href="/nfl-player-prop-trends"
                className="font-medium text-emerald-400 transition hover:text-emerald-300"
              >
                NFL player prop trends
              </Link>{" "}
              and the{" "}
              <Link
                href="/nfl-prop-research"
                className="font-medium text-emerald-400 transition hover:text-emerald-300"
              >
                NFL prop research dashboard
              </Link>
              .
            </p>
          </div>

          <h2 className="mt-12 text-3xl font-bold">
            NFL Red Zone Carries, Goal-Line Carries & Touches
          </h2>

          <div className="mt-6 space-y-5 text-slate-300">
            <p>
              NFL red zone carries measure rushing attempts inside the
              opponent&apos;s 20-yard line. For running backs, these attempts
              can help identify which players are consistently receiving
              valuable rushing opportunities when their offense gets close to
              the end zone.
            </p>

            <p>
              Carries inside the 10-yard line and 5-yard line provide an even
              closer look at goal-line usage. A running back with a high number
              of red zone carries, especially opportunities inside the 5, may
              have a different touchdown-scoring role than a back whose workload
              comes primarily between the 20s.
            </p>

            <p>
              Red zone touches is also a common way to describe player usage
              near the goal line, but KofSports uses Red Zone Opportunities as
              the broader metric. Red Zone Opportunities combines carries and
              targets, while a target does not necessarily result in a reception
              or an actual touch. The Season view above can be used to compare
              full-season red zone carries, targets, opportunities, and
              opportunities per game.
            </p>
          </div>

          <h2 className="mt-12 text-3xl font-bold">
            NFL Red Zone Stat Definitions
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-semibold text-white">RZ Opps</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Red Zone Opportunities equals red zone carries plus red zone
                targets.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-semibold text-white">RZ Carries</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Rushing attempts that occur inside the opponent&apos;s 20-yard
                line.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-semibold text-white">RZ Targets</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Passing targets that occur inside the opponent&apos;s 20-yard
                line.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-semibold text-white">
                Inside 10 / Inside 5
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Carries plus targets occurring inside the opponent&apos;s
                10-yard line or 5-yard line.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-semibold text-white">L3 / L5</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Average red zone opportunities across the player&apos;s last
                three or five games played.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="font-semibold text-white">Season/G</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Average red zone opportunities per game across the full season.
              </p>
            </div>
          </div>

          <p className="mt-10 text-sm leading-6 text-slate-500">
            Red zone data is provided for research and informational purposes.
            Historical usage does not guarantee future playing time, scoring,
            or betting outcomes.
          </p>
        </div>
      </section>
    </main>
  );
}
