import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

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
  is_published: boolean | null;
  published_at: string | null;
  updated_at: string | null;
};

type PerformanceGroup = {
  name: string;
  wins: number;
  losses: number;
  pushes: number;
  cancelled: number;
  netUnits: number;
  riskedUnits: number;
};

function normalizeNumber(value: number | null | undefined) {
  const number = Number(value ?? 0);

  return Number.isFinite(number) ? number : 0;
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
  }).format(date);
}

function calculateWinPercentage(wins: number, losses: number) {
  const decisions = wins + losses;

  if (decisions === 0) {
    return 0;
  }

  return (wins / decisions) * 100;
}

function calculateRoi(netUnits: number, riskedUnits: number) {
  if (riskedUnits === 0) {
    return 0;
  }

  return (netUnits / riskedUnits) * 100;
}

function createPerformanceGroups(
  picks: Pick[],
  key: "sport" | "bet_type",
): PerformanceGroup[] {
  const groups = new Map<string, PerformanceGroup>();

  for (const pick of picks) {
    const name = pick[key]?.trim() || "Other";

    const currentGroup = groups.get(name) ?? {
      name,
      wins: 0,
      losses: 0,
      pushes: 0,
      cancelled: 0,
      netUnits: 0,
      riskedUnits: 0,
    };

    const units = normalizeNumber(pick.units);
    const profitLoss = normalizeNumber(pick.profit_loss);

    if (pick.status === "won") {
      currentGroup.wins += 1;
      currentGroup.riskedUnits += units;
      currentGroup.netUnits += profitLoss;
    }

    if (pick.status === "lost") {
      currentGroup.losses += 1;
      currentGroup.riskedUnits += units;
      currentGroup.netUnits += profitLoss;
    }

    if (pick.status === "push") {
      currentGroup.pushes += 1;
      currentGroup.riskedUnits += units;
    }

    if (pick.status === "cancelled") {
      currentGroup.cancelled += 1;
    }

    groups.set(name, currentGroup);
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (b.netUnits !== a.netUnits) {
      return b.netUnits - a.netUnits;
    }

    return b.wins + b.losses - (a.wins + a.losses);
  });
}

function resultClasses(status: string | null) {
  switch (status) {
    case "won":
      return {
        badge: "bg-green-100 text-green-800",
        border: "border-green-200",
        label: "Win",
      };

    case "lost":
      return {
        badge: "bg-red-100 text-red-800",
        border: "border-red-200",
        label: "Loss",
      };

    case "push":
      return {
        badge: "bg-gray-100 text-gray-700",
        border: "border-gray-200",
        label: "Push",
      };

    case "cancelled":
      return {
        badge: "bg-gray-100 text-gray-500",
        border: "border-gray-200",
        label: "Cancelled",
      };

    default:
      return {
        badge: "bg-amber-100 text-amber-800",
        border: "border-amber-200",
        label: "Pending",
      };
  }
}

