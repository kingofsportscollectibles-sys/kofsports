import type { Metadata } from "next";

import NflDefenseVsPositionTable, {
  type DefenseVsPositionRow,
} from "@/components/nfl/NflDefenseVsPositionTable";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "NFL Defense vs Position Rankings | KofSports",
  description:
    "NFL defense vs position rankings for QB, RB, WR and TE. See fantasy points, yards, receptions, touchdowns and more allowed by every NFL defense.",
  alternates: {
    canonical: "/nfl-defense-vs-position",
  },
};

async function getDefenseVsPositionData() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_defense_vs_position_2025")
    .select("*")
    .order("position")
    .order("ppr_rank");

  if (error) {
    console.error(
      "Failed to load NFL defense vs position data:",
      error
    );

    return [];
  }

  return (data ?? []) as DefenseVsPositionRow[];
}

export default async function NflDefenseVsPositionPage() {
  const rows = await getDefenseVsPositionData();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
          KofSports NFL Research
        </div>

        <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          NFL Defense vs Position Rankings
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400 sm:text-lg">
          Compare every NFL defense by the production they allow to
          quarterbacks, running backs, wide receivers and tight ends.
          Find favorable matchups, difficult spots and position-specific
          defensive trends before researching player props.
        </p>
      </section>

      <NflDefenseVsPositionTable
        rows={rows}
        initialPosition="QB"
        season={2025}
      />

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-xl font-semibold text-white">
            How Defense vs Position Rankings Work
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Defense vs position measures how much statistical and fantasy
            production each NFL defense allows to a specific offensive
            position rather than looking only at overall defensive
            performance.
          </p>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            KofSports ranks all 32 defenses from the most production
            allowed to the least. A ranking of #1 represents the most
            favorable matchup for the selected position, while #32
            represents the toughest.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-xl font-semibold text-white">
            How to Use Defense vs Position
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Use the position filters to compare defenses against
            quarterbacks, running backs, wide receivers and tight ends.
            Sort individual columns to research the specific market you
            are evaluating.
          </p>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            DvP should be used alongside recent player performance,
            snap share, opportunities, injuries, game environment and
            current sportsbook lines rather than as a standalone betting
            signal.
          </p>
        </div>
      </section>
    </main>
  );
}
