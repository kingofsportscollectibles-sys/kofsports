import {
  defineArrayMember,
  defineField,
  defineType,
} from "sanity";

const sports = [
  { title: "General", value: "general" },
  { title: "NFL", value: "nfl" },
  { title: "MLB", value: "mlb" },
  { title: "NBA", value: "nba" },
  { title: "NHL", value: "nhl" },
  { title: "College Football", value: "cfb" },
  { title: "College Basketball", value: "cbb" },
];

const contentTypes = [
  { title: "Free Pick", value: "free-pick" },
  { title: "Game Preview", value: "game-preview" },
  { title: "Betting Education", value: "betting-education" },
  { title: "News", value: "news" },
  { title: "Weekly Recap", value: "weekly-recap" },
  { title: "Announcement", value: "announcement" },
  { title: "KofSports Update", value: "kofsports-update" },
];

const leagues = [
  { title: "None / General", value: "general" },
  { title: "NFL", value: "nfl" },
  { title: "MLB", value: "mlb" },
  { title: "NBA", value: "nba" },
  { title: "NHL", value: "nhl" },
  { title: "College Football", value: "cfb" },
  { title: "College Basketball", value: "cbb" },
];

const categories = [
  {
    title: "Betting Education",
    value: "betting-education",
  },
  {
    title: "NFL Betting",
    value: "nfl-betting",
  },
  {
    title: "MLB Betting",
    value: "mlb-betting",
  },
  {
    title: "NBA Betting",
    value: "nba-betting",
  },
  {
    title: "NHL Betting",
    value: "nhl-betting",
  },
  {
    title: "College Football",
    value: "college-football",
  },
  {
    title: "College Basketball",
    value: "college-basketball",
  },
  {
    title: "Golf Betting",
    value: "golf-betting",
  },
  {
    title: "Bankroll Management",
    value: "bankroll-management",
  },
  {
    title: "Odds Explained",
    value: "odds-explained",
  },
  {
    title: "Betting Strategy",
    value: "betting-strategy",
  },
  {
    title: "Sports Betting News",
    value: "sports-betting-news",
  },
  {
    title: "KofSports Updates",
    value: "kofsports-updates",
  },
];

const readingLevels = [
  {
    title: "Beginner",
    value: "beginner",
  },
  {
    title: "Intermediate",
    value: "intermediate",
  },
  {
    title: "Advanced",
    value: "advanced",
  },
];

