import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_BOARD_PREFERENCES as defaults,
  readBoardPreferences,
  validateBoardPreferences,
  parseBoardView,
  boardViewUrl,
  boardPreferencesKey,
  savedNflPlayerIds,
  filterMyBoardPlayers,
} from "../../lib/nfl/board-preferences";
test("corrupt, null, array and unknown-version preferences safely use defaults", () => {
  for (const raw of ["bad", "null", "[]", "{}", '{"version":2,"view":"saved"}'])
    assert.deepEqual(readBoardPreferences(raw), defaults);
});
test("supported fields persist and unsupported/private fields are discarded", () => {
  const result = validateBoardPreferences({
    ...defaults,
    position: "WR",
    market: "player_receptions",
    direction: "under",
    view: "saved",
    sort: "edge",
    order: "asc",
    game: "99",
    search: "private",
    modelVersion: "private",
  });
  assert.equal(result.position, "WR");
  assert.equal(result.view, "saved");
  assert.equal(result.sort, "edge");
  assert.ok(!JSON.stringify(result).includes("private"));
  assert.equal(Object.hasOwn(result, "game"), false);
});
test("invalid individual values cannot break supported filters or sorting", () => {
  const result = validateBoardPreferences({
    ...defaults,
    position: "CB",
    market: "passing_tds",
    direction: "win",
    sort: "private",
    order: "sideways",
    view: "pro",
  });
  assert.deepEqual(result, defaults);
});
test("preferences are scoped by account, and URL view never represents access rights", () => {
  assert.notEqual(
    boardPreferencesKey("accountA"),
    boardPreferencesKey("accountB"),
  );
  assert.equal(parseBoardView("saved"), "saved");
  assert.equal(parseBoardView("all"), "all");
  for (const value of ["admin", "pro", true, ["saved"], null])
    assert.equal(parseBoardView(value), undefined);
});
test("board URL preserves pending auth continuation while changing only the supported view", () => {
  const url = boardViewUrl("saved", "saveSport=nfl&savePlayer=00-123&view=all");
  const params = new URL(url, "https://example.test").searchParams;
  assert.equal(params.get("view"), "saved");
  assert.equal(params.get("savePlayer"), "00-123");
  assert.equal(params.getAll("view").length, 1);
});
test("My Players uses NFL GSIS identity and preserves all markets in original order", () => {
  const ids = savedNflPlayerIds(
    new Set(["nfl:00-123", "nba:00-456", "nhl:00-123"]),
  );
  const rows = [
    { playerId: "00-123", market: "yards" },
    { playerId: "00-456", market: "yards" },
    { playerId: "00-123", market: "receptions" },
  ];
  assert.deepEqual(filterMyBoardPlayers(rows, "saved", ids), [
    rows[0],
    rows[2],
  ]);
  assert.deepEqual(filterMyBoardPlayers(rows, "all", ids), rows);
  assert.equal(filterMyBoardPlayers(rows, "saved", new Set()).length, 0);
});
