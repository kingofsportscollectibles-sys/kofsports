"use client";

import { useMemo, useState } from "react";

import type {
  NflPlayerPropTrend,
  NflPropMarket,
} from "@/lib/nfl/prop-trends";

type TrendFilter =
  | "all"
  | "60"
  | "70"
  | "80"
  | "under40";

type SortOption =
  | "default"
  | "hit-desc"
  | "hit-asc"
  | "edge-desc"
  | "player-asc";

type Props = {
  props: NflPlayerPropTrend[];
  hasProAccess: boolean;
};

function marketLabel(market: NflPropMarket) {
  switch (market) {
    case "player_pass_yds":
      return "Passing Yards";
    case "player_rush_yds":
      return "Rushing Yards";
    case "player_reception_yds":
      return "Receiving Yards";
  }
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${value}%`;
}

function formatRecord(overs: number, games: number) {
  if (games === 0) {
    return "—";
  }

  return `${overs}/${games}`;
}

function formatOdds(value: number | null) {
  if (value === null) {
    return "—";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

function getAverageEdge(prop: NflPlayerPropTrend) {
  if (prop.avgL5 === null) {
    return null;
  }

  return prop.avgL5 - prop.line;
}

function getTrendClass(value: number | null) {
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

function getResultClass(
  result: "over" | "under" | "push",
) {
  switch (result) {
    case "over":
      return "border-emerald-500/40 bg-emerald-500/10";
    case "under":
      return "border-rose-500/30 bg-rose-500/10";
    case "push":
      return "border-slate-700 bg-slate-800/40";
  }
}

function getResultTextClass(
  result: "over" | "under" | "push",
) {
  switch (result) {
    case "over":
      return "text-emerald-400";
    case "under":
      return "text-rose-400";
    case "push":
      return "text-slate-400";
  }
}

function TrendStat({
  label,
  overs,
  games,
  percentage,
}: {
  label: string;
  overs: number;
  games: number;
  percentage: number | null;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${getTrendClass(
        percentage,
      )}`}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="text-xl font-bold text-white">
          {formatRecord(overs, games)}
        </div>

        <div className="text-sm font-semibold text-slate-300">
          {formatPercent(percentage)}
        </div>
      </div>
    </div>
  );
}

function LockedTrendStat({
  label,
}: {
  label: string;
}) {
  return (
    <a
      href="/pro"
      className="group rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-500/30"
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-sm font-bold text-slate-400">
          🔒 Pro
        </div>

        <div className="text-xs font-semibold text-emerald-500 opacity-80 transition group-hover:opacity-100">
          Unlock →
        </div>
      </div>
    </a>
  );
}

