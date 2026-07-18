import Link from "next/link";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

const navigation = [
  { name: "Free Picks", href: "/free-picks" },
  { name: "VIP Picks", href: "/vip" },
  { name: "Results", href: "/results" },
  { name: "Plans", href: "/plans" },
  { name: "About", href: "/about" },
];

export function SiteHeader() {
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
            Join VIP
          </Link>
        </div>

        <MobileNavigation />
      </div>
    </header>
  );
}