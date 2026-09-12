import type { Metadata } from "next";
import Link from "next/link";
import NflDefenseVsPositionTable, {
  type DefenseVsPositionRow,
} from "@/components/nfl/NflDefenseVsPositionTable";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "NFL Defense vs Running Backs Rankings | KofSports",
  description:
    "NFL defense vs running backs rankings showing fantasy points, rushing yards, receptions, receiving yards and touchdowns allowed to RBs.",
  alternates: {
    canonical: "/nfl-defense-vs-rb",
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
          NFL Defense vs Running Backs Rankings
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400 sm:text-lg">
          Compare every NFL defense against running backs using fantasy points, rushing volume, rushing yards, targets, receptions, receiving yards and touchdowns allowed per game.
        </p>
      </section>

      <NflDefenseVsPositionTable
        rows={rows}
        initialPosition="RB"
        season={2025}
      />

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-xl font-semibold text-white">
            NFL Defense vs Running Backs
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Running back matchups depend on more than rushing yards alone. These rankings include both rushing and receiving production, helping identify defenses that allow significant backfield volume and fantasy production.
          </p>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            A ranking of #1 represents the most favorable matchup for
             running backs,
            while #32 represents the toughest matchup based on production
            allowed.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="text-xl font-semibold text-white">
            How to Use These Rankings
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Use rushing attempts and yards to research ground-game matchups, then compare targets, receptions and receiving yards to see how much production a defense allows through the backfield.
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
