import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { sanitizePublicPickExample } from "../../lib/marketing/record-math";
const sample = {
  id: "settled",
  sport: "NFL",
  selection: "Recorded selection",
  odds: -110,
  units: 1,
  status: "lost",
  profit_loss: -1,
  game_time: "2026-11-13T00:00:00Z",
  is_published: true,
  is_premium: true,
};
async function render(analysis: unknown) {
  const example = sanitizePublicPickExample(
    { ...sample, analysis },
    Date.parse("2026-11-14T12:00:00Z"),
  );
  const exports: { PublicPickExample?: () => Promise<React.ReactNode> } = {};
  const source = ts.transpileModule(
    fs.readFileSync("components/marketing/PublicPickExample.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    Intl,
    Date,
    require: (name: string) =>
      name === "react/jsx-runtime"
        ? jsxRuntime
        : name === "next/link"
          ? (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
              React.createElement("a", props)
          : { getPublicRecord: async () => ({ example }) },
  });
  return renderToStaticMarkup(await exports.PublicPickExample!());
}
test("original analysis is collapsed by default, preserves paragraphs and is escaped as text", async () => {
  const analysis = "Original reasoning.\n\n<script>doNotRun()</script>";
  const html = await render(analysis);
  assert.ok(html.includes("Review original analysis"));
  assert.ok(html.includes("<details"));
  assert.ok(!/<details[^>]*\sopen(?:\s|=|>)/.test(html));
  assert.ok(html.includes("Original reasoning.\n\n"));
  assert.ok(html.includes("&lt;script&gt;doNotRun()&lt;/script&gt;"));
  assert.ok(!html.includes("<script>"));
});
test("missing or whitespace-only original analysis does not produce an empty dropdown", async () => {
  for (const value of [null, undefined, "", "  \n ", 123])
    assert.ok(!(await render(value)).includes("<details"));
});
test("analysis from pending, unpublished or future picks is never eligible for the public sample", () => {
  const now = Date.parse("2026-11-14T12:00:00Z");
  for (const patch of [
    { status: "pending" },
    { is_published: false },
    { game_time: "2026-11-15T00:00:00Z" },
  ])
    assert.equal(
      sanitizePublicPickExample(
        { ...sample, analysis: "Restricted analysis", ...patch },
        now,
      ),
      null,
    );
});
