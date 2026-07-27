import { ImageIcon } from "@sanity/icons";
import { defineArrayMember, defineType } from "sanity";

/**
 * Portable Text schema used for blog articles.
 *
 * Supports:
 * - Headings
 * - Lists
 * - Links
 * - Inline images
 * - Image captions
 * - SEO alt text
 * - Image sizing
 */

export const blockContentType = defineType({
  name: "blockContent",
  title: "Block Content",
  type: "array",

  of: [
    defineArrayMember({
      type: "block",

      styles: [
        { title: "Normal", value: "normal" },
        { title: "H1", value: "h1" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "H4", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],

      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],

      marks: {
        decorators: [
          {
            title: "Strong",
            value: "strong",
          },
          {
            title: "Emphasis",
            value: "em",
          },
        ],

        annotations: [
          defineArrayMember({
            name: "link",
            title: "Link",
            type: "object",

            fields: [
              {
                name: "href",
                title: "URL",
                type: "url",
              },
              {
                name: "blank",
                title: "Open in new tab",
                type: "boolean",
                initialValue: true,
              },
            ],
          }),
        ],
      },
    }),

    defineArrayMember({
      name: "articleImage",
      title: "Article Image",
      type: "image",
      icon: ImageIcon,

      options: {
        hotspot: true,
      },

      fields: [
        {
          name: "alt",
          title: "Alternative Text",
          type: "string",
          description:
            "Required for accessibility and SEO.",
          validation: (Rule) => Rule.required(),
        },

        {
          name: "caption",
          title: "Caption",
          type: "string",
        },

        {
          name: "size",
          title: "Display Size",
          type: "string",
          initialValue: "wide",

          options: {
            layout: "radio",
            list: [
              {
                title: "Standard",
                value: "standard",
              },
              {
                title: "Wide",
                value: "wide",
              },
              {
                title: "Full Width",
                value: "full",
              },
            ],
          },
        },
      ],

      preview: {
        select: {
          media: "asset",
          title: "caption",
          subtitle: "alt",
        },

        prepare({ media, title, subtitle }) {
          return {
            media,
            title: title || "Article Image",
            subtitle,
          };
        },
      },
    }),
  ],
});
