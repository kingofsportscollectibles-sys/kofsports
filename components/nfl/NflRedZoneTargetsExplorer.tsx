"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { NflRedZonePlayer } from "@/lib/nfl/red-zone-targets";

type PositionFilter = "ALL" | "RB" | "WR" | "TE";
type DataView = "LATEST" | "SEASON";

type SortKey =
  | "latestRedZoneOpportunities"
  | "latestRedZoneCarries"
  | "latestRedZoneTargets"
  | "latestInside10Opportunities"
  | "latestInside5Opportunities"
  | "l3RedZoneOpportunities"
  | "l5RedZoneOpportunities"
  | "seasonRedZoneOpportunitiesPerGame"
  | "seasonRedZoneOpportunities"
  | "seasonRedZoneCarries"
  | "seasonRedZoneTargets"
  | "seasonInside10Opportunities"
  | "seasonInside5Opportunities"
  | "gamesPlayed";

function formatAverage(value: number | null) {
  if (value === null) return "—";
  return value.toFixed(2);
}

export default function NflRedZoneTargetsExplorer({
  players,
}: {
  players: NflRedZonePlayer[];
}) {
  const [position, setPosition] = useState<PositionFilter>("ALL");
  const [search, setSearch] = useState("");
  const [dataView, setDataView] = useState<DataView>("LATEST");
  const [sortKey, setSortKey] = useState<SortKey>(
    "latestRedZoneOpportunities",
  );

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return players
      .filter((player) => {
        const matchesPosition =
          position === "ALL" || player.position === position;

        const matchesSearch =
          !query ||
          player.playerName.toLowerCase().includes(query) ||
          player.team.toLowerCase().includes(query) ||
          player.opponent?.toLowerCase().includes(query);

        return matchesPosition && matchesSearch;
      })
      .sort((a, b) => {
        const aValue = a[sortKey] ?? -1;
        const bValue = b[sortKey] ?? -1;

        if (bValue !== aValue) {
          return bValue - aValue;
        }

        return a.playerName.localeCompare(b.playerName);
      });
  }, [players, position, search, sortKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {(["LATEST", "SEASON"] as DataView[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setDataView(item);
                  setSortKey(
                    item === "LATEST"
                      ? "latestRedZoneOpportunities"
                      : "seasonRedZoneOpportunities",
                  );
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  dataView === item
                    ? "bg-emerald-400 text-slate-950"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {item === "LATEST" ? "Latest Week" : "Season"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
          {(["ALL", "RB", "WR", "TE"] as PositionFilter[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPosition(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  position === item
                    ? "bg-white text-slate-950"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {item}
              </button>
            ),
          )}
          </div>
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search player or team..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-slate-600 md:max-w-xs"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Pos</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">
                  {dataView === "LATEST" ? "Week" : "GP"}
                </th>
                {(dataView === "LATEST"
                  ? [
                      ["RZ Opps", "latestRedZoneOpportunities"],
                      ["RZ Carries", "latestRedZoneCarries"],
                      ["RZ Targets", "latestRedZoneTargets"],
                      ["Inside 10", "latestInside10Opportunities"],
                      ["Inside 5", "latestInside5Opportunities"],
                      ["L3", "l3RedZoneOpportunities"],
                      ["L5", "l5RedZoneOpportunities"],
                      ["Season/G", "seasonRedZoneOpportunitiesPerGame"],
                    ]
                  : [
                      ["RZ Opps", "seasonRedZoneOpportunities"],
                      ["RZ Carries", "seasonRedZoneCarries"],
                      ["RZ Targets", "seasonRedZoneTargets"],
                      ["Inside 10", "seasonInside10Opportunities"],
                      ["Inside 5", "seasonInside5Opportunities"],
                      ["Opps/G", "seasonRedZoneOpportunitiesPerGame"],
                    ]
                ).map(([label, key]) => (
                  <th key={key} className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSortKey(key as SortKey)}
                      className="whitespace-nowrap transition hover:text-white"
                    >
                      {label}
                      {sortKey === key && (
                        <span className="ml-1" aria-hidden="true">
                          ↓
                        </span>
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {filteredPlayers.map((player) => (
                <tr
                  key={`${player.season}-${player.externalPlayerId}`}
                  className="transition hover:bg-slate-900/60"
                >
                  <td className="px-4 py-4">
                    <div className="font-semibold text-white">
                      {player.playerSlug ? (
                        <Link
                          href={`/nfl/players/${player.playerSlug}`}
                          className="transition hover:text-emerald-400"
                        >
                          {player.playerName}
                        </Link>
                      ) : (
                        player.playerName
                      )}
                    </div>

                    {player.opponent && (
                      <div className="mt-1 text-xs text-slate-500">
                        vs {player.opponent}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {player.position}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {player.team}
                  </td>

                  <td className="px-4 py-4 text-slate-300">
                    {dataView === "LATEST"
                      ? player.latestWeek
                      : player.gamesPlayed}
                  </td>

                  {dataView === "LATEST" ? (
                    <>
                      <td className="px-4 py-4 font-semibold text-white">
                        {player.latestRedZoneOpportunities}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {player.latestRedZoneCarries}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {player.latestRedZoneTargets}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {player.latestInside10Opportunities}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {player.latestInside5Opportunities}
                      </td>

                      <td className="px-4 py-4 font-semibold text-white">
                        {formatAverage(player.l3RedZoneOpportunities)}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {formatAverage(player.l5RedZoneOpportunities)}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {formatAverage(
                          player.seasonRedZoneOpportunitiesPerGame,
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-4 font-semibold text-white">
                        {player.seasonRedZoneOpportunities}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {player.seasonRedZoneCarries}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {player.seasonRedZoneTargets}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {player.seasonInside10Opportunities}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {player.seasonInside5Opportunities}
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {formatAverage(
                          player.seasonRedZoneOpportunitiesPerGame,
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPlayers.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            No players match your filters.
          </div>
        )}
      </div>

      <p className="text-sm text-slate-500">
        Showing {filteredPlayers.length} of {players.length} players.
      </p>
    </div>
  );
}
