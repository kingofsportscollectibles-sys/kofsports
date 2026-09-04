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

const toolsNavigation = [
  {
    name: "NFL Player Prop Trends",
    description: "L5, L10, season and matchup trends",
    href: "/nfl-player-prop-trends",
  },
  {
    name: "NFL Anytime TD Rankings",
    description: "KOF Score, odds and touchdown research",
    href: "/nfl-anytime-touchdown-rankings",
  },
  {
    name: "NFL Snap Counts",
    description: "Player snap shares and recent usage trends",
    href: "/nfl-snap-counts",
  },
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
          <Link
            href="/blog"
            className="text-sm font-semibold text-zinc-300 transition hover:text-white"
          >
            Blog
          </Link>

          <Link
            href="/premium-picks"
            className="text-sm font-semibold text-zinc-300 transition hover:text-white"
          >
            Premium Picks
          </Link>

          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm font-semibold text-zinc-300 transition hover:text-white"
            >
              Tools

              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="h-4 w-4 transition duration-200 group-hover:rotate-180"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div className="invisible absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-4 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-2xl shadow-black/50">
                {toolsNavigation.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="block rounded-lg px-4 py-3 transition hover:bg-white/[0.06]"
                  >
                    <div className="text-sm font-bold text-white">
                      {tool.name}
                    </div>

                    <div className="mt-1 text-xs leading-5 text-zinc-500">
                      {tool.description}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {navigation.slice(2).map((item) => (
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