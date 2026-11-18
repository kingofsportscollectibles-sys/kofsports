"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SavedPlayersProvider,
  useSavedPlayers,
} from "@/components/SavedPlayersProvider";
import SavePlayerButton from "@/components/SavePlayerButton";
import PendingPlayerSave from "@/components/PendingPlayerSave";
import { PregameChecks } from "./PregameChecks";
import { BoardViewTabs } from "./BoardAccountLinks";
import { BettingBoardUpgradeLink } from "./BettingBoardTelemetry";
import { useBoardPreferences } from "./useBoardPreferences";
import {
  DEFAULT_BOARD_PREFERENCES,
  parseBoardView,
  boardViewUrl,
  savedNflPlayerIds,
  filterMyBoardPlayers,
  type BoardPreferences,
  type BoardView,
} from "@/lib/nfl/board-preferences";
import {
  BOARD_MARKETS,
  filterBoardRows,
  isBoardRowCurrent,
  sortBoardRows,
  type BoardPublicData,
  type BoardPublicRow,
  type BoardFilters,
  type BoardSortKey,
} from "@/lib/nfl/betting-board";
import { trackBettingBoardEvent } from "@/lib/growth/events/betting-board";

const initialFilters: BoardFilters = {
  position: "all",
  market: "all",
  game: "all",
  direction: "all",
  search: "",
};
const control =
  "min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";
const sortLabels: Record<BoardSortKey, string> = {
  kofScore: "KOFScore",
  edge: "Edge vs Line",
  absoluteEdge: "Absolute Edge vs Line",
  projection: "Projection",
  line: "Line",
  l5: "L5 Over hit rate",
};
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const date = (value: string) => `${dateFormatter.format(new Date(value))} ET`;
const number = (value: number) => value.toFixed(1);

