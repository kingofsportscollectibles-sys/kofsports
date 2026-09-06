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
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-4xl">
          <div className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">
            NFL Research Tools
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            NFL Defense vs Position Rankings
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400 sm:text-lg">
            Compare every NFL defense by the fantasy production
            they allow to quarterbacks, running backs, wide
            receivers and tight ends. Use the tabs below to find
            favorable matchups and tougher spots by position.
          </p>
        </header>

        <NflDefenseVsPositionTable
          rows={rows}
          initialPosition="QB"
          season={2025}
        />

        <section className="mt-12 max-w-4xl border-t border-white/10 pt-10">
          <h2 className="text-2xl font-bold">
            How NFL Defense vs Position Rankings Work
          </h2>

          <p className="mt-4 leading-7 text-zinc-400">
            Defense vs position rankings measure how much
            statistical and fantasy production each NFL defense
            allows to a specific offensive position. Instead of
            looking only at overall defensive rankings, you can
            compare how a defense performs specifically against
            quarterbacks, running backs, wide receivers or tight
            ends.
          </p>

          <p className="mt-4 leading-7 text-zinc-400">
            KofSports ranks defenses from the most fantasy
            production allowed to the least. A ranking of #1
            represents the most favorable matchup for the selected
            offensive position, while #32 represents the toughest
            matchup.
          </p>

          <h2 className="mt-8 text-2xl font-bold">
            Why Defense vs Position Matters
          </h2>

          <p className="mt-4 leading-7 text-zinc-400">
            NFL defense vs position data can help identify matchup
            advantages that may not be obvious from a team&apos;s
            overall defensive statistics. A defense can be strong
            overall while still allowing significant production to
            one position group, or it can struggle as a whole while
            remaining difficult against a specific position.
          </p>

          <p className="mt-4 leading-7 text-zinc-400">
            These rankings can be used as one part of fantasy
            football, player prop and DFS research alongside player
            usage, recent form, injuries, expected game script and
            current betting lines.
          </p>
        </section>
      </div>
    </main>
  );
}
