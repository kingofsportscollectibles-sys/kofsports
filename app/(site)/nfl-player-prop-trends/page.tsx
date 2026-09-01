import type { Metadata } from "next";

import NflPropTrendsExplorer from "@/components/nfl/NflPropTrendsExplorer";
import { getNflPlayerPropTrends } from "@/lib/nfl/prop-trends";

export const metadata: Metadata = {
  title: "NFL Player Props Today: Trends & Hit Rates | KofSports",
  description:
    "Research NFL player props today with current lines, L5 and L10 hit rates, season trends, and head-to-head stats for passing, rushing, and receiving yards.",
};

export default async function NflPlayerPropTrendsPage() {
  const props = await getNflPlayerPropTrends();

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            KofSports NFL Research
          </div>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
            NFL Player Props Today: Trends & Hit Rates
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
            Research NFL player props today using current DraftKings lines and
            historical performance. Compare last 5, last 10, season, and
            head-to-head hit rates for NFL passing, rushing, and receiving
            yard props.
          </p>

          <div className="mt-6 text-sm text-slate-500">
            Current player prop lines provided by DraftKings.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold text-white">
              NFL Player Props Today
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {props.length} current NFL player props available
            </p>
          </div>

          <div className="text-sm text-slate-500">
            Passing • Rushing • Receiving
          </div>
        </div>

        {props.length > 0 ? (
          <NflPropTrendsExplorer props={props} />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-xl font-bold text-white">
              No NFL Player Props Available
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Current NFL player prop lines will appear here when available.
            </p>
          </div>
        )}

        <div className="mt-12 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900">
  <div className="p-7 md:p-9">
    <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
          KofSports Premium Picks
        </div>

        <h2 className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
          Found a trend you like? See the bets we actually like.
        </h2>

        <p className="mt-3 max-w-xl leading-7 text-slate-400">
          Trends are only one part of the handicapping process.
          KofSports Premium members get access to our actual
          recommended plays across the NFL, college football, MLB,
          golf, and more.
        </p>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
          <span>✓ Full Premium Picks</span>
          <span>✓ Analysis with every play</span>
          <span>✓ Results tracked publicly</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
        <a
          href="/premium-picks"
          className="rounded-xl bg-emerald-500 px-6 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
        >
          View Premium Picks
        </a>

        <a
          href="/plans"
          className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-center text-sm font-bold text-white transition hover:border-slate-600 hover:bg-slate-800"
        >
          See Premium Plans
        </a>
      </div>
    </div>
  </div>
</div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-3xl font-black tracking-tight text-white">
            How to Research NFL Player Props
          </h2>

          <p className="mt-5 leading-7 text-slate-400">
            NFL player prop research goes beyond looking at a player&apos;s
            average. A current sportsbook line can be compared against recent
            game results, longer-term performance, and previous games against
            the upcoming opponent. KofSports brings those numbers together so
            you can quickly evaluate today&apos;s NFL player props.
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
                performance can provide additional context when researching
                NFL player props today.
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
                NFL Player Prop Predictions
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Historical trends do not guarantee future results, but they can
                help provide context when evaluating NFL player prop
                predictions. Use recent performance, season hit rates, and
                matchup history together rather than relying on a single
                statistic.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-bold text-white">
            NFL Player Prop Trends FAQ
          </h2>

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="font-bold text-white">
                What NFL player props are tracked?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                KofSports currently tracks NFL passing yards, rushing yards,
                and receiving yards. Additional player prop markets may be
                added over time.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                What sportsbook lines are used?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                The current version of the KofSports NFL player prop trends
                tool uses DraftKings as its reference sportsbook.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                How are NFL player prop hit rates calculated?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                Each historical game result is compared with the current prop
                line. A result above the current line is recorded as an over,
                a result below the line is recorded as an under, and an exact
                match is recorded as a push.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                Are these NFL player prop picks?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                No. The trend tool is designed for research and does not label
                every high hit rate as a recommended bet. Historical results
                are one part of evaluating an NFL player prop.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}