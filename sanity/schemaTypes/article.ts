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
  { title: "KofSports Update", value: "kofsports-update" },
];

export const articleType = defineType({
  name: "article",
  title: "Articles",
  type: "document",

  groups: [
    {
      name: "content",
      title: "Article",
      default: true,
    },
    {
      name: "settings",
      title: "Settings",
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
        "Click Generate to create the article URL from the title.",
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
        "A brief summary displayed on article cards and search results.",
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
      title: "Article Body",
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
            {
              name: "alt",
              title: "Alternative Text",
              type: "string",
              validation: (rule) => rule.required(),
            },
            {
              name: "caption",
              title: "Caption",
              type: "string",
            },
          ],
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "author",
      title: "Author",
      type: "string",
      group: "settings",
      initialValue: "Kof",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "sport",
      title: "Sport",
      type: "string",
      group: "settings",
      options: {
        list: sports,
        layout: "dropdown",
      },
      initialValue: "general",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "contentType",
      title: "Content Type",
      type: "string",
      group: "settings",
      options: {
        list: contentTypes,
        layout: "dropdown",
      },
      initialValue: "free-pick",
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "publishedAt",
      title: "Publication Date",
      type: "datetime",
      group: "settings",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "featured",
      title: "Feature This Article",
      type: "boolean",
      group: "settings",
      description:
        "Featured articles may appear in the prominent position on the Free Picks page.",
      initialValue: false,
    }),

    defineField({
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
      group: "seo",
      description:
        "Optional search-engine title. The article title will be used when blank.",
      validation: (rule) => rule.max(65),
    }),

    defineField({
      name: "seoDescription",
      title: "SEO Description",
      type: "text",
      rows: 3,
      group: "seo",
      description:
        "Optional search-engine description. The excerpt will be used when blank.",
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
      media: "featuredImage",
    },

    prepare({ title, author, sport, media }) {
      const subtitle = [
        sport?.toUpperCase(),
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