// Duration is always stored as whole minutes. Hours are a display concern only.

/** Increment used by the quick-pick controls, in minutes. */
export const DURATION_STEP_MINUTES = 30;

/** Largest quick-pick value offered in TE0, in minutes (4 hours). */
export const DURATION_MAX_QUICK_MINUTES = 240;

/** Hard upper bound for a single entry, in minutes (24 hours). */
export const DURATION_MAX_MINUTES = 24 * 60;

/**
 * Builds the list of quick-pick durations in minutes.
 * Defaults produce 30, 60, 90 ... 240. Callers can widen the range later
 * without touching the UI.
 * @param {{step?: number, max?: number}} [opts]
 * @returns {number[]}
 */
export function buildDurationOptions(opts = {}) {
  const step = opts.step ?? DURATION_STEP_MINUTES;
  const max = opts.max ?? DURATION_MAX_QUICK_MINUTES;
  const out = [];
  for (let m = step; m <= max; m += step) out.push(m);
  return out;
}

/** Default quick-pick options for TE0. */
export const DURATION_OPTIONS = buildDurationOptions();

/**
 * True when the value is a usable duration for a single entry.
 * @param {unknown} minutes
 */
export function isValidDurationMinutes(minutes) {
  return (
    typeof minutes === "number" &&
    Number.isInteger(minutes) &&
    minutes > 0 &&
    minutes <= DURATION_MAX_MINUTES
  );
}

/**
 * Formats minutes as decimal hours, e.g. 90 -> "1.5", 60 -> "1.0", 0 -> "0.0".
 * Always one decimal place so columns line up.
 * @param {number} minutes
 * @param {{decimals?: number}} [opts]
 */
export function minutesToHoursText(minutes, opts = {}) {
  const decimals = opts.decimals ?? 1;
  const hours = (minutes || 0) / 60;
  return hours.toFixed(decimals);
}

/**
 * Formats minutes as a compact label, e.g. 90 -> "1.5 h", 120 -> "2 h", 30 -> "0.5 h".
 * @param {number} minutes
 */
export function formatDurationLabel(minutes) {
  const hours = minutes / 60;
  const text = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${text} h`;
}

/**
 * Longer human label for chips and confirmations, e.g. 90 -> "1.5 hours", 60 -> "1 hour".
 * @param {number} minutes
 */
export function formatDurationWords(minutes) {
  const hours = minutes / 60;
  const text = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${text} ${hours === 1 ? "hour" : "hours"}`;
}