function Edge({ row }: { row: BoardPublicRow }) {
  const text =
    row.edge === 0
      ? "0.0"
      : `${row.edge > 0 ? "+" : "−"}${Math.abs(row.edge) < 0.1 ? "<0.1" : number(Math.abs(row.edge))}`;
  return (
    <div
      title={`Projection minus line: ${row.edge.toFixed(6)} ${BOARD_MARKETS[row.market].unit}`}
    >
      <div
        className={`font-mono text-base font-bold tabular-nums ${row.direction === "over" ? "text-emerald-300" : row.direction === "under" ? "text-sky-300" : "text-slate-400"}`}
      >
        {text} <span className="text-xs">{BOARD_MARKETS[row.market].unit}</span>
      </div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {row.pregame?.ratingWithheld ? `Raw ${row.edge > 0 ? "over" : row.edge < 0 ? "under" : "neutral"} edge` : row.direction === "none" ? "No lean" : `Projection ${row.direction === "over" ? "above" : "below"} line`}
      </div>
    </div>
  );
}
function Score({ row }: { row: BoardPublicRow }) {
  return row.kofScore === null ? (
    <span
      className="text-sm text-slate-500"
      title={
        row.research?.scoreNote ??
        "Insufficient evidence for a confidence rating."
      }
    >
      N/A
      {row.pregame?.ratingWithheld && <span className="mt-1 block text-[10px] text-amber-300">Role unverified</span>}
    </span>
  ) : (
    <span className="inline-flex rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1.5 font-mono text-lg font-bold tabular-nums text-emerald-300">
      {number(row.kofScore)}
      <span className="ml-1 self-center text-[10px] text-slate-400">/100</span>
    </span>
  );
}
function L5({ row }: { row: BoardPublicRow }) {
  return (
    <div>
      <div className="font-mono font-bold tabular-nums text-slate-200">
        {row.l5.settled ? `${row.l5.overs}/${row.l5.settled}` : "—"}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        {row.l5.games === 0
          ? "No eligible logs"
          : row.l5.games < 5
            ? `Only ${row.l5.games} games`
            : "Last 5 games"}
        {row.l5.pushes
          ? ` · ${row.l5.pushes} push${row.l5.pushes > 1 ? "es" : ""}`
          : ""}
      </div>
    </div>
  );
}
function Matchup({ row }: { row: BoardPublicRow }) {
  const tone =
    row.matchup.label === "Favorable"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : row.matchup.label === "Difficult"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
        : "border-slate-700 bg-slate-800/50 text-slate-400";
  return (
    <div
      title={
        row.matchup.reason ??
        `${row.season} ${row.position} ${BOARD_MARKETS[row.market].label} allowed. #1 allows the most; classification follows the model lean.`
      }
    >
      <span
        className={`inline-block rounded-md border px-2 py-1 text-xs font-semibold ${tone}`}
      >
        {row.matchup.label}
      </span>
      {row.matchup.rank !== null && (
        <div className="mt-1.5 text-[11px] text-slate-500">
          #{row.matchup.rank}/32 · {row.position}
        </div>
      )}
    </div>
  );
}
function ResearchDetails({ row }: { row: BoardPublicRow }) {
  return (
    <div className="grid gap-6 text-sm lg:grid-cols-3">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Recent results · {BOARD_MARKETS[row.market].unit}
        </h3>
        {row.l5.recent.length ? (
          <ol className="mt-3 space-y-2">
            {row.l5.recent.map((game) => (
              <li
                key={game.gameId}
                className="flex justify-between gap-4 text-slate-400"
              >
                <span>
                  {game.date} · vs {game.opponent}
                </span>
                <span className="font-mono text-slate-200">
                  {game.value}{" "}
                  <span className="ml-1 text-xs text-slate-500">
                    {game.result}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-slate-500">
            No completed, non-null game logs available.
          </p>
        )}
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Compared with the displayed {number(row.line)} line. Pushes are shown
          separately and excluded from the hit-rate denominator. Fewer than five
          games is an incomplete sample.
        </p>
      </div>
      <div className="space-y-3 text-slate-400">
        <h3 className="text-xs font-bold uppercase tracking-wider">
          Model & matchup
        </h3>
        <p>
          Projection:{" "}
          <strong className="font-mono text-slate-200">
            {row.projection.toFixed(3)} {BOARD_MARKETS[row.market].unit}
          </strong>
        </p>
        <p>
          {row.matchup.rank === null
            ? row.matchup.reason
            : `${row.opponent} allows ${row.matchup.allowed} ${BOARD_MARKETS[row.market].unit}/game to ${row.position}s across ${row.matchup.games} games (${row.season}). #1 allows the most. Favorability follows the model lean; neutral is ranks 13–20 or no lean.`}
        </p>
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-slate-200">
            KOFScore · {row.pregame?.ratingWithheld ? "withheld" : `Projection ${row.direction === "over" ? "above" : "below"} line`}
          </p>
          <p>Research confidence out of 100, not a predicted win percentage.</p>
          <p>
            KOFScore considers the projection relative to the line, recent
            performance, matchup context and available head-to-head history.
            Limited evidence can reduce confidence.
          </p>
          {row.research?.recentGames != null && (
            <p>
              Recent sample: {row.research.recentGames} games · current season:{" "}
              {row.research.seasonGames ?? "unavailable"} games.
            </p>
          )}
          {row.research?.h2hGames != null && (
            <p>
              Head-to-head sample: {row.research.h2hGames} games
              {row.research.h2hGames === 0
                ? " · no eligible opponent meetings available"
                : ""}
              .
            </p>
          )}
          {row.research?.scoreNote && <p>{row.research.scoreNote}</p>}
        </div>
      </div>
      <div className="space-y-3 text-xs leading-5 text-slate-500">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Sources & availability
        </h3>
        <p>
          DraftKings quote fetched{" "}
          <time dateTime={row.lineUpdatedAt}>{date(row.lineUpdatedAt)}</time>.
          <br />
          Over{" "}
          {row.overPrice === null
            ? "—"
            : row.overPrice > 0
              ? `+${row.overPrice}`
              : row.overPrice}{" "}
          / Under{" "}
          {row.underPrice === null
            ? "—"
            : row.underPrice > 0
              ? `+${row.underPrice}`
              : row.underPrice}
          . Stored odds, not a live feed.
        </p>
        <p>
          Calculated{" "}
          <time dateTime={row.calculatedAt}>{date(row.calculatedAt)}</time> from
          stored preweek statistics. Confirm the line at your sportsbook.
        </p>
        {row.pregame ? <PregameChecks evidence={row.pregame} /> : <p>
          Roster: {row.rosterStatus ?? "unknown"}. Game-day availability is
          unverified. Check player news before using the research.
        </p>}
        <p>
          Kickoff: <time dateTime={row.kickoff}>{date(row.kickoff)}</time> ·
          Week {row.week}
        </p>
      </div>
    </div>
  );
}

function SortHeader({
  field,
  children,
  sort,
  order,
  changeSort,
}: {
  field: BoardSortKey;
  children: React.ReactNode;
  sort: BoardSortKey;
  order: "asc" | "desc";
  changeSort: (key: BoardSortKey) => void;
}) {
  return (
    <th
      scope="col"
      aria-sort={
        sort === field ? (order === "asc" ? "ascending" : "descending") : "none"
      }
      className="px-4 py-4 text-left"
    >
      <button
        className="inline-flex min-h-9 items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
        onClick={() => changeSort(field)}
        aria-label={`Sort by ${sortLabels[field]}`}
      >
        {children}
        <span
          aria-hidden="true"
          className={sort === field ? "text-emerald-400" : "text-slate-600"}
        >
          {sort === field ? (order === "desc" ? "↓" : "↑") : "↕"}
        </span>
      </button>
    </th>
  );
}

export function BettingBoardRefreshButton() {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startRefresh(() => router.refresh())}
      disabled={refreshing}
      className="min-h-11 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-bold text-white transition hover:border-emerald-400 disabled:opacity-50"
    >
      {refreshing ? "Refreshing…" : "Refresh data"}
    </button>
  );
}

export default function NflBettingBoard(props: {
  board: BoardPublicData;
  pro?: boolean;
}) {
  return (
    <SavedPlayersProvider>
      <NflBettingBoardContent {...props} />
    </SavedPlayersProvider>
  );
}
function NflBettingBoardContent({
  board,
  pro = true,
}: {
  board: BoardPublicData;
  pro?: boolean;
}) {
  const {
    userId,
    loading: savesLoading,
    error: savesError,
    savedIds,
    reload,
  } = useSavedPlayers();
  const params = useSearchParams();
  const { preferences, update: storePreferences } = useBoardPreferences(userId);
  const view = parseBoardView(params.get("view")) ?? preferences.view;
  const savedNFL = useMemo(() => savedNflPlayerIds(savedIds), [savedIds]);
  const savedViewTracked = useRef<string | null>(null);
  useEffect(() => {
    if (view !== "saved" || !userId) {
      savedViewTracked.current = null;
      return;
    }
    if (savesLoading || savesError || savedViewTracked.current === userId)
      return;
    savedViewTracked.current = userId;
    trackBettingBoardEvent("betting_board_saved_view", {
      view: "saved",
      market: preferences.market,
    });
  }, [view, userId, savesLoading, savesError, preferences.market]);
  const [temporaryFilters, setFilters] = useState<BoardFilters>(initialFilters);
  const filters: BoardFilters = useMemo(
    () => ({
      ...temporaryFilters,
      position: preferences.position,
      market: preferences.market,
      direction: preferences.direction,
    }),
    [
      temporaryFilters,
      preferences.position,
      preferences.market,
      preferences.direction,
    ],
  );
  const sort = preferences.sort;
  const order = preferences.order;
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [now, setNow] = useState(Date.parse(board.calculatedAt));
  const searchWasActive = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const effectiveNow = Math.max(now, Date.parse(board.calculatedAt));
  const authorizedCurrent = useMemo(
    () => board.rows.filter((row) => isBoardRowCurrent(row, effectiveNow)),
    [board.rows, effectiveNow],
  );
  const current = useMemo(
    () => filterMyBoardPlayers(authorizedCurrent, view, savedNFL),
    [authorizedCurrent, view, savedNFL],
  );
  const games = useMemo(
    () =>
      [...new Map(current.map((row) => [row.gameId, row])).values()].sort(
        (a, b) => a.kickoff.localeCompare(b.kickoff),
      ),
    [current],
  );
  const visible = useMemo(
    () =>
      sortBoardRows(
        filterBoardRows(current, filters, effectiveNow),
        sort,
        order,
      ),
    [current, filters, effectiveNow, sort, order],
  );
  const newestQuote = visible
    .map((row) => row.lineUpdatedAt)
    .sort((a, b) => Date.parse(a) - Date.parse(b))
    .at(-1);
  const expired = board.rows.length - authorizedCurrent.length;
  function persist(patch: Partial<BoardPreferences>, preference: string) {
    if (!userId) return;
    const next = { ...preferences, view, ...patch };
    if (JSON.stringify(next) === JSON.stringify(preferences)) return;
    storePreferences(next);
    trackBettingBoardEvent("betting_board_preference_change", {
      preference,
      view: next.view,
      market: next.market,
      position: next.position,
      sort: next.sort,
      sort_direction: next.order,
      direction: next.direction,
    });
  }
  function changeView(next: BoardView) {
    if (next === "saved" && view !== "saved")
      trackBettingBoardEvent("betting_board_my_players_click", {
        view: "saved",
        market: filters.market,
      });
    persist({ view: next }, "view");
    window.history.replaceState(
      null,
      "",
      boardViewUrl(next, params.toString()),
    );
  }
  function reset() {
    setFilters(initialFilters);
    searchWasActive.current = false;
    if (userId) {
      storePreferences({ ...DEFAULT_BOARD_PREFERENCES });
      trackBettingBoardEvent("betting_board_preference_change", {
        preference: "reset",
        view: "all",
      });
    }
    window.history.replaceState(
      null,
      "",
      boardViewUrl("all", params.toString()),
    );
    trackBettingBoardEvent("betting_board_filter", {
      filter: "reset",
      selection: "all",
      view: "all",
    });
  }
  const active = [
    view === "saved" ? "My Players" : "All Players",
    filters.position !== "all" ? filters.position : null,
    filters.market !== "all"
      ? BOARD_MARKETS[filters.market as keyof typeof BOARD_MARKETS]?.label
      : null,
    filters.direction !== "all" ? `Projection ${filters.direction === "over" ? "above" : "below"} line` : null,
    filters.game !== "all" ? "Selected game" : null,
    filters.search.trim() ? "Player search active" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  function updateFilter(key: keyof BoardFilters, value: string) {
    if (key === "position" || key === "market" || key === "direction")
      persist({ [key]: value }, key);
    else setFilters((old) => ({ ...old, [key]: value }));
    if (key !== "search")
      trackBettingBoardEvent("betting_board_filter", {
        filter: key,
        selection:
          key === "game" ? (value === "all" ? "all" : "selected") : value,
        market: key === "market" ? value : filters.market,
        position: key === "position" ? value : filters.position,
        view,
      });
  }
  function changeSort(
    key: BoardSortKey,
    direction = sort === key && order === "desc" ? "asc" : "desc",
  ) {
    const next = direction as "asc" | "desc";
    persist({ sort: key, order: next }, "sort");
    trackBettingBoardEvent("betting_board_sort", {
      sort: key,
      sort_direction: next,
      market: filters.market,
      position: filters.position,
      view,
    });
  }
  const playerClick = (row: BoardPublicRow) =>
    trackBettingBoardEvent("betting_board_player_click", {
      market: row.market,
      position: row.position,
      view,
    });

  return (
    <div className="space-y-6">
      <PendingPlayerSave
        sport="nfl"
        eligiblePlayerIds={board.rows.map((row) => row.playerId)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BoardViewTabs
          view={view}
          onChange={changeView}
          disabled={savesLoading}
        />
        <Link
          href="/account"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-300"
        >
          My KofSports →
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 p-3 text-xs text-slate-400">
        <p>
          <strong className="text-slate-200">Active:</strong> {active} ·{" "}
          {sortLabels[sort]} ({order === "desc" ? "highest" : "lowest"} first)
        </p>
        <button
          type="button"
          onClick={reset}
          className="min-h-11 px-2 font-semibold text-emerald-300"
        >
          Reset to defaults
        </button>
      </div>
      {userId && (
        <p className="text-xs text-slate-500">
          Preferences are remembered for your account in this browser when
          storage is available.
        </p>
      )}
      {savesError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-400/20 p-4 text-sm text-amber-200"
        >
          {savesError}{" "}
          <button
            type="button"
            onClick={reload}
            className="ml-2 min-h-11 underline"
          >
            Retry saved players
          </button>
        </div>
      )}
      {!pro && userId && savedNFL.size > 0 && (
        <section className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <h2 className="font-bold text-white">
            Your Players. Our Projections.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            You’ve saved {savedNFL.size} NFL{" "}
            {savedNFL.size === 1 ? "player" : "players"}. Your free sample stays
            limited to today’s selected players. Upgrade to Pro to check the
            full board for your watchlist’s current props and KOFScore research.
          </p>
          <div className="mt-4">
            <BettingBoardUpgradeLink personalized view={view} />
          </div>
        </section>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs leading-6 text-slate-400">
        <div className="min-w-0">
          <p>
            {board.rows.length ? "Calculated" : "Board checked"}{" "}
            <time
              dateTime={board.calculatedAt}
              className="font-semibold text-slate-200"
            >
              {date(board.calculatedAt)}
            </time>
            <span className="hidden sm:inline">
              {" "}
              · refresh after 15 minutes
            </span>
          </p>
          <div className="hidden sm:block">
            <p>
              {newestQuote ? (
                <>
                  Latest displayed quote fetched{" "}
                  <time dateTime={newestQuote}>{date(newestQuote)}</time> ·{" "}
                </>
              ) : board.sourceLatestQuoteAt ? (
                <>
                  Latest stored source quote {date(board.sourceLatestQuoteAt)}{" "}
                  ·{" "}
                </>
              ) : null}
              Stored quotes within 48 hours · not live
            </p>
            {board.logsUpdatedAt && (
              <p>Latest player-log update {date(board.logsUpdatedAt)}</p>
            )}
          </div>
          <p className="text-[10px] sm:hidden">
            Stored quotes ≤48 hours · not live
          </p>
          <details className="sm:hidden">
            <summary className="cursor-pointer text-[10px] text-slate-500">
              Freshness details
            </summary>
            <p>Refresh model calculations after 15 minutes.</p>
            {newestQuote && <p>Latest quote: {date(newestQuote)}</p>}
            {board.logsUpdatedAt && (
              <p>Player logs updated {date(board.logsUpdatedAt)}</p>
            )}
          </details>
        </div>
        <BettingBoardRefreshButton />
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          ["On the board", "Props", current.length],
          ["Upcoming games", "Games", games.length],
          [
            "KOFScore available",
            "Scored",
            current.filter((r) => r.kofScore !== null).length,
          ],
          [
            "Full L5 samples",
            "Full L5",
            current.filter((r) => r.l5.games === 5).length,
          ],
        ].map(([label, short, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/40 p-3 sm:rounded-2xl sm:p-4"
          >
            <div className="font-mono text-xl font-bold tabular-nums text-white sm:text-2xl">
              {value}
            </div>
            <div className="mt-1 text-[10px] text-slate-500 sm:text-xs">
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs leading-5 text-slate-400">
        KOFScore is KofSports’ proprietary confidence rating out of 100 for the
        selected Over or Under lean. It is not a win probability. Passing ratings
        are withheld when game-day role evidence is unverified; their raw edges
        remain available for research.
      </p>
      <section
        aria-label="Filter and sort player props"
        className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5"
      >
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="board-filter-controls"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex min-h-10 w-full items-center justify-between gap-3 text-sm font-semibold text-slate-200 lg:hidden"
        >
          <span>Filters & sort</span>
          <span className="text-xs text-slate-500">
            {sortLabels[sort]} {filtersOpen ? "−" : "+"}
          </span>
        </button>
        <div
          id="board-filter-controls"
          className={`${filtersOpen ? "mt-4 block" : "hidden"} lg:mt-0 lg:block`}
        >
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <label className="col-span-2 text-xs font-semibold text-slate-400">
              Search players
              <input
                type="search"
                value={filters.search}
                placeholder="Player name"
                className={`mt-2 ${control}`}
                onChange={(event) => updateFilter("search", event.target.value)}
                onBlur={() => {
                  const active = filters.search.trim().length > 0;
                  if (active !== searchWasActive.current) {
                    searchWasActive.current = active;
                    trackBettingBoardEvent("betting_board_filter", {
                      filter: "search",
                      selection: active ? "active" : "empty",
                    });
                  }
                }}
              />
            </label>
            <label className="text-xs font-semibold text-slate-400">
              Position
              <select
                className={`mt-2 ${control}`}
                value={filters.position}
                disabled={savesLoading}
                onChange={(e) => updateFilter("position", e.target.value)}
              >
                <option value="all">All positions</option>
                {["QB", "RB", "WR", "TE"].map((position) => (
                  <option key={position}>{position}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-400">
              Prop market
              <select
                className={`mt-2 ${control}`}
                value={filters.market}
                disabled={savesLoading}
                onChange={(e) => updateFilter("market", e.target.value)}
              >
                <option value="all">All markets</option>
                {Object.entries(BOARD_MARKETS).map(([key, market]) => (
                  <option key={key} value={key}>
                    {market.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-400">
              Game
              <select
                className={`mt-2 ${control}`}
                value={filters.game}
                onChange={(e) => updateFilter("game", e.target.value)}
              >
                <option value="all">All games</option>
                {games.map((row) => (
                  <option key={row.gameId} value={row.gameId}>
                    {row.game}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-400">
              Projection direction
              <select
                className={`mt-2 ${control}`}
                value={filters.direction}
                disabled={savesLoading}
                onChange={(e) => updateFilter("direction", e.target.value)}
              >
                <option value="all">All directions</option>
                <option value="over">Over</option>
                <option value="under">Under</option>
                <option value="none">No lean</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-slate-800 pt-4">
            <div className="flex gap-2">
              <label className="text-xs text-slate-400">
                Sort by
                <select
                  className={`mt-1.5 ${control}`}
                  value={sort}
                  disabled={savesLoading}
                  onChange={(e) =>
                    changeSort(e.target.value as BoardSortKey, order)
                  }
                >
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400">
                Order
                <select
                  className={`mt-1.5 ${control}`}
                  value={order}
                  disabled={savesLoading}
                  onChange={(e) => changeSort(sort, e.target.value)}
                >
                  <option value="desc">Highest first</option>
                  <option value="asc">Lowest first</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              className="min-h-11 px-3 text-xs font-semibold text-slate-400 hover:text-white"
              onClick={reset}
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </section>
      <details className="rounded-xl border border-slate-800 p-3 text-xs leading-5 text-slate-500 sm:border-0 sm:p-0">
        <summary className="min-h-7 cursor-pointer font-semibold text-slate-400">
          How to read KOFScore, raw edges & availability
        </summary>
        <div className="mt-2 space-y-2">
          <p>
            <strong className="text-slate-300">KOFScore /100</strong> is
            KofSports&apos; proprietary confidence rating for the model&apos;s
            Over or Under lean. It considers the projection relative to the
            line, recent performance, current-season matchup and available
            head-to-head history. Sample sizes and missing data affect
            confidence. KOFScore is experimental and is not a calibrated win
            probability. Injury changes and market movement are not separately
            assessed by the current rating.
          </p>
          <p>
            Edge vs Line = projection − line, in the selected market&apos;s units.
            Filter a market for like-for-like comparisons. A lean is not a
            strong-opportunity label or expected return. Game-day player
            availability is unverified.
          </p>
        </div>
      </details>
      {board.warnings.map((warning) => (
        <p key={warning} className="text-xs text-amber-300">
          {warning}
        </p>
      ))}
      {expired > 0 && (
        <p role="status" className="text-xs text-amber-300">
          {expired} props hidden because kickoff passed or data aged. Refresh
          for current coverage.
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Player prop research</h2>
        <span
          role="status"
          aria-live="polite"
          className="text-xs text-slate-500"
        >
          {visible.length} of {current.length} props
        </span>
      </div>
      {visible.length && !(view === "saved" && (savesLoading || savesError)) ? (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-800 xl:block">
            <table className="w-full min-w-[1100px] text-sm">
              <caption className="sr-only">
                NFL player props: KOFScore ratings, model projections, raw
                edges, L5 Overs and current-season matchups.
              </caption>
              <thead className="bg-slate-900">
                <tr>
                  <SortHeader
                    sort={sort}
                    order={order}
                    changeSort={changeSort}
                    field="kofScore"
                  >
                    <span className="normal-case">KOFScore</span>
                  </SortHeader>
                  <th
                    scope="col"
                    className="px-4 text-left text-xs uppercase tracking-wider text-slate-400"
                  >
                    Player
                  </th>
                  <th
                    scope="col"
                    className="px-4 text-left text-xs uppercase tracking-wider text-slate-400"
                  >
                    Game
                  </th>
                  <th
                    scope="col"
                    className="px-4 text-left text-xs uppercase tracking-wider text-slate-400"
                  >
                    Prop
                  </th>
                  <SortHeader
                    sort={sort}
                    order={order}
                    changeSort={changeSort}
                    field="line"
                  >
                    Line
                  </SortHeader>
                  <SortHeader
                    sort={sort}
                    order={order}
                    changeSort={changeSort}
                    field="projection"
                  >
                    Projection
                  </SortHeader>
                  <SortHeader
                    sort={sort}
                    order={order}
                    changeSort={changeSort}
                    field="edge"
                  >
                    Edge vs Line
                  </SortHeader>
                  <SortHeader
                    sort={sort}
                    order={order}
                    changeSort={changeSort}
                    field="l5"
                  >
                    L5 Over
                  </SortHeader>
                  <th
                    scope="col"
                    className="px-4 text-left text-xs uppercase tracking-wider text-slate-400"
                  >
                    Matchup
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {visible.map((row) => (
                  <Fragment key={row.id}>
                    <tr className="bg-slate-950 transition hover:bg-slate-900/60">
                      <td className="px-4 py-5">
                        <Score row={row} />
                      </td>
                      <td className="max-w-[220px] px-4 py-5">
                        <Link
                          href={row.profileHref}
                          prefetch={false}
                          onClick={() => playerClick(row)}
                          className="font-bold text-white hover:text-emerald-300"
                        >
                          {row.player}
                        </Link>
                        <div className="mt-1 text-xs text-slate-500">
                          {row.team} · {row.position}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded(expanded === row.id ? null : row.id)
                          }
                          aria-expanded={expanded === row.id}
                          aria-controls={`board-research-${row.id}`}
                          className="mt-2 min-h-8 text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          {expanded === row.id
                            ? "Close details −"
                            : "Research details +"}
                        </button>
                        <div className="mt-2">
                          <SavePlayerButton
                            sport="nfl"
                            playerId={row.playerId}
                            playerName={row.player}
                            variant="board"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="whitespace-nowrap text-slate-300">
                          {row.game}
                        </div>
                        <time
                          dateTime={row.kickoff}
                          className="mt-1 block text-xs text-slate-500"
                        >
                          {date(row.kickoff)}
                        </time>
                      </td>
                      <td className="px-4 py-5 text-slate-300">
                        {BOARD_MARKETS[row.market].short}
                      </td>
                      <td className="px-4 py-5">
                        <div className="font-mono font-semibold text-slate-300">
                          {number(row.line)}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          DraftKings
                        </div>
                      </td>
                      <td className="px-4 py-5 font-mono font-bold text-white">
                        {number(row.projection)}
                      </td>
                      <td className="px-4 py-5">
                        <Edge row={row} />
                      </td>
                      <td className="px-4 py-5">
                        <L5 row={row} />
                      </td>
                      <td className="px-4 py-5">
                        <Matchup row={row} />
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr id={`board-research-${row.id}`}>
                        <td
                          colSpan={9}
                          className="border-t border-slate-800 bg-slate-900/50 p-6"
                        >
                          <ResearchDetails row={row} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:hidden">
            {visible.map((row) => (
              <article
                key={row.id}
                aria-label={`${row.player}, ${BOARD_MARKETS[row.market].label}`}
                className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={row.profileHref}
                        prefetch={false}
                        onClick={() => playerClick(row)}
                        className="font-bold text-white hover:text-emerald-300"
                      >
                        {row.player}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.team} · {row.position} · vs {row.opponent}
                      </p>
                      <div className="mt-3">
                        <SavePlayerButton
                          sport="nfl"
                          playerId={row.playerId}
                          playerName={row.player}
                          variant="board"
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 normal-case">
                        KOFScore
                      </div>
                      <Score row={row} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                    <span className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-300">
                      {BOARD_MARKETS[row.market].label}
                    </span>
                    <time className="text-slate-500" dateTime={row.kickoff}>
                      {date(row.kickoff)}
                    </time>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">
                        Line · DK
                      </div>
                      <div className="mt-1 font-mono text-xl text-slate-300">
                        {number(row.line)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">
                        Projection
                      </div>
                      <div className="mt-1 font-mono text-xl font-bold text-white">
                        {number(row.projection)}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase text-slate-500">
                        Edge vs Line
                      </div>
                      <Edge row={row} />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between gap-4">
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
                        L5 Over
                      </div>
                      <L5 row={row} />
                    </div>
                    <Matchup row={row} />
                  </div>
                </div>
                <div className="border-t border-slate-800 px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(expanded === row.id ? null : row.id)
                    }
                    aria-expanded={expanded === row.id}
                    aria-controls={`board-mobile-research-${row.id}`}
                    className="min-h-10 w-full text-left text-xs font-semibold text-emerald-400"
                  >
                    {expanded === row.id
                      ? "Close recent games & sources −"
                      : "Recent games & sources +"}
                  </button>
                  {expanded === row.id && (
                    <div
                      id={`board-mobile-research-${row.id}`}
                      className="pt-4"
                    >
                      <ResearchDetails row={row} />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div
          role="status"
          className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-12 text-center"
        >
          <h3 className="text-lg font-bold text-white">
            {view === "saved" && savesLoading
              ? "Loading your saved players…"
              : view === "saved" && savesError
                ? "Your watchlist is temporarily unavailable"
                : view === "saved" && !userId
                  ? "Sign in to view My Players"
                  : view === "saved" && savedNFL.size === 0
                    ? "Start tracking NFL players"
                    : current.length
                      ? "No props match your filters"
                      : view === "saved"
                        ? "No current props for your saved players"
                        : "No current props available"}
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
            {view === "saved" && savesError
              ? "We couldn’t load your saved-player list. Retry saved players above; your watchlist has not been cleared."
              : view === "saved" && savesLoading
                ? "Loading your saved-player list."
                : view === "saved" && !userId
                  ? "Create a free account or sign in to build your watchlist."
                  : view === "saved" && savedNFL.size === 0 && !savesLoading
                    ? "Save NFL players from All Players, player profiles or our free research tools to follow them here."
                    : current.length
                      ? "Try different filters or reset to defaults."
                      : view === "saved" && savedNFL.size > 0
                        ? pro
                          ? "Your saved players are still on your watchlist. Their games, markets or fresh lines may not be available right now."
                          : "Your saved players are still on your watchlist, but may not be in today’s free sample. Pro lets you check the full board; available props depend on current games and lines."
                        : "The board needs an upcoming game, a matched player, a valid projection and a fresh stored line."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {view === "saved" && !userId && !savesLoading ? (
              <>
                <Link
                  href="/signup?redirect=%2Fbetting-board%3Fview%3Dsaved"
                  className="inline-flex min-h-11 items-center font-semibold text-emerald-300"
                >
                  Create a free account
                </Link>
                <Link
                  href="/login?redirect=%2Fbetting-board%3Fview%3Dsaved"
                  className="inline-flex min-h-11 items-center font-semibold text-slate-300"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={reset}
                  className="min-h-11 font-semibold text-emerald-300"
                >
                  Show All Players
                </button>
                <Link
                  href="/nfl-player-prop-trends"
                  className="inline-flex min-h-11 items-center font-semibold text-slate-300"
                >
                  NFL Player Prop Trends →
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <details className="rounded-xl border border-slate-800 p-4 text-xs text-slate-500">
        <summary className="cursor-pointer font-semibold text-slate-400">
          Coverage & methodology
        </summary>
        <div className="mt-3 space-y-2 leading-6">
          <p>
            {board.coverage.sourceRows} source props checked;{" "}
            {board.coverage.displayed} passed board validation.
            Insufficient-history confidence scores and missing matchup
            indicators remain unavailable; limited or missing evidence affects
            the rating.
          </p>
          <p>
            {board.coverage.missingScores} without a KOFScore ·{" "}
            {board.coverage.missingMatchups} without a reliable matchup ·{" "}
            {board.coverage.limitedHistory} with fewer than five eligible logs.
          </p>
          <p>
            Only non-null stats from completed regular-season game logs are used
            for L5. Confidence combines the model margin with historical and
            matchup evidence; it is experimental and not a win probability. The
            board does not establish an expected betting return.
          </p>
        </div>
      </details>
    </div>
  );
}
