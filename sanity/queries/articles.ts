import { defineQuery } from "next-sanity";

export const ARTICLES_QUERY = defineQuery(`
  *[
    _type == "article" &&
    defined(slug.current) &&
    publishedAt <= now()
  ]
  | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    author,
    sport,
    contentType,
    publishedAt,
    featured,
    featuredImage {
      asset,
      crop,
      hotspot,
      alt,
      caption
    }
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
    _id,
    title,
    "slug": slug.current,
    excerpt,
    author,
    sport,
    contentType,
    publishedAt,
    featured,
    featuredImage {
      asset,
      crop,
      hotspot,
      alt,
      caption
    }
  }
`);

export const ARTICLE_BY_SLUG_QUERY = defineQuery(`
  *[
    _type == "article" &&
    slug.current == $slug &&
    publishedAt <= now()
  ][0] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    author,
    sport,
    contentType,
    publishedAt,
    featured,
    featuredImage {
      asset,
      crop,
      hotspot,
      alt,
      caption
    },
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