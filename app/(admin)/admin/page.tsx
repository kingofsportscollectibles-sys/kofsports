import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type DashboardCardProps = {
  label: string;
  value: string;
  description: string;
};

function DashboardCard({
  label,
  value,
  description,
}: DashboardCardProps) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
        {label}
      </p>

      <p className="mt-4 text-4xl font-black tracking-tight text-black">
        {value}
      </p>

      <p className="mt-3 text-sm leading-6 text-gray-500">
        {description}
      </p>
    </section>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const adminName =
    profile?.display_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Admin";

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="max-w-3xl">
        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
          Admin Control Center
        </span>

        <h1 className="mt-5 text-4xl font-black tracking-tight text-black sm:text-5xl">
          Welcome back, {adminName}
        </h1>

        <p className="mt-4 text-lg leading-8 text-gray-600">
          Manage KofSports picks, results, members, articles, and subscription
          activity from one place.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Premium Members"
          value="—"
          description="Active paid membership data will appear after Stripe is connected."
        />

        <DashboardCard
          label="Active Picks"
          value="—"
          description="Open premium selections will appear after the picks manager is built."
        />

        <DashboardCard
          label="Monthly Revenue"
          value="$—"
          description="Current subscription revenue will sync from Stripe."
        />

        <DashboardCard
          label="Year-to-Date Units"
          value="—"
          description="Performance will calculate from graded KofSports picks."
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Quick Actions
            </p>

            <h2 className="mt-3 text-2xl font-bold text-black">
              Manage KofSports
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/admin/picks/new"
              className="group rounded-2xl border border-gray-200 p-5 transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
            >
              <p className="text-lg font-bold text-black transition group-hover:text-amber-700">
                Publish a Pick
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Create and release a new premium selection.
              </p>
            </Link>

            <Link
              href="/studio"
              className="group rounded-2xl border border-gray-200 p-5 transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
            >
              <p className="text-lg font-bold text-black transition group-hover:text-amber-700">
                Write an Article
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Open Sanity Studio to publish free picks and content.
              </p>
            </Link>

            <Link
              href="/admin/members"
              className="group rounded-2xl border border-gray-200 p-5 transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
            >
              <p className="text-lg font-bold text-black transition group-hover:text-amber-700">
                View Members
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Review member accounts and subscription access.
              </p>
            </Link>

            <Link
              href="/admin/results"
              className="group rounded-2xl border border-gray-200 p-5 transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
            >
              <p className="text-lg font-bold text-black transition group-hover:text-amber-700">
                Grade Results
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Record wins, losses, pushes, units, and ROI.
              </p>
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            Recent Activity
          </p>

          <h2 className="mt-3 text-2xl font-bold text-black">
            Business updates
          </h2>

          <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
            <p className="font-semibold text-gray-700">
              No activity to display yet
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              New subscriptions, published picks, graded results, and member
              activity will appear here.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}