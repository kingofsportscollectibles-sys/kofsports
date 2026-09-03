import type { Metadata } from "next";

import NflAnytimeTdRankingsExplorer from "@/components/nfl/NflAnytimeTdRankingsExplorer";

import { getNflAnytimeTdRankings } from "@/lib/nfl/anytime-td-rankings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title:
    "NFL Anytime Touchdown Scorer Predictions & Rankings Today | KofSports",
  description:
    "Find today's NFL anytime touchdown scorer predictions, KOF Score rankings, anytime TD odds, red-zone usage, matchup data, and more.",
};

export default async function NflAnytimeTouchdownRankingsPage() {
  const rankings = await getNflAnytimeTdRankings();

  const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does anytime touchdown scorer mean?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An anytime touchdown scorer bet is a wager on whether a specific player will score a touchdown at any point during the game. Sportsbook rules can vary, so bettors should review the rules at the sportsbook where the wager is placed.",
      },
    },
    {
      "@type": "Question",
      name: "What are the best anytime TD scorer bets today?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "KOF Score ranks current NFL anytime touchdown scorers using market expectations, red-zone opportunity, overall usage, recent form, matchup, and team scoring environment. A high KOF Score indicates a strong research profile but does not automatically represent an official KofSports bet.",
      },
    },
    {
      "@type": "Question",
      name: "How are the anytime TD scorer predictions ranked?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Players are ranked by KOF Score, a proprietary 0-100 research index. Market and red-zone factors each account for 25% of the score, usage and recent form each account for 15%, and matchup and team scoring environment each account for 10%.",
      },
    },
    {
      "@type": "Question",
      name: "Are KOF Scores touchdown probabilities?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. KOF Score is a comparative research ranking and is not the percentage probability that a player will score a touchdown.",
      },
    },
    {
      "@type": "Question",
      name: "Where do the anytime touchdown odds come from?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "KofSports compares current anytime touchdown prices from multiple sportsbooks when available and displays the best available price found in the current data.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use KOF Score for an anytime TD parlay?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "KOF Score can be used as a research tool when comparing touchdown scorers, including players being considered for an anytime TD parlay. Each selection should still be evaluated individually.",
      },
    },
  ],
};

  return (
    <main className="min-h-screen bg-slate-950">
      <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
  }}
