"use client";

import { createElement } from "react";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";

import CommandCenter from "./sanity/components/CommandCenter";
import { schemaTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";

const CommandCenterIcon = () =>
  createElement(
    "span",
    {
      "aria-hidden": true,
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1em",
        lineHeight: 1,
      },
    },
    "🏠",
  );

export default defineConfig({
  name: "default",
  title: "KofSports Content Studio",

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,

  basePath: "/studio",

  plugins: [
    structureTool({
      name: "content",
      title: "Content",
      structure,
    }),
    visionTool(),
  ],

  tools: [
    {
      name: "command-center",
      title: "Command Center",
      icon: CommandCenterIcon,
      component: CommandCenter,
    },
  ],

  schema: {
    types: schemaTypes,
  },
});
