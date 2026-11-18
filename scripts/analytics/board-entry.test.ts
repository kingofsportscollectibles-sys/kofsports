import test from "node:test";
import assert from "node:assert/strict";
import {
  parseBoardEntry,
  cleanBoardEntrySource,
  BOARD_ENTRY_TTL_MS,
  BOARD_ENTRY_PLACEMENTS,
} from "../../lib/navigation/board-entry";
import { cleanAnalyticsPage } from "../../lib/growth/events/free-account-policy";
const now = Date.parse("2026-11-06T20:00:00Z"),
  id = "00000000-0000-4000-8000-000000000001";
test("entry context retains only supported placement, canonical source, timestamp and valid flow ID", () => {
  const entry = parseBoardEntry(
    JSON.stringify({
      placement: "homepage_hero",
      sourcePage: "/?email=private@example.test#token",
      funnelId: id,
      at: now,
      player_name: "private",
      user_id: "forged",
    }),
    now,
  );
  assert.deepEqual(entry, {
    placement: "homepage_hero",
    sourcePage: "/",
    funnelId: id,
    at: now,
  });
  assert.ok(!JSON.stringify(entry).includes("private"));
});
test("expired/future/corrupt/unsupported context cannot label a board visit", () => {
  const valid = {
    placement: "mobile_menu",
    sourcePage: "/",
    funnelId: id,
    at: now,
  };
  for (const input of [
    null,
    "broken",
    JSON.stringify({ ...valid, at: now - BOARD_ENTRY_TTL_MS - 1 }),
    JSON.stringify({ ...valid, at: now + 1 }),
    JSON.stringify({ ...valid, funnelId: "private" }),
    JSON.stringify({ ...valid, placement: "email@example.test" }),
    JSON.stringify({ ...valid, sourcePage: "https://example.com/account" }),
  ])
    assert.equal(parseBoardEntry(input, now), null);
});
test("all discovery placements have unique stable names and NFL source paths strip queries", () => {
  assert.equal(
    new Set(BOARD_ENTRY_PLACEMENTS).size,
    BOARD_ENTRY_PLACEMENTS.length,
  );
  for (const path of [
    "/nfl-player-prop-trends",
    "/nfl-defense-vs-position",
    "/nfl-defense-vs-rb",
    "/nfl-anytime-touchdown-rankings",
    "/nfl-player-prop-records",
    "/nfl-betting-power-rankings",
    "/nfl-snap-counts",
    "/nfl-red-zone-targets",
  ])
    assert.equal(cleanBoardEntrySource(path + "?email=private"), path);
  assert.equal(cleanBoardEntrySource("/not-a-research-page"), undefined);
  assert.equal(
    cleanAnalyticsPage("/nfl-snap-counts"),
    undefined,
    "keep registration/save source behavior unchanged",
  );
});
