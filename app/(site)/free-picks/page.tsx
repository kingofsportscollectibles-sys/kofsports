import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getArticles, getFeaturedArticle } from "@/sanity/lib/articles";
import { urlForImage } from "@/sanity/lib/image";
import type {
  ArticleCard,
  ArticleContentType,
  ArticleSport,
} from "@/sanity/types/article";

export const metadata: Metadata = {
  title: "Free Sports Betting Picks",
  description:
    "Read free sports betting picks, game analysis, and betting education from KofSports.",
};

const categories = [
  { label: "All Sports", value: "all" },
  { label: "NFL", value: "nfl" },
  { label: "MLB", value: "mlb" },
  { label: "NBA", value: "nba" },
  { label: "NHL", value: "nhl" },
  { label: "College Football", value: "cfb" },
  { label: "College Basketball", value: "cbb" },
] as const;

const sportLabels: Record<ArticleSport, string> = {
  general: "KofSports",
  nfl: "NFL",
  mlb: "MLB",
  nba: "NBA",
  nhl: "NHL",
  cfb: "College Football",
  cbb: "College Basketball",
};

const contentTypeLabels: Record<ArticleContentType, string> = {
  "free-pick": "Free Pick",
  "game-preview": "Game Preview",
  "betting-education": "Betting Education",
  news: "News",
  "weekly-recap": "Weekly Recap",
  announcement: "Announcement",
  "kofsports-update": "KofSports Update",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getArticleLabel(article: ArticleCard) {
  if (article.sport !== "general") {
    return sportLabels[article.sport];
  }

  return contentTypeLabels[article.contentType];
}

function getArticleImageUrl(article: ArticleCard) {
  if (!article.featuredImage) {
    return null;
  }

  return urlForImage(article.featuredImage)
    .width(1200)
    .height(675)
    .url();
}

export default async function FreePicksPage() {
  const [featuredArticle, articles] = await Promise.all([
    getFeaturedArticle(),
    getArticles(),
  ]);

  const freeArticles = articles.filter((article) => !article.isPremium);

  const featuredFreeArticle =
    featuredArticle && !featuredArticle.isPremium
      ? featuredArticle
      : freeArticles.find((article) => article.featured) ?? null;

  const latestArticles = freeArticles.filter(
    (article) => article._id !== featuredFreeArticle?._id
  );

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
                key={category.value}
                type="button"
                className={
                  index === 0
                    ? "shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-extrabold text-black"
                    : "shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-bold text-zinc-400 transition hover:border-white/30 hover:text-white"
                }
              >
                {category.label}
              </button>
            ))}
          </div>

          {featuredFreeArticle ? (
            <article className="mt-8 overflow-hidden rounded-2xl border border-brand/30 bg-brand/[0.06]">
              <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                <div className="p-8 lg:p-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand">
                      {getArticleLabel(featuredFreeArticle)}
                    </span>

                    <span className="text-sm text-zinc-500">
                      {formatDate(featuredFreeArticle.publishedAt)}
                    </span>

                    {featuredFreeArticle.readingTime ? (
                      <span className="text-sm text-zinc-500">
                        {featuredFreeArticle.readingTime} min read
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-6 max-w-4xl font-display text-4xl font-bold uppercase text-white sm:text-5xl">
                    {featuredFreeArticle.title}
                  </h2>

                  <p className="mt-5 max-w-3xl leading-7 text-zinc-400">
                    {featuredFreeArticle.excerpt}
                  </p>

                  <Link
                    href={`/free-picks/${featuredFreeArticle.slug}`}
                    className="mt-7 inline-flex text-sm font-extrabold uppercase tracking-wide text-brand"
                  >
                    Read article →
                  </Link>
                </div>

                {getArticleImageUrl(featuredFreeArticle) ? (
                  <div className="relative min-h-72 border-t border-white/10 lg:min-h-full lg:border-l lg:border-t-0">
                    <Image
                      src={getArticleImageUrl(featuredFreeArticle)!}
                      alt={
                        featuredFreeArticle.featuredImage?.alt ||
                        featuredFreeArticle.title
                      }
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      priority
                    />
                  </div>
                ) : null}
              </div>
            </article>
          ) : (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-8">
              <p className="text-zinc-400">
                The first KofSports article is coming soon.
              </p>
            </div>
          )}

          {latestArticles.length > 0 ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {latestArticles.map((article) => {
                const imageUrl = getArticleImageUrl(article);

                return (
                  <article
                    key={article._id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]"
                  >
                    {imageUrl ? (
                      <div className="relative aspect-[16/9] border-b border-white/10">
                        <Image
                          src={imageUrl}
                          alt={
                            article.featuredImage?.alt || article.title
                          }
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      </div>
                    ) : null}

                    <div className="p-8">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand">
                          {getArticleLabel(article)}
                        </span>

                        <span className="text-sm text-zinc-500">
                          {formatDate(article.publishedAt)}
                        </span>

                        {article.readingTime ? (
                          <span className="text-sm text-zinc-500">
                            {article.readingTime} min read
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-6 font-display text-3xl font-bold uppercase text-white">
                        {article.title}
                      </h2>

                      <p className="mt-5 leading-7 text-zinc-400">
                        {article.excerpt}
                      </p>

                      <Link
                        href={`/free-picks/${article.slug}`}
                        className="mt-7 inline-flex text-sm font-extrabold uppercase tracking-wide text-brand"
                      >
                        Read article →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

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