import type { Metadata } from "next";
import Link from "next/link";
import NflDefenseVsPositionTable, {
  type DefenseVsPositionRow,
} from "@/components/nfl/NflDefenseVsPositionTable";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "NFL Defense vs Tight Ends 2026: TE Rankings & Stats",
  description:
    "2026 NFL defense vs tight ends rankings. Compare fantasy points, targets, receptions, receiving yards and touchdowns allowed to TEs by all 32 defenses.",
  alternates: {
    canonical: "/nfl-defense-vs-te",
  },
};

async function getDefenseVsPositionData() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("nfl_defense_vs_position")
    .select("*")
    .eq("season", 2026)
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
          NFL Defense vs Tight Ends 2026: TE Matchup Rankings
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400 sm:text-lg">
          Compare every NFL defense vs tight ends using fantasy points,
          targets, receptions, receiving yards, and touchdowns allowed per
          game. Use the 2026 TE defense rankings to identify favorable and
          difficult tight end matchups for fantasy football and NFL player
          prop research.
        </p>

        <p className="mt-4 text-sm font-semibold text-emerald-400">
          2026 Season • Updated as games are processed
        </p>
      </section>

      <NflDefenseVsPositionTable
        rows={rows}
        initialPosition="TE"
        season={2026}
      />

      <section className="mt-12 space-y-12">
        <div>
          <h2 className="text-2xl font-bold text-white">
            NFL Defense Rankings vs Tight Ends
          </h2>

          <div className="mt-4 max-w-4xl space-y-4 text-sm leading-7 text-zinc-400 sm:text-base">
            <p>
              The rankings above compare all 32 NFL defenses by the production
              they allow to tight ends. Sort the table by fantasy points,
              targets, receptions, receiving yards, or receiving touchdowns to
              evaluate different parts of a TE matchup.
            </p>

            <p>
              A defense that allows significant target and reception volume to
              tight ends may create a different type of matchup than one that
              primarily allows touchdowns or explosive receiving production.
              Looking beyond a single overall ranking provides more context for
              fantasy football and player prop research.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            How to Read NFL Defense vs TE Rankings
          </h2>

          <div className="mt-4 max-w-4xl space-y-4 text-sm leading-7 text-zinc-400 sm:text-base">
            <p>
              A ranking of #1 represents the defense allowing the most
              full-PPR fantasy production to tight ends, making it the most
              favorable matchup by this measure. A ranking of #32 represents
              the defense allowing the least production to the position.
            </p>

            <p>
              Targets and receptions help measure opportunity allowed, while
              receiving yards and touchdowns show how much production opposing
              tight ends have generated from those opportunities. Click any
              column heading to sort the TE vs defense table by the statistic
              most relevant to your research.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            Using TE vs Defense Stats for NFL Player Props
          </h2>

          <div className="mt-4 max-w-4xl space-y-4 text-sm leading-7 text-zinc-400 sm:text-base">
            <p>
              Defense vs tight end data can provide useful matchup context for
              receptions, receiving yards, and touchdown props. Start by
              identifying how much opportunity and production a defense has
              allowed to the position, then compare that matchup with the
              individual tight end&apos;s recent role.
            </p>

            <p>
              Defense vs position should not be used by itself. Combine these
              rankings with snap share, targets, red-zone usage, recent player
              performance, injuries, game environment, and current sportsbook
              lines.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/nfl-snap-counts"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:border-emerald-500/50"
            >
              NFL Snap Counts
            </Link>

            <Link
              href="/nfl-red-zone-targets"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:border-emerald-500/50"
            >
              NFL Red Zone Targets
            </Link>

            <Link
              href="/nfl-player-prop-trends"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:border-emerald-500/50"
            >
              NFL Player Prop Trends
            </Link>

            <Link
              href="/nfl-defense-vs-position"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:border-emerald-500/50"
            >
              All Defense vs Position Rankings
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            NFL Defense vs Tight Ends FAQ
          </h2>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold text-white">
                Which NFL defenses allow the most production to tight ends?
              </h3>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-zinc-400 sm:text-base">
                The table above ranks all 32 defenses using full-PPR fantasy
                points allowed per game to tight ends. You can also sort by
                targets, receptions, receiving yards, and touchdowns allowed.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">
                What does defense vs TE mean?
              </h3>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-zinc-400 sm:text-base">
                Defense vs TE measures how opposing tight ends have performed
                against a defense. It can include targets, receptions,
                receiving yards, touchdowns, and fantasy points allowed to the
                tight end position.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">
                How are the NFL defense vs tight end rankings calculated?
              </h3>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-zinc-400 sm:text-base">
                The default ranking orders defenses by full-PPR fantasy points
                allowed per game to tight ends. The table can also be sorted by
                the individual receiving statistics shown above.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">
                Are defense vs tight end rankings useful for player props?
              </h3>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-zinc-400 sm:text-base">
                They can help provide matchup context for tight end receptions,
                receiving yards, and touchdown props. They are most useful when
                combined with player usage, recent performance, injuries, and
                current betting lines.
              </p>
            </div>
          </div>
        </div>

        <p className="border-t border-zinc-800 pt-8 text-sm leading-6 text-zinc-500">
          Defense vs position data is provided for research and informational
          purposes. Historical matchup results do not guarantee future player
          performance or betting outcomes.
        </p>
      </section>
    </main>
  );
}
