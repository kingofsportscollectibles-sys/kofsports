import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file: string) {
  const calls: unknown[][] = [];
  const storage = new Map<string, string>();
  const exports: Record<string, (...args: unknown[]) => unknown> = {};
  const analytics = Object.fromEntries(
    ["init", "setIdentity", "trackEvent"].map((name) => [
      name,
      (...args: unknown[]) => {
        calls.push([name, ...args]);
      },
    ]),
  );
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require: (name: string) =>
        name === "@heycatch/sdk" ? { analytics } : {},
      localStorage: {
        getItem: (key: string) => storage.get(key),
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    },
  );
  return { calls, exports };
}
const user = {
  id: "user-id",
  created_at: "2026-11-14",
  identities: [{ id: "identity" }],
  email: "private@example.com",
};

test("unconfirmed signup waits; confirmed session reports once; ordinary login does not report signup", () => {
  const { calls, exports } = load("lib/analytics/heycatch-auth.ts");
  exports.rememberHeyCatchSignup(user, false);
  exports.identifyHeyCatchUser(user);
  assert.equal(calls.filter((c) => c[0] === "trackEvent").length, 0);
  exports.identifyHeyCatchUser({ ...user, email_confirmed_at: "2026-11-14" });
  exports.identifyHeyCatchUser({ ...user, email_confirmed_at: "2026-11-14" });
  assert.equal(calls.filter((c) => c[0] === "trackEvent").length, 1);
  assert.ok(!JSON.stringify(calls).includes(user.email));
});

test("immediate signup reports once and obfuscated existing account does not report", () => {
  const { calls, exports } = load("lib/analytics/heycatch-auth.ts");
  exports.rememberHeyCatchSignup({ ...user, identities: [] }, false);
  exports.identifyHeyCatchUser({ ...user, email_confirmed_at: "2026-11-14" });
  assert.equal(calls.filter((c) => c[0] === "trackEvent").length, 0);
  exports.rememberHeyCatchSignup(user, true);
  assert.equal(calls.filter((c) => c[0] === "trackEvent").length, 1);
});

test("server outcomes ignore unpaid checkouts and await paid outcomes tied to internal user", async () => {
  const { calls, exports } = load("lib/analytics/heycatch-server.ts");
  const event = {
    id: "evt",
    type: "checkout.session.completed",
    data: {
      object: {
        metadata: { profile_id: "user-id" },
        mode: "subscription",
        payment_status: "unpaid",
      },
    },
  };
  await exports.reportHeyCatchStripeOutcome(event);
  assert.equal(calls.filter((c) => c[0] === "trackEvent").length, 0);
  event.data.object.payment_status = "paid";
  await exports.reportHeyCatchStripeOutcome(event);
  assert.equal(calls.filter((c) => c[0] === "trackEvent").length, 1);
  assert.equal(calls.at(-1)?.[1], "subscription_started");
  assert.equal((calls.at(-1)?.[3] as { userId: string }).userId, "user-id");
});
