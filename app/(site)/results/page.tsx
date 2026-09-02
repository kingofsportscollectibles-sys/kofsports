import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type RangeFilter = "30-days" | "7-days";

type SearchParams = {
  range?: string;
  sport?: string;
  betType?: string;
};

type Pick = {
  id: string;
  sport: string | null;
  bet_type: string | null;
  matchup: string | null;
  selection: string;
  odds: number | null;
  units: number | null;
  confidence: number | null;
  game_date: string | null;
  game_time: string | null;
  status: string | null;
  profit_loss: number | null;
  published_at: string | null;
  updated_at: string | null;
};

type PerformanceGroup = {
  name: string;
  wins: number;
  losses: number;
  pushes: number;
  netUnits: number;
  riskedUnits: number;
};

type MonthlyGroup = {
  key: string;
  label: string;
  wins: number;
  losses: number;
  pushes: number;
  netUnits: number;
  riskedUnits: number;
};


type ResultStyles = {
  label: string;
  badge: string;
  value: string;
};

const rangeOptions: Array<{
  value: RangeFilter;
  label: string;
}> = [
  {
    value: "7-days",
    label: "Last 7 Days",
  },
  {
    value: "30-days",
    label: "Last 30 Days",
  },
];

function normalizeNumber(value: number | null | undefined) {
  const parsedValue = Number(value ?? 0);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeRange(value: string | undefined): RangeFilter {
  const validRanges: RangeFilter[] = ["30-days", "7-days"];

  if (value && validRanges.includes(value as RangeFilter)) {
    return value as RangeFilter;
  }

  return "7-days";
}

function formatUnits(value: number) {
  if (value > 0) {
    return `+${value.toFixed(2)}`;
  }

  return value.toFixed(2);
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return "0.0%";
  }

  return `${value.toFixed(1)}%`;
}

function formatOdds(odds: number | null) {
  if (odds === null) {
    return "—";
  }

  return odds > 0 ? `+${odds}` : String(odds);
}

function formatAverageOdds(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const roundedValue = Math.round(value);

  return roundedValue > 0 ? `+${roundedValue}` : String(roundedValue);
}

const DISPLAY_TIME_ZONE = "America/New_York";

function formatDate(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
}


function getPerformanceDate(pick: Pick) {
  const value =
    pick.game_date ??
    pick.game_time ??
    pick.published_at ??
    pick.updated_at;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function calculateWinPercentage(wins: number, losses: number) {
  const decisions = wins + losses;

  return decisions > 0 ? (wins / decisions) * 100 : 0;
}

function filterByRange(
  picks: Pick[],
  range: RangeFilter,
  currentDate: Date,
) {

  const now = currentDate;

  return picks.filter((pick) => {
    const performanceDate = getPerformanceDate(pick);

    if (!performanceDate) {
      return false;
    }

    const cutoffDate = new Date(now);

    if (range === "30-days") {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
    }

    if (range === "7-days") {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    }

    return performanceDate >= cutoffDate;
  });
}

function createPerformanceGroups(
  picks: Pick[],
  key: "sport" | "bet_type",
): PerformanceGroup[] {
  const groups = new Map<string, PerformanceGroup>();

  for (const pick of picks) {
    const name = pick[key]?.trim() || "Other";

    const group = groups.get(name) ?? {
      name,
      wins: 0,
      losses: 0,
      pushes: 0,
      netUnits: 0,
      riskedUnits: 0,
    };

    if (pick.status === "won") {
      group.wins += 1;
    }

    if (pick.status === "lost") {
      group.losses += 1;
    }

    if (pick.status === "push") {
      group.pushes += 1;
    }

    group.netUnits += normalizeNumber(pick.profit_loss);
    group.riskedUnits += normalizeNumber(pick.units);

    groups.set(name, group);
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (b.netUnits !== a.netUnits) {
      return b.netUnits - a.netUnits;
    }

    return b.wins + b.losses - (a.wins + a.losses);
  });
}

