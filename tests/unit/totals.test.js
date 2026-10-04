import { test } from "node:test";
import assert from "node:assert/strict";
import { createTimeEntry } from "../../src/domain/models.js";
import { dailyTotalMinutes, weeklyTotalMinutes, weeklyBreakdown, totalsByCustomer, entriesByDate, latestEntryByCustomer } from "../../src/domain/totals.js";

/** @param {string} customerId @param {string} date @param {number} minutes */
const e = (customerId, date, minutes) => createTimeEntry({ customerId, tamId: "t", date, durationMinutes: minutes });

// Week of Mon 2026-10-05 .. Sun 2026-10-11
const entries = [
  e("A", "2026-10-05", 240), e("B", "2026-10-05", 150),           // Mon 6.5 h
  e("A", "2026-10-06", 420),                                      // Tue 7.0 h
  e("C", "2026-10-07", 330),                                      // Wed 5.5 h
  e("A", "2026-10-08", 480),                                      // Thu 8.0 h
  e("B", "2026-10-09", 360),                                      // Fri 6.0 h
  e("C", "2026-10-02", 60),                                       // previous week
];

test("daily totals sum minutes for one date only", () => {
  assert.equal(dailyTotalMinutes(entries, "2026-10-05"), 390);
  assert.equal(dailyTotalMinutes(entries, "2026-10-10"), 0);
});

test("weekly total excludes other weeks", () => {
  assert.equal(weeklyTotalMinutes(entries, "2026-10-07"), 33 * 60);
  assert.equal(weeklyTotalMinutes(entries, "2026-10-02"), 60);
});

test("weekly breakdown is Monday-first with seven days", () => {
  const bd = weeklyBreakdown(entries, "2026-10-07");
  assert.equal(bd.length, 7);
  assert.deepEqual(bd.map((d) => d.minutes), [390, 420, 330, 480, 360, 0, 0]);
  assert.equal(bd[0].date, "2026-10-05");
});

test("totals by customer", () => {
  const t = totalsByCustomer(entries);
  assert.equal(t.get("A"), 1140);
  assert.equal(t.get("B"), 510);
  assert.equal(t.get("C"), 390);
});

test("entries grouped by date newest first", () => {
  const groups = entriesByDate(entries);
  assert.equal(groups[0].date, "2026-10-09");
  assert.equal(groups.at(-1)?.date, "2026-10-02");
  assert.equal(groups.find((g) => g.date === "2026-10-05")?.entries.length, 2);
  assert.equal(groups.find((g) => g.date === "2026-10-05")?.minutes, 390);
});

test("latest entry per customer picks the newest date", () => {
  const latest = latestEntryByCustomer(entries);
  assert.equal(latest.get("A")?.date, "2026-10-08");
  assert.equal(latest.get("C")?.date, "2026-10-07");
});
