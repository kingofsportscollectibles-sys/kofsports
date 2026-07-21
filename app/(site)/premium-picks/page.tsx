import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import PremiumVault from "@/components/premium/PremiumVault";

type PickStatus = "pending" | "won" | "lost" | "push" | "void";

type PremiumPageSearchParams = {
  vaultSearch?: string;
  vaultSport?: string;
  vaultBetType?: string;
  vaultResult?: string;
  vaultYear?: string;
  vaultPage?: string;
};

type PremiumPick = {
  id: string;
  sport: string | null;
  matchup: string | null;
  bet_type: string | null;
  selection: string;
  odds: number | null;
  units: number | null;
  confidence: number | null;
  game_date: string | null;
  game_time: string | null;
  analysis: string | null;
  best_sportsbook: string | null;
  game_notes: string | null;
  status: PickStatus | string | null;
  profit_loss: number | null;
};

type Profile = {
  membership: string | null;
  role: string | null;
};

function formatOdds(odds: number | null) {
  if (odds === null) {
    return "Odds pending";
  }

  return odds > 0 ? `+${odds}` : String(odds);
}

function formatUnits(units: number | null) {
  const value = units ?? 1;

  return `${value} ${value === 1 ? "unit" : "units"}`;
}

function formatGameTime(gameTime: string | null) {
  if (!gameTime) {
    return "Game time coming soon";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(gameTime));
}

function confidenceStars(confidence: number | null) {
  const rating = Math.min(Math.max(confidence ?? 3, 1), 5);

  return Array.from({ length: 5 }, (_, index) =>
    index < rating ? "★" : "☆",
  ).join("");
}

function formatProfitLoss(profitLoss: number | null) {
  if (profitLoss === null) {
    return null;
  }

  const sign = profitLoss > 0 ? "+" : "";

  return `${sign}${profitLoss.toFixed(2)}u`;
}

function getResultDisplay(status: PremiumPick["status"]) {
  switch (status) {
    case "won":
      return {
        label: "Win",
        symbol: "✓",
        badgeClass:
          "border-green-300 bg-green-50 text-green-700",
        cardClass: "border-green-200",
      };

    case "lost":
      return {
        label: "Loss",
        symbol: "×",
        badgeClass:
          "border-red-300 bg-red-50 text-red-700",
        cardClass: "border-red-200",
      };

    case "push":
      return {
        label: "Push",
        symbol: "—",
        badgeClass:
          "border-gray-300 bg-gray-100 text-gray-700",
        cardClass: "border-gray-200",
      };

    case "void":
      return {
        label: "Void",
        symbol: "—",
        badgeClass:
          "border-gray-300 bg-gray-100 text-gray-700",
        cardClass: "border-gray-200",
      };

    default:
      return {
        label: "Pending",
        symbol: "•",
        badgeClass:
          "border-amber-300 bg-amber-50 text-amber-700",
        cardClass: "border-amber-200",
      };
  }
}

