"use client";

import { Fragment, useMemo, useState } from "react";
import type { NflPropResearchRow } from "@/lib/nfl/prop-research";

type PositionFilter = "ALL" | "QB" | "RB" | "WR" | "TE";

type MarketFilter =
  | "ALL"
  | "player_pass_yds"
  | "player_rush_yds"
  | "player_reception_yds";

type SortKey =
  | "kof"
  | "l5"
  | "l10"
  | "matchup"
  | "edge";

type RecentResult = {
  value: number;
  result: "over" | "under" | "push";
  is_home: boolean;
  opponent: string;
  game_date: string;
};

type Props = {
  rows: NflPropResearchRow[];
  hasProAccess: boolean;
};

function formatMarket(market: string) {
  if (market === "player_pass_yds") return "Pass Yds";
  if (market === "player_rush_yds") return "Rush Yds";
  if (market === "player_reception_yds") return "Rec Yds";
  return market;
}

function formatPct(value: number | null) {
  if (value === null) return "—";
  return `${Math.round(value)}%`;
}

function formatNumber(
  value: number | null,
  decimals = 1,
) {
  if (value === null) return "—";

  return value.toFixed(decimals);
}

function formatSignedPct(value: number | null) {
  if (value === null) return "—";

  const formatted = value.toFixed(1);

  return value > 0
    ? `+${formatted}%`
    : `${formatted}%`;
}

function formatOdds(value: number | null) {
  if (value === null) return "—";

  return value > 0
    ? `+${value}`
    : `${value}`;
}

function getTierClasses(tier: string | null) {
  switch (tier) {
    case "ELITE":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";

    case "STRONG":
      return "border-blue-500/40 bg-blue-500/10 text-blue-300";

    case "ABOVE_AVERAGE":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";

    case "INSUFFICIENT_DATA":
      return "border-zinc-700 bg-zinc-900 text-zinc-500";

    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

function getScoreClasses(score: number | null) {
  if (score === null) {
    return "border-zinc-700 bg-zinc-900 text-zinc-500";
  }

  if (score >= 80) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  if (score >= 70) {
    return "border-blue-500/40 bg-blue-500/10 text-blue-300";
  }

  if (score >= 60) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }

  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

function getRecentResults(
  value: unknown,
): RecentResult[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is RecentResult =>
      typeof item === "object" &&
      item !== null &&
      typeof item.value === "number" &&
      typeof item.opponent === "string" &&
      typeof item.game_date === "string" &&
      typeof item.is_home === "boolean" &&
      (
        item.result === "over" ||
        item.result === "under" ||
        item.result === "push"
      ),
  );
}

function formatGameDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
    },
  ).format(date);
}

function getResultClasses(
  result: RecentResult["result"],
) {
  if (result === "over") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (result === "under") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-zinc-600 bg-zinc-800 text-zinc-300";
}

function ResearchMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </div>

      <div className="mt-2 text-xl font-semibold text-white">
        {value}
      </div>

      {detail ? (
        <div className="mt-1 text-xs text-zinc-500">
          {detail}
        </div>
      ) : null}
    </div>
  );
}

