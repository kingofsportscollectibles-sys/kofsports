import type { Metadata } from "next";

import { NflPropResearchDashboard } from "@/components/nfl/NflPropResearchDashboard";
import { getNflPropResearch } from "@/lib/nfl/prop-research";
import { hasKofSportsProAccess } from "@/lib/auth/entitlements";

export const metadata: Metadata = {
  title:
    "NFL Player Prop Research Tool & KOF Score | KofSports",
  description:
    "Research NFL player props with KOF Score, last 5 and last 10 hit rates, recent performance versus the current line, snap share, and defense vs position matchup data.",
};

export const revalidate = 300;

export default async function NflPropResearchPage() {
  const [rows, hasProAccess] = await Promise.all([
    getNflPropResearch(),
    hasKofSportsProAccess(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">
          KofSports NFL Research
        </div>

        <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          NFL Player Prop Research
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400 sm:text-lg">
          Research current NFL player props in one
          place using recent hit rates, performance
          versus the current line, player usage,
          defensive matchup data and the KOF Over
          Score.
        </p>
      </section>

      <NflPropResearchDashboard
        rows={rows}
        hasProAccess={hasProAccess}
      />

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-xl font-semibold text-white">
            What is the KOF Over Score?
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            KOF Over Score Beta ranks NFL player
            prop opportunities by combining recent
            performance, performance relative to
            the current sportsbook line, opponent
            matchup and player role. Higher scores
            represent stronger combinations of
            those research signals.
          </p>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            The score is a research ranking and
            should not be interpreted as a
            projected probability that a prop will
            hit.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-xl font-semibold text-white">
            How to use the NFL prop research tool
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Filter the board by position or prop
            type, then sort by KOF Score, recent
            hit rate, edge versus the current line
            or defensive matchup. Open any player
            to view the individual factors behind
            the ranking.
          </p>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Current historical trends are measured
            against the live prop line, while
            matchup and usage data provide
            additional context before making a
            betting decision.
          </p>
        </div>
      </section>
    </main>
  );
}
