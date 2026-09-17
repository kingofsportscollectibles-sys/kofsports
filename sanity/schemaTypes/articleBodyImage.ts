import { defineField, defineType } from "sanity";

export const articleBodyImage = defineType({
  name: "articleBodyImage",
  title: "Article Image",
  type: "object",

  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: "alt",
      title: "Alternative Text",
      type: "string",
      description:
        "Describe the image for accessibility and search engines. Avoid phrases such as “image of” or “picture of.”",
      validation: (rule) => rule.required().min(10).max(160),
    }),

    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
    }),
  ],

  preview: {
    select: {
      title: "alt",
      media: "image",
      caption: "caption",
    },

    prepare({ title, media, caption }) {
      return {
        title: title || "Article Image",
        subtitle: caption || "Inline article image",
        media,
      };
    },
  },
});
