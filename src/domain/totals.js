// Pure calculations over time entries. Everything is derived from durationMinutes.
import { weekDates, startOfWeek } from "./dates.js";

/** @typedef {import("./models.js").TimeEntry} TimeEntry */

/**
 * @param {TimeEntry[]} entries
 */
export function sumMinutes(entries) {
  return entries.reduce((n, e) => n + (e.durationMinutes || 0), 0);
}

/**
 * Total minutes recorded on a single date.
 * @param {TimeEntry[]} entries
 * @param {string} iso
 */
export function dailyTotalMinutes(entries, iso) {
  return sumMinutes(entries.filter((e) => e.date === iso));
}

/**
 * Entries whose date falls in the Mon..Sun week containing `iso`.
 * @param {TimeEntry[]} entries
 * @param {string} iso
 */
export function entriesInWeek(entries, iso) {
  const monday = startOfWeek(iso);
  return entries.filter((e) => startOfWeek(e.date) === monday);
}

/**
 * Minutes per day for the week containing `iso`, Monday first.
 * @param {TimeEntry[]} entries
 * @param {string} iso
 * @returns {{date: string, minutes: number}[]}
 */
export function weeklyBreakdown(entries, iso) {
  return weekDates(iso).map((date) => ({ date, minutes: dailyTotalMinutes(entries, date) }));
}

/**
 * Total minutes for the week containing `iso`.
 * @param {TimeEntry[]} entries
 * @param {string} iso
 */
export function weeklyTotalMinutes(entries, iso) {
  return sumMinutes(entriesInWeek(entries, iso));
}

/**
 * Minutes grouped by customerId.
 * @param {TimeEntry[]} entries
 * @returns {Map<string, number>}
 */
export function totalsByCustomer(entries) {
  /** @type {Map<string, number>} */
  const map = new Map();
  for (const e of entries) map.set(e.customerId, (map.get(e.customerId) || 0) + (e.durationMinutes || 0));
  return map;
}

/**
 * Entries grouped by date, newest date first; entries inside a date newest first.
 * @param {TimeEntry[]} entries
 * @returns {{date: string, entries: TimeEntry[], minutes: number}[]}
 */
export function entriesByDate(entries) {
  /** @type {Map<string, TimeEntry[]>} */
  const map = new Map();
  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, []);
    /** @type {TimeEntry[]} */ (map.get(e.date)).push(e);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([date, list]) => ({
      date,
      entries: list.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      minutes: sumMinutes(list),
    }));
}

/**
 * The most recent entry per customer, keyed by customerId.
 * @param {TimeEntry[]} entries
 * @returns {Map<string, TimeEntry>}
 */
export function latestEntryByCustomer(entries) {
  /** @type {Map<string, TimeEntry>} */
  const map = new Map();
  for (const e of entries) {
    const cur = map.get(e.customerId);
    if (!cur || e.date > cur.date || (e.date === cur.date && e.createdAt > cur.createdAt)) map.set(e.customerId, e);
  }
  return map;
}