function createMonthlyGroups(picks: Pick[]): MonthlyGroup[] {
  const groups = new Map<string, MonthlyGroup>();

  const monthKeyFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  });

  const monthLabelFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  });

  for (const pick of picks) {
    const performanceDate = getPerformanceDate(pick);

    if (!performanceDate) {
      continue;
    }

    const dateParts = monthKeyFormatter.formatToParts(
      performanceDate,
    );

    const year =
      dateParts.find((part) => part.type === "year")?.value ??
      "";

    const month =
      dateParts.find((part) => part.type === "month")?.value ??
      "";

    const key = `${year}-${month}`;
    const label = monthLabelFormatter.format(performanceDate);

    const group = groups.get(key) ?? {
      key,
      label,
      wins: 0,
      losses: 0,
      pushes: 0,
      netUnits: 0,
      riskedUnits: 0,
    };

    if (pick.status === "won") {
      group.wins += 1;
    }

    if (pick.status === "lost") {
      group.losses += 1;
    }

    if (pick.status === "push") {
      group.pushes += 1;
    }

    group.netUnits += normalizeNumber(pick.profit_loss);
    group.riskedUnits += normalizeNumber(pick.units);

    groups.set(key, group);
  }

  return Array.from(groups.values()).sort((a, b) =>
    b.key.localeCompare(a.key),
  );
}

function calculateStreaks(picks: Pick[]) {
  const decidedPicks = [...picks]
    .filter(
      (pick) =>
        pick.status === "won" || pick.status === "lost",
    )
    .sort((a, b) => {
      const firstDate = getPerformanceDate(a)?.getTime() ?? 0;
      const secondDate = getPerformanceDate(b)?.getTime() ?? 0;

      return firstDate - secondDate;
    });

  let longestWinningStreak = 0;
  let longestLosingStreak = 0;
  let activeWinningStreak = 0;
  let activeLosingStreak = 0;

  for (const pick of decidedPicks) {
    if (pick.status === "won") {
      activeWinningStreak += 1;
      activeLosingStreak = 0;
      longestWinningStreak = Math.max(
        longestWinningStreak,
        activeWinningStreak,
      );
    }

    if (pick.status === "lost") {
      activeLosingStreak += 1;
      activeWinningStreak = 0;
      longestLosingStreak = Math.max(
        longestLosingStreak,
        activeLosingStreak,
      );
    }
  }

  const latestPick =
    decidedPicks[decidedPicks.length - 1] ?? null;

  const currentWinningStreak =
    latestPick?.status === "won" ? activeWinningStreak : 0;

  return {
    currentWinningStreak,
    longestWinningStreak,
    longestLosingStreak,
  };
}


function getResultStyles(
  status: string | null,
): ResultStyles {
  switch (status) {
    case "won":
      return {
        label: "Win",
        badge: "bg-green-100 text-green-800",
        value: "text-green-700",
      };

    case "lost":
      return {
        label: "Loss",
        badge: "bg-red-100 text-red-800",
        value: "text-red-700",
      };

    case "push":
      return {
        label: "Push",
        badge: "bg-gray-100 text-gray-700",
        value: "text-gray-700",
      };

    default:
      return {
        label: "Result",
        badge: "bg-gray-100 text-gray-700",
        value: "text-gray-700",
      };
  }
}

function buildFilterHref({
  range,
  sport,
  betType,
}: {
  range: RangeFilter;
  sport?: string;
  betType?: string;
}) {
  const params = new URLSearchParams();

  params.set("range", range);

  if (sport) {
    params.set("sport", sport);
  }

  if (betType) {
    params.set("betType", betType);
  }

  return `/results?${params.toString()}`;
}

