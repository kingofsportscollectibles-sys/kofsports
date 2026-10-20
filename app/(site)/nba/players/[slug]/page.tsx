import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getNbaPlayerBySlug,
  getNbaPlayerLatestRegularSeason,
  getNbaPlayerSeasonStats,
  getNbaPlayerGameLog,
} from "@/lib/nba/player-pages";

import {
  getNbaPlayerPropTrendsByPlayer,
  type NbaPropMarket,
} from "@/lib/nba/prop-trends";

import { hasKofSportsProAccess } from "@/lib/auth/entitlements";

type PlayerPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatNbaSeason(season: number): string {
  return `${season}-${String(season + 1).slice(-2)}`;
}

function perGame(value: number, games: number): string {
  if (games === 0) {
    return "0.0";
  }

  return (value / games).toFixed(1);
}

function percentage(made: number, attempted: number): string {
  if (attempted === 0) {
    return "0.0%";
  }

  return `${((made / attempted) * 100).toFixed(1)}%`;
}

function formatOdds(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

function formatRecord(overs: number, games: number): string {
  if (games === 0) {
    return "—";
  }

  return `${overs}/${games}`;
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return `${value}%`;
}

function trendClass(value: number | null): string {
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
}

function marketLabel(market: NbaPropMarket): string {
  switch (market) {
    case "player_points":
      return "Points";
    case "player_rebounds":
      return "Rebounds";
    case "player_assists":
      return "Assists";
    case "player_threes":
      return "3-Pointers Made";
    case "player_points_rebounds_assists":
      return "Points + Rebounds + Assists";
  }
}

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const player = await getNbaPlayerBySlug(slug);

  if (!player) {
    return {
      title: "NBA Player Not Found | KofSports",
    };
  }

  const season =
    await getNbaPlayerLatestRegularSeason(player.playerId);

  const seasonLabel =
    season === null ? "NBA" : formatNbaSeason(season);

  const title =
    `${player.playerName} Stats, Player Props & Trends | KofSports`;

  const description =
    `${player.playerName} NBA stats, player prop trends, game logs, ` +
    `recent performance and betting research for the ${seasonLabel} season.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/nba/players/${player.slug}`,
    },
  };
}

