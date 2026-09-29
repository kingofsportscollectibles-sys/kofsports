import type { Metadata } from "next";

import NflBettingPowerRankings from "@/components/nfl/NflBettingPowerRankings";
import { getNflBettingPowerRankings } from "@/lib/nfl/betting-power-rankings";

export const metadata: Metadata = {
  title:
    "NFL Betting Power Rankings: ATS Rankings & Cover Margin | KofSports",
  description:
    "See all 32 NFL teams ranked by performance against the spread. KofSports NFL Betting Power Rankings combine ATS record, cover percentage, and average cover margin using DraftKings pregame spreads.",
};

export default async function NflBettingPowerRankingsPage() {
  const season = 2026;

  const rankings =
    await getNflBettingPowerRankings(season);

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            KofSports NFL Research
          </div>

          <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight text-white md:text-5xl">
            NFL Betting Power Rankings
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
            Power rankings built for bettors. See how
            all 32 NFL teams have performed against
            market expectations based on ATS record,
            cover percentage, and margin versus the
            spread.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <span>DraftKings pregame spreads</span>
            <span className="hidden sm:inline">•</span>
            <span>All 32 NFL teams</span>
            <span className="hidden sm:inline">•</span>
            <span>{season} NFL Season</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">
            NFL ATS Power Rankings
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Teams are ranked first by ATS win
            percentage, then by average cover margin
            and total cover margin. Pushes are excluded
            from ATS win percentage.
          </p>
        </div>

        {rankings.length > 0 ? (
          <NflBettingPowerRankings
            rankings={rankings}
          />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-xl font-bold text-white">
              No Power Rankings Available
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              NFL Betting Power Rankings will appear
              here as games are graded against their
              pregame spreads.
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
                  Go deeper than the rankings.
                </h2>

                <p className="mt-3 max-w-xl leading-7 text-slate-400">
                  KofSports Pro combines player prop
                  trends, matchup data, usage, Defense
                  vs Position, KOF Scores, sportsbook
                  lines, and advanced betting research
                  in one place.
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
                  Explore NFL Research
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-3xl font-black tracking-tight text-white">
            How NFL Betting Power Rankings Work
          </h2>

          <p className="mt-5 leading-7 text-slate-400">
            Traditional NFL power rankings usually
            focus on wins, losses, roster strength,
            and subjective opinions. KofSports Betting
            Power Rankings focus on a different
            question: which teams are outperforming
            the expectations set by the betting
            market?
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-white">
                ATS Record
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Each team is graded against the
                DraftKings spread captured before its
                game. A team earns an ATS win when it
                covers the spread, a loss when it
                fails to cover, and a push when the
                final margin lands exactly on the
                spread.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                ATS Win Percentage
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                ATS win percentage is the primary
                ranking factor. Pushes are excluded
                from the calculation so teams are
                compared using games with a clear
                ATS decision.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Average Cover Margin
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Cover margin measures how far a team
                finished above or below the spread.
                Positive numbers indicate the team
                outperformed the market expectation,
                while negative numbers indicate it
                underperformed the spread.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Ranking Tiebreakers
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                When teams have the same ATS win
                percentage, average cover margin is
                the first tiebreaker followed by total
                cover margin.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-bold text-white">
            NFL Betting Power Rankings FAQ
          </h2>

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="font-bold text-white">
                What does ATS mean?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                ATS means against the spread. It
                measures whether a team covered the
                point spread rather than simply
                whether it won or lost the game.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                What sportsbook is used for the
                rankings?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                KofSports currently uses DraftKings
                pregame spreads as the reference
                market for NFL Betting Power Rankings.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                How often are the rankings updated?
              </h3>

              <p className="mt-2 leading-7 text-slate-400">
                Rankings update as completed NFL games
                are graded against their captured
                pregame spreads throughout the season.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
