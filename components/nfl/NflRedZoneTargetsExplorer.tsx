"use client";

import { useMemo, useState } from "react";

import type { NflRedZonePlayer } from "@/lib/nfl/red-zone-targets";

type PositionFilter = "ALL" | "RB" | "WR" | "TE";

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

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return players.filter((player) => {
      const matchesPosition =
        position === "ALL" || player.position === position;

      const matchesSearch =
        !query ||
        player.playerName.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query) ||
        player.opponent?.toLowerCase().includes(query);

      return matchesPosition && matchesSearch;
    });
  }, [players, position, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
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
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">RZ Opps</th>
                <th className="px-4 py-3">RZ Carries</th>
                <th className="px-4 py-3">RZ Targets</th>
                <th className="px-4 py-3">Inside 10</th>
                <th className="px-4 py-3">Inside 5</th>
                <th className="px-4 py-3">L3</th>
                <th className="px-4 py-3">L5</th>
                <th className="px-4 py-3">Season/G</th>
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
                      {player.playerName}
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
                    {player.latestWeek}
                  </td>

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
