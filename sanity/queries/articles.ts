import { defineQuery } from "next-sanity";

const ARTICLE_CARD_PROJECTION = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  author,
  sport,
  "league": coalesce(league, "general"),
  contentType,
  "tags": coalesce(tags, []),
  "isPremium": coalesce(isPremium, false),
  publishedAt,
  "featured": coalesce(featured, false),
  readingTime,
  featuredImage {
    asset,
    crop,
    hotspot,
    alt,
    caption
  }
`;

export const ARTICLES_QUERY = defineQuery(`
  *[
    _type == "article" &&
    defined(slug.current) &&
    publishedAt <= now()
  ]
  | order(publishedAt desc) {
    ${ARTICLE_CARD_PROJECTION}
  }
`);

export const FEATURED_ARTICLE_QUERY = defineQuery(`
  *[
    _type == "article" &&
    defined(slug.current) &&
    featured == true &&
    publishedAt <= now()
  ]
  | order(publishedAt desc)[0] {
    ${ARTICLE_CARD_PROJECTION}
  }
`);

export const ARTICLE_BY_SLUG_QUERY = defineQuery(`
  *[
    _type == "article" &&
    slug.current == $slug &&
    publishedAt <= now()
  ][0] {
    ${ARTICLE_CARD_PROJECTION},
    body,
    seoTitle,
    seoDescription
  }
`);

export const ARTICLE_SLUGS_QUERY = defineQuery(`
  *[
    _type == "article" &&
    defined(slug.current) &&
    publishedAt <= now()
  ] {
    "slug": slug.current
  }
`);