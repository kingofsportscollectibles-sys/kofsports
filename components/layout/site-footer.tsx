import Link from "next/link";

const footerLinks = [
  { name: "Free Picks", href: "/free-picks" },
  { name: "Results", href: "/results" },
  { name: "Plans", href: "/plans" },
  { name: "About Kof", href: "/about" },
  { name: "Responsible Betting", href: "/responsible-betting" },
  { name: "Terms", href: "/terms" },
  { name: "Privacy", href: "/privacy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="font-display text-3xl font-bold uppercase text-white">
              Kof<span className="text-brand">Sports</span>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
              Independent sports betting information, analytics, and
              entertainment since 2015. KofSports is not a sportsbook and does
              not accept wagers.
            </p>

            <p className="mt-4 text-sm font-semibold text-zinc-300">
              Contact:{" "}
              <a
                href="mailto:kof@kofsports.com"
                className="text-brand hover:text-brand-light"
              >
                kofsports1@gmail.com 
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-zinc-400 transition hover:text-white"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs leading-5 text-zinc-600">
          <p>
            © {new Date().getFullYear()} KofSports. All rights reserved.
          </p>

          <p className="mt-2 max-w-4xl">
            Sports betting involves risk. Information published by KofSports is
            for informational and entertainment purposes only. No outcome or
            financial result is guaranteed. Only wager where legal and always
            bet responsibly.
          </p>
        </div>
      </div>
    </footer>
  );
}