export default async function NbaPlayerPage({
  params,
}: PlayerPageProps) {
  const { slug } = await params;
  const player = await getNbaPlayerBySlug(slug);

  if (!player) {
    notFound();
  }

  const season =
    await getNbaPlayerLatestRegularSeason(player.playerId);

  if (season === null) {
    notFound();
  }

  const [
    stats,
    gameLog,
    propTrends,
    hasProAccess,
  ] = await Promise.all([
    getNbaPlayerSeasonStats(
      player.playerId,
      season,
    ),
    getNbaPlayerGameLog(
      player.playerId,
      season,
    ),
    getNbaPlayerPropTrendsByPlayer(
      player.playerId,
    ),
    hasKofSportsProAccess(),
  ]);

  const seasonLabel = formatNbaSeason(season);

  const statCards = [
    {
      label: "PPG",
      value: perGame(stats.points, stats.games),
    },
    {
      label: "RPG",
      value: perGame(stats.rebounds, stats.games),
    },
    {
      label: "APG",
      value: perGame(stats.assists, stats.games),
    },
    {
      label: "3PM",
      value: perGame(stats.threePointersMade, stats.games),
    },
    {
      label: "FG%",
      value: percentage(
        stats.fieldGoalsMade,
        stats.fieldGoalsAttempted,
      ),
    },
    {
      label: "MPG",
      value: perGame(stats.minutes, stats.games),
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950">
      <section className="border-b border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex h-36 w-36 shrink-0 items-end justify-center overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 md:h-44 md:w-44">
              <img
                src={player.headshotUrl}
                alt={`${player.playerName} headshot`}
                className="h-full w-full -translate-y-2 scale-110 object-contain object-bottom"
              />
            </div>

            <div>
              <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
                KofSports NBA Player Research
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-6xl">
                {player.playerName}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {player.team ? (
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                    {player.team}
                  </span>
                ) : null}

                <span className="text-sm text-slate-500">
                  {seasonLabel} NBA Season
                </span>
              </div>

              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-400">
                Explore {player.playerName}&apos;s NBA stats,
                player prop trends, game logs, recent performance,
                and betting research from KofSports.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              {seasonLabel} Season
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
      </section>

      {propTrends.length > 0 ? (
        <section className="mx-auto max-w-7xl px-6 pb-12">
          <div className="mb-6">
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

          <div className="grid gap-5">
            {propTrends.map((prop) => {
              const averageEdge =
                prop.avgL5 === null
                  ? null
                  : prop.avgL5 - prop.line;

              const trendCards = [
                {
                  label: "Last 5",
                  games: prop.l5Games,
                  overs: prop.l5Overs,
                  pct: prop.l5OverPct,
                  locked: false,
                },
                {
                  label: "Last 10",
                  games: prop.l10Games,
                  overs: prop.l10Overs,
                  pct: prop.l10OverPct,
                  locked: !hasProAccess,
                },
                {
                  label: "Season",
                  games: prop.seasonGames,
                  overs: prop.seasonOvers,
                  pct: prop.seasonOverPct,
                  locked: !hasProAccess,
                },
                {
                  label: prop.upcomingOpponent
                    ? `vs ${prop.upcomingOpponent}`
                    : "Head to Head",
                  games: prop.h2hGames,
                  overs: prop.h2hOvers,
                  pct: prop.h2hOverPct,
                  locked: !hasProAccess,
                },
              ];

              return (
                <article
                  key={prop.propId}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
                >
                  <div className="border-b border-slate-800 p-5 md:p-6">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                      <div>
                        <div className="text-lg font-bold text-white">
                          {marketLabel(prop.market)}
                        </div>

                        <div className="mt-1 text-sm text-slate-400">
                          {player.team ?? "NBA"}
                          {prop.upcomingOpponent
                            ? ` • ${
                                prop.playerTeam === prop.awayTeam
                                  ? "@"
                                  : "vs"
                              } ${prop.upcomingOpponent}`
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
                            Over {formatOdds(prop.overPrice)}
                          </span>
                          <span>
                            Under {formatOdds(prop.underPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-5 md:p-6 lg:grid-cols-4">
                    {trendCards.map((trend) =>
                      trend.locked ? (
                        <a
                          key={trend.label}
                          href="/pro"
                          className="group rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-500/30"
                        >
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {trend.label}
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
                      ) : (
                        <div
                          key={trend.label}
                          className={`rounded-xl border p-4 ${trendClass(
                            trend.pct,
                          )}`}
                        >
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {trend.label}
                          </div>

                          <div className="mt-2 flex items-end justify-between gap-3">
                            <div className="text-xl font-bold text-white">
                              {formatRecord(
                                trend.overs,
                                trend.games,
                              )}
                            </div>

                            <div className="text-sm font-semibold text-slate-300">
                              {formatPercent(trend.pct)}
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="border-t border-slate-800 px-5 py-4 md:px-6">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                      <div>
                        <span className="text-slate-500">
                          L5 Average
                        </span>{" "}
                        <span className="font-bold text-white">
                          {prop.avgL5 ?? "—"}
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

          <div className="mt-5">
            <a
              href="/nba/player-prop-trends"
              className="text-sm font-bold text-emerald-400 transition hover:text-emerald-300"
            >
              View All NBA Player Prop Trends →
            </a>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
            {seasonLabel} Results
          </div>

          <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
            Game Log
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-slate-800 bg-slate-950/60">
                <tr className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Matchup</th>
                  <th className="px-5 py-4 text-right">MIN</th>
                  <th className="px-5 py-4 text-right">PTS</th>
                  <th className="px-5 py-4 text-right">REB</th>
                  <th className="px-5 py-4 text-right">AST</th>
                  <th className="px-5 py-4 text-right">3PM</th>
                  <th className="px-5 py-4 text-right">FG</th>
                  <th className="px-5 py-4 text-right">FT</th>
                  <th className="px-5 py-4 text-right">STL</th>
                  <th className="px-5 py-4 text-right">BLK</th>
                  <th className="px-5 py-4 text-right">TO</th>
                  <th className="px-5 py-4 text-right">+/-</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {gameLog.length > 0 ? (
                  gameLog.map((game) => (
                    <tr
                      key={game.gameId}
                      className="text-sm text-slate-300 transition hover:bg-slate-800/40"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                        {new Date(
                          `${game.gameDate}T12:00:00`,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      <td className="px-5 py-4 font-semibold text-white">
                        {game.isHome ? "vs" : "@"}{" "}
                        {game.opponent}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {game.minutes.toFixed(1)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-white">
                        {game.points}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {game.rebounds}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {game.assists}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {game.threePointersMade}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {game.fieldGoalsMade}/{game.fieldGoalsAttempted}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {game.freeThrowsMade}/{game.freeThrowsAttempted}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {game.steals}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {game.blocks}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {game.turnovers}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {game.plusMinus > 0 ? "+" : ""}
                        {game.plusMinus}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No {seasonLabel} regular-season game data
                      available yet.
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
