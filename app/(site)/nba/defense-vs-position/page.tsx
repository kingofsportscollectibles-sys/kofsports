import type { Metadata } from "next";
import Link from "next/link";

import NbaDefenseVsPositionTable from "@/components/nba/NbaDefenseVsPositionTable";
import {
  getNbaDefenseVsPosition,
  getNbaDvpMatchupProps,
} from "@/lib/nba/defense-vs-position";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "NBA Defense vs Position Rankings | KofSports",
  description:
    "NBA defense vs position rankings for guards, forwards, and centers. Compare points, rebounds, assists, and 3-pointers allowed by every NBA defense.",
  alternates: {
    canonical: "/nba/defense-vs-position",
  },
};

function formatSeasonLabel(season: number): string {
  const nextYear = (season + 1) % 100;

  return `${season}–${String(nextYear).padStart(2, "0")}`;
}

function formatThroughDate(value: string): string {
  const date = new Date(`${value}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function NbaDefenseVsPositionPage() {
  const [rows, matchupProps] = await Promise.all([
    getNbaDefenseVsPosition(),
    getNbaDvpMatchupProps(),
  ]);

  const season =
    rows.length > 0
      ? Math.max(...rows.map((row) => row.season))
      : null;

  const throughDate =
    rows.length > 0
      ? rows
          .map((row) => row.throughDate)
          .sort((a, b) => b.localeCompare(a))[0]
      : null;

  const seasonLabel =
    season === null ? null : formatSeasonLabel(season);

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            KofSports NBA Research
          </div>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
            NBA Defense vs Position Rankings
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
            Compare NBA defenses by the production they allow to
            guards, forwards, and centers. Research points, rebounds,
            assists, and 3-pointers allowed by position to identify
            favorable statistical matchups.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            {seasonLabel && (
              <span>{seasonLabel} Regular Season</span>
            )}

            {seasonLabel && throughDate && (
              <span className="hidden sm:inline">•</span>
            )}

            {throughDate && (
              <span>
                Through {formatThroughDate(throughDate)}
              </span>
            )}

            {(seasonLabel || throughDate) && (
              <span className="hidden sm:inline">•</span>
            )}

            <span>
              Guards • Forwards • Centers
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {rows.length > 0 ? (
          <NbaDefenseVsPositionTable
            rows={rows}
            matchupProps={matchupProps}
          />
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-xl font-bold text-white">
              NBA Defense vs Position Data Unavailable
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Defense vs position rankings will appear when
              regular-season NBA game data is available.
            </p>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 p-7 md:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                Continue Your Research
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                Compare the matchup with today&apos;s player props.
              </h2>

              <p className="mt-3 leading-7 text-slate-400">
                Defense vs position provides matchup context.
                Combine it with current sportsbook lines and recent
                player results before evaluating an NBA player prop.
              </p>
            </div>

            <Link
              href="/nba/player-prop-trends"
              className="shrink-0 rounded-xl bg-emerald-500 px-6 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              View NBA Player Props
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-3xl font-black tracking-tight text-white">
            How NBA Defense vs Position Rankings Work
          </h2>

          <p className="mt-5 leading-7 text-slate-400">
            NBA defense vs position measures the statistical
            production a defense allows to opposing players grouped
            by position. KofSports ranks defenses from the most
            production allowed to the least for the selected stat.
            A ranking of #1 therefore represents the most production
            allowed and a potentially more favorable statistical
            matchup for the opposing position.
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-white">
                Season vs Recent Matchups
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Season rankings provide the larger sample, while
                Last 5 and Last 10 show how the defense has performed
                across its most recent team games. Recent samples
                stay within the selected season and do not silently
                carry over games from a previous season.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Position Sample Size
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Games are counted for a position only when at least
                one opposing player classified in that position
                appeared. A game without a center, for example, is
                not recorded as zero center production. The GP
                column shows the actual sample used for the selected
                position and timeframe.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Guard, Forward & Center Groups
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                KofSports uses the player&apos;s primary listed
                NBA.com position and groups players as Guard,
                Forward, or Center. For hybrid listings, the
                first-listed position determines the group.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                How to Use NBA DvP
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Defense vs position is matchup context rather than a
                standalone betting signal. Consider the player&apos;s
                recent production, expected minutes, role, injuries,
                game environment, and current sportsbook line
                alongside the defensive matchup.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
