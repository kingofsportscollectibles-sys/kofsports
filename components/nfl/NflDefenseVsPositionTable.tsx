"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type DvpPosition = "QB" | "RB" | "WR" | "TE";

export type DefenseVsPositionRow = {
  defense: string;
  position: DvpPosition;
  games: number;

  passing_yards_per_game: number | string;
  passing_touchdowns_per_game: number | string;
  interceptions_per_game: number | string;

  rushing_attempts_per_game: number | string;
  rushing_yards_per_game: number | string;
  rushing_touchdowns_per_game: number | string;

  targets_per_game: number | string;
  receptions_per_game: number | string;
  receiving_yards_per_game: number | string;
  receiving_touchdowns_per_game: number | string;

  ppr_fantasy_points_per_game: number | string;
  ppr_rank: number;
};

type Props = {
  rows: DefenseVsPositionRow[];
  initialPosition?: DvpPosition;
  season?: number;
};

type SortDirection = "asc" | "desc";

type SortConfig = {
  key: keyof DefenseVsPositionRow;
  direction: SortDirection;
};

const POSITION_ORDER: DvpPosition[] = ["QB", "RB", "WR", "TE"];

const POSITION_URLS: Record<DvpPosition, string> = {
  QB: "/nfl-defense-vs-qb",
  RB: "/nfl-defense-vs-rb",
  WR: "/nfl-defense-vs-wr",
  TE: "/nfl-defense-vs-te",
};

const TEAM_NAMES: Record<string, string> = {
  ARI: "Arizona Cardinals",
  ATL: "Atlanta Falcons",
  BAL: "Baltimore Ravens",
  BUF: "Buffalo Bills",
  CAR: "Carolina Panthers",
  CHI: "Chicago Bears",
  CIN: "Cincinnati Bengals",
  CLE: "Cleveland Browns",
  DAL: "Dallas Cowboys",
  DEN: "Denver Broncos",
  DET: "Detroit Lions",
  GB: "Green Bay Packers",
  HOU: "Houston Texans",
  IND: "Indianapolis Colts",
  JAX: "Jacksonville Jaguars",
  KC: "Kansas City Chiefs",
  LA: "Los Angeles Rams",
  LAC: "Los Angeles Chargers",
  LV: "Las Vegas Raiders",
  MIA: "Miami Dolphins",
  MIN: "Minnesota Vikings",
  NE: "New England Patriots",
  NO: "New Orleans Saints",
  NYG: "New York Giants",
  NYJ: "New York Jets",
  PHI: "Philadelphia Eagles",
  PIT: "Pittsburgh Steelers",
  SEA: "Seattle Seahawks",
  SF: "San Francisco 49ers",
  TB: "Tampa Bay Buccaneers",
  TEN: "Tennessee Titans",
  WAS: "Washington Commanders",
};

type Column = {
  key: keyof DefenseVsPositionRow;
  label: string;
  decimals?: number;
};

