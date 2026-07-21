import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type RangeFilter =
  | "season"
  | "30-days"
  | "month"
  | "7-days"
  | "all-time";

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

type ChartPoint = {
  label: string;
  value: number;
};

type ResultStyles = {
  label: string;
  badge: string;
  value: string;
};

const CURRENT_SEASON = 2026;

const rangeOptions: Array<{
  value: RangeFilter;
  label: string;
}> = [
  {
    value: "season",
    label: `${CURRENT_SEASON} Season`,
  },
  {
    value: "30-days",
    label: "Last 30 Days",
  },
  {
    value: "month",
    label: "This Month",
  },
  {
    value: "7-days",
    label: "Last 7 Days",
  },
  {
    value: "all-time",
    label: "All Time",
  },
];

function normalizeNumber(value: number | null | undefined) {
  const parsedValue = Number(value ?? 0);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeRange(value: string | undefined): RangeFilter {
  const validRanges: RangeFilter[] = [
    "season",
    "30-days",
    "month",
    "7-days",
    "all-time",
  ];

  if (value && validRanges.includes(value as RangeFilter)) {
    return value as RangeFilter;
  }

  return "season";
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

function formatChartDate(value: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
}

function getPerformanceDate(pick: Pick) {
  const value =
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
  if (range === "all-time") {
    return picks.filter(
      (pick) => getPerformanceDate(pick) !== null,
    );
  }

  const now = currentDate;

  return picks.filter((pick) => {
    const performanceDate = getPerformanceDate(pick);

    if (!performanceDate) {
      return false;
    }

    if (range === "season") {
      return performanceDate.getFullYear() === CURRENT_SEASON;
    }

    if (range === "month") {
      return (
        performanceDate.getFullYear() === now.getFullYear() &&
        performanceDate.getMonth() === now.getMonth()
      );
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

function createChartPoints(picks: Pick[]): ChartPoint[] {
  const sortedPicks = [...picks].sort((a, b) => {
    const firstDate = getPerformanceDate(a)?.getTime() ?? 0;
    const secondDate = getPerformanceDate(b)?.getTime() ?? 0;

    return firstDate - secondDate;
  });

  let cumulativeUnits = 0;

  return sortedPicks.map((pick) => {
    cumulativeUnits += normalizeNumber(pick.profit_loss);

    return {
    label: formatChartDate(
  getPerformanceDate(pick),
),
      value: cumulativeUnits,
    };
  });
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

function CumulativeUnitsChart({
  points,
}: {
  points: ChartPoint[];
}) {
  if (points.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center text-gray-500">
        Grade and publish picks to build the cumulative units
        chart.
      </div>
    );
  }

  const width = 900;
  const height = 360;
  const horizontalPadding = 60;
  const verticalPadding = 45;

  const values = points.map((point) => point.value);

  const minimumValue = Math.min(0, ...values);
  const maximumValue = Math.max(0, ...values);
  const rawRange = maximumValue - minimumValue;
  const valueRange = rawRange === 0 ? 1 : rawRange;

  const getX = (index: number) => {
    if (points.length === 1) {
      return width / 2;
    }

    const availableWidth = width - horizontalPadding * 2;

    return (
      horizontalPadding +
      (index / (points.length - 1)) * availableWidth
    );
  };

  const getY = (value: number) => {
    const availableHeight = height - verticalPadding * 2;

    return (
      verticalPadding +
      ((maximumValue - value) / valueRange) * availableHeight
    );
  };

  const linePoints = points
    .map(
      (point, index) =>
        `${getX(index)},${getY(point.value)}`,
    )
    .join(" ");

  const zeroY = getY(0);
  const finalPoint = points[points.length - 1];

  const gridValues = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;

    return maximumValue - ratio * valueRange;
  });

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
            Running Profit
          </p>

          <h3 className="mt-2 text-2xl font-black">
            Cumulative units
          </h3>
        </div>

        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
            Current
          </p>

          <p
            className={`mt-1 text-3xl font-black ${
              finalPoint.value > 0
                ? "text-green-700"
                : finalPoint.value < 0
                  ? "text-red-700"
                  : "text-black"
            }`}
          >
            {formatUnits(finalPoint.value)}
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[720px]"
          role="img"
          aria-label="Cumulative units performance chart"
        >
          {gridValues.map((value) => {
            const y = getY(value);

            return (
              <g key={value}>
                <line
                  x1={horizontalPadding}
                  x2={width - horizontalPadding}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-gray-200"
                  strokeWidth="1"
                />

                <text
                  x={horizontalPadding - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-gray-400 text-[12px]"
                >
                  {value.toFixed(1)}
                </text>
              </g>
            );
          })}

          <line
            x1={horizontalPadding}
            x2={width - horizontalPadding}
            y1={zeroY}
            y2={zeroY}
            stroke="currentColor"
            className="text-gray-500"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />

          <polyline
            points={linePoints}
            fill="none"
            stroke="currentColor"
            className="text-amber-500"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => (
          <circle
  key={`${point.label}-${index}`}
  cx={getX(index)}
  cy={getY(point.value)}
  r={index === points.length - 1 ? 7 : 4}
  fill="currentColor"
  className="text-black"
/>
          ))}

          <text
            x={horizontalPadding}
            y={height - 10}
            textAnchor="start"
            className="fill-gray-400 text-[12px]"
          >
            {points[0]?.label}
          </text>

          <text
            x={width - horizontalPadding}
            y={height - 10}
            textAnchor="end"
            className="fill-gray-400 text-[12px]"
          >
            {finalPoint.label}
          </text>
        </svg>
      </div>
    </div>
  );
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
        game_time,
        status,
        profit_loss,
        published_at,
        updated_at
      `,
    )
    .eq("is_published", true)
    .in("status", ["won", "lost", "push"])
    .order("updated_at", { ascending: false });

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
  const chartPoints = createChartPoints(picks);

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
    )?.label ?? `${CURRENT_SEASON} Season`;

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

         <div className="mt-10 grid gap-4 sm:grid-cols-3"></div>
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

            <div className="rounded-3xl border border-white/10 bg-white/5 p-7">
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
              <section className="rounded-3xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      Refine Performance
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Filter the verified record
                    </h2>
                  </div>

                  {(selectedSport ||
                    selectedBetType) && (
                    <a
  href={buildFilterHref({
    range: selectedRange,
  })}
  className="font-bold text-amber-700 transition hover:text-amber-900"
>
  Clear filters
</a>
                  )}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
  <p className="text-sm font-bold text-gray-700">
    Sport
  </p>

  <div className="mt-3 flex flex-wrap gap-2">
    <a
      href={buildFilterHref({
        range: selectedRange,
        betType: selectedBetType || undefined,
      })}
      className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
        !selectedSport
          ? "border-black bg-black text-white"
          : "border-gray-300 bg-white text-gray-700 hover:border-black"
      }`}
    >
      All Sports
    </a>

    {availableSports.map((sport) => (
      <a
        key={sport}
        href={buildFilterHref({
          range: selectedRange,
          sport,
          betType: selectedBetType || undefined,
        })}
        className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
          selectedSport === sport
            ? "border-black bg-black text-white"
            : "border-gray-300 bg-white text-gray-700 hover:border-black"
        }`}
      >
        {sport}
      </a>
    ))}
  </div>
</div>

                 <div>
  <p className="text-sm font-bold text-gray-700">
    Bet Type
  </p>

  <div className="mt-3 flex flex-wrap gap-2">
    <a
      href={buildFilterHref({
        range: selectedRange,
        sport: selectedSport || undefined,
      })}
      className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
        !selectedBetType
          ? "border-black bg-black text-white"
          : "border-gray-300 bg-white text-gray-700 hover:border-black"
      }`}
    >
      All Bet Types
    </a>

    {availableBetTypes.map((betType) => (
      <a
        key={betType}
        href={buildFilterHref({
          range: selectedRange,
          sport: selectedSport || undefined,
          betType,
        })}
        className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
          selectedBetType === betType
            ? "border-black bg-black text-white"
            : "border-gray-300 bg-white text-gray-700 hover:border-black"
        }`}
      >
        {betType}
      </a>
    ))}
  </div>
</div>
                </div>
              </section>

              {picks.length === 0 ? (
                <section className="mt-10 rounded-3xl border border-dashed border-gray-300 px-6 py-16 text-center">
                  <h2 className="text-3xl font-black">
                    No results match these filters
                  </h2>

                  <p className="mx-auto mt-4 max-w-xl text-gray-600">
                    Try another date range, sport, or bet
                    type.
                  </p>

                  <Link
                    href="/results?range=season"
                    className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-amber-500 hover:text-black"
                  >
                    View Season Results
                  </Link>
                </section>
              ) : (
                <>
                  <section className="mt-10">
                    <CumulativeUnitsChart
                      points={chartPoints}
                    />
                  </section>

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
            </>
          )}
        </div>
      </section>
    </main>
  );
}