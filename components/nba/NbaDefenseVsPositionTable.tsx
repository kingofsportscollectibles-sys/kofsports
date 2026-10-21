"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

import type {
  NbaDefenseVsPosition,
  NbaDvpMatchupProp,
  NbaDvpPosition,
} from "@/lib/nba/defense-vs-position";

type Props = {
  rows: NbaDefenseVsPosition[];
  matchupProps: NbaDvpMatchupProp[];
};

type Timeframe = "season" | "last5" | "last10";

type Metric =
  | "points"
  | "rebounds"
  | "assists"
  | "threes";

const POSITION_ORDER: NbaDvpPosition[] = ["G", "F", "C"];

const POSITION_LABELS: Record<NbaDvpPosition, string> = {
  G: "Guards",
  F: "Forwards",
  C: "Centers",
};

const TIMEFRAMES: {
  key: Timeframe;
  label: string;
}[] = [
  { key: "season", label: "Season" },
  { key: "last5", label: "Last 5" },
  { key: "last10", label: "Last 10" },
];

const METRICS: {
  key: Metric;
  label: string;
  shortLabel: string;
}[] = [
  {
    key: "points",
    label: "Points Allowed",
    shortLabel: "PTS",
  },
  {
    key: "rebounds",
    label: "Rebounds Allowed",
    shortLabel: "REB",
  },
  {
    key: "assists",
    label: "Assists Allowed",
    shortLabel: "AST",
  },
  {
    key: "threes",
    label: "3-Pointers Made Allowed",
    shortLabel: "3PM",
  },
];

const METRIC_PROP_MARKETS: Record<
  Metric,
  NbaDvpMatchupProp["market"]
> = {
  points: "player_points",
  rebounds: "player_rebounds",
  assists: "player_assists",
  threes: "player_threes",
};

const TEAM_NAMES: Record<string, string> = {
  ATL: "Atlanta Hawks",
  BOS: "Boston Celtics",
  BKN: "Brooklyn Nets",
  CHA: "Charlotte Hornets",
  CHI: "Chicago Bulls",
  CLE: "Cleveland Cavaliers",
  DAL: "Dallas Mavericks",
  DEN: "Denver Nuggets",
  DET: "Detroit Pistons",
  GSW: "Golden State Warriors",
  HOU: "Houston Rockets",
  IND: "Indiana Pacers",
  LAC: "LA Clippers",
  LAL: "Los Angeles Lakers",
  MEM: "Memphis Grizzlies",
  MIA: "Miami Heat",
  MIL: "Milwaukee Bucks",
  MIN: "Minnesota Timberwolves",
  NOP: "New Orleans Pelicans",
  NYK: "New York Knicks",
  OKC: "Oklahoma City Thunder",
  ORL: "Orlando Magic",
  PHI: "Philadelphia 76ers",
  PHX: "Phoenix Suns",
  POR: "Portland Trail Blazers",
  SAC: "Sacramento Kings",
  SAS: "San Antonio Spurs",
  TOR: "Toronto Raptors",
  UTA: "Utah Jazz",
  WAS: "Washington Wizards",
};

function getMetricValue(
  row: NbaDefenseVsPosition,
  timeframe: Timeframe,
  metric: Metric,
): number | null {
  if (timeframe === "season") {
    if (metric === "points") {
      return row.pointsAllowedPerGame;
    }

    if (metric === "rebounds") {
      return row.reboundsAllowedPerGame;
    }

    if (metric === "assists") {
      return row.assistsAllowedPerGame;
    }

    return row.threesAllowedPerGame;
  }

  if (timeframe === "last5") {
    if (metric === "points") {
      return row.last5PointsAllowedPerGame;
    }

    if (metric === "rebounds") {
      return row.last5ReboundsAllowedPerGame;
    }

    if (metric === "assists") {
      return row.last5AssistsAllowedPerGame;
    }

    return row.last5ThreesAllowedPerGame;
  }

  if (metric === "points") {
    return row.last10PointsAllowedPerGame;
  }

  if (metric === "rebounds") {
    return row.last10ReboundsAllowedPerGame;
  }

  if (metric === "assists") {
    return row.last10AssistsAllowedPerGame;
  }

  return row.last10ThreesAllowedPerGame;
}

function getSampleSize(
  row: NbaDefenseVsPosition,
  timeframe: Timeframe,
): number {
  if (timeframe === "last5") {
    return row.last5Games;
  }

  if (timeframe === "last10") {
    return row.last10Games;
  }

  return row.seasonGames;
}