export default async function PublicResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  const selectedRange = normalizeRange(
    resolvedSearchParams.range,
  );

  const selectedSport =
    resolvedSearchParams.sport?.trim() || "";

  const selectedBetType =
    resolvedSearchParams.betType?.trim() || "";

    const currentDate = new Date();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vip_picks")
    .select(
      `
        id,
        sport,
        bet_type,
        matchup,
        selection,
        odds,
        units,
        confidence,
        game_date,
        game_time,
        status,
        profit_loss,
        published_at,
        updated_at
      `,
    )
    .eq("is_published", true)
    .in("status", ["won", "lost", "push"])
    .order("game_date", { ascending: false });

  const allPublishedPicks = (data ?? []) as Pick[];

  const availableSports = Array.from(
    new Set(
      allPublishedPicks
        .map((pick) => pick.sport?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

  const availableBetTypes = Array.from(
    new Set(
      allPublishedPicks
        .map((pick) => pick.bet_type?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

 const rangeFilteredPicks = filterByRange(
  allPublishedPicks,
  selectedRange,
  currentDate,
);

  const picks = rangeFilteredPicks.filter((pick) => {
    const matchesSport =
      !selectedSport || pick.sport === selectedSport;

    const matchesBetType =
      !selectedBetType ||
      pick.bet_type === selectedBetType;

    return matchesSport && matchesBetType;
  });

  const wins = picks.filter(
    (pick) => pick.status === "won",
  ).length;

  const losses = picks.filter(
    (pick) => pick.status === "lost",
  ).length;

  const pushes = picks.filter(
    (pick) => pick.status === "push",
  ).length;

  const netUnits = picks.reduce(
    (total, pick) =>
      total + normalizeNumber(pick.profit_loss),
    0,
  );

  const riskedUnits = picks.reduce(
    (total, pick) => total + normalizeNumber(pick.units),
    0,
  );

  const oddsValues = picks
    .map((pick) => pick.odds)
    .filter((value): value is number => value !== null);

  const confidenceValues = picks
    .map((pick) => pick.confidence)
    .filter((value): value is number => value !== null);

  const averageConfidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce(
          (total, value) => total + value,
          0,
        ) / confidenceValues.length
      : 0;

  const winPercentage = calculateWinPercentage(
    wins,
    losses,
  );

  const sportGroups = createPerformanceGroups(
    picks,
    "sport",
  );

  const betTypeGroups = createPerformanceGroups(
    picks,
    "bet_type",
  );

  const monthlyGroups = createMonthlyGroups(picks);
  const streaks = calculateStreaks(picks);

  const recentResults = [...picks]
    .sort((a, b) => {
      const firstDate =
        getPerformanceDate(a)?.getTime() ?? 0;

      const secondDate =
        getPerformanceDate(b)?.getTime() ?? 0;

      return secondDate - firstDate;
    })
    .slice(0, 12);

  const selectedRangeLabel =
    rangeOptions.find(
      (option) => option.value === selectedRange,
    )?.label ?? "Last 7 Days";

  return (
    <main className="bg-black text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-400">
              Transparent Performance
            </p>

            <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-7xl">
              The KofSports record.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              Every result is calculated from published
              selections, documented odds, units risked, and
              final grades.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-300">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              Verified published results
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            {rangeOptions.map((option) => {
              const isActive =
                selectedRange === option.value;

              return (
                <Link
                  key={option.value}
                  href={buildFilterHref({
                    range: option.value,
                    sport: selectedSport || undefined,
                    betType:
                      selectedBetType || undefined,
                  })}
                  className={`rounded-full border px-5 py-2.5 text-sm font-bold transition ${
                    isActive
                      ? "border-amber-400 bg-amber-400 text-black"
                      : "border-white/15 bg-white/5 text-gray-300 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>

         <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                {selectedRangeLabel}
              </p>

              <p className="mt-4 text-4xl font-black">
                {wins}-{losses}-{pushes}
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Record
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                Win Rate
              </p>

              <p className="mt-4 text-4xl font-black">
                {formatPercentage(winPercentage)}
              </p>

              <p className="mt-2 text-sm text-gray-400">
                Decided picks only
              </p>
            </div>

            <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
                Net Units
              </p>

              <p
                className={`mt-4 text-4xl font-black ${
                  netUnits > 0
                    ? "text-green-400"
                    : netUnits < 0
                      ? "text-red-400"
                      : "text-white"
                }`}
              >
                {formatUnits(netUnits)}
              </p>

              <p className="mt-2 text-sm text-amber-100/70">
                Settled published picks
              </p>
            </div>

          </div>
        </div>
      </section>

      <section className="bg-white text-black">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              Results are temporarily unavailable.
            </div>
          )}

{!error && (
  <>
    <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl border border-gray-200 p-6 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                        Current Win Streak
                      </p>

                      <p className="mt-3 text-3xl font-black">
                        {streaks.currentWinningStreak}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-gray-200 p-6 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                        Best Win Streak
                      </p>

                      <p className="mt-3 text-3xl font-black">
                        {streaks.longestWinningStreak}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-gray-200 p-6 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                        Longest Loss Streak
                      </p>

                      <p className="mt-3 text-3xl font-black">
                        {streaks.longestLosingStreak}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-gray-200 p-6 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                        Avg. Confidence
                      </p>

                      <p className="mt-3 text-3xl font-black">
                        {averageConfidence > 0
                          ? `${averageConfidence.toFixed(
                              1,
                            )}/5`
                          : "—"}
                      </p>
                    </div>
                  </section>

                  <section className="mt-20">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      Performance Breakdown
                    </p>

                    <h2 className="mt-3 text-4xl font-black tracking-tight">
                      Results by sport
                    </h2>

                    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {sportGroups.map((group) => {
                        const groupWinRate =
                          calculateWinPercentage(
                            group.wins,
                            group.losses,
                          );

                        return (
                          <article
                            key={group.name}
                            className="rounded-3xl border border-gray-200 p-7 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-5">
                              <div>
                                <h3 className="text-2xl font-black">
                                  {group.name}
                                </h3>

                                <p className="mt-2 text-gray-500">
                                  {group.wins}-
                                  {group.losses}-
                                  {group.pushes}
                                </p>
                              </div>

                              <p
                                className={`text-2xl font-black ${
                                  group.netUnits > 0
                                    ? "text-green-700"
                                    : group.netUnits < 0
                                      ? "text-red-700"
                                      : "text-black"
                                }`}
                              >
                                {formatUnits(
                                  group.netUnits,
                                )}
                              </p>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                  Win Rate
                                </p>

                                <p className="mt-1 font-black">
                                  {formatPercentage(
                                    groupWinRate,
                                  )}
                                </p>
                              </div>

                              <div>

                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  <section className="mt-20">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      Selection Analysis
                    </p>

                    <h2 className="mt-3 text-4xl font-black tracking-tight">
                      Results by bet type
                    </h2>

                    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {betTypeGroups.map((group) => {
                        const groupWinRate =
                          calculateWinPercentage(
                            group.wins,
                            group.losses,
                          );

                        return (
                          <article
                            key={group.name}
                            className="rounded-3xl border border-gray-200 p-7 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-5">
                              <div>
                                <h3 className="text-2xl font-black">
                                  {group.name}
                                </h3>

                                <p className="mt-2 text-gray-500">
                                  {group.wins}-
                                  {group.losses}-
                                  {group.pushes}
                                </p>
                              </div>

                              <p
                                className={`text-2xl font-black ${
                                  group.netUnits > 0
                                    ? "text-green-700"
                                    : group.netUnits < 0
                                      ? "text-red-700"
                                      : "text-black"
                                }`}
                              >
                                {formatUnits(
                                  group.netUnits,
                                )}
                              </p>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                  Win Rate
                                </p>

                                <p className="mt-1 font-black">
                                  {formatPercentage(
                                    groupWinRate,
                                  )}
                                </p>
                              </div>

                              <div>
                                
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  <section className="mt-20">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      Month by Month
                    </p>

                    <h2 className="mt-3 text-4xl font-black tracking-tight">
                      Monthly performance
                    </h2>

                    <div className="mt-8 overflow-hidden rounded-3xl border border-gray-200">
                      {monthlyGroups.map(
                        (group, index) => {
                          const monthlyWinRate =
                            calculateWinPercentage(
                              group.wins,
                              group.losses,
                            );

                          return (
                            <article
                              key={group.key}
                              className={`grid gap-5 px-6 py-6 sm:grid-cols-[1.5fr_1fr_1fr_1fr] sm:items-center ${
                                index > 0
                                  ? "border-t border-gray-200"
                                  : ""
                              }`}
                            >
                              <div>
                                <h3 className="text-lg font-black">
                                  {group.label}
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                  {group.wins}-
                                  {group.losses}-
                                  {group.pushes}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                  Win Rate
                                </p>

                                <p className="mt-1 font-black">
                                  {formatPercentage(
                                    monthlyWinRate,
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                  Units
                                </p>

                                <p
                                  className={`mt-1 font-black ${
                                    group.netUnits > 0
                                      ? "text-green-700"
                                      : group.netUnits < 0
                                        ? "text-red-700"
                                        : "text-black"
                                  }`}
                                >
                                  {formatUnits(
                                    group.netUnits,
                                  )}
                                </p>
                              </div>

                              <div>
                              </div>
                            </article>
                          );
                        },
                      )}
                    </div>
                  </section>

                  <section className="mt-20">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      Verified History
                    </p>

                    <h2 className="mt-3 text-4xl font-black tracking-tight">
                      Recent results
                    </h2>

                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                      {recentResults.map((pick) => {
                        const resultStyles =
                          getResultStyles(
                            pick.status,
                          );

                        const profitLoss =
                          normalizeNumber(
                            pick.profit_loss,
                          );

                        return (
                          <article
                            key={pick.id}
                            className="rounded-3xl border border-gray-200 p-7 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-5">
                              <div>
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.15em] ${resultStyles.badge}`}
                                >
                                  {resultStyles.label}
                                </span>

                                <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
                                  {pick.sport ??
                                    "Sport"}{" "}
                                  ·{" "}
                                  {pick.bet_type ??
                                    "Selection"}
                                </p>

                                <h3 className="mt-2 text-2xl font-black">
                                  {pick.selection}
                                </h3>

                                <p className="mt-2 text-sm text-gray-500">
                                  {pick.matchup ??
                                    "Matchup unavailable"}
                                </p>
                              </div>

                              <div className="text-right">
                                <p
                                  className={`text-2xl font-black ${resultStyles.value}`}
                                >
                                  {formatUnits(
                                    profitLoss,
                                  )}
                                </p>

                                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                                  Units
                                </p>
                              </div>
                            </div>

                            <div className="mt-7 grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                  Odds
                                </p>

                                <p className="mt-1 font-black">
                                  {formatOdds(
                                    pick.odds,
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                  Risk
                                </p>

                                <p className="mt-1 font-black">
                                  {normalizeNumber(
                                    pick.units,
                                  ).toFixed(2)}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                  Date
                                </p>

                                <p className="mt-1 font-black">
                                  {formatDate(
                                    getPerformanceDate(
                                      pick,
                                    )?.toISOString() ??
                                      null,
                                  )}
                                </p>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  <section className="mt-20 rounded-[2rem] bg-black px-7 py-12 text-white sm:px-12">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
                          Get the selections before
                          game time
                        </p>

                        <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-tight">
                          Want the next pick instead
                          of yesterday&apos;s result?
                        </h2>

                        <p className="mt-4 max-w-xl text-gray-300">
                          Join KofSports Premium for
                          current picks, full analysis,
                          confidence ratings, and
                          member-only updates.
                        </p>
                      </div>

                      <Link
                        href="/plans"
                        className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-amber-400 px-7 py-3 font-black text-black transition hover:bg-amber-300"
                      >
                        View Premium Plans
                      </Link>
                    </div>
                  </section>
                          </>
          )}
        </div>
      </section>
    </main>);
}