/>
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            KofSports NFL Research
          </div>

          <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight text-white md:text-5xl">
            NFL Anytime Touchdown Scorer Predictions & KOF Rankings
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
            Research today&apos;s NFL anytime touchdown scorers with KOF Score,
            our proprietary 0-100 ranking system combining betting market
            expectations, red-zone opportunity, player usage, recent role,
            matchup, and team scoring environment.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <span>Updated with current anytime TD odds</span>
            <span>RB • WR • TE</span>
            <span>Multiple sportsbooks compared</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Today&apos;s NFL Anytime TD Scorer Rankings
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Higher KOF Scores indicate stronger overall touchdown-scoring
              profiles based on the six factors in the KOF model.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            {rankings.length} players ranked
          </div>
        </div>

        {rankings.length > 0 ? (
          <NflAnytimeTdRankingsExplorer rankings={rankings} />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-xl font-bold text-white">
              No NFL Anytime TD Rankings Available
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              NFL anytime touchdown scorer rankings will appear here when
              current sportsbook markets are available.
            </p>
          </div>
        )}

        <div className="mt-12 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900">
          <div className="p-7 md:p-9">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                  KofSports Premium
                </div>

                <h2 className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
                  See the bets we actually like.
                </h2>

                <p className="mt-3 max-w-xl leading-7 text-slate-400">
                  KOF Score is a research tool, not an automatic betting
                  recommendation. Premium members get access to the actual
                  plays selected by KofSports with analysis behind every pick.
                </p>

                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                  <span>✓ Full Premium Picks</span>
                  <span>✓ Analysis with every play</span>
                  <span>✓ Results tracked publicly</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href="/free-week?source=td-rankings"
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  Try Premium Free for 7 Days
                </a>

                <a
                  href="/premium-picks"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-center text-sm font-bold text-white transition hover:border-slate-600 hover:bg-slate-800"
                >
                  View Premium Picks
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-3xl font-black tracking-tight text-white">
            How the KOF Anytime TD Score Works
          </h2>

          <p className="mt-5 leading-7 text-slate-400">
            KOF Score is designed to rank NFL anytime touchdown scorer
            opportunities using more than touchdown history alone. Each player
            receives a score from 0 to 100 based on six components that can
            influence touchdown opportunities.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              [
                "Market — 25%",
                "Current anytime TD odds help establish how strongly the betting market expects a player to score.",
              ],
              [
                "Red Zone — 25%",
                "Red-zone, inside-10, and inside-5 opportunities identify players getting valuable touches and targets near the goal line.",
              ],
              [
                "Usage — 15%",
                "Overall carries, targets, and offensive involvement help measure each player's role within the offense.",
              ],
              [
                "Recent Form — 15%",
                "Recent opportunities, red-zone role, touchdown production, and changes in usage help identify evolving roles.",
              ],
              [
                "Matchup — 10%",
                "Opponent performance against the player's position provides context for the upcoming matchup.",
              ],
              [
                "Environment — 10%",
                "The team's implied scoring total provides context for how many points the offense is expected to produce.",
              ],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-6"
              >
                <h3 className="font-bold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm leading-6 text-slate-500">
            KOF Score is a comparative research ranking and is not the
            percentage probability that a player will score a touchdown.
            Sportsbook implied probabilities may include bookmaker margin.
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-3xl font-black tracking-tight text-white">
            How to Research the Best Anytime TD Bets Today
          </h2>

          <p className="mt-5 leading-7 text-slate-400">
            Finding the best anytime touchdown bets involves more than looking
            at which NFL players have scored recently. Touchdowns can be
            volatile, so opportunity and role are important parts of evaluating
            an anytime TD scorer prediction.
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-white">
                Start With Red-Zone Opportunity
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                Carries and targets near the goal line can provide useful
                context for an anytime touchdown scorer. KOF Score separately
                evaluates red-zone, inside-10, and inside-5 opportunities
                rather than relying only on touchdowns already scored.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Compare Anytime TD Odds
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                Anytime touchdown odds can vary between sportsbooks. The
                rankings above compare available prices and display the best
                price found in the current market.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Evaluate Player Usage
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                A player&apos;s snap rate, carries, and targets help establish
                how involved he is in the offense. Changes in recent usage can
                also identify players whose roles are expanding or declining.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Account for Matchup and Scoring Environment
              </h3>
              <p className="mt-3 leading-7 text-slate-400">
                KOF Score incorporates opponent performance by position and
                each team&apos;s implied scoring environment so the same player
                can rank differently from one matchup to the next.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-3xl font-black tracking-tight text-white">
            NFL Anytime Touchdown Scorer FAQ
          </h2>

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="font-bold text-white">
                What does anytime touchdown scorer mean?
              </h3>
              <p className="mt-2 leading-7 text-slate-400">
                An anytime touchdown scorer bet is a wager on whether a
                specific player will score a touchdown at any point during the
                game. The exact sportsbook rules can vary, so always review
                the rules at the sportsbook where the wager is placed.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                What are the best anytime TD scorer bets today?
              </h3>
              <p className="mt-2 leading-7 text-slate-400">
                KOF Score ranks current NFL anytime TD scorers using market
                expectations, red-zone opportunity, overall usage, recent
                form, matchup, and team scoring environment. A high KOF Score
                indicates a strong overall research profile, but it does not
                automatically mean a player is an official KofSports bet.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                How are the anytime TD scorer predictions ranked?
              </h3>
              <p className="mt-2 leading-7 text-slate-400">
                Players are ranked by KOF Score, a proprietary 0-100 index.
                Market and red-zone factors each account for 25% of the score,
                usage and recent form each account for 15%, and matchup and
                team scoring environment each account for 10%.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                Are KOF Scores touchdown probabilities?
              </h3>
              <p className="mt-2 leading-7 text-slate-400">
                No. An 86 KOF Score does not mean the player has an 86% chance
                of scoring. KOF Score is a comparative ranking index designed
                to combine several touchdown-related factors into one research
                score.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                Where do the anytime touchdown odds come from?
              </h3>
              <p className="mt-2 leading-7 text-slate-400">
                KofSports compares current anytime touchdown prices from
                multiple sportsbooks when available. The rankings display the
                best available price found in the current data.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white">
                Can I use KOF Score for an anytime TD parlay?
              </h3>
              <p className="mt-2 leading-7 text-slate-400">
                KOF Score can be used as a research tool when comparing
                touchdown scorers, including players being considered for an
                anytime TD parlay. Combining multiple selections increases the
                difficulty of winning the wager, so each leg should still be
                evaluated individually.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
