import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PortableText,
  type PortableTextComponents,
} from "@portabletext/react";

import {
  getArticleBySlug,
  getArticleSlugs,
} from "@/sanity/lib/articles";
import { urlForImage } from "@/sanity/lib/image";
import type {
  Article,
  ArticleContentType,
  ArticleImage,
  ArticleSport,
} from "@/sanity/types/article";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

function getArticleLabel(article: Article) {
  if (article.sport !== "general") {
    return sportLabels[article.sport];
  }

  return contentTypeLabels[article.contentType];
}

function getImageUrl(
  image: ArticleImage | null | undefined,
  width: number,
  height: number
) {
  if (!image) {
    return null;
  }

  return urlForImage(image)
    .width(width)
    .height(height)
    .url();
}

const portableTextComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="my-6 text-lg leading-8 text-zinc-300">
        {children}
      </p>
    ),

    h2: ({ children }) => (
      <h2 className="mb-5 mt-12 font-display text-3xl font-bold uppercase text-white sm:text-4xl">
        {children}
      </h2>
    ),

    h3: ({ children }) => (
      <h3 className="mb-4 mt-10 font-display text-2xl font-bold uppercase text-white sm:text-3xl">
        {children}
      </h3>
    ),

    blockquote: ({ children }) => (
      <blockquote className="my-8 border-l-4 border-brand bg-brand/[0.06] px-6 py-5 text-xl italic leading-8 text-zinc-200">
        {children}
      </blockquote>
    ),
  },

  list: {
    bullet: ({ children }) => (
      <ul className="my-6 list-disc space-y-3 pl-7 text-lg leading-8 text-zinc-300">
        {children}
      </ul>
    ),

    number: ({ children }) => (
      <ol className="my-6 list-decimal space-y-3 pl-7 text-lg leading-8 text-zinc-300">
        {children}
      </ol>
    ),
  },

  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },

  marks: {
    strong: ({ children }) => (
      <strong className="font-extrabold text-white">
        {children}
      </strong>
    ),

    em: ({ children }) => (
      <em className="italic text-zinc-200">{children}</em>
    ),

    underline: ({ children }) => (
      <span className="underline decoration-brand underline-offset-4">
        {children}
      </span>
    ),

    link: ({ children, value }) => {
      const linkValue = value as {
        href?: string;
        openInNewTab?: boolean;
      };

      const href = linkValue?.href ?? "#";
      const opensNewTab = linkValue?.openInNewTab;

      return (
        <a
          href={href}
          target={opensNewTab ? "_blank" : undefined}
          rel={opensNewTab ? "noopener noreferrer" : undefined}
          className="font-bold text-brand underline decoration-brand/50 underline-offset-4 transition hover:text-brand-light"
        >
          {children}
        </a>
      );
    },
  },

  types: {
    image: ({ value }) => {
      const image = value as ArticleImage;
      const imageUrl = getImageUrl(image, 1200, 800);

      if (!imageUrl) {
        return null;
      }

      return (
        <figure className="my-10">
          <div className="relative aspect-[3/2] overflow-hidden rounded-xl border border-white/10">
            <Image
              src={imageUrl}
              alt={image.alt || "KofSports article image"}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>

          {image.caption ? (
            <figcaption className="mt-3 text-center text-sm text-zinc-500">
              {image.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    },
  },
};

export async function generateStaticParams() {
  const articles = await getArticleSlugs();

  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  const imageUrl = getImageUrl(article.featuredImage, 1200, 630);

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,

    alternates: {
      canonical: `/free-picks/${article.slug}`,
    },

    openGraph: {
      type: "article",
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      publishedTime: article.publishedAt,
      authors: [article.author],
      url: `/free-picks/${article.slug}`,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt:
                article.featuredImage?.alt ||
                article.title,
            },
          ]
        : [],
    },

    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ArticlePage({
  params,
}: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || article.isPremium) {
    notFound();
  }

  const heroImageUrl = getImageUrl(
    article.featuredImage,
    1600,
    900
  );

  return (
    <article>
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-5xl px-5 pb-14 pt-12 lg:px-8 lg:pb-20 lg:pt-16">
          <Link
            href="/blog"
            className="inline-flex text-sm font-extrabold uppercase tracking-wide text-brand transition hover:text-brand-light"
          >
            ← Back to Blog
          </Link>

          <div className="mt-10 flex flex-wrap items-center gap-3">
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

          <h1 className="mt-6 max-w-5xl font-display text-5xl font-bold uppercase leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            {article.title}
          </h1>

          <p className="mt-7 max-w-3xl text-xl leading-8 text-zinc-400">
            {article.excerpt}
          </p>

          <p className="mt-7 text-sm font-bold uppercase tracking-wider text-zinc-500">
            By {article.author}
          </p>
        </div>
      </header>

      {heroImageUrl ? (
        <div className="mx-auto max-w-6xl px-5 pt-10 lg:px-8 lg:pt-14">
          <figure>
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
              <Image
                src={heroImageUrl}
                alt={
                  article.featuredImage?.alt ||
                  article.title
                }
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority
              />
            </div>

            {article.featuredImage?.caption ? (
              <figcaption className="mt-3 text-center text-sm text-zinc-500">
                {article.featuredImage.caption}
              </figcaption>
            ) : null}
          </figure>
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl px-5 py-14 lg:px-8 lg:py-20">
        <PortableText
          value={article.body}
          components={portableTextComponents}
        />

        {article.tags.length > 0 ? (
          <div className="mt-14 border-t border-white/10 pt-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-zinc-500">
              Topics
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-14 rounded-2xl border border-brand/30 bg-brand/[0.06] p-8 text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-brand">
            Get every official play
          </p>

          <h2 className="mt-4 font-display text-3xl font-bold uppercase text-white">
            Unlock KofSports VIP
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-zinc-400">
            Receive the complete betting card, full analysis,
            transparent results, and direct access for questions.
          </p>

          <Link
            href="/plans"
            className="mt-7 inline-flex rounded-md bg-brand px-7 py-4 text-sm font-extrabold uppercase tracking-wide text-black transition hover:bg-brand-light"
          >
            View memberships
          </Link>
        </div>
      </div>
    </article>
  );
}