function PlayerPropCard({
  prop,
  hasProAccess,
}: {
  prop: NflPlayerPropTrend;
  hasProAccess: boolean;
}) {
  const visibleGames = hasProAccess
    ? prop.lastTen
    : prop.lastTen.slice(0, 5);

  const lockedGameCount = hasProAccess
    ? 0
    : Math.min(
        5,
        Math.max(prop.lastTen.length - 5, 0),
      );

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h3 className="text-lg font-bold text-white">
              {prop.playerName}
            </h3>

            <div className="mt-1 text-sm text-slate-400">
              {prop.playerTeam ?? "—"}
              {prop.upcomingOpponent
                ? ` • vs ${prop.upcomingOpponent}`
                : ""}
            </div>
          </div>

          <div className="sm:text-right">
            <div className="text-sm font-medium text-slate-400">
              {marketLabel(prop.market)}
            </div>

            <div className="mt-1 text-2xl font-black text-white">
              {prop.line}
            </div>

            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              DraftKings
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-4 text-xs text-slate-400">
          <span>
            Over {formatOdds(prop.overPrice)}
          </span>

          <span>
            Under {formatOdds(prop.underPrice)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-5 lg:grid-cols-4">
        <TrendStat
          label="Last 5"
          overs={prop.l5Overs}
          games={prop.l5Games}
          percentage={prop.l5OverPct}
        />

        {hasProAccess ? (
          <TrendStat
            label="Last 10"
            overs={prop.l10Overs}
            games={prop.l10Games}
            percentage={prop.l10OverPct}
          />
        ) : (
          <LockedTrendStat label="Last 10" />
        )}

        {hasProAccess ? (
          <TrendStat
            label="Season"
            overs={prop.seasonOvers}
            games={prop.seasonGames}
            percentage={prop.seasonOverPct}
          />
        ) : (
          <LockedTrendStat label="Season" />
        )}

        {hasProAccess ? (
          <TrendStat
            label={
              prop.upcomingOpponent
                ? `vs ${prop.upcomingOpponent}`
                : "Head to Head"
            }
            overs={prop.h2hOvers}
            games={prop.h2hGames}
            percentage={prop.h2hOverPct}
          />
        ) : (
          <LockedTrendStat
            label={
              prop.upcomingOpponent
                ? `vs ${prop.upcomingOpponent}`
                : "Head to Head"
            }
          />
        )}
      </div>

      {prop.lastTen.length > 0 ? (
        <div className="border-t border-slate-800 px-5 py-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recent Results
            </div>

            {!hasProAccess ? (
              <a
                href="/pro"
                className="text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
              >
                Unlock Last 10 →
              </a>
            ) : null}
          </div>

          <div className="overflow-x-auto pb-1 lg:overflow-x-visible">
            <div className="flex min-w-max gap-2 lg:grid lg:min-w-0 lg:grid-cols-10 lg:gap-1.5">
              {visibleGames.map((game) => (
                <div
                  key={`${game.game_date}-${game.opponent}-${game.value}`}
                  className={`min-w-14 rounded-lg border px-2 py-2 text-center lg:min-w-0 lg:px-1.5 ${getResultClass(
                    game.result,
                  )}`}
                  title={`${game.game_date} vs ${
                    game.opponent ?? "Opponent"
                  }`}
                >
                  <div className="text-sm font-bold text-white">
                    {game.value}
                  </div>

                  <div
                    className={`mt-1 text-[10px] font-bold uppercase ${getResultTextClass(
                      game.result,
                    )}`}
                  >
                    {game.result === "over"
                      ? "O"
                      : game.result === "under"
                        ? "U"
                        : "P"}
                  </div>
                </div>
              ))}

              {!hasProAccess
                ? Array.from({
                    length: lockedGameCount,
                  }).map((_, index) => (
                    <a
                      key={`locked-${index}`}
                      href="/pro"
                      className="flex min-w-14 flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-center transition hover:border-emerald-500/30 lg:min-w-0 lg:px-1.5"
                    >
                      <div className="text-sm">
                        🔒
                      </div>

                      <div className="mt-1 text-[9px] font-bold uppercase text-slate-500">
                        Pro
                      </div>
                    </a>
                  ))
                : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-800 px-5 py-4 text-sm text-slate-500">
          No NFL game history available.
        </div>
      )}

      {!hasProAccess ? (
        <div className="border-t border-slate-800 bg-slate-950/50 px-5 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs leading-5 text-slate-500">
              Unlock L10, season, H2H and deeper prop research.
            </div>

            <a
              href="/pro"
              className="shrink-0 text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
            >
              KofSports Pro →
            </a>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function NflPropTrendsExplorer({
  props,
  hasProAccess,
}: Props) {
  const [search, setSearch] = useState("");
  const [game, setGame] = useState("all");
  const [market, setMarket] = useState("all");
  const [trend, setTrend] =
    useState<TrendFilter>("all");
  const [sort, setSort] =
    useState<SortOption>("default");

  const games = useMemo(() => {
    const uniqueGames = new Map<string, string>();

    for (const prop of props) {
      const key = `${prop.awayTeam}-${prop.homeTeam}`;
      const label = `${prop.awayTeam} @ ${prop.homeTeam}`;

      uniqueGames.set(key, label);
    }

    return Array.from(uniqueGames.entries()).sort(
      (a, b) => a[1].localeCompare(b[1]),
    );
  }, [props]);

  const filteredProps = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    const results = props.filter((prop) => {
      if (
        normalizedSearch &&
        !prop.playerName
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (
        game !== "all" &&
        `${prop.awayTeam}-${prop.homeTeam}` !== game
      ) {
        return false;
      }

      if (
        market !== "all" &&
        prop.market !== market
      ) {
        return false;
      }

      const pct = prop.l5OverPct;
      const gamesPlayed = prop.l5Games;

      if (trend !== "all") {
        if (
          pct === null ||
          gamesPlayed === 0
        ) {
          return false;
        }

        if (
          trend === "60" &&
          pct < 60
        ) {
          return false;
        }

        if (
          trend === "70" &&
          pct < 70
        ) {
          return false;
        }

        if (
          trend === "80" &&
          pct < 80
        ) {
          return false;
        }

        if (
          trend === "under40" &&
          pct > 40
        ) {
          return false;
        }
      }

      return true;
    });

    if (sort === "default") {
      return results;
    }

    return [...results].sort((a, b) => {
      if (sort === "player-asc") {
        return a.playerName.localeCompare(
          b.playerName,
        );
      }

      if (
        sort === "hit-desc" ||
        sort === "hit-asc"
      ) {
        const aPct = a.l5OverPct;
        const bPct = b.l5OverPct;

        if (
          aPct === null &&
          bPct === null
        ) {
          return 0;
        }

        if (aPct === null) {
          return 1;
        }

        if (bPct === null) {
          return -1;
        }

        if (aPct !== bPct) {
          return sort === "hit-desc"
            ? bPct - aPct
            : aPct - bPct;
        }

        if (a.l5Games !== b.l5Games) {
          return b.l5Games - a.l5Games;
        }

        return a.playerName.localeCompare(
          b.playerName,
        );
      }

      if (sort === "edge-desc") {
        const aEdge = getAverageEdge(a);
        const bEdge = getAverageEdge(b);

        if (
          aEdge === null &&
          bEdge === null
        ) {
          return 0;
        }

        if (aEdge === null) {
          return 1;
        }

        if (bEdge === null) {
          return -1;
        }

        if (aEdge !== bEdge) {
          return bEdge - aEdge;
        }

        if (a.l5Games !== b.l5Games) {
          return b.l5Games - a.l5Games;
        }

        return a.playerName.localeCompare(
          b.playerName,
        );
      }

      return 0;
    });
  }, [
    props,
    search,
    game,
    market,
    trend,
    sort,
  ]);

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
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
              Game
            </label>

            <select
              value={game}
              onChange={(event) =>
                setGame(event.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="all">
                All Games
              </option>

              {games.map(([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Market
            </label>

            <select
              value={market}
              onChange={(event) =>
                setMarket(event.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="all">
                All Markets
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
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              L5 Trend
            </label>

            <select
              value={trend}
              onChange={(event) =>
                setTrend(
                  event.target
                    .value as TrendFilter,
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="all">
                All Trends
              </option>

              <option value="60">
                60%+ Over
              </option>

              <option value="70">
                70%+ Over
              </option>

              <option value="80">
                80%+ Over
              </option>

              <option value="under40">
                40% or Lower
              </option>
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
                  event.target
                    .value as SortOption,
                )
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="default">
                Default
              </option>

              <option value="hit-desc">
                Highest L5 Hit Rate
              </option>

              <option value="hit-asc">
                Lowest L5 Hit Rate
              </option>

              <option
                value="edge-desc"
                disabled={!hasProAccess}
              >
                {hasProAccess
                  ? "Highest L5 Avg vs Line"
                  : "🔒 Highest Avg vs Line"}
              </option>

              <option value="player-asc">
                Player A–Z
              </option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">
            Trend filtering and hit-rate sorting use
            each player&apos;s Last 5 results.
          </div>

          <div className="text-sm text-slate-400">
            Showing{" "}
            <span className="font-bold text-white">
              {filteredProps.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-white">
              {props.length}
            </span>{" "}
            props
          </div>
        </div>
      </div>

      {filteredProps.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredProps.map((prop) => (
            <PlayerPropCard
              key={prop.propId}
              prop={prop}
              hasProAccess={hasProAccess}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <h2 className="text-xl font-bold text-white">
            No Props Match These Filters
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Try changing the game, market, trend,
            or search filters.
          </p>
        </div>
      )}
    </div>
  );
}
