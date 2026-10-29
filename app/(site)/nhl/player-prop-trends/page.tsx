import type { Metadata } from "next";

import NhlPropTrendsExplorer from "@/components/nhl/NhlPropTrendsExplorer";
import { getNhlPlayerPropTrends } from "@/lib/nhl/prop-trends";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NHL Player Props Today: Trends & Hit Rates | KofSports",
  description:
    "Research NHL player props today with current lines, recent hit rates, historical results, and advanced player prop trends from KofSports.",
};

export default async function NhlPlayerPropTrendsPage() {
  const props = await getNhlPlayerPropTrends();

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            KofSports NHL Research
          </div>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
            NHL Player Props Today: Trends & Hit Rates
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
            Research NHL player props using current DraftKings lines, L5 and
            L10 hit rates, season trends, matchup history, and recent game
            results. Compare historical performance against today&apos;s line
            with free KofSports NHL research.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <span>Current lines provided by DraftKings.</span>
            <span className="hidden sm:inline">•</span>
            <span>Shots on Goal • Points • Assists • Goalie Saves</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold text-white">
              NHL Player Props Today
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {props.length} current NHL player props available
            </p>
          </div>


        </div>

        {props.length > 0 ? (
          <NhlPropTrendsExplorer props={props} />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-xl font-bold text-white">
              No NHL Player Props Available
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Current NHL player prop lines will appear here when available.
            </p>
          </div>
        )}


      </section>

      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-3xl font-black tracking-tight text-white">
            How to Research NHL Player Props
          </h2>

          <p className="mt-5 leading-7 text-slate-400">
            NHL player prop research goes beyond looking at a player&apos;s
            average. A current sportsbook line can be compared against recent
            game results, longer-term performance, and previous games against
            the upcoming opponent. KofSports brings those numbers together so
            you can quickly evaluate today&apos;s NHL player props.
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-white">
                Last 5 & Last 10 Hit Rates
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Last 5 and last 10 results provide a quick look at recent
                performance against the current prop line. Because each result
                is calculated against today&apos;s line, the hit rate adjusts
                when the sportsbook line changes.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Season Player Prop Trends
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Season hit rates provide a larger sample than recent-game
                trends. Comparing short-term results with season-long
                performance can provide additional context when researching NHL
                player props today.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Head-to-Head Performance
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Head-to-head results show how often a player has exceeded the
                current line in previous games against the upcoming opponent.
                Smaller samples should be viewed as additional context rather
                than a standalone prediction.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Edge Versus the Current Line
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Hit rates become more useful when combined with the size of a
                player&apos;s historical performance relative to today&apos;s
                sportsbook line. KofSports Pro adds deeper context so you can
                identify where recent production has meaningfully exceeded the
                current number.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-bold text-white">
            NHL Player Prop Trends FAQ
          </h2>

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="font-bold text-white">
                What NHL player props are tracked?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                KofSports tracks NHL shots on goal, points, assists, and goalie
                saves. All users can access L5 trends, while
                KofSports Pro unlocks deeper L10, season, and matchup research.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                What sportsbook lines are used?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                The current version of the KofSports NHL player prop trends tool
                uses DraftKings as its reference sportsbook.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                How are NHL player prop hit rates calculated?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                Each historical game result is compared with the current prop
                line. A result above the current line is recorded as an over, a
                result below the line is recorded as an under, and an exact
                match is recorded as a push.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                What does KofSports Pro unlock?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                KofSports Pro unlocks deeper NHL research including advanced
                player prop trends, matchup research, historical results, and
                additional tools designed to help identify and evaluate betting
                opportunities.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                Are these NHL player prop picks?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                No. The trend tool is designed for research and does not label
                every high hit rate as a recommended bet. Historical results
                are one part of evaluating an NHL player prop.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}