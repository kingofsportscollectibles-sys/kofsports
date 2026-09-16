"use client";

import { useMemo, useState } from "react";

import type { NflPlayerPropRecord } from "@/lib/nfl/player-prop-records";

type PositionFilter = "all" | "QB" | "RB" | "WR" | "TE";

type MarketFilter =
  | "overall"
  | "passing"
  | "rushing"
  | "receiving";

type SortOption =
  | "cover-desc"
  | "delta-desc"
  | "player-asc";

type Props = {
  records: NflPlayerPropRecord[];
};

function formatPct(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function formatDelta(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function formatRecord(
  wins: number,
  losses: number,
  pushes: number,
  graded: number,
) {
  if (graded === 0) {
    return "—";
  }

  if (pushes > 0) {
    return `${wins}-${losses}-${pushes}`;
  }

  return `${wins}-${losses}`;
}

function getCoverClass(value: number | null) {
  if (value === null) {
    return "text-slate-400";
  }

  if (value >= 70) {
    return "text-emerald-400";
  }

  if (value >= 60) {
    return "text-emerald-300";
  }

  if (value <= 40) {
    return "text-rose-400";
  }

  return "text-white";
}

function getDeltaClass(value: number | null) {
  if (value === null) {
    return "text-slate-500";
  }

  if (value > 0) {
    return "text-emerald-400";
  }

  if (value < 0) {
    return "text-rose-400";
  }

  return "text-slate-300";
}

function getMarketStats(
  record: NflPlayerPropRecord,
  market: MarketFilter,
) {
  switch (market) {
    case "passing":
      return {
        wins: record.passWins,
        losses: record.passLosses,
        pushes: record.passPushes,
        graded: record.passGradedProps,
        coverPct: record.passCoverPct,
        avgDelta: record.passAvgDelta,
      };

    case "rushing":
      return {
        wins: record.rushWins,
        losses: record.rushLosses,
        pushes: record.rushPushes,
        graded: record.rushGradedProps,
        coverPct: record.rushCoverPct,
        avgDelta: record.rushAvgDelta,
      };

    case "receiving":
      return {
        wins: record.receivingWins,
        losses: record.receivingLosses,
        pushes: record.receivingPushes,
        graded: record.receivingGradedProps,
        coverPct: record.receivingCoverPct,
        avgDelta: record.receivingAvgDelta,
      };

    case "overall":
      return {
        wins: record.wins,
        losses: record.losses,
        pushes: record.pushes,
        graded: record.gradedProps,
        coverPct: record.coverPct,
        avgDelta: record.avgDelta,
      };
  }
}

function MarketRecord({
  wins,
  losses,
  pushes,
  graded,
}: {
  wins: number;
  losses: number;
  pushes: number;
  graded: number;
}) {
  return (
    <span className="font-semibold text-slate-200">
      {formatRecord(
        wins,
        losses,
        pushes,
        graded,
      )}
    </span>
  );
}

export default function NflPlayerPropRecordsExplorer({
  records,
}: Props) {
  const [search, setSearch] = useState("");
  const [position, setPosition] =
    useState<PositionFilter>("all");
  const [market, setMarket] =
    useState<MarketFilter>("overall");
  const [minimumProps, setMinimumProps] =
    useState(1);
  const [sort, setSort] =
    useState<SortOption>("cover-desc");

  const filteredRecords = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    const results = records.filter((record) => {
      if (
        normalizedSearch &&
        !record.playerName
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (
        position !== "all" &&
        record.position !== position
      ) {
        return false;
      }

      const stats = getMarketStats(
        record,
        market,
      );

      if (stats.graded < minimumProps) {
        return false;
      }

      return true;
    });

    return [...results].sort((a, b) => {
      if (sort === "player-asc") {
        return a.playerName.localeCompare(
          b.playerName,
        );
      }

      const aStats = getMarketStats(a, market);
      const bStats = getMarketStats(b, market);

      if (sort === "delta-desc") {
        if (
          aStats.avgDelta !== bStats.avgDelta
        ) {
          return (
            (bStats.avgDelta ??
              Number.NEGATIVE_INFINITY) -
            (aStats.avgDelta ??
              Number.NEGATIVE_INFINITY)
          );
        }

        return bStats.graded - aStats.graded;
      }

      if (
        aStats.coverPct !== bStats.coverPct
      ) {
        return (
          (bStats.coverPct ?? -1) -
          (aStats.coverPct ?? -1)
        );
      }

      if (aStats.graded !== bStats.graded) {
        return bStats.graded - aStats.graded;
      }

      if (
        aStats.avgDelta !== bStats.avgDelta
      ) {
        return (
          (bStats.avgDelta ??
            Number.NEGATIVE_INFINITY) -
          (aStats.avgDelta ??
            Number.NEGATIVE_INFINITY)
        );
      }

      return a.playerName.localeCompare(
        b.playerName,
      );
    });
  }, [
    records,
    search,
    position,
    market,
    minimumProps,
    sort,
  ]);

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="md:col-span-2 xl:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Search Player
            </label>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search player..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Position
            </label>

            <select
              value={position}
              onChange={(event) =>
                setPosition(
                  event.target
                    .value as PositionFilter,
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="all">
                All Positions
              </option>
              <option value="QB">QB</option>
              <option value="RB">RB</option>
              <option value="WR">WR</option>
              <option value="TE">TE</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Prop Type
            </label>

            <select
              value={market}
              onChange={(event) =>
                setMarket(
                  event.target
                    .value as MarketFilter,
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="overall">
                All Props
              </option>
              <option value="passing">
                Passing Yards
              </option>
              <option value="rushing">
                Rushing Yards
              </option>
              <option value="receiving">
                Receiving Yards
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Minimum Props
            </label>

            <select
              value={minimumProps}
              onChange={(event) =>
                setMinimumProps(
                  Number(event.target.value),
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value={1}>1+</option>
              <option value={2}>2+</option>
              <option value={3}>3+</option>
              <option value={5}>5+</option>
              <option value={10}>10+</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sort By
            </label>

            <select
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target.value as SortOption,
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="cover-desc">
                Highest Cover %
              </option>
              <option value="delta-desc">
                Highest Avg vs Line
              </option>
              <option value="player-asc">
                Player A–Z
              </option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">
            Records are graded against each
            game&apos;s captured DraftKings
            pregame line.
          </div>

          <div className="text-sm text-slate-400">
            Showing{" "}
            <span className="font-bold text-white">
              {filteredRecords.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-white">
              {records.length}
            </span>{" "}
            players
          </div>
        </div>
      </div>

      {filteredRecords.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-4 text-center">
                      #
                    </th>
                    <th className="px-4 py-4">
                      Player
                    </th>
                    <th className="px-4 py-4 text-center">
                      Record
                    </th>
                    <th className="px-4 py-4 text-center">
                      Cover
                    </th>
                    <th className="px-4 py-4 text-center">
                      Avg vs Line
                    </th>
                    <th className="px-4 py-4 text-center">
                      Pass
                    </th>
                    <th className="px-4 py-4 text-center">
                      Rush
                    </th>
                    <th className="px-4 py-4 text-center">
                      Receiving
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredRecords.map(
                    (record, index) => {
                      const active =
                        getMarketStats(
                          record,
                          market,
                        );

                      return (
                        <tr
                          key={
                            record.externalPlayerId
                          }
                          className="transition hover:bg-slate-800/30"
                        >
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-bold text-slate-300">
                              {index + 1}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-bold text-white">
                              {record.playerName}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {record.team ??
                                "—"}{" "}
                              •{" "}
                              {record.position ??
                                "—"}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-center text-base">
                            <MarketRecord
                              wins={active.wins}
                              losses={
                                active.losses
                              }
                              pushes={
                                active.pushes
                              }
                              graded={
                                active.graded
                              }
                            />
                          </td>

                          <td
                            className={`px-4 py-4 text-center font-bold ${getCoverClass(
                              active.coverPct,
                            )}`}
                          >
                            {formatPct(
                              active.coverPct,
                            )}
                          </td>

                          <td
                            className={`px-4 py-4 text-center font-bold ${getDeltaClass(
                              active.avgDelta,
                            )}`}
                          >
                            {formatDelta(
                              active.avgDelta,
                            )}
                          </td>

                          <td className="px-4 py-4 text-center">
                            <MarketRecord
                              wins={
                                record.passWins
                              }
                              losses={
                                record.passLosses
                              }
                              pushes={
                                record.passPushes
                              }
                              graded={
                                record.passGradedProps
                              }
                            />
                          </td>

                          <td className="px-4 py-4 text-center">
                            <MarketRecord
                              wins={
                                record.rushWins
                              }
                              losses={
                                record.rushLosses
                              }
                              pushes={
                                record.rushPushes
                              }
                              graded={
                                record.rushGradedProps
                              }
                            />
                          </td>

                          <td className="px-4 py-4 text-center">
                            <MarketRecord
                              wins={
                                record.receivingWins
                              }
                              losses={
                                record.receivingLosses
                              }
                              pushes={
                                record.receivingPushes
                              }
                              graded={
                                record.receivingGradedProps
                              }
                            />
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {filteredRecords.map(
              (record, index) => {
                const active = getMarketStats(
                  record,
                  market,
                );

                return (
                  <article
                    key={record.externalPlayerId}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-2 text-sm font-bold text-slate-300">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate font-bold text-white">
                            {record.playerName}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {record.team ?? "—"} •{" "}
                            {record.position ?? "—"}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-lg font-black text-white">
                          {formatRecord(
                            active.wins,
                            active.losses,
                            active.pushes,
                            active.graded,
                          )}
                        </div>
                        <div
                          className={`text-xs font-bold ${getCoverClass(
                            active.coverPct,
                          )}`}
                        >
                          {formatPct(
                            active.coverPct,
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Avg vs Line
                        </div>
                        <div
                          className={`mt-1 text-lg font-bold ${getDeltaClass(
                            active.avgDelta,
                          )}`}
                        >
                          {formatDelta(
                            active.avgDelta,
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Props Graded
                        </div>
                        <div className="mt-1 text-lg font-bold text-white">
                          {active.graded}
                        </div>
                      </div>
                    </div>

                    {market === "overall" ? (
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-center">
                        <div>
                          <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                            Pass
                          </div>
                          <div className="mt-1 text-sm font-bold text-slate-200">
                            {formatRecord(
                              record.passWins,
                              record.passLosses,
                              record.passPushes,
                              record.passGradedProps,
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                            Rush
                          </div>
                          <div className="mt-1 text-sm font-bold text-slate-200">
                            {formatRecord(
                              record.rushWins,
                              record.rushLosses,
                              record.rushPushes,
                              record.rushGradedProps,
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                            Receiving
                          </div>
                          <div className="mt-1 text-sm font-bold text-slate-200">
                            {formatRecord(
                              record.receivingWins,
                              record.receivingLosses,
                              record.receivingPushes,
                              record.receivingGradedProps,
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              },
            )}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-400">
          No players match the selected filters.
        </div>
      )}
    </div>
  );
}
