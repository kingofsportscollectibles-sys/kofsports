import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getNflPlayerBySlug,
  getNflPlayerSeasonStats,
  getNflPlayerGameLog,
  getNflPlayerUpcomingGame,
} from "@/lib/nfl/player-pages";

import {
  getNflPlayerPropTrendsByPlayer,
} from "@/lib/nfl/prop-trends";

import { hasKofSportsProAccess } from "@/lib/auth/entitlements";

import {
  getNflDefenseVsPositionMatchup,
} from "@/lib/nfl/defense-vs-position";

type PlayerPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const player = await getNflPlayerBySlug(slug);

  if (!player) {
    return {
      title: "NFL Player Not Found | KofSports",
    };
  }

  const title =
    `${player.playerName} Stats, Player Props & Trends | KofSports`;

  const description =
    `${player.playerName} NFL stats, player prop trends, game logs, ` +
    `snap counts, red zone usage, matchup data and betting research ` +
    `for the ${player.season} NFL season.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/nfl/players/${player.slug}`,
    },
  };
}

export default async function NflPlayerPage({
  params,
}: PlayerPageProps) {
  const { slug } = await params;
  const player = await getNflPlayerBySlug(slug);

  if (!player) {
    notFound();
  }

const [
  stats,
  gameLog,
  propTrends,
  hasProAccess,
  upcomingGame,
] = await Promise.all([
  getNflPlayerSeasonStats(
    player.gsisId,
    player.season,
  ),
  getNflPlayerGameLog(
    player.gsisId,
    player.season,
  ),
  getNflPlayerPropTrendsByPlayer(
    player.gsisId,
  ),
  hasKofSportsProAccess(),
  getNflPlayerUpcomingGame(
    player.team,
    player.season,
  ),
]);

const matchup = upcomingGame
  ? await getNflDefenseVsPositionMatchup(
      upcomingGame.opponent,
      player.position,
      player.season,
    )
  : null;

  const completionPct =
    stats.passingAttempts > 0
      ? (
          (stats.passingCompletions /
            stats.passingAttempts) *
          100
        ).toFixed(1)
      : "0.0";

  const totalTouchdowns =
    stats.rushingTouchdowns +
    stats.receivingTouchdowns;

  const statCards =
    player.position === "QB"
      ? [
          {
            label: "Pass Yds",
            value: stats.passingYards,
          },
          {
            label: "Pass TD",
            value: stats.passingTouchdowns,
          },
          {
            label: "Comp %",
            value: `${completionPct}%`,
          },
          {
            label: "Rush Yds",
            value: stats.rushingYards,
          },
          {
            label: "Rush TD",
            value: stats.rushingTouchdowns,
          },
          {
            label: "INT",
            value: stats.interceptions,
          },
        ]
      : player.position === "RB"
        ? [
            {
              label: "Rush Yds",
              value: stats.rushingYards,
            },
            {
              label: "Rush TD",
              value: stats.rushingTouchdowns,
            },
            {
              label: "Carries",
              value: stats.rushingAttempts,
            },
            {
              label: "Rec",
              value: stats.receptions,
            },
            {
              label: "Rec Yds",
              value: stats.receivingYards,
            },
            {
              label: "Rec TD",
              value: stats.receivingTouchdowns,
            },
          ]
        : [
            {
              label: "Rec",
              value: stats.receptions,
            },
            {
              label: "Targets",
              value: stats.targets,
            },
            {
              label: "Rec Yds",
              value: stats.receivingYards,
            },
            {
              label: "Rec TD",
              value: stats.receivingTouchdowns,
            },
            {
              label: "Rush Yds",
              value: stats.rushingYards,
            },
            {
              label: "Total TD",
              value: totalTouchdowns,
            },
          ];

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 md:h-44 md:w-44">
              <div className="text-center">
                <div className="text-4xl font-black text-slate-600">
                  {player.position}
                </div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Player
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
                KofSports NFL Player Research
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-6xl">
                {player.playerName}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                  {player.team}
                </span>

                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
                  {player.position}
                </span>

                <span className="text-sm text-slate-500">
                  {player.season} NFL Season
                </span>
              </div>

              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-400">
                Explore {player.playerName}&apos;s NFL stats,
                player prop trends, game logs, snap counts,
                red zone usage, matchup data, and betting
                research from KofSports.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                {player.season} Season
              </div>

              <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
                Season Snapshot
              </h2>
            </div>

            <div className="text-sm text-slate-500">
              {stats.games} {stats.games === 1 ? "game" : "games"}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  {stat.label}
                </div>

                <div className="mt-2 text-3xl font-black tracking-tight text-white">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

            {upcomingGame ? (
        <section className="mx-auto max-w-7xl px-6 pb-12">
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Week {upcomingGame.week}
            </div>

            <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
              Upcoming Matchup
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 p-5 md:p-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <div className="text-sm font-medium text-slate-500">
                    {player.playerName}
                  </div>

                  <div className="mt-1 text-2xl font-black text-white">
                    {player.team}{" "}
                    <span className="text-slate-500">
                      {upcomingGame.isHome ? "vs" : "@"}
                    </span>{" "}
                    {upcomingGame.opponent}
                  </div>

                  <div className="mt-2 text-sm text-slate-400">
                    {new Date(
                      `${upcomingGame.gameDate}T12:00:00`,
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {matchup ? (
                  <div className="sm:text-right">
           <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
  {upcomingGame.opponent} Allowed to {player.position}s
</div>

<div className="mt-1 text-3xl font-black text-white">
  #{matchup.ppr_rank}
</div>

<div className="mt-1 text-xs font-medium text-slate-400">
  of 32 DvP • {matchup.games}{" "}
  {matchup.games === 1 ? "Game" : "Games"}
</div>
                  </div>
                ) : null}
              </div>
            </div>

            {matchup ? (
              <>
            <div
  className={`grid gap-3 p-5 md:p-6 ${
    player.position === "QB"
      ? "grid-cols-2 md:grid-cols-5"
      : player.position === "RB"
        ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-8"
        : "grid-cols-2 md:grid-cols-5"
  }`}
>
  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
      PPR Pts/G
    </div>
    <div className="mt-2 text-xl font-bold text-white">
      {Number(
        matchup.ppr_fantasy_points_per_game,
      ).toFixed(2)}
    </div>
  </div>

  {player.position === "QB" ? (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Pass Yds/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.passing_yards_per_game,
          ).toFixed(1)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Pass TD/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.passing_touchdowns_per_game,
          ).toFixed(2)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rush Yds/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.rushing_yards_per_game,
          ).toFixed(1)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rush TD/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.rushing_touchdowns_per_game,
          ).toFixed(2)}
        </div>
      </div>
    </>
  ) : player.position === "RB" ? (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rush Att/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.rushing_attempts_per_game,
          ).toFixed(1)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rush Yds/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.rushing_yards_per_game,
          ).toFixed(1)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rush TD/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.rushing_touchdowns_per_game,
          ).toFixed(2)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Targets/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.targets_per_game,
          ).toFixed(1)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rec/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.receptions_per_game,
          ).toFixed(1)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rec Yds/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.receiving_yards_per_game,
          ).toFixed(1)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rec TD/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.receiving_touchdowns_per_game,
          ).toFixed(2)}
        </div>
      </div>
    </>
  ) : (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Targets/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.targets_per_game,
          ).toFixed(1)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rec/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.receptions_per_game,
          ).toFixed(1)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rec Yds/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.receiving_yards_per_game,
          ).toFixed(1)}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Rec TD/G
        </div>
        <div className="mt-2 text-xl font-bold text-white">
          {Number(
            matchup.receiving_touchdowns_per_game,
          ).toFixed(2)}
        </div>
      </div>
    </>
  )}
