import { defineField, defineType } from "sanity";

export const faqItemType = defineType({
  name: "faqItem",
  title: "FAQ Item",
  type: "object",

  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "string",
      validation: (rule) =>
        rule.required().min(10).max(200),
    }),

    defineField({
      name: "answer",
      title: "Answer",
      type: "text",
      rows: 5,
      validation: (rule) =>
        rule.required().min(20),
    }),
  ],

  preview: {
    select: {
      title: "question",
      subtitle: "answer",
    },

    prepare({ title, subtitle }) {
      return {
        title: title || "Untitled Question",
        subtitle,
      };
    },
  },
});