export const articleType = defineType({
  name: "article",
  title: "Content",
  type: "document",

  groups: [
    {
      name: "content",
      title: "Content",
      default: true,
    },
    {
      name: "distribution",
      title: "Publishing",
    },
    {
      name: "seo",
      title: "SEO",
    },
  ],

  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (rule) =>
        rule.required().min(5).max(100),
    }),

    defineField({
      name: "slug",
      title: "URL Slug",
      type: "slug",
      group: "content",
      description:
        "Click Generate to create the page URL from the title.",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 4,
      group: "content",
      description:
        "A brief summary displayed on cards, previews, and search results.",
      validation: (rule) =>
        rule.required().min(40).max(240),
    }),

    defineField({
      name: "featuredImage",
      title: "Featured Image",
      type: "image",
      group: "content",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative Text",
          type: "string",
          description:
            "Describe the image for accessibility and search engines. Avoid phrases such as “image of” or “picture of.”",
          validation: (rule) =>
            rule
              .required()
              .min(10)
              .max(160),
        }),

        defineField({
          name: "caption",
          title: "Caption",
          type: "string",
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "body",
      title: "Body",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading 2", value: "h2" },
            { title: "Heading 3", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bulleted List", value: "bullet" },
            { title: "Numbered List", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
              { title: "Underline", value: "underline" },
            ],
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  {
                    name: "href",
                    title: "URL",
                    type: "url",
                    validation: (rule) =>
                      rule.uri({
                        allowRelative: true,
                        scheme: [
                          "http",
                          "https",
                          "mailto",
                          "tel",
                        ],
                      }),
                  },
                  {
                    name: "openInNewTab",
                    title: "Open in New Tab",
                    type: "boolean",
                    initialValue: false,
                  },
                ],
              },
            ],
          },
        }),

        defineArrayMember({
          type: "image",
          options: {
            hotspot: true,
          },
          fields: [
            defineField({
              name: "alt",
              title: "Alternative Text",
              type: "string",
              description:
                "Describe the image for accessibility and search engines.",
              validation: (rule) =>
                rule
                  .required()
                  .min(10)
                  .max(160),
            }),

            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
            }),
          ],
        }),
      ],
      validation: (rule) => rule.required(),
    }),

   defineField({
  name: "faq",
  title: "Frequently Asked Questions",
  type: "array",
  group: "content",
  description:
    "Add questions and answers that may be displayed on the article and used for FAQ structured data.",
  of: [
    defineArrayMember({
      type: "faqItem",
    }),
  ],
  validation: (rule) => rule.max(10),
}),

    defineField({
      name: "author",
      title: "Author",
      type: "string",
      group: "distribution",
      initialValue: "Kof",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "distribution",
      description:
        "Primary SEO and editorial category for this article.",
      options: {
        list: categories,
        layout: "dropdown",
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "contentType",
      title: "Content Type",
      type: "string",
      group: "distribution",
      description:
        "Legacy content classification retained for existing filtering and frontend compatibility.",
      options: {
        list: contentTypes,
        layout: "dropdown",
      },
      initialValue: "free-pick",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "sport",
      title: "Sport",
      type: "string",
      group: "distribution",
      description:
        "Legacy sport classification retained for existing filtering and frontend compatibility.",
      options: {
        list: sports,
        layout: "dropdown",
      },
      initialValue: "general",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "league",
      title: "League",
      type: "string",
      group: "distribution",
      description:
        "Optional league classification used for filtering and navigation.",
      options: {
        list: leagues,
        layout: "dropdown",
      },
      initialValue: "general",
    }),

    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      group: "distribution",
      description:
        "Add relevant topics such as spread, moneyline, parlay, bankroll, closing line value, expected value, props, live betting, or futures.",
      of: [
        defineArrayMember({
          type: "string",
          validation: (rule) =>
            rule.min(2).max(60),
        }),
      ],
      options: {
        layout: "tags",
      },
      validation: (rule) => rule.unique(),
    }),

    defineField({
      name: "readingLevel",
      title: "Reading Level",
      type: "string",
      group: "distribution",
      description:
        "The intended experience level of the reader.",
      options: {
        list: readingLevels,
        layout: "dropdown",
      },
      initialValue: "beginner",
    }),

    defineField({
      name: "relatedArticles",
      title: "Related Articles",
      type: "array",
      group: "distribution",
      description:
        "Choose up to five articles to recommend after this article.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "article" }],
        }),
      ],
      validation: (rule) =>
        rule.unique().max(5),
    }),

    defineField({
      name: "isPremium",
      title: "Premium Content",
      type: "boolean",
      group: "distribution",
      description:
        "Premium content will eventually require an active VIP membership.",
      initialValue: false,
    }),

    defineField({
      name: "publishedAt",
      title: "Publication Date",
      type: "datetime",
      group: "distribution",
      description:
        "Future dates can later be used for scheduled publishing.",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "featured",
      title: "Feature This Content",
      type: "boolean",
      group: "distribution",
      description:
        "Featured content may appear prominently on the homepage or Free Picks page. Generally, only one article should be featured at a time.",
      initialValue: false,
    }),

    defineField({
      name: "readingTime",
      title: "Estimated Reading Time",
      type: "number",
      group: "distribution",
      description:
        "Estimated reading time in minutes.",
      validation: (rule) =>
        rule.integer().min(1).max(60),
    }),

    defineField({
      name: "metaTitle",
      title: "Meta Title",
      type: "string",
      group: "seo",
      description:
        "The title shown in search results. Keep it at 60 characters or fewer.",
      validation: (rule) =>
        rule
          .required()
          .max(60)
          .warning(
            "Meta titles longer than 60 characters may be truncated in search results.",
          ),
    }),

    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      rows: 3,
      group: "seo",
      description:
        "The page description shown in search results. Keep it at 155 characters or fewer.",
      validation: (rule) =>
        rule
          .required()
          .max(155)
          .warning(
            "Meta descriptions longer than 155 characters may be truncated in search results.",
          ),
    }),

    defineField({
      name: "primaryKeyword",
      title: "Primary Keyword",
      type: "string",
      group: "seo",
      description:
        "The main search query this article is intended to target.",
      validation: (rule) =>
        rule.required().min(2).max(100),
    }),

    defineField({
      name: "secondaryKeywords",
      title: "Secondary Keywords",
      type: "array",
      group: "seo",
      description:
        "Related search terms and keyword variations targeted by this article.",
      of: [
        defineArrayMember({
          type: "string",
          validation: (rule) =>
            rule.min(2).max(100),
        }),
      ],
      options: {
        layout: "tags",
      },
      validation: (rule) => rule.unique(),
    }),

    defineField({
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
      group: "seo",
      description:
        "Optional. Use only when another URL should be treated as the primary version of this content.",
      validation: (rule) =>
        rule.uri({
          scheme: ["http", "https"],
        }),
    }),

    defineField({
      name: "noIndex",
      title: "Prevent Search Indexing",
      type: "boolean",
      group: "seo",
      description:
        "Enable this only when search engines should not index this article.",
      initialValue: false,
    }),

    defineField({
      name: "seoTitle",
      title: "Legacy SEO Title",
      type: "string",
      group: "seo",
      description:
        "Legacy field retained for existing articles and frontend compatibility. Use Meta Title for new articles.",
      validation: (rule) => rule.max(65),
    }),

    defineField({
      name: "seoDescription",
      title: "Legacy SEO Description",
      type: "text",
      rows: 3,
      group: "seo",
      description:
        "Legacy field retained for existing articles and frontend compatibility. Use Meta Description for new articles.",
      validation: (rule) => rule.max(165),
    }),
  ],

  orderings: [
    {
      title: "Publication Date, Newest",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Publication Date, Oldest",
      name: "publishedAtAsc",
      by: [{ field: "publishedAt", direction: "asc" }],
    },
  ],

  preview: {
    select: {
      title: "title",
      author: "author",
      category: "category",
      sport: "sport",
      contentType: "contentType",
      isPremium: "isPremium",
      media: "featuredImage",
    },

    prepare({
      title,
      author,
      category,
      sport,
      contentType,
      isPremium,
      media,
    }) {
      const classification =
        category ??
        sport?.toUpperCase() ??
        contentType?.replaceAll("-", " ").toUpperCase();

      const subtitle = [
        isPremium ? "VIP" : "FREE",
        classification
          ?.replaceAll("-", " ")
          .toUpperCase(),
        author ? `By ${author}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      return {
        title,
        subtitle,
        media,
      };
    },
  },
});