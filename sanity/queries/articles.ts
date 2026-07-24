import { defineQuery } from "next-sanity";

const ARTICLE_CARD_PROJECTION = `
  _id,
  title,
  "slug": slug.current,

  excerpt,

  author,

  category,

  sport,

  "league": coalesce(league, "general"),

  contentType,

  "tags": coalesce(tags, []),

  "readingLevel": coalesce(readingLevel, "beginner"),

  "isPremium": coalesce(isPremium, false),

  publishedAt,

  "lastUpdated": _updatedAt,

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
| order(publishedAt desc){
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
| order(publishedAt desc)[0]{
  ${ARTICLE_CARD_PROJECTION}
}
`);

export const LATEST_ARTICLES_QUERY = defineQuery(`
*[
  _type == "article" &&
  defined(slug.current) &&
  publishedAt <= now() &&
  coalesce(isPremium,false)==false
]
| order(publishedAt desc)[0...$limit]{
  ${ARTICLE_CARD_PROJECTION}
}
`);

export const ARTICLES_BY_SPORT_QUERY = defineQuery(`
*[
  _type == "article" &&
  defined(slug.current) &&
  publishedAt <= now() &&
  sport == $sport &&
  coalesce(isPremium,false)==false
]
| order(publishedAt desc)[0...$limit]{
  ${ARTICLE_CARD_PROJECTION}
}
`);

export const ARTICLES_BY_CONTENT_TYPE_QUERY = defineQuery(`
*[
  _type == "article" &&
  defined(slug.current) &&
  publishedAt <= now() &&
  contentType == $contentType &&
  coalesce(isPremium,false)==false
]
| order(publishedAt desc)[0...$limit]{
  ${ARTICLE_CARD_PROJECTION}
}
`);

export const ARTICLES_BY_CATEGORY_QUERY = defineQuery(`
*[
  _type == "article" &&
  defined(slug.current) &&
  publishedAt <= now() &&
  category == $category &&
  coalesce(isPremium,false)==false
]
| order(publishedAt desc)[0...$limit]{
  ${ARTICLE_CARD_PROJECTION}
}
`);

export const ARTICLE_BY_SLUG_QUERY = defineQuery(`
*[
  _type == "article" &&
  slug.current == $slug &&
  publishedAt <= now()
][0]{

  ${ARTICLE_CARD_PROJECTION},

  body,

  faq,

  relatedArticles[]->{
    ${ARTICLE_CARD_PROJECTION}
  },

  "metaTitle": coalesce(metaTitle, seoTitle, title),

  "metaDescription": coalesce(
    metaDescription,
    seoDescription,
    excerpt
  ),

  primaryKeyword,

  "secondaryKeywords": coalesce(
    secondaryKeywords,
    []
  ),

  canonicalUrl,

  "noIndex": coalesce(noIndex,false)
}
`);

export const RELATED_ARTICLES_QUERY = defineQuery(`
*[
  _type=="article" &&
  defined(slug.current) &&
  category==$category &&
  slug.current != $slug &&
  publishedAt <= now()
]
| order(publishedAt desc)[0...3]{
  ${ARTICLE_CARD_PROJECTION}
}
`);

export const ARTICLE_SLUGS_QUERY = defineQuery(`
*[
  _type=="article" &&
  defined(slug.current) &&
  publishedAt <= now()
]{
  "slug":slug.current
}
`);