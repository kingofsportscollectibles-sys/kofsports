import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import LogoutButton from "@/components/member/LogoutButton";
import { createClient } from "@/lib/supabase/server";

type MemberLayoutProps = {
  children: ReactNode;
};

export default async function MemberLayout({
  children,
}: MemberLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-amber-400/20 bg-black text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-black tracking-tight transition hover:text-amber-300"
            >
              KofSports
            </Link>

            <span className="ml-3 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
              Premium
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold sm:gap-5">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-white transition hover:bg-white/10 hover:text-amber-300"
            >
              Dashboard
            </Link>

            <Link
              href="/premium-picks"
              className="rounded-lg px-3 py-2 text-white transition hover:bg-white/10 hover:text-amber-300"
            >
              Premium Picks
            </Link>

            <Link
              href="/account"
              className="rounded-lg px-3 py-2 text-white transition hover:bg-white/10 hover:text-amber-300"
            >
              Account
            </Link>

            <LogoutButton />
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}