function LockedPremiumCard({
  pick,
  index,
}: {
  pick: PremiumPick;
  index: number;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">
              {pick.sport ?? "Sports"}
            </span>

            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-700">
              Premium
            </span>
          </div>

          <p className="text-sm font-semibold text-gray-500">
            {formatGameTime(pick.game_time)}
          </p>
        </div>
      </div>

      <div className="px-6 py-7 sm:px-8 sm:py-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-gray-500">
          {pick.sport ?? "Sports"} Premium Pick
        </p>

        <p className="mt-2 text-2xl font-black tracking-tight text-black">
          Premium Pick #{index + 1}
        </p>

        <div className="mt-5 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xl">
            🔒
          </span>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-amber-700">
              Selection locked
            </p>

            <div className="mt-2 flex gap-2">
              <span className="h-4 w-28 rounded bg-gray-200" />
              <span className="h-4 w-12 rounded bg-gray-200" />
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
              Confidence
            </p>

            <p className="mt-2 text-lg tracking-wider text-amber-500">
              {confidenceStars(pick.confidence)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
              Recommended Units
            </p>

            <p className="mt-2 font-black text-black">Locked</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
              Best Odds
            </p>

            <p className="mt-2 font-black text-black">Locked</p>
          </div>
        </div>

        <div className="relative mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="space-y-3 opacity-50 blur-[3px]">
            <div className="h-3 w-full rounded bg-gray-300" />
            <div className="h-3 w-11/12 rounded bg-gray-300" />
            <div className="h-3 w-4/5 rounded bg-gray-300" />
            <div className="h-3 w-10/12 rounded bg-gray-300" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-white/55 px-4 backdrop-blur-[1px]">
            <p className="rounded-full bg-black px-4 py-2 text-center text-xs font-black uppercase tracking-[0.14em] text-white">
              Premium analysis locked
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function UnlockedPremiumCard({ pick }: { pick: PremiumPick }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-amber-300 bg-white shadow-sm">
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">
              {pick.sport ?? "Sports"}
            </span>

            {pick.bet_type && (
              <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-700">
                {pick.bet_type}
              </span>
            )}

            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black">
              Premium Pick
            </span>
          </div>

          <p className="text-sm font-semibold text-gray-600">
            {formatGameTime(pick.game_time)}
          </p>
        </div>
      </div>

      <div className="px-6 py-7 sm:px-8 sm:py-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-gray-500">
          {pick.matchup ?? "Premium matchup"}
        </p>

        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            Official Selection
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-black">
            {pick.selection}{" "}
            <span className="text-amber-700">
              {formatOdds(pick.odds)}
            </span>
          </h2>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
              Confidence
            </p>

            <p className="mt-2 text-lg tracking-wider text-amber-500">
              {confidenceStars(pick.confidence)}
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-600">
              {pick.confidence ?? 3}/5
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
              Recommended Risk
            </p>

            <p className="mt-2 text-lg font-black text-black">
              {formatUnits(pick.units)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
              Best Sportsbook
            </p>

            <p className="mt-2 text-lg font-black text-black">
              {pick.best_sportsbook ?? "Shop for the best line"}
            </p>
          </div>
        </div>

        <section className="mt-7 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
            KofSports Analysis
          </p>

          <div className="mt-4 whitespace-pre-line text-base leading-8 text-gray-700">
            {pick.analysis ?? "Full analysis will be added shortly."}
          </div>
        </section>

        {pick.game_notes && (
          <section className="mt-5 rounded-2xl border border-gray-200 p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">
              Game Notes
            </p>

            <div className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-700">
              {pick.game_notes}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function RecentResultCard({
  pick,
  hasPremiumAccess,
}: {
  pick: PremiumPick;
  hasPremiumAccess: boolean;
}) {
  const result = getResultDisplay(pick.status);
  const formattedProfitLoss = formatProfitLoss(pick.profit_loss);

  return (
    <article
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${result.cardClass}`}
    >
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">
              {pick.sport ?? "Sports"}
            </span>

            {pick.bet_type && (
              <span className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-700">
                {pick.bet_type}
              </span>
            )}
          </div>

          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${result.badgeClass}`}
          >
            <span>{result.symbol}</span>
            {result.label}
          </span>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-gray-500">
              {pick.matchup ?? "Premium matchup"}
            </p>

            <h3 className="mt-3 text-2xl font-black tracking-tight text-black">
              {hasPremiumAccess ? (
                <>
                  {pick.selection}{" "}
                  <span className="text-amber-700">
                    {formatOdds(pick.odds)}
                  </span>
                </>
              ) : (
                "Premium selection"
              )}
            </h3>

            <p className="mt-2 text-sm font-semibold text-gray-500">
              {formatGameTime(pick.game_time)}
            </p>
          </div>

          {hasPremiumAccess && formattedProfitLoss && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 sm:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                Result
              </p>

              <p
                className={`mt-1 text-xl font-black ${
                  pick.profit_loss && pick.profit_loss > 0
                    ? "text-green-700"
                    : pick.profit_loss && pick.profit_loss < 0
                      ? "text-red-700"
                      : "text-gray-700"
                }`}
              >
                {formattedProfitLoss}
              </p>
            </div>
          )}
        </div>

        {hasPremiumAccess ? (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                  Recommended Risk
                </p>

                <p className="mt-2 font-black text-black">
                  {formatUnits(pick.units)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                  Confidence
                </p>

                <p className="mt-2 tracking-wider text-amber-500">
                  {confidenceStars(pick.confidence)}
                </p>
              </div>
            </div>

            {pick.analysis && (
              <details className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.14em] text-amber-700">
                  Review original analysis
                </summary>

                <div className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-700">
                  {pick.analysis}
                </div>
              </details>
            )}
          </>
        ) : (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-semibold text-gray-600">
              Premium members can review the selection and original analysis.
            </p>

            <span className="shrink-0 text-xl">🔒</span>
          </div>
        )}
      </div>
    </article>
  );
}

export default async function PremiumPicksPage({
  searchParams,
}: {
  searchParams: Promise<PremiumPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;

  if (user) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("membership, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Unable to load profile:", profileError);
    }

    profile = profileData as Profile | null;
  }

  const hasPremiumAccess =
    profile?.membership === "premium" || profile?.role === "admin";

  const pickFields = `
    id,
    sport,
    matchup,
    bet_type,
    selection,
    odds,
    units,
    confidence,
    game_date,
    game_time,
    analysis,
    best_sportsbook,
    game_notes,
    status,
    profit_loss
  `;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const thirtyDaysAgoDate = thirtyDaysAgo
    .toISOString()
    .split("T")[0];

  const [
    { data: activeData, error: activeError },
    { data: recentData, error: recentError },
  ] = await Promise.all([
    supabase
      .from("vip_picks")
      .select(pickFields)
      .eq("is_published", true)
      .eq("is_premium", true)
      .eq("status", "pending")
      .order("game_time", { ascending: true })
      .limit(12),

    supabase
      .from("vip_picks")
      .select(pickFields)
      .eq("is_published", true)
      .eq("is_premium", true)
      .in("status", ["won", "lost", "push", "void"])
      .gte("game_date", thirtyDaysAgoDate)
      .order("game_date", { ascending: false })
      .order("game_time", { ascending: false })
      .limit(10),
  ]);

  const activePicks = (activeData ?? []) as PremiumPick[];
  const recentPicks = (recentData ?? []) as PremiumPick[];

  const hasError = Boolean(activeError || recentError);

  if (activeError) {
    console.error("Unable to load active Premium picks:", activeError);
  }

  if (recentError) {
    console.error("Unable to load recent Premium results:", recentError);
  }

  return (
    <main className="bg-white text-black">
      <section className="relative overflow-hidden bg-black px-6 py-20 text-white sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.22),transparent_36%)]" />

        <div className="relative mx-auto max-w-6xl">
          <span className="inline-flex rounded-full border border-amber-400/50 bg-amber-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-amber-300">
            KofSports Premium
          </span>

          <h1 className="mt-7 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Today&apos;s premium betting card.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300 sm:text-xl">
            Get every published selection, recommended unit size, best
            available odds, confidence rating, and the complete reasoning
            behind each play.
          </p>

          {hasPremiumAccess ? (
            <div className="mt-9 inline-flex items-center gap-3 rounded-2xl border border-green-400/30 bg-green-400/10 px-5 py-4">
              <span className="text-xl">✓</span>

              <div>
                <p className="font-black text-green-300">
                  Premium access active
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  All selections and analysis are unlocked below.
                </p>
              </div>
            </div>
          ) : user ? (
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/plans"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-7 py-3 font-black text-black transition hover:bg-amber-300"
              >
                Upgrade to Premium
              </Link>

              <Link
                href="/account"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-7 py-3 font-black text-white transition hover:border-white hover:bg-white hover:text-black"
              >
                View My Account
              </Link>
            </div>
          ) : (
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-7 py-3 font-black text-black transition hover:bg-amber-300"
              >
                Log In to Access Picks
              </Link>

              <Link
                href="/plans"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-7 py-3 font-black text-white transition hover:border-white hover:bg-white hover:text-black"
              >
                View Membership Plans
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-700">
                Current Card
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {hasPremiumAccess
                  ? "Your Premium selections"
                  : "Today's Premium card"}
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                {hasPremiumAccess
                  ? "Your membership is active. Review the complete card below."
                  : "Log in with a Premium account or upgrade your membership to unlock the complete card."}
              </p>
            </div>

            {activePicks.length > 0 && (
              <p className="font-bold text-gray-500">
                {activePicks.length} active{" "}
                {activePicks.length === 1 ? "pick" : "picks"}
              </p>
            )}
          </div>

          {hasError && (
            <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              We could not load all Premium picks right now. Please check back
              shortly.
            </div>
          )}

          {!activeError && activePicks.length === 0 && (
            <div className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl text-white">
                ♛
              </div>

              <h3 className="mt-5 text-2xl font-black">
                The next Premium card is being prepared
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                New selections will appear here as soon as they are published.
                Recent graded plays remain available below.
              </p>
            </div>
          )}

          {!activeError && activePicks.length > 0 && (
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {activePicks.map((pick, index) =>
                hasPremiumAccess ? (
                  <UnlockedPremiumCard key={pick.id} pick={pick} />
                ) : (
                  <LockedPremiumCard
                    key={pick.id}
                    pick={pick}
                    index={index}
                  />
                ),
              )}
            </div>
          )}

          {!activeError &&
            activePicks.length > 0 &&
            !hasPremiumAccess && (
              <div className="mt-10 rounded-3xl bg-gray-100 px-6 py-10 text-center">
                <h3 className="text-2xl font-black text-black">
                  {user
                    ? "Upgrade your account to unlock the card"
                    : "Already a Premium member?"}
                </h3>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                  {user
                    ? "Choose a Premium plan to access every selection, unit size, sportsbook, and full analysis."
                    : "Log in using the account connected to your Premium membership."}
                </p>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  {!user && (
                    <Link
                      href="/login"
                      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-black px-7 py-3 font-black text-white transition hover:bg-amber-400 hover:text-black"
                    >
                      Log In
                    </Link>
                  )}

                  <Link
                    href="/plans"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-7 py-3 font-black text-black transition hover:bg-amber-300"
                  >
                    {user ? "Upgrade to Premium" : "View Premium Plans"}
                  </Link>
                </div>
              </div>
            )}
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-700">
                Transparent Tracking
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Recent Premium results
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                The 10 most recent graded Premium plays from the last 30
                days remain visible for members to review.
              </p>
            </div>

            <Link
              href="/results"
              className="font-black text-amber-700 transition hover:text-black"
            >
              View full results →
            </Link>
          </div>

          {!recentError && recentPicks.length === 0 && (
            <div className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
              <h3 className="text-xl font-black">
                No Premium results in the last 30 days
              </h3>

              <p className="mt-3 text-gray-600">
                Newly graded Premium plays will appear here automatically.
              </p>
            </div>
          )}

          {!recentError && recentPicks.length > 0 && (
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {recentPicks.map((pick) => (
                <RecentResultCard
                  key={pick.id}
                  pick={pick}
                  hasPremiumAccess={hasPremiumAccess}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <PremiumVault
        searchParams={resolvedSearchParams}
        hasPremiumAccess={hasPremiumAccess}
      />
    </main>
  );
}