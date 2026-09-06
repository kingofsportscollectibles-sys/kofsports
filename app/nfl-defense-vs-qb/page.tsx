import type { Metadata } from "next";
import Link from "next/link";
import NflDefenseVsPositionTable, {
  type DefenseVsPositionRow,
} from "@/components/nfl/NflDefenseVsPositionTable";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "NFL Defense vs QB Rankings | KofSports",
  description:
    "NFL defense vs QB rankings showing fantasy points, passing yards, passing touchdowns, interceptions and rushing production allowed to quarterbacks.",
  alternates: {
    canonical: "/nfl-defense-vs-qb",
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

export default async function Page() {
  const rows = await getDefenseVsPositionData();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-4xl">
          <Link
            href="/nfl-defense-vs-position"
            className="mb-3 inline-block text-sm font-bold uppercase tracking-[0.18em] text-zinc-500 transition hover:text-white"
          >
            NFL Defense vs Position
          </Link>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            NFL Defense vs QB Rankings
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400 sm:text-lg">
            See how every NFL defense performed against quarterbacks, including fantasy points, passing yards, passing touchdowns, interceptions and quarterback rushing production allowed per game.
          </p>
        </header>

        <NflDefenseVsPositionTable
          rows={rows}
          initialPosition="QB"
          season={2025}
        />

        <section className="mt-12 max-w-4xl border-t border-white/10 pt-10">
          <h2 className="text-2xl font-bold">
            NFL Defense vs Quarterbacks
          </h2>

          <p className="mt-4 leading-7 text-zinc-400">
            Defense vs quarterback rankings can reveal passing-game matchups that are not obvious from overall defensive statistics. The table combines passing and rushing production allowed to quarterbacks so you can compare all 32 defenses on the same basis.
          </p>

          <p className="mt-4 leading-7 text-zinc-400">
            A ranking of #1 means the defense allowed the most
            fantasy production to QB players during the
            2025 regular season. A ranking of #32 means the defense
            allowed the least. Use the individual statistics in the
            table to understand what is driving each matchup rather
            than relying on fantasy points alone.
          </p>

          <div className="mt-8">
            <Link
              href="/nfl-defense-vs-position"
              className="font-semibold text-white underline decoration-zinc-600 underline-offset-4 transition hover:decoration-white"
            >
              View all NFL defense vs position rankings
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
