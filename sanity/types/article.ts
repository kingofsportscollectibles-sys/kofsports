import type { PortableTextBlock } from "@portabletext/types";
import type { SanityImageSource } from "@sanity/image-url";

export type ArticleSport =
  | "general"
  | "nfl"
  | "mlb"
  | "nba"
  | "nhl"
  | "cfb"
  | "cbb";

export type ArticleLeague =
  | "general"
  | "nfl"
  | "mlb"
  | "nba"
  | "nhl"
  | "cfb"
  | "cbb";

export type ArticleContentType =
  | "free-pick"
  | "game-preview"
  | "betting-education"
  | "news"
  | "weekly-recap"
  | "announcement"
  | "kofsports-update";

export type ArticleCategory =
  | "betting-education"
  | "nfl-betting"
  | "mlb-betting"
  | "nba-betting"
  | "nhl-betting"
  | "college-football"
  | "college-basketball"
  | "golf-betting"
  | "bankroll-management"
  | "odds-explained"
  | "betting-strategy"
  | "sports-betting-news"
  | "kofsports-updates";

export type ArticleReadingLevel =
  | "beginner"
  | "intermediate"
  | "advanced";

export type ArticleImage = SanityImageSource & {
  alt?: string;
  caption?: string;
};

export type ArticleFaq = {
  question: string;
  answer: string;
};

export type ArticleCard = {
  _id: string;

  title: string;

  slug: string;

  excerpt: string;

  author: string;

  category?: ArticleCategory;

  sport: ArticleSport;

  league: ArticleLeague;

  contentType: ArticleContentType;

  tags: string[];

  readingLevel?: ArticleReadingLevel;

  isPremium: boolean;

  publishedAt: string;

  lastUpdated?: string;

  featured: boolean;

  readingTime?: number;

  featuredImage: ArticleImage | null;
};

export type Article = ArticleCard & {
  body: PortableTextBlock[];

  faq?: ArticleFaq[];

  relatedArticles?: ArticleCard[];

  metaTitle?: string;

  metaDescription?: string;

  primaryKeyword?: string;

  secondaryKeywords?: string[];

  canonicalUrl?: string;

  noIndex?: boolean;

  // Legacy fields retained for backwards compatibility
  seoTitle?: string;

  seoDescription?: string;
};