</div>

                <div className="border-t border-slate-800 px-5 py-4 md:px-6">
                  <a
                    href={`/nfl-defense-vs-${player.position.toLowerCase()}`}
                    className="text-sm font-bold text-emerald-400 transition hover:text-emerald-300"
                  >
                    View {upcomingGame.opponent} vs{" "}
                    {player.position} Rankings →
                  </a>
                </div>
              </>
            ) : (
              <div className="p-5 text-sm text-slate-400 md:p-6">
                Defense vs position data is not yet available
                for this matchup.
              </div>
            )}
          </div>
        </section>
      ) : null}

            {propTrends.length > 0 ? (
        <section className="mx-auto max-w-7xl px-6 pb-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                Current Player Props
              </div>

              <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
                {player.playerName} Player Prop Trends
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Current DraftKings lines and recent performance trends
                for {player.playerName}.
              </p>
            </div>

            <a
              href="/nfl-player-prop-trends"
              className="text-sm font-bold text-emerald-400 transition hover:text-emerald-300"
            >
              View All Player Prop Trends →
            </a>
          </div>

          <div className="grid gap-5">
            {propTrends.map((prop) => {
              const marketLabel =
                prop.market === "player_pass_yds"
                  ? "Passing Yards"
                  : prop.market === "player_rush_yds"
                    ? "Rushing Yards"
                    : "Receiving Yards";

              const formatOdds = (
                value: number | null,
              ) => {
                if (value === null) {
                  return "—";
                }

                return value > 0
                  ? `+${value}`
                  : `${value}`;
              };

              const formatRecord = (
                overs: number,
                games: number,
              ) => {
                if (games === 0) {
                  return "—";
                }

                return `${overs}/${games}`;
              };

              const formatPercent = (
                value: number | null,
              ) => {
                if (value === null) {
                  return "—";
                }

                return `${value}%`;
              };

              const trendClass = (
                value: number | null,
              ) => {
                if (value === null) {
                  return "border-slate-800 bg-slate-950";
                }

                if (value >= 80) {
                  return "border-emerald-500/40 bg-emerald-500/10";
                }

                if (value >= 70) {
                  return "border-emerald-400/30 bg-emerald-400/5";
                }

                if (value <= 40) {
                  return "border-rose-500/30 bg-rose-500/5";
                }

                return "border-slate-800 bg-slate-950";
              };

              const averageEdge =
                prop.avgL5 === null
                  ? null
                  : prop.avgL5 - prop.line;

              return (
                <article
                  key={prop.propId}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                >
                  <div className="border-b border-slate-800 p-5 md:p-6">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                      <div>
                        <div className="text-lg font-bold text-white">
                          {marketLabel}
                        </div>

                        <div className="mt-1 text-sm text-slate-400">
                          {player.team}
                          {prop.upcomingOpponent
                            ? ` • vs ${prop.upcomingOpponent}`
                            : ""}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <div className="text-3xl font-black tracking-tight text-white">
                          {prop.line}
                        </div>

                        <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                          DraftKings
                        </div>

                        <div className="mt-3 flex gap-4 text-xs text-slate-400 sm:justify-end">
                          <span>
                            Over{" "}
                            {formatOdds(
                              prop.overPrice,
                            )}
                          </span>

                          <span>
                            Under{" "}
                            {formatOdds(
                              prop.underPrice,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-5 md:p-6 lg:grid-cols-4">
                    <div
                      className={`rounded-xl border p-4 ${trendClass(
                        prop.l5OverPct,
                      )}`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Last 5
                      </div>

                      <div className="mt-2 flex items-end justify-between gap-3">
                        <div className="text-xl font-bold text-white">
                          {formatRecord(
                            prop.l5Overs,
                            prop.l5Games,
                          )}
                        </div>

                        <div className="text-sm font-semibold text-slate-300">
                          {formatPercent(
                            prop.l5OverPct,
                          )}
                        </div>
                      </div>
                    </div>

                    {hasProAccess ? (
                      <div
                        className={`rounded-xl border p-4 ${trendClass(
                          prop.l10OverPct,
                        )}`}
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Last 10
                        </div>

                        <div className="mt-2 flex items-end justify-between gap-3">
                          <div className="text-xl font-bold text-white">
                            {formatRecord(
                              prop.l10Overs,
                              prop.l10Games,
                            )}
                          </div>

                          <div className="text-sm font-semibold text-slate-300">
                            {formatPercent(
                              prop.l10OverPct,
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <a
                        href="/pro"
                        className="group rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-500/30"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Last 10
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-slate-400">
                            🔒 Pro
                          </span>

                          <span className="text-xs font-semibold text-emerald-500">
                            Unlock →
                          </span>
                        </div>
                      </a>
                    )}

                    {hasProAccess ? (
                      <div
                        className={`rounded-xl border p-4 ${trendClass(
                          prop.seasonOverPct,
                        )}`}
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Season
                        </div>

                        <div className="mt-2 flex items-end justify-between gap-3">
                          <div className="text-xl font-bold text-white">
                            {formatRecord(
                              prop.seasonOvers,
                              prop.seasonGames,
                            )}
                          </div>

                          <div className="text-sm font-semibold text-slate-300">
                            {formatPercent(
                              prop.seasonOverPct,
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <a
                        href="/pro"
                        className="group rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-500/30"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Season
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-slate-400">
                            🔒 Pro
                          </span>

                          <span className="text-xs font-semibold text-emerald-500">
                            Unlock →
                          </span>
                        </div>
                      </a>
                    )}

                    {hasProAccess ? (
                      <div
                        className={`rounded-xl border p-4 ${trendClass(
                          prop.h2hOverPct,
                        )}`}
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {prop.upcomingOpponent
                            ? `vs ${prop.upcomingOpponent}`
                            : "Head to Head"}
                        </div>

                        <div className="mt-2 flex items-end justify-between gap-3">
                          <div className="text-xl font-bold text-white">
                            {formatRecord(
                              prop.h2hOvers,
                              prop.h2hGames,
                            )}
                          </div>

                          <div className="text-sm font-semibold text-slate-300">
                            {formatPercent(
                              prop.h2hOverPct,
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <a
                        href="/pro"
                        className="group rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-500/30"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {prop.upcomingOpponent
                            ? `vs ${prop.upcomingOpponent}`
                            : "Head to Head"}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-slate-400">
                            🔒 Pro
                          </span>

                          <span className="text-xs font-semibold text-emerald-500">
                            Unlock →
                          </span>
                        </div>
                      </a>
                    )}
                  </div>

                  <div className="border-t border-slate-800 px-5 py-4 md:px-6">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                      <div>
                        <span className="text-slate-500">
                          L5 Average
                        </span>{" "}
                        <span className="font-bold text-white">
                          {prop.avgL5 === null
                            ? "—"
                            : prop.avgL5}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500">
                          vs Current Line
                        </span>{" "}
                        <span
                          className={
                            averageEdge === null
                              ? "font-bold text-slate-400"
                              : averageEdge > 0
                                ? "font-bold text-emerald-400"
                                : averageEdge < 0
                                  ? "font-bold text-rose-400"
                                  : "font-bold text-white"
                          }
                        >
                          {averageEdge === null
                            ? "—"
                            : `${averageEdge > 0 ? "+" : ""}${averageEdge.toFixed(
                                1,
                              )}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
            {player.season} Results
          </div>

          <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
            Game Log
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-800 bg-slate-950/60">
                <tr className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Week</th>
                  <th className="px-5 py-4">Matchup</th>

                  {player.position === "QB" ? (
                    <>
                      <th className="px-5 py-4 text-right">
                        Comp/Att
                      </th>
                      <th className="px-5 py-4 text-right">
                        Pass Yds
                      </th>
                      <th className="px-5 py-4 text-right">
                        Pass TD
                      </th>
                      <th className="px-5 py-4 text-right">
                        INT
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rush
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rush Yds
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rush TD
                      </th>
                    </>
                  ) : player.position === "RB" ? (
                    <>
                      <th className="px-5 py-4 text-right">
                        Carries
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rush Yds
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rush TD
                      </th>
                      <th className="px-5 py-4 text-right">
                        Targets
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rec
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rec Yds
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rec TD
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-5 py-4 text-right">
                        Targets
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rec
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rec Yds
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rec TD
                      </th>
                      <th className="px-5 py-4 text-right">
                        Carries
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rush Yds
                      </th>
                      <th className="px-5 py-4 text-right">
                        Rush TD
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {gameLog.length > 0 ? (
                  gameLog.map((game) => (
                    <tr
                      key={`${game.week}-${game.gameDate}`}
                      className="text-sm text-slate-300 transition hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4 font-bold text-white">
                        {game.week}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-white">
                          {game.isHome ? "vs" : "@"}{" "}
                          {game.opponent}
                        </span>
                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(
                            `${game.gameDate}T12:00:00`,
                          ).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </div>
                      </td>

                      {player.position === "QB" ? (
                        <>
                          <td className="px-5 py-4 text-right">
                            {game.passingCompletions}/
                            {game.passingAttempts}
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-white">
                            {game.passingYards}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.passingTouchdowns}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.interceptions}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.rushingAttempts}
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-white">
                            {game.rushingYards}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.rushingTouchdowns}
                          </td>
                        </>
                      ) : player.position === "RB" ? (
                        <>
                          <td className="px-5 py-4 text-right">
                            {game.rushingAttempts}
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-white">
                            {game.rushingYards}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.rushingTouchdowns}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.targets}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.receptions}
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-white">
                            {game.receivingYards}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.receivingTouchdowns}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-4 text-right">
                            {game.targets}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.receptions}
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-white">
                            {game.receivingYards}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.receivingTouchdowns}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.rushingAttempts}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.rushingYards}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {game.rushingTouchdowns}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No {player.season} game data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
