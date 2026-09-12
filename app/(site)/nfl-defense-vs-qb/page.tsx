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
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8">
        <Link
          href="/nfl-defense-vs-position"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400 transition hover:text-emerald-300"
        >
          KofSports NFL Research
        </Link>

        <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          NFL Defense vs QB Rankings
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400 sm:text-lg">
          See how every NFL defense performs against quarterbacks using fantasy points, passing yards, passing touchdowns, interceptions and quarterback rushing production allowed per game.
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
            NFL Defense vs Quarterbacks
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Defense vs quarterback rankings can reveal passing-game matchups that are not obvious from overall defensive statistics. The table combines passing and rushing production allowed to quarterbacks so you can compare all 32 defenses on the same basis.
          </p>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            A ranking of #1 represents the most favorable matchup for
             quarterbacks,
            while #32 represents the toughest matchup based on production
            allowed.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-xl font-semibold text-white">
            How to Use These Rankings
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Use passing yards, passing touchdowns, interceptions and quarterback rushing production to identify what is driving the matchup. This can provide additional context when researching quarterback player props and game environments.
          </p>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Defense vs position is one research signal and should be
            considered alongside recent player performance, snap share,
            opportunities, injuries, game environment and sportsbook lines.
          </p>

          <Link
            href="/nfl-defense-vs-position"
            className="mt-5 inline-flex text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
          >
            View all NFL defense vs position rankings →
          </Link>
        </div>
      </section>
    </main>
  );
}
