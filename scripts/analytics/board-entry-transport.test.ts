import test from "node:test";
import assert from "node:assert/strict";
import { rememberBoardEntry } from "../../lib/growth/events/board-entry";
import { trackBettingBoardEvent } from "../../lib/growth/events/betting-board";
import { signupAttribution } from "../../lib/growth/events/free-account";
function storage(blocked = false) {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      if (blocked) throw Error("blocked");
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (blocked) throw Error("blocked");
      values.set(key, value);
    },
  };
}
async function environment(
  blocked: boolean,
  run: (
    events: Record<string, unknown>[],
    session: ReturnType<typeof storage>,
  ) => Promise<void>,
) {
  const names = [
    "window",
    "document",
    "sessionStorage",
    "localStorage",
    "fetch",
  ] as const;
  const before = new Map(
    names.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  const session = storage(blocked),
    local = storage(blocked),
    events: Record<string, unknown>[] = [];
  try {
    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          origin: "https://kofsports.test",
          pathname: "/betting-board",
        },
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, "document", {
      value: { referrer: "https://kofsports.test/pro?email=secret" },
      configurable: true,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      value: session,
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: local,
      configurable: true,
    });
    globalThis.fetch = async (_url, init) => {
      events.push(JSON.parse(String(init?.body)));
      return new Response('{"success":true}', {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    await run(events, session);
  } finally {
    for (const [key, descriptor] of before) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
test("entry context tags later board events and links signup without overwriting campaign attribution", async () => {
  await environment(false, async (events, session) => {
    session.setItem("kof_acquisition_source_v1", "newsletter");
    const entry = rememberBoardEntry(
      "desktop_header",
      "/nfl-snap-counts?email=private",
    );
    assert.ok(entry);
    trackBettingBoardEvent("betting_board_navigation_click", {
      placement: "desktop_header",
      source_page: "/nfl-snap-counts?email=private",
    });
    await flush();
    trackBettingBoardEvent("betting_board_view");
    await flush();
    const click = events[0] as {
        anonymousId: string;
        metadata: Record<string, string>;
      },
      view = events[1] as { metadata: Record<string, string> };
    assert.equal(click.metadata.source_page, "/nfl-snap-counts");
    assert.equal(view.metadata.entry_placement, "desktop_header");
    assert.equal(view.metadata.funnel_id, entry.funnelId);
    const signup = signupAttribution("/betting-board");
    assert.equal(signup.conversion_funnel_id, entry.funnelId);
    assert.equal(signup.conversion_anonymous_id, click.anonymousId);
    assert.equal(signup.conversion_acquisition_source, "newsletter");
    assert.ok(!JSON.stringify(events).includes("email="));
  });
});
test("blocked browser storage does not suppress click events or fabricate stable identifiers", async () => {
  await environment(true, async (events) => {
    rememberBoardEntry("mobile_menu", "/");
    trackBettingBoardEvent("betting_board_navigation_click", {
      placement: "mobile_menu",
      source_page: "/",
    });
    await flush();
    assert.equal(events.length, 1);
    assert.equal(events[0].anonymousId, undefined);
    assert.equal(events[0].sessionId, undefined);
    assert.equal(
      (events[0].metadata as Record<string, string>).placement,
      "mobile_menu",
    );
  });
});
