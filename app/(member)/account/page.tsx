import { redirect } from "next/navigation";

import AccountForm from "@/components/member/AccountForm";
import { createClient } from "@/lib/supabase/server";

function formatMembershipDate(date: string | null) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClasses(status: string | null) {
  switch (status) {
    case "won":
      return "bg-green-50 text-green-700";
    case "lost":
      return "bg-red-50 text-red-700";
    case "push":
    case "void":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

type AccountPageProps = {
  searchParams: Promise<{
    billing_error?: string;
  }>;
};

export default async function AccountPage({
  searchParams,
}: AccountPageProps) {
  const { billing_error: billingError } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
        display_name,
        role,
        membership,
        subscription_status,
        membership_expires_at,
        stripe_customer_id
      `,
    )
    .eq("id", user.id)
    .maybeSingle();

  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const todayDate = todayStart.toISOString().slice(0, 10);
  const thirtyDaysAgoDate = thirtyDaysAgo.toISOString().slice(0, 10);

  const [{ data: todayPicks }, { data: recentPicks }] = await Promise.all([
    supabase
      .from("vip_picks")
      .select("id")
      .eq("is_published", true)
      .eq("is_premium", true)
      .eq("status", "pending")
      .eq("game_date", todayDate),

    supabase
      .from("vip_picks")
      .select(
        `
          id,
          matchup,
          selection,
          status,
          game_date,
          game_time
        `,
      )
      .eq("is_published", true)
      .eq("is_premium", true)
      .in("status", ["won", "lost", "push", "void"])
      .gte("game_date", thirtyDaysAgoDate)
      .order("game_date", { ascending: false })
      .order("game_time", { ascending: false })
      .limit(5),
  ]);

  const todayPickCount = todayPicks?.length ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 text-black">
      {billingError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {billingError === "no_customer"
            ? "We could not find a Stripe billing account for this membership."
            : "We could not open the billing portal. Please try again."}
        </div>
      ) : null}

      <div className="rounded-3xl bg-gradient-to-r from-black via-gray-900 to-black p-8 text-white shadow-xl">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
          Member Dashboard
        </p>

        <h1 className="mt-4 text-4xl font-black">
          Welcome back, {profile?.display_name ?? "Member"} 👋
        </h1>

        <p className="mt-3 text-gray-300">
          {profile?.membership === "premium"
            ? `Premium Member • Active through ${formatMembershipDate(
                profile.membership_expires_at,
              )}`
            : "Free Member • Upgrade anytime for full Premium Picks access."}
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Picks"
          value={`${todayPickCount}`}
          subtitle={todayPickCount === 1 ? "Active Pick" : "Active Picks"}
        />

        <StatCard
          title="Membership"
          value={profile?.membership === "premium" ? "Premium" : "Free"}
          subtitle="Current Plan"
        />

        <StatCard
          title="Status"
          value={profile?.subscription_status ?? "Active"}
          subtitle="Subscription"
        />

        <StatCard
          title="Renewal"
          value={formatMembershipDate(
            profile?.membership_expires_at ?? null,
          )}
          subtitle="Next Billing"
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section className="rounded-3xl border border-gray-200 bg-white p-8 text-black shadow-sm">
            <h2 className="text-2xl font-bold text-black">
              Recent Premium Results
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Graded Premium picks from the last 30 days.
            </p>

            <div className="mt-6 space-y-4">
              {recentPicks?.length ? (
                recentPicks.map((pick) => (
                  <div
                    key={pick.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4"
                  >
                    <div>
                      <p className="font-semibold text-black">
                        {pick.selection}
                      </p>

                      <p className="text-sm text-gray-500">
                        {pick.matchup ?? "Premium matchup"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusClasses(
                        pick.status,
                      )}`}
                    >
                      {pick.status ?? "pending"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No Premium results have been graded in the last 30 days.
                </p>
              )}
            </div>
          </section>

          <AccountForm
            userId={user.id}
            email={user.email ?? ""}
            initialDisplayName={profile?.display_name ?? ""}
          />
        </div>

        <aside className="space-y-6 text-black">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 text-black shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Membership
            </p>

            <h2 className="mt-3 text-2xl font-bold text-black">
              {profile?.membership === "premium"
                ? "⭐ Premium"
                : "Free Member"}
            </h2>

            <div className="mt-5 space-y-3 text-sm text-gray-700">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Status</span>
                <span className="font-semibold capitalize text-black">
                  {profile?.subscription_status ?? "Free"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Renews</span>
                <span className="font-semibold text-black">
                  {formatMembershipDate(
                    profile?.membership_expires_at ?? null,
                  )}
                </span>
              </div>
            </div>

            {profile?.stripe_customer_id ? (
              <form
                action="/api/stripe/customer-portal"
                method="POST"
                className="mt-6"
              >
                <button
                  type="submit"
                  className="w-full rounded-xl bg-black py-3 font-semibold text-white transition hover:bg-gray-800"
                >
                  Manage Billing
                </button>
              </form>
            ) : profile?.role === "admin" ? (
              <div className="mt-6 rounded-xl bg-gray-100 p-3 text-center text-sm text-gray-600">
                Admin membership is managed manually.
              </div>
            ) : (
              <a
                href="/plans"
                className="mt-6 block w-full rounded-xl bg-amber-500 py-3 text-center font-semibold text-black transition hover:bg-amber-400"
              >
                Upgrade to Premium
              </a>
            )}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 text-black shadow-sm">
            <h2 className="font-bold text-black">Notifications</h2>

            <div className="mt-5 space-y-3 text-sm text-gray-700">
              <label className="flex items-center gap-3 text-black">
                <input type="checkbox" checked readOnly />
                Email Premium Picks
              </label>

              <label className="flex items-center gap-3 text-gray-400">
                <input type="checkbox" disabled />
                SMS Alerts (Coming Soon)
              </label>

              <label className="flex items-center gap-3 text-gray-400">
                <input type="checkbox" disabled />
                Weekly Recap (Coming Soon)
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 text-black shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Account Role
            </p>

            <p className="mt-3 text-lg font-semibold capitalize text-black">
              {profile?.role ?? "member"}
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 text-black shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
        {title}
      </p>

      <h3 className="mt-3 text-3xl font-black text-black">{value}</h3>

      <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}