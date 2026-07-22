import Image from "next/image";
import Link from "next/link";

import { urlForImage } from "@/sanity/lib/image";
import type {
  ArticleCard,
  ArticleContentType,
  ArticleSport,
} from "@/sanity/types/article";

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

type FeaturedArticleProps = {
  article: ArticleCard;
  priority?: boolean;
};

export function FeaturedArticle({
  article,
  priority = false,
}: FeaturedArticleProps) {
  const imageUrl = article.featuredImage
    ? urlForImage(article.featuredImage)
        .width(1400)
        .height(900)
        .url()
    : null;

  return (
    <article className="mt-8 overflow-hidden rounded-2xl border border-brand/30 bg-brand/[0.06]">
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-8 lg:p-10">
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

          <h2 className="mt-6 max-w-4xl font-display text-4xl font-bold uppercase text-white sm:text-5xl">
            {article.title}
          </h2>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-400">
            {article.excerpt}
          </p>

          <Link
            href={`/blog/${article.slug}`}
            className="mt-7 inline-flex text-sm font-extrabold uppercase tracking-wide text-brand"
          >
            Read article →
          </Link>
        </div>

        {imageUrl ? (
          <div className="relative min-h-72 border-t border-white/10 lg:min-h-full lg:border-l lg:border-t-0">
            <Image
              src={imageUrl}
              alt={article.featuredImage?.alt || article.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority={priority}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}