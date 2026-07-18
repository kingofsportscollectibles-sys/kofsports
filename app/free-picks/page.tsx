import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Sports Betting Picks",
  description:
    "Read free sports betting picks, game analysis, and betting education from KofSports.",
};

const categories = [
  "All Sports",
  "NFL",
  "MLB",
  "NBA",
  "NHL",
  "College Football",
  "College Basketball",
];

const placeholderPosts = [
  {
    category: "KofSports",
    title: "KofSports Is Back",
    excerpt:
      "After more than a decade of picks, analysis, wins, losses, and relationships with VIP members, the next era of KofSports is beginning.",
    date: "Coming Soon",
    slug: "#",
    featured: true,
  },
  {
    category: "Betting Education",
    title: "How KofSports Approaches Bankroll Management",
    excerpt:
      "A disciplined betting strategy begins before the first wager is placed. Learn how unit sizing can protect bettors from short-term volatility.",
    date: "Coming Soon",
    slug: "#",
    featured: false,
  },
  {
    category: "NFL",
    title: "What Kof Looks for Before Betting an NFL Game",
    excerpt:
      "Line movement, injuries, matchup advantages, recent performance, and market perception all play a role in evaluating a potential wager.",
    date: "Coming Soon",
    slug: "#",
    featured: false,
  },
];

export default function FreePicksPage() {
  return (
    <>
      <section className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-brand">
            Free analysis
          </p>

          <h1 className="mt-4 max-w-4xl font-display text-5xl font-bold uppercase leading-tight text-white sm:text-6xl">
            Free picks, previews, and betting education
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            Read free analysis from Kof covering the NFL, MLB, NBA, NHL,
            college football, college basketball, and the betting market.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {categories.map((category, index) => (
              <button
                key={category}
                type="button"
                className={
                  index === 0
                    ? "shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-extrabold text-black"
                    : "shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-bold text-zinc-400 transition hover:border-white/30 hover:text-white"
                }
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {placeholderPosts.map((post) => (
              <article
                key={post.title}
                className={
                  post.featured
                    ? "rounded-2xl border border-brand/30 bg-brand/[0.06] p-8 lg:col-span-2 lg:p-10"
                    : "rounded-2xl border border-white/10 bg-white/[0.025] p-8"
                }
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand">
                    {post.category}
                  </span>

                  <span className="text-sm text-zinc-500">{post.date}</span>
                </div>

                <h2
                  className={
                    post.featured
                      ? "mt-6 max-w-4xl font-display text-4xl font-bold uppercase text-white sm:text-5xl"
                      : "mt-6 font-display text-3xl font-bold uppercase text-white"
                  }
                >
                  {post.title}
                </h2>

                <p className="mt-5 max-w-3xl leading-7 text-zinc-400">
                  {post.excerpt}
                </p>

                <Link
                  href={post.slug}
                  className="mt-7 inline-flex text-sm font-extrabold uppercase tracking-wide text-brand"
                >
                  Article coming soon →
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-white/10 bg-zinc-950 p-8 text-center sm:p-12">
            <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-brand">
              Want every official play?
            </p>

            <h2 className="mt-4 font-display text-4xl font-bold uppercase text-white">
              Unlock the complete VIP card
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-zinc-400">
              VIP members receive Kof&apos;s official selections, full analysis,
              transparent tracking, and direct access for questions.
            </p>

            <Link
              href="/plans"
              className="mt-8 inline-flex rounded-md bg-brand px-7 py-4 text-sm font-extrabold uppercase tracking-wide text-black transition hover:bg-brand-light"
            >
              View Memberships
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}