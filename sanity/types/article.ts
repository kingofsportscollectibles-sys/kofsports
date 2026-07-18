import type { PortableTextBlock } from "@portabletext/types";
import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";

export type ArticleSport =
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
  contentType: ArticleContentType;
  publishedAt: string;
  featured: boolean;
  featuredImage: ArticleImage | null;
};

export type Article = ArticleCard & {
  body: PortableTextBlock[];
  seoTitle?: string;
  seoDescription?: string;
};