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
            "Describe the image for accessibility and search engines.",
          validation: (rule) => rule.required(),
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
              validation: (rule) => rule.required(),
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
      name: "author",
      title: "Author",
      type: "string",
      group: "distribution",
      initialValue: "Kof",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "contentType",
      title: "Content Type",
      type: "string",
      group: "distribution",
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
        "Examples: best bets, player props, futures, betting strategy.",
      of: [
        defineArrayMember({
          type: "string",
        }),
      ],
      options: {
        layout: "tags",
      },
      validation: (rule) =>
        rule.unique().max(10),
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
        "Featured content may appear prominently on the homepage or Free Picks page.",
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
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
      group: "seo",
      description:
        "Optional search title. The content title will be used when blank.",
      validation: (rule) => rule.max(65),
    }),

    defineField({
      name: "seoDescription",
      title: "SEO Description",
      type: "text",
      rows: 3,
      group: "seo",
      description:
        "Optional search description. The excerpt will be used when blank.",
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
      sport: "sport",
      contentType: "contentType",
      isPremium: "isPremium",
      media: "featuredImage",
    },

    prepare({
      title,
      author,
      sport,
      contentType,
      isPremium,
      media,
    }) {
      const subtitle = [
        isPremium ? "VIP" : "FREE",
        sport?.toUpperCase(),
        contentType?.replaceAll("-", " ").toUpperCase(),
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