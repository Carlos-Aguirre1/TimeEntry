import { minutesToHoursText } from "../domain/duration.js";
import { formatDateFriendly, parseISODate, todayISO } from "../domain/dates.js";

/** "6.5 h" style text for totals. @param {number} minutes */
export function hoursText(minutes) {
  return `${minutesToHoursText(minutes)} h`;
}

/**
 * Relative description of a date, e.g. "Today", "Yesterday", "3 days ago", "Sep 12".
 * @param {string} iso
 * @param {string} [today]
 */
export function relativeDate(iso, today = todayISO()) {
  if (iso === today) return "Today";
  const a = parseISODate(iso), b = parseISODate(today);
  if (!a || !b) return iso;
  const days = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return `${days} days ago`;
  if (days < 0 && days > -7) return formatDateFriendly(iso, today);
  return a.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** @param {import("../domain/models.js").TimeEntryStatus} status */
export function statusLabel(status) {
  return { draft: "Draft", saved: "Saved", submitted: "Submitted" }[status] || status;
}
