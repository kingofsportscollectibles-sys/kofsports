import { redirect } from "next/navigation";

import AccountForm from "@/components/member/AccountForm";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
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
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="max-w-2xl">
        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-amber-700">
          Account Settings
        </span>

        <h1 className="mt-5 text-4xl font-black tracking-tight text-black sm:text-5xl">
          Manage your account
        </h1>

        <p className="mt-4 text-lg leading-8 text-gray-600">
          Update your profile information and review the email address connected
          to your KofSports account.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <AccountForm
          userId={user.id}
          email={user.email ?? ""}
          initialDisplayName={profile?.display_name ?? ""}
        />

        <aside className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Membership
            </p>

            <h2 className="mt-3 text-xl font-bold text-black">
              KofSports Premium
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Your subscription status, renewal date, and billing information
              will appear here once Stripe is connected.
            </p>

            <div className="mt-5 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              Setup in progress
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Account Role
            </p>

            <p className="mt-3 font-semibold capitalize text-black">
              {profile?.role ?? "member"}
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}