function formatValue(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return value.toFixed(1);
}

function getRankClass(rank: number) {
  if (rank <= 5) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (rank <= 12) {
    return "border-green-500/20 bg-green-500/5 text-green-300";
  }

  if (rank >= 28) {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (rank >= 21) {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }

  return "border-white/10 bg-white/5 text-zinc-300";
}

export default function NbaDefenseVsPositionTable({
  rows,
  matchupProps,
}: Props) {
  const [position, setPosition] =
    useState<NbaDvpPosition>("G");
  const [timeframe, setTimeframe] =
    useState<Timeframe>("season");
  const [metric, setMetric] =
    useState<Metric>("points");
  const [expandedDefense, setExpandedDefense] =
    useState<string | null>(null);

  const matchupPropsByDefense = useMemo(() => {
    const selectedMarket = METRIC_PROP_MARKETS[metric];
    const grouped = new Map<string, NbaDvpMatchupProp[]>();

    for (const prop of matchupProps) {
      if (
        prop.positionGroup !== position ||
        prop.market !== selectedMarket
      ) {
        continue;
      }

      const current = grouped.get(prop.opponent) ?? [];
      current.push(prop);
      grouped.set(prop.opponent, current);
    }

    return grouped;
  }, [matchupProps, position, metric]);

  const rankedRows = useMemo(() => {
    return rows
      .filter((row) => row.positionGroup === position)
      .map((row) => ({
        row,
        value: getMetricValue(row, timeframe, metric),
      }))
      .sort((a, b) => {
        if (a.value === null && b.value === null) {
          return a.row.defense.localeCompare(b.row.defense);
        }

        if (a.value === null) {
          return 1;
        }

        if (b.value === null) {
          return -1;
        }

        if (b.value !== a.value) {
          return b.value - a.value;
        }

        return a.row.defense.localeCompare(b.row.defense);
      });
  }, [rows, position, timeframe, metric]);

  return (
    <section className="w-full">
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Position
          </div>

          <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950/70 p-1">
            {POSITION_ORDER.map((item) => {
              const active = item === position;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPosition(item)}
                  className={[
                    "min-w-[64px] rounded-lg px-4 py-2 text-center text-sm font-bold transition",
                    active
                      ? "bg-white text-black shadow-sm"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Timeframe
          </div>

          <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950/70 p-1">
            {TIMEFRAMES.map((item) => {
              const active = item.key === timeframe;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTimeframe(item.key)}
                  className={[
                    "rounded-lg px-3 py-2 text-center text-sm font-bold transition",
                    active
                      ? "bg-white text-black shadow-sm"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Rank By
          </div>

          <select
            value={metric}
            onChange={(event) =>
              setMetric(event.target.value as Metric)
            }
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-emerald-500/50"
          >
            {METRICS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-sm leading-6 text-zinc-400">
        <span className="font-semibold text-white">
          How to read the rankings:
        </span>{" "}
        #1 allows the most production in the selected category.
        Higher-ranked defenses represent more favorable statistical
        matchups for opposing {POSITION_LABELS[position].toLowerCase()}.
        Sample size reflects games in the selected timeframe where
        at least one player classified at that position appeared.
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left md:min-w-[760px] md:table-auto">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/70">
                <th className="w-[62px] bg-zinc-950 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 md:px-4">
                  Rank
                </th>

                <th className="bg-zinc-950 px-2 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 md:px-4">
                  Defense
                </th>

                <th className="w-[64px] px-2 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 md:px-4">
                  GP
                </th>

                {METRICS.map((item) => (
                  <th
                    key={item.key}
                    className={[
                      "whitespace-nowrap px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 md:px-4",
                      item.key === metric
                        ? "w-[82px]"
                        : "hidden md:table-cell",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => setMetric(item.key)}
                      className="hover:text-white"
                    >
                      {item.shortLabel}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rankedRows.map(({ row }, index) => {
                const rank = index + 1;
                const sampleSize = getSampleSize(
                  row,
                  timeframe,
                );

                const defenseProps =
                  matchupPropsByDefense.get(row.defense) ?? [];

                return (
                  <Fragment
                    key={`${row.defense}-${row.positionGroup}`}
                  >
                    <tr
                      className="border-b border-white/[0.06] transition hover:bg-white/[0.035]"
                    >
                    <td className="w-[62px] bg-zinc-950 px-3 py-3 md:px-4">
                      <span
                        className={[
                          "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-bold",
                          getRankClass(rank),
                        ].join(" ")}
                      >
                        {rank}
                      </span>
                    </td>

                    <td className="bg-zinc-950 px-2 py-3 md:px-4">
                      <div className="flex flex-col items-start gap-1 md:flex-row md:items-center md:gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-black text-white">
                          {row.defense}
                        </div>

                        <div>
                          <div className="hidden whitespace-nowrap text-sm font-bold text-white md:block">
                            {TEAM_NAMES[row.defense] ??
                              row.defense}
                          </div>

                          <div className="whitespace-nowrap text-xs text-zinc-500">
                            {sampleSize} games
                          </div>

                          {(matchupPropsByDefense.get(row.defense)?.length ?? 0) > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedDefense((current) =>
                                  current === row.defense
                                    ? null
                                    : row.defense,
                                )
                              }
                              className="mt-1 whitespace-nowrap text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
                              aria-expanded={
                                expandedDefense === row.defense
                              }
                            >
                              {expandedDefense === row.defense
                                ? "Hide Props"
                                : `Props (${
                                    matchupPropsByDefense.get(
                                      row.defense,
                                    )?.length ?? 0
                                  })`}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-3 text-right text-sm tabular-nums text-zinc-400 md:px-4">
                      {sampleSize}
                    </td>

                    {METRICS.map((item) => {
                      const value = getMetricValue(
                        row,
                        timeframe,
                        item.key,
                      );

                      return (
                        <td
                          key={item.key}
                          className={[
                            "whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums md:px-4",
                            item.key === metric
                              ? "w-[82px] font-bold text-white"
                              : "hidden text-zinc-300 md:table-cell",
                          ].join(" ")}
                        >
                          {formatValue(value)}
                        </td>
                      );
                    })}
                    </tr>

                    {expandedDefense === row.defense &&
                      defenseProps.length > 0 && (
                        <tr className="border-b border-white/[0.06]">
                          <td
                            colSpan={7}
                            className="bg-zinc-900/60 px-3 py-4 md:px-4"
                          >
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="text-sm font-bold text-white">
                                  {POSITION_LABELS[position]} vs{" "}
                                  {TEAM_NAMES[row.defense] ??
                                    row.defense}
                                </div>

                                <div className="mt-1 text-xs text-zinc-500">
                                  Current DraftKings{" "}
                                  {metric === "points"
                                    ? "Points"
                                    : metric === "rebounds"
                                      ? "Rebounds"
                                      : metric === "assists"
                                        ? "Assists"
                                        : "3-Pointers Made"}{" "}
                                  props
                                </div>
                              </div>

                              <Link
                                href="/nba/player-prop-trends"
                                className="text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
                              >
                                View all NBA props →
                              </Link>
                            </div>

                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                              {defenseProps.map((prop) => {
                                const l5Rate =
                                  prop.l5Games > 0
                                    ? Math.round(
                                        (prop.l5Overs /
                                          prop.l5Games) *
                                          100,
                                      )
                                    : null;

                                const content = (
                                  <>
                                    <div className="font-bold text-white">
                                      {prop.playerName}
                                    </div>

                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                                      {prop.playerTeam && (
                                        <span>
                                          {prop.playerTeam}
                                        </span>
                                      )}

                                      <span>
                                        Line {prop.line}
                                      </span>

                                      <span>
                                        L5{" "}
                                        {l5Rate === null
                                          ? "—"
                                          : `${prop.l5Overs}/${prop.l5Games} (${l5Rate}%)`}
                                      </span>
                                    </div>
                                  </>
                                );

                                return prop.playerSlug ? (
                                  <Link
                                    key={prop.propId}
                                    href={`/nba/players/${prop.playerSlug}`}
                                    className="rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3 transition hover:border-emerald-500/30 hover:bg-zinc-950"
                                  >
                                    {content}
                                  </Link>
                                ) : (
                                  <div
                                    key={prop.propId}
                                    className="rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3"
                                  >
                                    {content}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-zinc-500">
        NBA positions use the player&apos;s primary listed
        NBA.com position and are grouped as Guard, Forward, or
        Center. Hybrid positions are assigned by their first-listed
        position. Games without an appearance from the selected
        position are not treated as zero production.
      </p>
    </section>
  );
}
