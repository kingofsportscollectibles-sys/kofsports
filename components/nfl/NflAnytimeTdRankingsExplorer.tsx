"use client";

import { useMemo, useState } from "react";

import type { NflAnytimeTdRanking } from "@/lib/nfl/anytime-td-rankings";

type Props = {
  rankings: NflAnytimeTdRanking[];
};

type PositionFilter = "ALL" | "RB" | "WR" | "TE";

function formatOdds(price: number | null) {
  if (price === null) return "—";
  return price > 0 ? `+${price}` : `${price}`;
}

function formatBookmaker(bookmaker: string | null) {
  if (!bookmaker) return "Best available";

  const labels: Record<string, string> = {
    betonlineag: "BetOnline",
    betrivers: "BetRivers",
    bovada: "Bovada",
    draftkings: "DraftKings",
    fanatics: "Fanatics",
    fanduel: "FanDuel",
    williamhill_us: "Caesars",
  };

  return labels[bookmaker] ?? bookmaker;
}

function formatProbability(probability: number | null) {
  if (probability === null) return "—";
  return `${(probability * 100).toFixed(1)}%`;
}

function scoreLabel(score: number) {
  if (score >= 85) return "Elite";
  if (score >= 75) return "Strong";
  if (score >= 65) return "Above Avg.";
  return "Average";
}

function scoreClasses(score: number) {
  if (score >= 85) {
    return "border-emerald-400/40 bg-emerald-400/15 text-emerald-300";
  }

  if (score >= 75) {
    return "border-green-400/30 bg-green-400/10 text-green-300";
  }

  if (score >= 65) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-300";
  }

  return "border-slate-700 bg-slate-800 text-slate-300";
}

function ScoreBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold tabular-nums text-white">
          {score.toFixed(1)}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${Math.max(0, Math.min(score, 100))}%` }}
        />
      </div>
    </div>
  );
}

export default function NflAnytimeTdRankingsExplorer({
  rankings,
}: Props) {
  const [position, setPosition] = useState<PositionFilter>("ALL");
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const filteredRankings = useMemo(() => {
    if (position === "ALL") return rankings;

    return rankings.filter((ranking) => ranking.position === position);
  }, [position, rankings]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(["ALL", "RB", "WR", "TE"] as PositionFilter[]).map((filter) => {
          const active = position === filter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setPosition(filter)}
              className={`rounded-lg border px-4 py-2 text-sm font-bold transition ${
                active
                  ? "border-emerald-400 bg-emerald-400 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
              }`}
            >
              {filter === "ALL" ? "All Players" : filter}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
          <thead className="border-b border-slate-800 bg-slate-950/70">
  <tr>
    <th colSpan={7} className="p-0">
      <div className="grid grid-cols-[76px_minmax(190px,1fr)_140px_130px_120px_120px_110px] items-center text-left text-xs font-bold uppercase tracking-wider text-slate-500">
        <div className="px-5 py-4">Rank</div>

        <div className="px-5 py-4">Player</div>

        <div className="px-5 py-4">Matchup</div>

        <div className="px-5 py-4 text-center">
          KOF Score
        </div>

        <div className="px-5 py-4 text-center">
          Best Odds
        </div>

        <div className="px-5 py-4 text-center">
          Market
        </div>

        <div className="px-5 py-4 text-right">
          Research
        </div>
      </div>
    </th>
  </tr>
</thead>

            <tbody className="divide-y divide-slate-800">
              {filteredRankings.map((ranking) => {
                const overallRank =
                  rankings.findIndex(
                    (item) =>
                      item.externalEventId === ranking.externalEventId &&
                      item.externalPlayerId === ranking.externalPlayerId
                  ) + 1;

                const rowKey = `${ranking.externalEventId}:${ranking.externalPlayerId}`;
                const expanded = expandedPlayer === rowKey;

                return (
                  <tr key={rowKey} className="group">
                    <td colSpan={7} className="p-0">
                      <div className="grid grid-cols-[76px_minmax(190px,1fr)_140px_130px_120px_120px_110px] items-center">
                        <div className="px-5 py-5 text-lg font-black tabular-nums text-slate-500">
                          #{overallRank}
                        </div>

                        <div className="px-5 py-5">
                          <div className="font-bold text-white">
                            {ranking.playerName}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            {ranking.team} • {ranking.position}
                          </div>
                        </div>

                        <div className="px-5 py-5 text-sm font-semibold text-slate-300">
                          vs {ranking.opponent}
                        </div>

                        <div className="px-5 py-5 text-center">
                          <div
                            className={`inline-flex min-w-[76px] flex-col rounded-xl border px-3 py-2 ${scoreClasses(
                              ranking.kofScore
                            )}`}
                          >
                            <span className="text-xl font-black tabular-nums">
                              {ranking.kofScore.toFixed(1)}
                            </span>
                            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider">
                              {scoreLabel(ranking.kofScore)}
                            </span>
                          </div>
                        </div>

                        <div className="px-5 py-5 text-center">
                          <div className="text-lg font-black tabular-nums text-white">
                            {formatOdds(ranking.bestPrice)}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
  {formatBookmaker(ranking.bestBookmaker)}
</div>
                        </div>

                        <div className="px-5 py-5 text-center">
                          <div className="font-bold tabular-nums text-slate-300">
                            {formatProbability(ranking.medianProbability)}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {ranking.books} books
                          </div>
                        </div>

                        <div className="px-5 py-5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedPlayer(expanded ? null : rowKey)
                            }
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-emerald-500/50 hover:text-white"
                          >
                            {expanded ? "Close" : "Breakdown"}
                          </button>
                        </div>
                      </div>

                      {expanded ? (
                        <div className="border-t border-slate-800 bg-slate-950/60 px-6 py-6">
                          <div className="grid gap-7 lg:grid-cols-[1fr_280px]">
                            <div>
                              <div className="mb-5 flex flex-wrap items-center gap-3">
                                <div>
                                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                                    KOF Score Breakdown
                                  </div>
                                  <h3 className="mt-1 text-xl font-black text-white">
                                    {ranking.playerName}
                                  </h3>
                                </div>

                                <div className="ml-auto text-right">
                                  <div className="text-xs text-slate-500">
                                    Historical sample
                                  </div>
                                  <div className="font-bold text-slate-300">
                                    {ranking.historicalGames ?? 0} games
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                                <ScoreBar
                                  label="Market"
                                  score={ranking.marketScore}
                                />
                                <ScoreBar
                                  label="Red Zone"
                                  score={ranking.redZoneScore}
                                />
                                <ScoreBar
                                  label="Usage"
                                  score={ranking.usageScore}
                                />
                                <ScoreBar
                                  label="Recent"
                                  score={ranking.recentScore}
                                />
                                <ScoreBar
                                  label="Matchup"
                                  score={ranking.matchupScore}
                                />
                                <ScoreBar
                                  label="Environment"
                                  score={ranking.environmentScore}
                                />
                              </div>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Anytime TD Market
                              </div>

                              <div className="mt-4 flex items-end justify-between">
                                <div>
                                  <div className="text-xs text-slate-500">
                                    Best Odds
                                  </div>
                                  <div className="mt-1 text-2xl font-black text-white">
                                    {formatOdds(ranking.bestPrice)}
                                  </div>
                                  <div className="mt-1 text-xs font-semibold text-slate-500">
      {formatBookmaker(ranking.bestBookmaker)}
    </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-xs text-slate-500">
                                    Median Implied
                                  </div>
                                  <div className="mt-1 font-bold text-slate-300">
                                    {formatProbability(
                                      ranking.medianProbability
                                    )}
                                  </div>
                                </div>
                              </div>

                              <p className="mt-4 text-xs leading-5 text-slate-500">
                                Market probability is derived from available
                                sportsbook prices and includes bookmaker margin.
                                KOF Score is a research ranking, not a projected
                                touchdown probability.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRankings.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
          No qualifying anytime touchdown scorers are currently available for
          this position.
        </div>
      ) : null}
    </div>
  );
}
