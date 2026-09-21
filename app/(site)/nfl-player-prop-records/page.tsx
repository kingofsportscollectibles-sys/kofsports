import type { Metadata } from "next";

import NflPlayerPropRecordsExplorer from "@/components/nfl/NflPlayerPropRecordsExplorer";
import { getNflPlayerPropRecords } from "@/lib/nfl/player-prop-records";

export const metadata: Metadata = {
  title:
    "NFL Player Prop Records & Cover Rates | KofSports",
  description:
    "See NFL player prop records against actual DraftKings pregame lines. Compare cover rates, average performance versus the line, and passing, rushing, and receiving prop records.",
};

export default async function NflPlayerPropRecordsPage() {
  const season = 2026;
  const records =
    await getNflPlayerPropRecords(season);

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            KofSports NFL Research
          </div>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
            NFL Player Prop Records & Cover Rates
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
            See how NFL players have performed
            against the sportsbook&apos;s actual
            pregame prop line. Compare season
            records, cover rates, and average
            performance versus the line across
            passing, rushing, and receiving yards.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <span>
              DraftKings reference lines.
            </span>
            <span className="hidden sm:inline">
              •
            </span>
            <span>
              Passing • Rushing • Receiving
            </span>
            <span className="hidden sm:inline">
              •
            </span>
            <span>{season} NFL Season</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">
            NFL Player Prop Leaderboard
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Rankings compare each player&apos;s
            results with the DraftKings line
            captured before each game. Filter by
            position or prop type to find the
            players who have covered their market
            expectations most often.
          </p>
        </div>

        {records.length > 0 ? (
          <NflPlayerPropRecordsExplorer
            records={records}
          />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-xl font-bold text-white">
              No Player Prop Records Available
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              NFL player prop records will appear
              here as games are graded against
              their pregame lines.
            </p>
          </div>
        )}

        <div className="mt-12 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900">
          <div className="p-7 md:p-9">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                  KofSports Pro
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
                  Turn historical records into
                  deeper prop research.
                </h2>

                <p className="mt-3 max-w-xl leading-7 text-slate-400">
                  KofSports Pro combines player
                  trends, matchup data, usage,
                  Defense vs Position, KOF Scores,
                  and current sportsbook lines to
                  help you research NFL player
                  props in one place.
                </p>

                <div className="mt-5 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                  <span>✓ Advanced prop trends</span>
                  <span>✓ KOF Over Score Beta</span>
                  <span>✓ Defense vs Position</span>
                  <span>✓ Snap count research</span>
                  <span>✓ Red zone usage</span>
                  <span>✓ Matchup research</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href="/pro"
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  Unlock KofSports Pro
                </a>

                <a
                  href="/nfl-player-prop-trends"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-center text-sm font-bold text-white transition hover:border-slate-600 hover:bg-slate-800"
                >
                  Preview Prop Research
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-3xl font-black tracking-tight text-white">
            How NFL Player Prop Records Work
          </h2>

          <p className="mt-5 leading-7 text-slate-400">
            Traditional player prop trend tools
            often compare historical results with
            today&apos;s line. Player Prop Records
            answer a different question: how did
            the player perform against the line
            the sportsbook actually posted for
            each individual game?
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-white">
                Actual Pregame Lines
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Each graded result uses a
                DraftKings player prop line
                captured before that specific
                game. This allows each game to be
                evaluated against the market
                expectation that existed at the
                time.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Win-Loss-Push Records
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                A player receives a win when the
                final result exceeds the line, a
                loss when it finishes below the
                line, and a push when the result
                lands exactly on the sportsbook
                number.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Cover Percentage
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Cover percentage measures how
                often a player has finished above
                the historical prop line. Use the
                minimum-props filter to compare
                players with similar sample sizes
                as the season progresses.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Average vs Line
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Average versus line measures the
                average difference between a
                player&apos;s actual result and
                the sportsbook line. Positive
                numbers indicate average
                production above the line, while
                negative numbers indicate
                production below it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-bold text-white">
            NFL Player Prop Records FAQ
          </h2>

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="font-bold text-white">
                What NFL player props are tracked?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                KofSports currently tracks passing
                yards, rushing yards, and receiving
                yards. Additional player prop
                markets may be added over time.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                What sportsbook is used?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                The current Player Prop Records
                tool uses DraftKings as its
                reference sportsbook.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                What is the difference between
                Player Prop Records and Player Prop
                Trends?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                Player Prop Trends compares past
                game results with the current
                sportsbook line. Player Prop
                Records instead grades each game
                against the DraftKings line
                captured before that individual
                game.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                Does a high cover rate mean a prop
                is a good bet?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                Not necessarily. Historical cover
                rate is one research input and
                should be considered alongside the
                current line, matchup, player
                role, usage, injuries, and other
                relevant information.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
