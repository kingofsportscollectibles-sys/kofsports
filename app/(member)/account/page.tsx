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
    .from(
      "profiles"
    )
    .select(
      `
      display_name,
      role,
      membership,
      subscription_status,
      membership_expires_at,
      stripe_customer_id
    `
    )
    .eq("id", user.id)
    .maybeSingle();

  const { data: recentPicks } = await supabase
    .from("vip_picks")
    .select("id, matchup, selection, status")
    .eq("is_published", true)
    .order("game_time", { ascending: false })
    .limit(3);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {/* Hero */}

      {billingError ? (
  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
    {billingError === "no_customer"
      ? "We could not find a Stripe billing account for this membership."
      : "We could not open the billing portal. Please try again."}
  </div>
) : null}

      <div className="rounded-3xl bg-gradient-to-r from-black via-gray-900 to-black p-8 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-400 font-bold">
          Member Dashboard
        </p>

        <h1 className="mt-4 text-4xl font-black">
          Welcome back, {profile?.display_name ?? "Member"} 👋
        </h1>

        <p className="mt-3 text-gray-300">
          {profile?.membership === "premium"
            ? `Premium Member • Active through ${formatMembershipDate(
                profile.membership_expires_at
              )}`
            : "Free Member • Upgrade anytime for full Premium Picks access."}
        </p>
      </div>

      {/* Stats */}

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Picks"
          value={`${recentPicks?.length ?? 0}`}
          subtitle="Published"
        />

        <StatCard
          title="Membership"
          value={
            profile?.membership === "premium" ? "Premium" : "Free"
          }
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
            profile?.membership_expires_at ?? null
          )}
          subtitle="Next Billing"
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {/* Recent Picks */}

          <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-black">
              Recent Premium Picks
            </h2>

            <div className="mt-6 space-y-4">
              {recentPicks?.length ? (
                recentPicks.map((pick) => (
                  <div
                    key={pick.id}
                    className="flex items-center justify-between rounded-xl border p-4"
                  >
                    <div>
                      <p className="font-semibold text-black">
                        {pick.selection}
                      </p>

                      <p className="text-sm text-gray-500">
                        {pick.matchup}
                      </p>
                    </div>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase">
                      {pick.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No premium picks have been published yet.
                </p>
              )}
            </div>
          </section>

          {/* Account Settings */}

          <AccountForm
            userId={user.id}
            email={user.email ?? ""}
            initialDisplayName={profile?.display_name ?? ""}
          />
        </div>

        <aside className="space-y-6">
          {/* Membership */}

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Membership
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              {profile?.membership === "premium"
                ? "⭐ Premium"
                : "Free Member"}
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Status</span>
                <span className="font-semibold capitalize">
                  {profile?.subscription_status ?? "Free"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Renews</span>
                <span className="font-semibold">
                  {formatMembershipDate(
                    profile?.membership_expires_at ?? null
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

          {/* Notifications */}

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-black">
              Notifications
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked readOnly />
                Email Premium Picks
              </label>

              <label className="flex items-center gap-3">
                <input type="checkbox" disabled />
                SMS Alerts (Coming Soon)
              </label>

              <label className="flex items-center gap-3">
                <input type="checkbox" disabled />
                Weekly Recap (Coming Soon)
              </label>
            </div>
          </section>

          {/* Account */}

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Account Role
            </p>

            <p className="mt-3 text-lg font-semibold capitalize">
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
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
        {title}
      </p>

      <h3 className="mt-3 text-3xl font-black text-black">
        {value}
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}