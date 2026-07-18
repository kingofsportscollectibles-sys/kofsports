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

export type ArticleImage = SanityImageSource & {
  alt?: string;
  caption?: string;
};

export type ArticleCard = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  sport: ArticleSport;
  league: ArticleLeague;
  contentType: ArticleContentType;
  tags: string[];
  isPremium: boolean;
  publishedAt: string;
  featured: boolean;
  readingTime?: number;
  featuredImage: ArticleImage | null;
};

export type Article = ArticleCard & {
  body: PortableTextBlock[];
  seoTitle?: string;
  seoDescription?: string;
};