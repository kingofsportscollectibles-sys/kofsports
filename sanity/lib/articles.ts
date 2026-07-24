import { sanityClient } from "@/sanity/lib/client";
import {
  ARTICLE_BY_SLUG_QUERY,
  ARTICLE_SLUGS_QUERY,
  ARTICLES_BY_CATEGORY_QUERY,
  ARTICLES_BY_CONTENT_TYPE_QUERY,
  ARTICLES_BY_SPORT_QUERY,
  ARTICLES_QUERY,
  FEATURED_ARTICLE_QUERY,
  LATEST_ARTICLES_QUERY,
  RELATED_ARTICLES_QUERY,
} from "@/sanity/queries/articles";
import type {
  Article,
  ArticleCard,
  ArticleCategory,
  ArticleContentType,
  ArticleSport,
} from "@/sanity/types/article";

const REVALIDATE_SECONDS = 60;

const articleFetchOptions = {
  next: {
    revalidate: REVALIDATE_SECONDS,
    tags: ["articles"],
  },
};

export async function getArticles(): Promise<ArticleCard[]> {
  return sanityClient.fetch<ArticleCard[]>(
    ARTICLES_QUERY,
    {},
    articleFetchOptions
  );
}

export async function getLatestArticles(
  limit = 4
): Promise<ArticleCard[]> {
  return sanityClient.fetch<ArticleCard[]>(
    LATEST_ARTICLES_QUERY,
    { limit },
    articleFetchOptions
  );
}

export async function getArticlesBySport(
  sport: ArticleSport,
  limit = 3
): Promise<ArticleCard[]> {
  return sanityClient.fetch<ArticleCard[]>(
    ARTICLES_BY_SPORT_QUERY,
    { sport, limit },
    articleFetchOptions
  );
}

export async function getArticlesByContentType(
  contentType: ArticleContentType,
  limit = 3
): Promise<ArticleCard[]> {
  return sanityClient.fetch<ArticleCard[]>(
    ARTICLES_BY_CONTENT_TYPE_QUERY,
    { contentType, limit },
    articleFetchOptions
  );
}

export async function getArticlesByCategory(
  category: ArticleCategory,
  limit = 3
): Promise<ArticleCard[]> {
  return sanityClient.fetch<ArticleCard[]>(
    ARTICLES_BY_CATEGORY_QUERY,
    { category, limit },
    articleFetchOptions
  );
}

export async function getFeaturedArticle(): Promise<ArticleCard | null> {
  return sanityClient.fetch<ArticleCard | null>(
    FEATURED_ARTICLE_QUERY,
    {},
    articleFetchOptions
  );
}

export async function getArticleBySlug(
  slug: string
): Promise<Article | null> {
  return sanityClient.fetch<Article | null>(
    ARTICLE_BY_SLUG_QUERY,
    { slug },
    {
      next: {
        revalidate: REVALIDATE_SECONDS,
        tags: ["articles", `article:${slug}`],
      },
    }
  );
}

export async function getRelatedArticles(
  category: ArticleCategory,
  slug: string,
  limit = 3
): Promise<ArticleCard[]> {
  const articles = await sanityClient.fetch<ArticleCard[]>(
    RELATED_ARTICLES_QUERY,
    { category, slug },
    articleFetchOptions
  );

  return articles.slice(0, limit);
}

export async function getArticleSlugs(): Promise<Array<{ slug: string }>> {
  return sanityClient.fetch<Array<{ slug: string }>>(
    ARTICLE_SLUGS_QUERY,
    {},
    articleFetchOptions
  );
}