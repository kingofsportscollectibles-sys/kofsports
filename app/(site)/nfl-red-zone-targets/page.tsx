import type { Metadata } from "next";

import NflRedZoneTargetsExplorer from "@/components/nfl/NflRedZoneTargetsExplorer";
import { getNflRedZoneTargets } from "@/lib/nfl/red-zone-targets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NFL Red Zone Targets & Usage Stats | KofSports",
  description:
    "View NFL red zone targets, carries, inside-10 opportunities, inside-5 opportunities, and recent usage trends for running backs, wide receivers, and tight ends.",
  alternates: {
    canonical: "/nfl-red-zone-targets",
  },
};

export default async function NflRedZoneTargetsPage() {
  const players = await getNflRedZoneTargets(2025);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            NFL Research Tools
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            NFL Red Zone Targets, Carries & Usage
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Track NFL red zone targets and carries for running backs, wide
            receivers, and tight ends. Compare recent red zone opportunities
            with season-long usage to identify players earning valuable scoring
            chances near the goal line.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-400">
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
              It becomes even more valuable when combined with snap counts,
              defensive matchup data, team scoring environment, and current
              sportsbook odds.
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