export default async function AdminResultsPage() {
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
        is_published,
        published_at,
        updated_at
      `,
    )
    .order("updated_at", { ascending: false });

  const picks = (data ?? []) as Pick[];

  const gradedPicks = picks.filter(
    (pick) =>
      pick.status === "won" ||
      pick.status === "lost" ||
      pick.status === "push" ||
      pick.status === "cancelled",
  );

  const settledPicks = gradedPicks.filter(
    (pick) => pick.status !== "cancelled",
  );

  const pendingPicks = picks.filter((pick) => pick.status === "pending");

  const wins = gradedPicks.filter((pick) => pick.status === "won").length;
  const losses = gradedPicks.filter((pick) => pick.status === "lost").length;
  const pushes = gradedPicks.filter((pick) => pick.status === "push").length;
  const cancelled = gradedPicks.filter(
    (pick) => pick.status === "cancelled",
  ).length;

  const netUnits = settledPicks.reduce(
    (total, pick) => total + normalizeNumber(pick.profit_loss),
    0,
  );

  const riskedUnits = settledPicks.reduce(
    (total, pick) => total + normalizeNumber(pick.units),
    0,
  );

  const pendingExposure = pendingPicks.reduce(
    (total, pick) => total + normalizeNumber(pick.units),
    0,
  );

  const winPercentage = calculateWinPercentage(wins, losses);
  const roi = calculateRoi(netUnits, riskedUnits);

  const sportGroups = createPerformanceGroups(gradedPicks, "sport");
  const betTypeGroups = createPerformanceGroups(gradedPicks, "bet_type");

  const recentResults = gradedPicks.slice(0, 8);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
            Performance Tracking
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-black sm:text-5xl">
            KofSports results
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Every statistic is calculated directly from your graded picks,
            odds, and units.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/picks"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-bold text-gray-700 transition hover:border-black hover:text-black"
          >
            Manage Picks
          </Link>

          <Link
            href="/admin/picks/new"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-amber-500 hover:text-black"
          >
            Add New Pick
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load performance data: {error.message}
        </div>
      )}

      {!error && (
        <>
          <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Overall Record
              </p>

              <p className="mt-4 text-4xl font-black tracking-tight text-black">
                {wins}-{losses}-{pushes}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {cancelled > 0
                  ? `${cancelled} cancelled pick${
                      cancelled === 1 ? "" : "s"
                    } excluded`
                  : "Wins, losses, and pushes"}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Win Rate
              </p>

              <p className="mt-4 text-3xl font-black text-black">
                {formatPercentage(winPercentage)}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Decided picks only
              </p>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                Net Units
              </p>

              <p
                className={`mt-4 text-3xl font-black ${
                  netUnits > 0
                    ? "text-green-700"
                    : netUnits < 0
                      ? "text-red-700"
                      : "text-black"
                }`}
              >
                {formatUnits(netUnits)}
              </p>

              <p className="mt-2 text-sm text-amber-800">
                Settled selections
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                ROI
              </p>

              <p
                className={`mt-4 text-3xl font-black ${
                  roi > 0
                    ? "text-green-700"
                    : roi < 0
                      ? "text-red-700"
                      : "text-black"
                }`}
              >
                {formatPercentage(roi)}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {riskedUnits.toFixed(2)} units risked
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Pending
              </p>

              <p className="mt-4 text-3xl font-black text-black">
                {pendingPicks.length}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {pendingExposure.toFixed(2)} units exposed
              </p>
            </div>
          </section>

          {picks.length === 0 && (
            <section className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <p className="text-2xl font-black text-black">
                No performance data yet
              </p>

              <p className="mx-auto mt-3 max-w-xl text-gray-600">
                Create and grade picks to begin building your verified
                KofSports performance history.
              </p>

              <Link
                href="/admin/picks/new"
                className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-amber-500 hover:text-black"
              >
                Create First Pick
              </Link>
            </section>
          )}

          {picks.length > 0 && (
            <>
              <section className="mt-12 grid gap-8 xl:grid-cols-2">
                <div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                        Breakdown
                      </p>

                      <h2 className="mt-2 text-3xl font-black text-black">
                        Results by sport
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {sportGroups.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-gray-500">
                        Grade a pick to generate sport performance.
                      </div>
                    ) : (
                      sportGroups.map((group) => {
                        const groupWinRate = calculateWinPercentage(
                          group.wins,
                          group.losses,
                        );

                        const groupRoi = calculateRoi(
                          group.netUnits,
                          group.riskedUnits,
                        );

                        return (
                          <div
                            key={group.name}
                            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xl font-black text-black">
                                  {group.name}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                  {group.wins}-{group.losses}-{group.pushes}
                                  {group.cancelled > 0
                                    ? ` · ${group.cancelled} cancelled`
                                    : ""}
                                </p>
                              </div>

                              <div className="grid grid-cols-3 gap-6 sm:text-right">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                    Win Rate
                                  </p>

                                  <p className="mt-1 font-black text-black">
                                    {formatPercentage(groupWinRate)}
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
                                    {formatUnits(group.netUnits)}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                    ROI
                                  </p>

                                  <p className="mt-1 font-black text-black">
                                    {formatPercentage(groupRoi)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      Breakdown
                    </p>

                    <h2 className="mt-2 text-3xl font-black text-black">
                      Results by bet type
                    </h2>
                  </div>

                  <div className="mt-6 space-y-4">
                    {betTypeGroups.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-gray-500">
                        Grade a pick to generate bet-type performance.
                      </div>
                    ) : (
                      betTypeGroups.map((group) => {
                        const groupWinRate = calculateWinPercentage(
                          group.wins,
                          group.losses,
                        );

                        const groupRoi = calculateRoi(
                          group.netUnits,
                          group.riskedUnits,
                        );

                        return (
                          <div
                            key={group.name}
                            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xl font-black text-black">
                                  {group.name}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                  {group.wins}-{group.losses}-{group.pushes}
                                  {group.cancelled > 0
                                    ? ` · ${group.cancelled} cancelled`
                                    : ""}
                                </p>
                              </div>

                              <div className="grid grid-cols-3 gap-6 sm:text-right">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                    Win Rate
                                  </p>

                                  <p className="mt-1 font-black text-black">
                                    {formatPercentage(groupWinRate)}
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
                                    {formatUnits(group.netUnits)}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                    ROI
                                  </p>

                                  <p className="mt-1 font-black text-black">
                                    {formatPercentage(groupRoi)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>

              <section className="mt-14">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                      Latest Grades
                    </p>

                    <h2 className="mt-2 text-3xl font-black text-black">
                      Recent results
                    </h2>
                  </div>

                  <Link
                    href="/admin/picks"
                    className="font-bold text-amber-700 transition hover:text-amber-900"
                  >
                    View all picks
                  </Link>
                </div>

                {recentResults.length === 0 ? (
                  <div className="mt-6 rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                    No graded results yet.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    {recentResults.map((pick) => {
                      const resultStyle = resultClasses(pick.status);
                      const profitLoss = normalizeNumber(pick.profit_loss);

                      return (
                        <article
                          key={pick.id}
                          className={`rounded-3xl border bg-white p-6 shadow-sm ${resultStyle.border}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.15em] ${resultStyle.badge}`}
                              >
                                {resultStyle.label}
                              </span>

                              <p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
                                {pick.sport ?? "Sport"} ·{" "}
                                {pick.bet_type ?? "Bet"}
                              </p>

                              <h3 className="mt-2 text-2xl font-black text-black">
                                {pick.selection}
                              </h3>

                              <p className="mt-2 text-sm text-gray-500">
                                {pick.matchup ?? "Matchup unavailable"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p
                                className={`text-2xl font-black ${
                                  profitLoss > 0
                                    ? "text-green-700"
                                    : profitLoss < 0
                                      ? "text-red-700"
                                      : "text-gray-700"
                                }`}
                              >
                                {formatUnits(profitLoss)}
                              </p>

                              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-400">
                                Units
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                Odds
                              </p>

                              <p className="mt-1 font-black text-black">
                                {formatOdds(pick.odds)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                Risk
                              </p>

                              <p className="mt-1 font-black text-black">
                                {normalizeNumber(pick.units).toFixed(2)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                                Confidence
                              </p>

                              <p className="mt-1 font-black text-black">
                                {pick.confidence ?? 3}/5
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 flex items-center justify-between gap-4">
                            <p className="text-sm text-gray-500">
                              Graded {formatDate(pick.updated_at)}
                            </p>

                            <Link
                              href={`/admin/picks/${pick.id}`}
                              className="text-sm font-bold text-amber-700 transition hover:text-amber-900"
                            >
                              Manage
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}