const POSITION_COLUMNS: Record<DvpPosition, Column[]> = {
  QB: [
    {
      key: "ppr_fantasy_points_per_game",
      label: "Fantasy Pts",
      decimals: 2,
    },
    {
      key: "passing_yards_per_game",
      label: "Pass Yds",
      decimals: 1,
    },
    {
      key: "passing_touchdowns_per_game",
      label: "Pass TD",
      decimals: 2,
    },
    {
      key: "interceptions_per_game",
      label: "INT",
      decimals: 2,
    },
    {
      key: "rushing_yards_per_game",
      label: "Rush Yds",
      decimals: 1,
    },
    {
      key: "rushing_touchdowns_per_game",
      label: "Rush TD",
      decimals: 2,
    },
  ],

  RB: [
    {
      key: "ppr_fantasy_points_per_game",
      label: "Fantasy Pts",
      decimals: 2,
    },
    {
      key: "rushing_attempts_per_game",
      label: "Rush Att",
      decimals: 1,
    },
    {
      key: "rushing_yards_per_game",
      label: "Rush Yds",
      decimals: 1,
    },
    {
      key: "rushing_touchdowns_per_game",
      label: "Rush TD",
      decimals: 2,
    },
    {
      key: "targets_per_game",
      label: "Targets",
      decimals: 1,
    },
    {
      key: "receptions_per_game",
      label: "Rec",
      decimals: 1,
    },
    {
      key: "receiving_yards_per_game",
      label: "Rec Yds",
      decimals: 1,
    },
    {
      key: "receiving_touchdowns_per_game",
      label: "Rec TD",
      decimals: 2,
    },
  ],

  WR: [
    {
      key: "ppr_fantasy_points_per_game",
      label: "Fantasy Pts",
      decimals: 2,
    },
    {
      key: "targets_per_game",
      label: "Targets",
      decimals: 1,
    },
    {
      key: "receptions_per_game",
      label: "Rec",
      decimals: 1,
    },
    {
      key: "receiving_yards_per_game",
      label: "Rec Yds",
      decimals: 1,
    },
    {
      key: "receiving_touchdowns_per_game",
      label: "Rec TD",
      decimals: 2,
    },
  ],

  TE: [
    {
      key: "ppr_fantasy_points_per_game",
      label: "Fantasy Pts",
      decimals: 2,
    },
    {
      key: "targets_per_game",
      label: "Targets",
      decimals: 1,
    },
    {
      key: "receptions_per_game",
      label: "Rec",
      decimals: 1,
    },
    {
      key: "receiving_yards_per_game",
      label: "Rec Yds",
      decimals: 1,
    },
    {
      key: "receiving_touchdowns_per_game",
      label: "Rec TD",
      decimals: 2,
    },
  ],
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatValue(value: number | string, decimals = 1) {
  return toNumber(value).toFixed(decimals);
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

export default function NflDefenseVsPositionTable({
  rows,
  initialPosition = "QB",
  season = 2025,
}: Props) {
  const [position, setPosition] =
    useState<DvpPosition>(initialPosition);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "ppr_rank",
    direction: "asc",
  });

  const columns = POSITION_COLUMNS[position];

  const filteredRows = useMemo(() => {
    const positionRows = rows.filter(
      (row) => row.position === position
    );

    return [...positionRows].sort((a, b) => {
      const key = sortConfig.key;

      const aValue =
        key === "defense"
          ? String(a[key] ?? "")
          : toNumber(a[key] as number | string);

      const bValue =
        key === "defense"
          ? String(b[key] ?? "")
          : toNumber(b[key] as number | string);

      if (typeof aValue === "string") {
        const comparison = aValue.localeCompare(
          String(bValue)
        );

        return sortConfig.direction === "asc"
          ? comparison
          : -comparison;
      }

      const comparison =
        Number(aValue) - Number(bValue);

      return sortConfig.direction === "asc"
        ? comparison
        : -comparison;
    });
  }, [rows, position, sortConfig]);

  function handleSort(key: keyof DefenseVsPositionRow) {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction:
            current.direction === "asc"
              ? "desc"
              : "asc",
        };
      }

      return {
        key,
        direction:
          key === "defense" || key === "ppr_rank"
            ? "asc"
            : "desc",
      };
    });
  }

  function sortIndicator(
    key: keyof DefenseVsPositionRow
  ) {
    if (sortConfig.key !== key) return "";

    return sortConfig.direction === "asc"
      ? " ↑"
      : " ↓";
  }

  return (
    <section className="w-full">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Position
          </div>

          <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950/70 p-1">
            {POSITION_ORDER.map((item) => {
              const active = item === position;

              return (
                <Link
                  key={item}
                  href={POSITION_URLS[item]}
                  onClick={() => {
                    setPosition(item);
                    setSortConfig({
                      key: "ppr_rank",
                      direction: "asc",
                    });
                  }}
                  className={[
                    "min-w-[64px] rounded-lg px-4 py-2 text-center text-sm font-bold transition",
                    active
                      ? "bg-white text-black shadow-sm"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  {item}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="dvp-season"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Season
          </label>

          <select
            id="dvp-season"
            value={season}
            disabled
            className="min-w-[110px] rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm font-semibold text-white outline-none disabled:cursor-default disabled:opacity-100"
          >
            <option value={season}>{season}</option>
          </select>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-sm text-zinc-400">
        <span className="font-semibold text-white">
          Ranking guide:
        </span>{" "}
        #1 allows the most fantasy production to{" "}
        {position}s and represents the most favorable
        matchup. #32 allows the least and represents the
        toughest matchup.
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/70">
                <th className="sticky left-0 z-20 bg-zinc-950 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <button
                    type="button"
                    onClick={() =>
                      handleSort("ppr_rank")
                    }
                    className="hover:text-white"
                  >
                    Rank
                    {sortIndicator("ppr_rank")}
                  </button>
                </th>

                <th className="sticky left-[78px] z-20 bg-zinc-950 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <button
                    type="button"
                    onClick={() =>
                      handleSort("defense")
                    }
                    className="hover:text-white"
                  >
                    Defense
                    {sortIndicator("defense")}
                  </button>
                </th>

                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleSort(column.key)
                      }
                      className="hover:text-white"
                    >
                      {column.label}
                      {sortIndicator(column.key)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={`${row.defense}-${row.position}`}
                  className="border-b border-white/[0.06] transition last:border-0 hover:bg-white/[0.035]"
                >
                  <td className="sticky left-0 z-10 bg-zinc-950 px-4 py-3">
                    <span
                      className={[
                        "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-bold",
                        getRankClass(row.ppr_rank),
                      ].join(" ")}
                    >
                      {row.ppr_rank}
                    </span>
                  </td>

                  <td className="sticky left-[78px] z-10 bg-zinc-950 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-black text-white">
                        {row.defense}
                      </div>

                      <div>
                        <div className="whitespace-nowrap text-sm font-bold text-white">
                          {TEAM_NAMES[row.defense] ??
                            row.defense}
                        </div>

                        <div className="text-xs text-zinc-500">
                          {row.games} games
                        </div>
                      </div>
                    </div>
                  </td>

                  {columns.map((column) => {
                    const isFantasyPoints =
                      column.key ===
                      "ppr_fantasy_points_per_game";

                    return (
                      <td
                        key={column.key}
                        className={[
                          "whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums",
                          isFantasyPoints
                            ? "font-bold text-white"
                            : "text-zinc-300",
                        ].join(" ")}
                      >
                        {formatValue(
                          row[column.key] as
                            | number
                            | string,
                          column.decimals
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-6 py-12 text-center text-sm text-zinc-500"
                  >
                    No defense vs position data is
                    available for {position}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        Statistics represent per-game production allowed
        to the selected offensive position during the{" "}
        {season} NFL regular season. Fantasy points use
        full-PPR scoring.
      </p>
    </section>
  );
}