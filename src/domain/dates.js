// Date helpers. Dates are stored as ISO calendar strings (YYYY-MM-DD) in local time.
// Weeks start on Monday.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** @param {number} n */
const pad = (n) => String(n).padStart(2, "0");

/**
 * Formats a Date as a local YYYY-MM-DD string.
 * @param {Date} d
 */
export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Parses YYYY-MM-DD into a local Date at midnight. Returns null when invalid.
 * @param {string} iso
 */
export function parseISODate(iso) {
  if (typeof iso !== "string" || !ISO_DATE.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

/** @param {unknown} iso */
export function isValidISODate(iso) {
  return typeof iso === "string" && parseISODate(iso) !== null;
}

/**
 * Today's date as YYYY-MM-DD. `now` is injectable for tests.
 * @param {Date} [now]
 */
export function todayISO(now = new Date()) {
  return toISODate(now);
}

/**
 * Adds whole days to an ISO date.
 * @param {string} iso
 * @param {number} days
 */
export function addDays(iso, days) {
  const d = parseISODate(iso);
  if (!d) throw new Error(`Invalid date: ${iso}`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/**
 * Monday of the week containing the given date.
 * @param {string} iso
 */
export function startOfWeek(iso) {
  const d = parseISODate(iso);
  if (!d) throw new Error(`Invalid date: ${iso}`);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return toISODate(d);
}

/**
 * The seven ISO dates (Mon..Sun) of the week containing the given date.
 * @param {string} iso
 */
export function weekDates(iso) {
  const monday = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Monday-based weekday index (0 = Monday .. 6 = Sunday).
 * @param {string} iso
 */
export function weekdayIndex(iso) {
  const d = parseISODate(iso);
  if (!d) throw new Error(`Invalid date: ${iso}`);
  return (d.getDay() + 6) % 7;
}

/**
 * Friendly date text, e.g. "Mon, Oct 5" or "Today" / "Yesterday" relative to `today`.
 * @param {string} iso
 * @param {string} [today]
 */
export function formatDateFriendly(iso, today = todayISO()) {
  if (iso === today) return "Today";
  if (iso === addDays(today, -1)) return "Yesterday";
  const d = parseISODate(iso);
  if (!d) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Short range text for a week, e.g. "Oct 5 – Oct 11".
 * @param {string} iso any date inside the week
 */
export function formatWeekRange(iso) {
  const [mon, , , , , , sun] = weekDates(iso);
  const fmt = (/** @type {string} */ x) =>
    /** @type {Date} */ (parseISODate(x)).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(mon)} – ${fmt(sun)}`;
}
