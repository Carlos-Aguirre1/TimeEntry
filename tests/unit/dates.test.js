import { test } from "node:test";
import assert from "node:assert/strict";
import { toISODate, parseISODate, isValidISODate, addDays, startOfWeek, weekDates, weekdayIndex, formatDateFriendly } from "../../src/domain/dates.js";

test("ISO date round-trips in local time", () => {
  const d = new Date(2026, 9, 4); // 4 Oct 2026, local
  assert.equal(toISODate(d), "2026-10-04");
  assert.equal(toISODate(/** @type {Date} */ (parseISODate("2026-10-04"))), "2026-10-04");
});

test("invalid dates are rejected", () => {
  assert.equal(isValidISODate("2026-02-30"), false);
  assert.equal(isValidISODate("2026-13-01"), false);
  assert.equal(isValidISODate("nope"), false);
  assert.equal(isValidISODate(undefined), false);
  assert.equal(isValidISODate("2026-02-28"), true);
});

test("weeks start on Monday", () => {
  // 2026-10-04 is a Sunday; 2026-10-05 is a Monday.
  assert.equal(startOfWeek("2026-10-04"), "2026-09-28");
  assert.equal(startOfWeek("2026-10-05"), "2026-10-05");
  assert.equal(startOfWeek("2026-10-07"), "2026-10-05");
  assert.deepEqual(weekDates("2026-10-07"), ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]);
  assert.equal(weekdayIndex("2026-10-05"), 0);
  assert.equal(weekdayIndex("2026-10-11"), 6);
});

test("addDays crosses month boundaries", () => {
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(addDays("2026-10-01", -1), "2026-09-30");
});

test("friendly date names today and yesterday", () => {
  assert.equal(formatDateFriendly("2026-10-04", "2026-10-04"), "Today");
  assert.equal(formatDateFriendly("2026-10-03", "2026-10-04"), "Yesterday");
  assert.notEqual(formatDateFriendly("2026-10-01", "2026-10-04"), "Today");
});
