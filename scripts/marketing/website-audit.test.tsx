import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import {
  aggregatePublicDecisions,
  sanitizePublicPickExample,
} from "../../lib/marketing/record-math";
import { premiumPlans, proPlans } from "../../lib/marketing/plans";
import {
  MemberStories,
  IndependentReview,
} from "../../components/marketing/Proof";
import { JsonLd } from "../../components/marketing/JsonLd";
import { PlanComparison } from "../../components/marketing/PlanComparison";
import { comparisons } from "../../lib/marketing/comparisons";

test("record counts ignore duplicate IDs and non-decisions, normalize sport labels without adding a baseline", () => {
  const s = aggregatePublicDecisions([
    { id: "a", sport: "NFL", status: "won" },
    { id: "a", sport: "NFL", status: "won" },
    { id: "b", sport: "NCAAF", status: "lost" },
    { id: "c", sport: "CFB", status: "won" },
    { id: "d", sport: "NFL", status: "push" },
    { id: "e", sport: "NBA", status: "pending" },
  ]);
  assert.deepEqual(s, [
    { sport: "NFL", wins: 1, losses: 0 },
    { sport: "CFB", wins: 1, losses: 1 },
  ]);
});
test("a sample must be already-published Premium, settled, played in the past and have actual priced results", () => {
  const now = Date.parse("2026-11-14T12:00:00Z"),
    r = {
      id: "public",
      sport: "NFL",
      selection: "A real recorded selection",
      odds: -110,
      units: 1,
      status: "lost",
      profit_loss: -1,
      game_time: "2026-11-13T23:00:00Z",
      is_published: true,
      is_premium: true,
    };
  assert.equal(sanitizePublicPickExample(r, now)?.profit_loss, -1);
  for (const patch of [
    { status: "pending" },
    { is_published: false },
    { is_premium: false },
    { game_time: "2026-11-15T23:00:00Z" },
    { odds: null },
    { units: 0 },
    { profit_loss: null },
  ])
    assert.equal(sanitizePublicPickExample({ ...r, ...patch }, now), null);
  const safe = sanitizePublicPickExample(
    {
      ...r,
      analysis: "Original analysis for this published settled pick",
      email: "PRIVATE_EMAIL",
    },
    now,
  );
  assert.equal(
    safe?.analysis,
    "Original analysis for this published settled pick",
  );
  assert.ok(!JSON.stringify(safe).includes("PRIVATE_"));
});
test("all six real plan keys, renewal periods and exact annual savings remain consistent", () => {
  const all = [...premiumPlans, ...proPlans];
  assert.equal(new Set(all.map((p) => p.planKey)).size, 6);
  assert.equal(
    all.find((p) => p.planKey === "one_day")?.billingLabel,
    "One-time payment",
  );
  const savings =
    Number(proPlans[0].price.slice(1)) * 12 -
    Number(proPlans[1].price.slice(1));
  assert.equal(savings.toFixed(2), "40.88");
  const html = renderToStaticMarkup(<PlanComparison />);
  for (const p of all) assert.ok(html.includes(p.name));
  assert.ok(html.includes("scroll horizontally"));
  assert.ok(!html.includes("35%"));
});
test("missing member and independent-review evidence renders no invented proof", () => {
  assert.equal(renderToStaticMarkup(<MemberStories />), "");
  assert.equal(renderToStaticMarkup(<IndependentReview />), "");
});
test("structured data escapes script delimiters rather than inserting executable content", () => {
  const html = renderToStaticMarkup(
    <JsonLd data={{ text: "</script><script>alert(1)</script>" }} />,
  );
  assert.equal((html.match(/<script/g) || []).length, 1);
  assert.ok(html.includes("\\u003c/script>"));
});
test("public record reader paginates a complete published/settled scope and fails instead of publishing partial totals", async () => {
  const rows = Array.from({ length: 1001 }, (_, i) => ({
    id: String(i),
    sport: "NFL",
    status: i % 2 ? "lost" : "won",
  }));
  const calls: { table: string; filters: unknown[]; from?: number }[] = [];
  let fail = false;
  const client = {
    from(table: string) {
      const call = {
        table,
        filters: [] as unknown[],
        from: undefined as number | undefined,
      };
      calls.push(call);
      const q = {
        select() {
          return q;
        },
        eq(k: string, v: unknown) {
          call.filters.push([k, v]);
          return q;
        },
        in(k: string, v: unknown) {
          call.filters.push([k, v]);
          return q;
        },
        not() {
          return q;
        },
        lt(k: string, v: unknown) {
          call.filters.push([k, v]);
          return q;
        },
        order() {
          return q;
        },
        range(from: number, to: number) {
          call.from = from;
          return Promise.resolve(
            fail && from > 0
              ? { error: { code: "FAIL" }, data: null, count: 1001 }
              : { error: null, data: rows.slice(from, to + 1), count: 1001 },
          );
        },
        limit() {
          return Promise.resolve({ data: [], error: null });
        },
      };
      return q;
    },
  };
  const exports: Record<
    string,
    () => Promise<{ sports: { wins: number; losses: number }[] }>
  > = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync("lib/marketing/public-record.ts", "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
        },
      },
    ).outputText,
    {
      exports,
      Date,
      Promise,
      Error,
      Map,
      Set,
      require: (name: string) =>
        name === "server-only"
          ? {}
          : name === "next/cache"
            ? { unstable_cache: (fn: unknown) => fn }
            : name.includes("supabase/admin")
              ? { createAdminClient: () => client }
              : { aggregatePublicDecisions, sanitizePublicPickExample },
    },
  );
  const data = await exports.getPublicRecord();
  assert.equal(data.sports[0].wins + data.sports[0].losses, 1001);
  for (const call of calls) {
    assert.ok(
      call.filters.some((f) => JSON.stringify(f) === '["is_published",true]'),
    );
    assert.ok(
      call.filters.some((f) => JSON.stringify(f) === '["is_premium",true]'),
    );
    assert.ok(
      call.filters.some(
        (f) => JSON.stringify(f) === '["status",["won","lost"]]',
      ),
    );
  }
  fail = true;
  await assert.rejects(
    () => exports.getPublicRecord(),
    /temporarily unavailable/,
  );
});
test("three comparison routes use distinct source-backed content, and Outlier uncertainty is explicit", () => {
  assert.equal(new Set(comparisons.map((c) => c.slug)).size, 3);
  assert.ok(
    comparisons.every((c) => c.sources.length > 0 && c.features.length >= 4),
  );
  assert.ok(
    comparisons
      .find((c) => c.name === "Outlier")!
      .price.includes("not verified"),
  );
});
