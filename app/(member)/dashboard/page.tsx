import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const memberName =
    profile?.display_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Member";

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-amber-700">
          Premium Member
        </span>

        <h1 className="mt-5 text-5xl font-black tracking-tight text-black">
          Welcome back, {memberName}
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-gray-600">
          Your premium dashboard gives you instant access to today's picks,
          membership details, and your KofSports account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            🏆
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-700">
            Premium Picks
          </p>

          <h2 className="mt-3 text-2xl font-bold text-black">
            Today's Plays
          </h2>

          <p className="mt-4 leading-7 text-gray-600">
            Every published premium selection will appear here before game
            time.
          </p>

          <Link
            href="/vip-picks"
            className="mt-8 inline-flex items-center font-bold text-amber-700 transition hover:text-amber-800"
          >
            View Today's Picks →
          </Link>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            👑
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-700">
            Membership
          </p>

          <h2 className="mt-3 text-2xl font-bold text-black">
            Premium Access
          </h2>

          <p className="mt-4 leading-7 text-gray-600">
            Manage your subscription, renewal date and billing information.
          </p>

          <Link
            href="/billing"
            className="mt-8 inline-flex items-center font-bold text-amber-700 transition hover:text-amber-800"
          >
            Manage Membership →
          </Link>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            ⚙️
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-700">
            Account
          </p>

          <h2 className="mt-3 text-2xl font-bold text-black">
            Your Profile
          </h2>

          <p className="mt-4 break-all leading-7 text-gray-600">
            Signed in as
            <br />
            <span className="font-semibold text-black">
              {user?.email}
            </span>
          </p>

          <Link
            href="/account"
            className="mt-8 inline-flex items-center font-bold text-amber-700 transition hover:text-amber-800"
          >
            Account Settings →
          </Link>
        </section>
      </div>
    </main>
  );
}