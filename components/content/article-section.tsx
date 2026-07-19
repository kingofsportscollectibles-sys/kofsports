import Link from "next/link";

import { ArticleCard } from "@/components/content/article-card";
import type { ArticleCard as ArticleCardType } from "@/sanity/types/article";

type ArticleSectionProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  articles: ArticleCardType[];
  href?: string;
  linkLabel?: string;
};

export function ArticleSection({
  title,
  eyebrow,
  description,
  articles,
  href,
  linkLabel = "View all",
}: ArticleSectionProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-white/10">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow ? (
              <p className="text-sm font-extrabold uppercase tracking-[0.28em] text-brand">
                {eyebrow}
              </p>
            ) : null}

            <h2 className="mt-3 font-display text-4xl font-bold uppercase text-white">
              {title}
            </h2>

            {description ? (
              <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
                {description}
              </p>
            ) : null}
          </div>

          {href ? (
            <Link
              href={href}
              className="shrink-0 text-sm font-extrabold uppercase tracking-wide text-brand transition hover:text-brand-light"
            >
              {linkLabel}
            </Link>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={article._id}
              article={article}
            />
          ))}
        </div>
      </div>
    </section>
  );
}