export function NflPropResearchDashboard({
  rows,
  hasProAccess,
}: Props) {
  const [position, setPosition] =
    useState<PositionFilter>("ALL");

  const [market, setMarket] =
    useState<MarketFilter>("ALL");
  const [game, setGame] = useState("ALL");

  const [sortKey, setSortKey] =
    useState<SortKey>(hasProAccess ? "kof" : "l5");

  const [search, setSearch] =
    useState("");

  const [expandedPropId, setExpandedPropId] =
    useState<number | null>(null);

  const games = useMemo(() => {
    const gameMap = new Map<
      string,
      { id: string; label: string; commenceTime: string }
    >();

    for (const row of rows) {
      if (!row.externalEventId) continue;

      const teams = [row.playerTeam, row.upcomingOpponent]
        .filter(Boolean)
        .map((team) => String(team));

      const sortedTeams = [...teams].sort();
      const label =
        sortedTeams.length === 2
          ? `${sortedTeams[0]} vs ${sortedTeams[1]}`
          : teams.join(" vs ");

      if (!gameMap.has(row.externalEventId)) {
        gameMap.set(row.externalEventId, {
          id: row.externalEventId,
          label,
          commenceTime: row.commenceTime,
        });
      }
    }

    return [...gameMap.values()].sort(
      (a, b) =>
        new Date(a.commenceTime).getTime() -
        new Date(b.commenceTime).getTime(),
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      const matchesPosition =
        position === "ALL" ||
        row.position === position;

      const matchesMarket =
        market === "ALL" ||
        row.market === market;

      const matchesGame =
        game === "ALL" ||
        row.externalEventId === game;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        row.playerName
          .toLowerCase()
          .includes(normalizedSearch) ||
        (row.playerTeam ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (row.upcomingOpponent ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesPosition &&
        matchesMarket &&
        matchesGame &&
        matchesSearch
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === "l5") {
        return (
          (b.l5OverPct ?? -1) -
          (a.l5OverPct ?? -1)
        );
      }

      if (sortKey === "l10") {
        return (
          (b.l10OverPct ?? -1) -
          (a.l10OverPct ?? -1)
        );
      }

      if (sortKey === "matchup") {
        return (
          (a.dvpMarketRank ?? 999) -
          (b.dvpMarketRank ?? 999)
        );
      }

      if (sortKey === "edge") {
        return (
          (b.l5EdgePct ?? -999) -
          (a.l5EdgePct ?? -999)
        );
      }

      return (
        (b.kofOverScore ?? -1) -
        (a.kofOverScore ?? -1)
      );
    });
  }, [rows, position, market, game, sortKey, search]);

  const positions: PositionFilter[] = [
    "ALL",
    "QB",
    "RB",
    "WR",
    "TE",
  ];

  return (
    <div className="space-y-6">
      {!hasProAccess ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-amber-400">
            KofSports Pro Preview
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            Free access is active. Pro research features are locked.
          </div>
        </div>
      ) : null}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              KOF Over Score Beta
            </div>

            <div className="mt-1 text-sm text-zinc-400">
              Rank current NFL player props using recent
              performance, edge versus the current line,
              defensive matchup and player role.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {positions.map((item) => {
              const active = position === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setPosition(item)
                  }
                  className={[
                    "rounded-lg border px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "border-amber-400 bg-amber-400 text-black"
                      : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-white",
                  ].join(" ")}
                >
                  {item === "ALL"
                    ? "All"
                    : item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Search Player
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search player or team..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Prop Type
            </span>

            <select
              value={market}
              onChange={(event) =>
                setMarket(
                  event.target
                    .value as MarketFilter,
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400"
            >
              <option value="ALL">
                All Props
              </option>

              <option value="player_pass_yds">
                Passing Yards
              </option>

              <option value="player_rush_yds">
                Rushing Yards
              </option>

              <option value="player_reception_yds">
                Receiving Yards
              </option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Game
            </span>
            <select
              value={game}
              onChange={(event) => setGame(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400"
            >
              <option value="ALL">All Games</option>
              {games.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
              Sort By
            </span>

            <select
              value={hasProAccess ? sortKey : "l5"}
              disabled={!hasProAccess}
              onChange={(event) =>
                setSortKey(
                  event.target.value as SortKey,
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="kof">
                KOF Score
              </option>

              <option value="l5">
                Last 5 Hit Rate
              </option>

              <option value="l10">
                Last 10 Hit Rate
              </option>

              <option value="matchup">
                Best Matchup
              </option>

              <option value="edge">
                L5 Edge vs Line
              </option>
            </select>
          </label>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[940px] w-full">
            <thead className="border-b border-zinc-800 bg-zinc-900/80">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                <th className="px-4 py-3">
                  Player
                </th>

                <th className="px-4 py-3">
                  Prop
                </th>

                <th className="px-4 py-3">
                  Line
                </th>

                <th className="px-4 py-3">
                  Odds
                </th>

                <th className="px-4 py-3">
                  KOF
                </th>

                <th className="px-4 py-3">
                  L5
                </th>

                <th className="px-4 py-3">
                  L10
                </th>

                <th className="px-4 py-3">
                  Matchup
                </th>

                <th className="px-4 py-3" />
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row) => {
                const isExpanded =
                  expandedPropId === row.propId;

                const recentResults =
                  getRecentResults(row.lastTen);

                return (
                  <Fragment
                    key={`${row.propId}-${row.market}`}
                  >
                    <tr
                      className="border-b border-zinc-900 transition hover:bg-zinc-900/60"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">
                          {row.playerName}
                        </div>

                        <div className="mt-1 text-xs text-zinc-500">
                          {row.playerTeam ?? "—"}
                          {row.position
                            ? ` • ${row.position}`
                            : ""}
                          {row.upcomingOpponent
                            ? ` • vs ${row.upcomingOpponent}`
                            : ""}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-300">
                        {formatMarket(
                          row.market,
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-white">
                          O{" "}
                          {formatNumber(
                            row.line,
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-300">
                        {formatOdds(
                          row.overPrice,
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {hasProAccess ? (
                            <span
                              className={[
                                "inline-flex min-w-[58px] items-center justify-center rounded-lg border px-2.5 py-1.5 text-sm font-bold",
                                getScoreClasses(
                                  row.kofOverScore,
                                ),
                              ].join(" ")}
                            >
                              {formatNumber(
                                row.kofOverScore,
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex min-w-[58px] items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-zinc-400">
                              🔒 Pro
                            </span>
                          )}

                          {hasProAccess && row.kofScoreTier ? (
                            <span
                              className={[
                                "rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                                getTierClasses(
                                  row.kofScoreTier,
                                ),
                              ].join(" ")}
                            >
                              {row.kofScoreTier.replaceAll(
                                "_",
                                " ",
                              )}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-white">
                        {formatPct(
                          row.l5OverPct,
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-white">
                        {hasProAccess
                          ? formatPct(row.l10OverPct)
                          : "🔒"}
                      </td>

                      <td className="px-4 py-4">
                        {row.dvpMarketRank !==
                        null ? (
                          <div>
                            <div className="text-sm font-semibold text-white">
                              #
                              {
                                row.dvpMarketRank
                              }
                            </div>

                            <div className="mt-1 text-xs text-zinc-500">
                              vs{" "}
                              {row.upcomingOpponent ??
                                "—"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-600">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasProAccess) return;

                            setExpandedPropId(
                              isExpanded
                                ? null
                                : row.propId,
                            );
                          }}
                          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                        >
                          {!hasProAccess
                            ? "🔒 Pro"
                            : isExpanded
                              ? "Close"
                              : "Research"}
                        </button>
                      </td>
                    </tr>

                    {hasProAccess && isExpanded ? (
                      <tr
                        key={`${row.propId}-expanded`}
                        className="border-b border-zinc-800 bg-black/30"
                      >
                        <td
                          colSpan={9}
                          className="px-4 py-5"
                        >
                          <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
                            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
                                KOF Over Score
                              </div>

                              <div className="mt-2 text-4xl font-bold text-white">
                                {formatNumber(
                                  row.kofOverScore,
                                )}
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <ResearchMetric
                                  label="Trend"
                                  value={formatNumber(
                                    row.trendScore,
                                  )}
                                />

                                <ResearchMetric
                                  label="Edge"
                                  value={formatNumber(
                                    row.edgeScore,
                                  )}
                                />

                                <ResearchMetric
                                  label="Matchup"
                                  value={formatNumber(
                                    row.matchupScore,
                                  )}
                                />

                                <ResearchMetric
                                  label="Role"
                                  value={
                                    row.position ===
                                    "QB"
                                      ? "N/A"
                                      : formatNumber(
                                          row.roleScore,
                                        )
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                              <ResearchMetric
                                label="Current Line"
                                value={`O ${formatNumber(
                                  row.line,
                                )}`}
                                detail={`DraftKings ${formatOdds(
                                  row.overPrice,
                                )}`}
                              />

                              <ResearchMetric
                                label="Last 5"
                                value={`${formatPct(
                                  row.l5OverPct,
                                )} Over`}
                                detail={`${row.l5Games} games`}
                              />

                              <ResearchMetric
                                label="Last 10"
                                value={`${formatPct(
                                  row.l10OverPct,
                                )} Over`}
                                detail={`${row.l10Games} games`}
                              />

                              <ResearchMetric
                                label="DvP Matchup"
                                value={
                                  row.dvpMarketRank !==
                                  null
                                    ? `#${row.dvpMarketRank}`
                                    : "—"
                                }
                                detail={
                                  row.upcomingOpponent
                                    ? `vs ${row.upcomingOpponent}`
                                    : undefined
                                }
                              />

                              <ResearchMetric
                                label="L5 Average"
                                value={formatNumber(
                                  row.avgL5,
                                )}
                                detail={`Edge ${formatSignedPct(
                                  row.l5EdgePct,
                                )}`}
                              />

                              <ResearchMetric
                                label="L10 Average"
                                value={formatNumber(
                                  row.avgL10,
                                )}
                                detail={`Edge ${formatSignedPct(
                                  row.l10EdgePct,
                                )}`}
                              />

                              <ResearchMetric
                                label="H2H"
                                value={formatPct(
                                  row.h2hOverPct,
                                )}
                                detail={
                                  row.avgH2h !==
                                  null
                                    ? `Avg ${formatNumber(
                                        row.avgH2h,
                                      )}`
                                    : "No sample"
                                }
                              />

                              <ResearchMetric
                                label="L5 Snap Share"
                                value={
                                  row.l5SnapPct !==
                                  null
                                    ? formatPct(
                                        row.l5SnapPct *
                                          100,
                                      )
                                    : "—"
                                }
                                detail="2025 baseline"
                              />
                            </div>
                          </div>

                          {recentResults.length > 0 ? (
                            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                  <div className="text-sm font-semibold text-white">
                                    Recent Results
                                  </div>

                                  <div className="mt-1 text-xs text-zinc-500">
                                    Historical results compared with the current line of O{" "}
                                    {formatNumber(row.line)}.
                                  </div>
                                </div>

                                <div className="text-xs text-zinc-500">
                                  Most recent first
                                </div>
                              </div>

                              <div className="mt-4 overflow-x-auto">
                                <table className="min-w-[640px] w-full">
                                  <thead>
                                    <tr className="border-b border-zinc-800 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                                      <th className="pb-3 pr-4">
                                        Date
                                      </th>

                                      <th className="pb-3 pr-4">
                                        Matchup
                                      </th>

                                      <th className="pb-3 pr-4">
                                        Result
                                      </th>

                                      <th className="pb-3 pr-4">
                                        Current Line
                                      </th>

                                      <th className="pb-3 text-right">
                                        Hit
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {recentResults.map(
                                      (game) => (
                                        <tr
                                          key={`${row.propId}-${game.game_date}-${game.opponent}`}
                                          className="border-b border-zinc-900 last:border-b-0"
                                        >
                                          <td className="py-3 pr-4 text-sm text-zinc-400">
                                            {formatGameDate(
                                              game.game_date,
                                            )}
                                          </td>

                                          <td className="py-3 pr-4">
                                            <div className="text-sm font-medium text-white">
                                              {game.is_home
                                                ? "vs"
                                                : "@"}{" "}
                                              {
                                                game.opponent
                                              }
                                            </div>
                                          </td>

                                          <td className="py-3 pr-4">
                                            <span className="text-sm font-semibold text-white">
                                              {formatNumber(
                                                game.value,
                                                0,
                                              )}
                                            </span>
                                          </td>

                                          <td className="py-3 pr-4 text-sm text-zinc-400">
                                            O{" "}
                                            {formatNumber(
                                              row.line,
                                            )}
                                          </td>

                                          <td className="py-3 text-right">
                                            <span
                                              className={[
                                                "inline-flex min-w-[68px] items-center justify-center rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em]",
                                                getResultClasses(
                                                  game.result,
                                                ),
                                              ].join(
                                                " ",
                                              )}
                                            >
                                              {game.result}
                                            </span>
                                          </td>
                                        </tr>
                                      ),
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-zinc-500">
            No current props match these
            filters.
          </div>
        ) : null}
      </div>

      <div className="space-y-3 md:hidden">
        {filteredRows.map((row) => {
          const isExpanded =
            expandedPropId === row.propId;

          const recentResults =
            getRecentResults(row.lastTen);

          return (
            <div
              key={`${row.propId}-${row.market}-mobile`}
              className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70"
            >
              <button
                type="button"
                onClick={() => {
                  if (!hasProAccess) return;

                  setExpandedPropId(
                    isExpanded
                      ? null
                      : row.propId,
                  );
                }}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">
                      {row.playerName}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      {row.playerTeam ?? "—"}
                      {row.position
                        ? ` • ${row.position}`
                        : ""}
                      {row.upcomingOpponent
                        ? ` • vs ${row.upcomingOpponent}`
                        : ""}
                    </div>
                  </div>

                  {hasProAccess ? (
                    <span
                      className={[
                        "inline-flex min-w-[58px] items-center justify-center rounded-lg border px-2.5 py-1.5 text-sm font-bold",
                        getScoreClasses(
                          row.kofOverScore,
                        ),
                      ].join(" ")}
                    >
                      {formatNumber(
                        row.kofOverScore,
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex min-w-[58px] items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-zinc-400">
                      🔒 Pro
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                      Prop
                    </div>
                    <div className="mt-1 text-sm font-medium text-zinc-200">
                      {formatMarket(row.market)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                      Line
                    </div>
                    <div className="mt-1 text-sm font-medium text-zinc-200">
                      O {formatNumber(row.line)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                      L5
                    </div>
                    <div className="mt-1 text-sm font-medium text-zinc-200">
                      {formatPct(
                        row.l5OverPct,
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                      DvP
                    </div>
                    <div className="mt-1 text-sm font-medium text-zinc-200">
                      {row.dvpMarketRank !== null
                        ? `#${row.dvpMarketRank}`
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    {!hasProAccess
                      ? "🔒 Pro Research"
                      : isExpanded
                        ? "Hide Research"
                        : "Research"}
                  </span>

                  <span
                    className={[
                      "text-lg leading-none text-lime-400 transition-transform duration-200",
                      isExpanded
                        ? "rotate-180"
                        : "",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    ⌄
                  </span>
                </div>
              </button>

              {hasProAccess && isExpanded ? (
                <div className="border-t border-zinc-800 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <ResearchMetric
                      label="Trend"
                      value={formatNumber(
                        row.trendScore,
                      )}
                    />

                    <ResearchMetric
                      label="Edge"
                      value={formatNumber(
                        row.edgeScore,
                      )}
                    />

                    <ResearchMetric
                      label="Matchup"
                      value={formatNumber(
                        row.matchupScore,
                      )}
                    />

                    <ResearchMetric
                      label="Role"
                      value={
                        row.position === "QB"
                          ? "N/A"
                          : formatNumber(
                              row.roleScore,
                            )
                      }
                    />

                    <ResearchMetric
                      label="L10"
                      value={formatPct(
                        row.l10OverPct,
                      )}
                    />

                    <ResearchMetric
                      label="L5 Avg"
                      value={formatNumber(
                        row.avgL5,
                      )}
                      detail={`Edge ${formatSignedPct(
                        row.l5EdgePct,
                      )}`}
                    />
                  </div>

                  {recentResults.length > 0 ? (
                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Recent Results
                      </div>

                      <div className="mt-3 space-y-2">
                        {recentResults
                          .slice(0, 5)
                          .map((game) => (
                            <div
                              key={`${row.propId}-${game.game_date}-${game.opponent}-mobile`}
                              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2"
                            >
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {game.is_home
                                    ? "vs"
                                    : "@"}{" "}
                                  {game.opponent}
                                </div>

                                <div className="text-[11px] text-zinc-500">
                                  {formatGameDate(
                                    game.game_date,
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-sm font-semibold text-white">
                                  {formatNumber(
                                    game.value,
                                    0,
                                  )}
                                </div>

                                <span
                                  className={[
                                    "rounded-md border px-2 py-1 text-[10px] font-bold uppercase",
                                    getResultClasses(
                                      game.result,
                                    ),
                                  ].join(" ")}
                                >
                                  {game.result}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        {filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-6 py-12 text-center text-sm text-zinc-500">
            No current props match these
            filters.
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-xs leading-5 text-zinc-500">
        KOF Over Score Beta is a research
        ranking, not a projected win probability.
        Historical trends compare previous
        performances against the current prop line.
        Usage and matchup inputs currently use the
        2025 baseline until 2026 data becomes
        available.
      </div>
    </div>
  );
}
