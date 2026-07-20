import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type PremiumPick = {
  id: string;
  sport: string | null;
  matchup: string | null;
  bet_type: string | null;
  selection: string;
  odds: number | null;
  units: number | null;
  confidence: number | null;
  game_time: string | null;
  analysis: string | null;
  best_sportsbook: string | null;
  game_notes: string | null;
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
            Today&apos;s Card
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
            <span className="text-amber-700">{formatOdds(pick.odds)}</span>
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

export default async function PremiumPicksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("membership, role")
      .eq("id", user.id)
      .maybeSingle();

    profile = profileData as Profile | null;
  }

  const hasPremiumAccess =
    profile?.membership === "premium" || profile?.role === "admin";

  const { data, error } = await supabase
    .from("vip_picks")
    .select(
      `
        id,
        sport,
        matchup,
        bet_type,
        selection,
        odds,
        units,
        confidence,
        game_time,
        analysis,
        best_sportsbook,
        game_notes
      `,
    )
    .eq("is_published", true)
    .eq("is_premium", true)
    .eq("result", "pending")
    .order("game_time", { ascending: true })
    .limit(12);

  const picks = (data ?? []) as PremiumPick[];

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

            {hasPremiumAccess && picks.length > 0 && (
              <p className="font-bold text-gray-500">
                {picks.length} active {picks.length === 1 ? "pick" : "picks"}
              </p>
            )}
          </div>

          {error && (
            <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              We could not load the Premium card right now. Please check back
              shortly.
            </div>
          )}

          {!error && picks.length === 0 && (
            <div className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl text-white">
                ♛
              </div>

              <h3 className="mt-5 text-2xl font-black">
                The next Premium card is being prepared
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
                New selections will appear here as soon as they are published.
              </p>
            </div>
          )}

          {!error && picks.length > 0 && (
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {picks.map((pick, index) =>
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

          {!error && picks.length > 0 && !hasPremiumAccess && (
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
    </main>
  );
}