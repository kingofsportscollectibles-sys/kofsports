import Link from "next/link";

import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { UserMenu } from "@/components/layout/user-menu";
import { createClient } from "@/lib/supabase/server";

const navigation = [
  { name: "Blog", href: "/blog" },
  { name: "Premium Picks", href: "/premium-picks" },
  { name: "Results", href: "/results" },
  { name: "Plans", href: "/plans" },
  { name: "About", href: "/about" },
];

export type HeaderUser = {
  email: string | null;
  displayName: string;
  membership: "free" | "premium";
  role: string;
  membershipExpiresAt: string | null;
};

export async function SiteHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let headerUser: HeaderUser | null = null;

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("membership, role, membership_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Unable to load header profile:", profileError);
    }

    const metadataDisplayName =
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null;

    const emailDisplayName = user.email?.split("@")[0] ?? "Member";

    headerUser = {
      email: user.email ?? null,
      displayName: metadataDisplayName ?? emailDisplayName,
      membership:
        profile?.membership === "premium" ? "premium" : "free",
      role: profile?.role ?? "user",
      membershipExpiresAt: profile?.membership_expires_at ?? null,
    };
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="group">
          <div className="font-display text-2xl font-bold uppercase tracking-tight text-white">
            Kof<span className="text-brand">Sports</span>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Established 2015
          </p>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold text-zinc-300 transition hover:text-white"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {headerUser ? (
            <UserMenu user={headerUser} />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-zinc-300 transition hover:text-white"
              >
                Log In
              </Link>

              <Link
                href="/plans"
                className="rounded-md bg-brand px-4 py-2.5 text-sm font-extrabold text-black transition hover:bg-brand-light"
              >
                Upgrade to Premium
              </Link>
            </>
          )}
        </div>

        <MobileNavigation user={headerUser} />
      </div>
    </header>
  );
}