import type { Metadata } from "next";
import { PublicPickExample } from "@/components/marketing/PublicPickExample";
import { MarketingFaq } from "@/components/marketing/Faq";
import { RecordMethodology } from "@/components/marketing/RecordMethodology";
import { PaymentTrust } from "@/components/marketing/PaymentTrust";
import { MemberStories, IndependentReview } from "@/components/marketing/Proof";
export const metadata: Metadata = {
  title: { absolute: "NFL Betting Picks & Research Tools | KofSports" },
  description:
    "Follow Kof’s official picks or research NFL props with KOFScore, L5/L10 trends, matchup data and recorded sportsbook lines. See the public record and compare plans.",
  alternates: { canonical: "https://www.kofsports.com" },
  openGraph: {
    title: "NFL Betting Picks & Research Tools | KofSports",
    description:
      "Official picks or your own research. Check the public record, compare lines and choose Premium or Pro.",
    url: "https://www.kofsports.com",
    type: "website",
    images: ["/brand/social-preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "NFL Betting Picks & Research Tools | KofSports",
    description:
      "Official picks, public results and NFL prop research in one place.",
    images: ["/brand/social-preview.png"],
  },
};
import Link from "next/link";
import { getOverallRecord, getSportResults } from "@/lib/results";

const products = [
  {
    eyebrow: "We Find the Bets",
    title: "Premium Picks",
    description:
      "Get every official KofSports wager with the reasoning behind the play. Premium members also receive full access to KofSports Pro.",
    features: [
      "Official KofSports selections",
      "Full betting analysis",
      "Transparent tracked results",
      "KofSports Pro included",
    ],
    href: "/premium-picks",
    cta: "View Today's Picks",
  },
  {
    eyebrow: "You Find the Bets",
    title: "KofSports Pro",
    description:
      "Research the board yourself with proprietary KOF Scores, betting trends, matchup data, player usage and advanced NFL research tools.",
    features: [
      "KOF Over Score Beta",
      "Advanced player prop research",
      "Matchup & usage intelligence",
      "Premium research features",
    ],
    href: "/pro",
    cta: "Explore KofSports Pro",
  },
];

const tools = [
  {
    title: "Check a prop against the line",
    description:
      "Compare stored lines with recent trends, matchup context and available KOFScore research. A raw edge is not a calibrated +EV signal.",
    href: "/nfl-player-prop-trends",
    tag: "KOF Score",
  },
  {
    title: "Check the last 5 and 10 games",
    description:
      "Compare today's lines against recent player performance, including L5, L10, season and matchup history.",
    href: "/nfl-player-prop-trends",
    tag: "Trends",
  },
  {
    title: "Compare results with pregame lines",
    description:
      "See how NFL players have performed against their actual DraftKings pregame lines with cover rates and average results versus the line.",
    href: "/nfl-player-prop-records",
    tag: "Records",
  },
  {
    title: "Find the position matchup",
    description:
      "See which NFL defenses allow the most production to quarterbacks, running backs, receivers and tight ends.",
    href: "/nfl-defense-vs-position",
    tag: "Matchups",
  },
  {
    title: "Compare touchdown opportunities",
    description:
      "Research anytime touchdown candidates using odds, scoring opportunity and the KOF TD ranking model.",
    href: "/nfl-anytime-touchdown-rankings",
    tag: "Touchdowns",
  },
  {
    title: "Check whether a player’s role changed",
    description:
      "Check recorded snap participation and recent usage before deciding how much to trust a player’s past results.",
    href: "/nfl-snap-counts",
    tag: "Usage",
  },
  {
    title: "Find goal-line carries and targets",
    description:
      "Find the players getting valuable opportunities near the goal line through carries and targets.",
    href: "/nfl-red-zone-targets",
    tag: "Opportunity",
  },
];

const trustPoints = [
  {
    number: "01",
    title: "Built From the Research",
    description:
      "We don't just publish picks. We've built a growing research platform designed to surface trends, matchups and betting opportunities.",
  },
  {
    number: "02",
    title: "Transparent Results",
    description:
      "Wins and losses are tracked publicly. No deleting losses. No selective screenshots. The record is the record.",
  },
  {
    number: "03",
    title: "Analysis Behind the Pick",
    description:
      "Official selections include the reasoning behind the wager so members can understand why we're betting it.",
  },
];

export default async function Home() {
  const sportsResults = await getSportResults();
  const overallRecord = getOverallRecord(sportsResults);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:52px_52px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 lg:min-h-[720px] lg:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-brand/30 bg-brand/10 px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">
                Picks + Research Tools
              </span>
            </div>

            <p className="font-display text-sm font-semibold uppercase tracking-[0.4em] text-zinc-500">
              Sports betting intelligence since 2015
            </p>

            <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
              NFL Betting Picks &amp; Research Tools.
            </h1>

            <p className="mt-5 text-lg font-semibold text-zinc-200">
              Better bets start with better information.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              Follow Kof’s official picks, or research player props with
              KOFScore, L5/L10 trends and the edge versus a recorded sportsbook
              line. Have the numbers ready when you explain your pick.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
              Keep your recent-form and matchup research in one place for
              $9.99/month. Premium picks already include Pro—no second
              subscription needed.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/premium-picks"
                className="rounded-md bg-brand px-7 py-4 text-center text-sm font-extrabold uppercase tracking-wide text-black transition hover:bg-brand-light"
              >
                View Today's Picks
              </Link>

              <Link
                href="/nfl-player-prop-trends"
                className="rounded-md border border-white/20 bg-white/5 px-7 py-4 text-center text-sm font-extrabold uppercase tracking-wide text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Explore Betting Tools
              </Link>
            </div>

            <p className="mt-4 text-sm text-zinc-400">
              <Link
                href="/plans"
                className="inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4"
              >
                See plans: Pro $9.99/month · Premium from $10
              </Link>
              <span className="mx-2">·</span>
              <a
                href="#questions"
                className="inline-flex min-h-11 items-center underline"
              >
                Questions first?
              </a>
            </p>
            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-400">
              <span>✓ Official Premium Picks</span>
              <span>✓ Free Research Tools</span>
              <span>✓ Advanced KofSports Pro</span>
            </div>
          </div>

          <div className="relative min-w-0">
            <PublicPickExample />
          </div>
        </div>
      </section>

      {/* TWO PRODUCTS */}
      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
              Two Ways to Use KofSports
            </p>

            <h2 className="mt-4 font-display text-4xl font-bold uppercase text-white sm:text-5xl">
              Want the picks—or want the tools?
            </h2>

            <p className="mt-5 text-lg leading-8 text-zinc-400">
              Whether you want Kof to find the bets for you or prefer to
              research the board yourself, start with the path that fits your
              routine.
            </p>
          </div>

          <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-7 text-zinc-400">
            For bettors who want the reasoning behind a pick or the numbers for
            their own research. KofSports is not a sportsbook, an auto-betting
            service or a promise of guaranteed winners.
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {products.map((product) => (
              <article
                key={product.title}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-8"
              >
                <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-brand">
                  {product.eyebrow}
                </p>

                <h3 className="mt-3 font-display text-4xl font-bold uppercase text-white">
                  {product.title}
                </h3>

                <p className="mt-5 leading-7 text-zinc-400">
                  {product.description}
                </p>

                <div className="mt-7 space-y-3">
                  {product.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 text-sm text-zinc-300"
                    >
                      <span className="font-black text-brand">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-8">
                  <Link
                    href={product.href}
                    className="inline-flex rounded-md bg-brand px-6 py-3.5 text-sm font-extrabold uppercase tracking-wide text-black transition hover:bg-brand-light"
                  >
                    {product.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Premium Picks members receive KofSports Pro access at no additional
            cost.
          </p>
        </div>
      </section>

      {/* RESEARCH TOOLS */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
              The KofSports Research Platform
            </p>

            <h2 className="mt-4 font-display text-4xl font-bold uppercase text-white sm:text-5xl">
              We built the tools we want when researching a bet.
            </h2>

            <p className="mt-5 text-lg leading-8 text-zinc-400">
              Instead of jumping between spreadsheets, box scores and betting
              sites, KofSports brings the most useful NFL betting research into
              one platform.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="group rounded-xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-brand/40 hover:bg-white/[0.04]"
              >
                <span className="inline-flex rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">
                  {tool.tag}
                </span>

                <h3 className="mt-5 font-display text-2xl font-bold uppercase text-white">
                  {tool.title}
                </h3>

                <p className="mt-3 leading-7 text-zinc-400">
                  {tool.description}
                </p>

                <p className="mt-6 text-sm font-extrabold uppercase tracking-wide text-brand transition group-hover:text-brand-light">
                  Open Tool →
                </p>
              </Link>
            ))}
          </div>

          <p className="mt-6 text-sm leading-7 text-zinc-400">
            Use these recorded lines as a starting point for line shopping. They
            are not a live feed or a guaranteed closing line.{" "}
            <Link href="/vs" className="text-brand underline">
              Compare KofSports with Props.Cash, Outlier and SportsLine
            </Link>
            .
          </p>
          <div className="mt-10 rounded-2xl border border-brand/20 bg-brand/[0.05] p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <p className="font-display text-2xl font-bold uppercase text-white">
                Want the full research experience?
              </p>
              <p className="mt-2 text-zinc-400">
                Unlock KOF Scores and advanced betting research with KofSports
                Pro.
              </p>
            </div>

            <Link
              href="/pro"
              className="mt-5 inline-flex shrink-0 rounded-md bg-brand px-6 py-3.5 text-sm font-extrabold uppercase tracking-wide text-black transition hover:bg-brand-light sm:mt-0"
            >
              See KofSports Pro
            </Link>
          </div>
        </div>
      </section>

      {/* HISTORICAL RESULTS */}
      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
                The Tools Are New. The Track Record Isn't.
              </p>

              <h2 className="mt-4 font-display text-4xl font-bold uppercase text-white sm:text-5xl">
                Published picks. Wins and losses included.
              </h2>

              <p className="mt-5 text-lg leading-8 text-zinc-400">
                Check the published Premium vault before you pay. The totals
                below come from the same settled win/loss records; imported
                history and newly settled picks are counted together, without
                adding a separate baseline.
              </p>
            </div>

            <div className="flex gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Settled Decisions
                </p>
                <p className="mt-2 font-display text-4xl font-bold text-white">
                  {overallRecord.formattedTotal}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Win Rate
                </p>
                <p className="mt-2 font-display text-4xl font-bold text-brand">
                  {overallRecord.formattedWinRate}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-white/5">
                  <tr className="text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-6 py-4">Sport</th>
                    <th className="px-6 py-4">Wins</th>
                    <th className="px-6 py-4">Losses</th>
                    <th className="px-6 py-4">Total Picks</th>
                    <th className="px-6 py-4 text-right">Win Rate</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {sportsResults.map((result) => (
                    <tr
                      key={result.sport}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-5 font-display text-xl font-bold text-white">
                        {result.sport}
                      </td>

                      <td className="px-6 py-5 text-zinc-300">
                        {result.formattedWins}
                      </td>

                      <td className="px-6 py-5 text-zinc-300">
                        {result.formattedLosses}
                      </td>

                      <td className="px-6 py-5 text-zinc-300">
                        {result.formattedTotal}
                      </td>

                      <td className="px-6 py-5 text-right font-bold text-brand">
                        {result.formattedWinRate}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="border-t border-brand/30 bg-brand/5">
                  <tr>
                    <td className="px-6 py-5 font-display text-xl font-bold uppercase text-white">
                      Total
                    </td>

                    <td className="px-6 py-5 font-bold text-white">
                      {overallRecord.formattedWins}
                    </td>

                    <td className="px-6 py-5 font-bold text-white">
                      {overallRecord.formattedLosses}
                    </td>

                    <td className="px-6 py-5 font-bold text-white">
                      {overallRecord.formattedTotal}
                    </td>

                    <td className="px-6 py-5 text-right text-lg font-extrabold text-brand">
                      {overallRecord.formattedWinRate}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <RecordMethodology />
          <IndependentReview />
          <div className="mt-6 text-right">
            <Link
              href="/results"
              className="text-sm font-extrabold uppercase tracking-wide text-brand hover:text-brand-light"
            >
              Explore the full record →
            </Link>
          </div>
        </div>
      </section>

      <MemberStories />
      {/* WHY KOFSPORTS */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
              Why KofSports
            </p>

            <h2 className="mt-4 font-display text-4xl font-bold uppercase text-white sm:text-5xl">
              More than another picks site
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {trustPoints.map((point) => (
              <article
                key={point.number}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-7"
              >
                <p className="font-display text-5xl font-bold text-brand/30">
                  {point.number}
                </p>

                <h3 className="mt-5 font-display text-2xl font-bold uppercase text-white">
                  {point.title}
                </h3>

                <p className="mt-4 leading-7 text-zinc-400">
                  {point.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <MarketingFaq />
      {/* FINAL CTA */}
      <section className="bg-brand">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 py-16 text-center lg:flex-row lg:px-8 lg:text-left">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-black/60">
              Your Board. Your Decision.
            </p>

            <h2 className="mt-3 font-display text-4xl font-bold uppercase text-black sm:text-5xl">
              How do you want to attack the board?
            </h2>

            <p className="mt-4 max-w-2xl text-lg font-medium text-black/70">
              Get the official KofSports plays or use the same type of research
              framework to find betting opportunities yourself.
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/premium-picks"
              className="rounded-md bg-black px-7 py-4 text-center text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-zinc-800"
            >
              Today's Picks
            </Link>

            <Link
              href="/pro"
              className="rounded-md border-2 border-black px-7 py-4 text-center text-sm font-extrabold uppercase tracking-wide text-black transition hover:bg-black hover:text-white"
            >
              Explore Pro
            </Link>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-4xl px-5 pb-8">
        <PaymentTrust />
      </div>
    </>
  );
}
