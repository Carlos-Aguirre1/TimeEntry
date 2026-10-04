import { isValidDurationMinutes } from "./duration.js";
import { isValidISODate } from "./dates.js";
import { TIME_ENTRY_STATUSES } from "./models.js";

/**
 * @typedef {{field: string, message: string}} ValidationError
 */

/**
 * Validates a time entry (or a candidate input). Returns an empty array when valid.
 * @param {Partial<import("./models.js").TimeEntry>} entry
 * @returns {ValidationError[]}
 */
export function validateTimeEntry(entry) {
  /** @type {ValidationError[]} */
  const errors = [];
  if (!entry || typeof entry !== "object") return [{ field: "entry", message: "Entry is required." }];
  if (!entry.customerId) errors.push({ field: "customerId", message: "Choose a customer." });
  if (!entry.tamId) errors.push({ field: "tamId", message: "No TAM is signed in." });
  if (!isValidISODate(entry.date)) errors.push({ field: "date", message: "Choose a valid date." });
  if (!isValidDurationMinutes(entry.durationMinutes)) {
    errors.push({ field: "durationMinutes", message: "Choose how much time to record." });
  }
  if (entry.notes !== undefined && typeof entry.notes !== "string") {
    errors.push({ field: "notes", message: "Notes must be text." });
  }
  if (entry.status !== undefined && !TIME_ENTRY_STATUSES.includes(/** @type {any} */ (entry.status))) {
    errors.push({ field: "status", message: `Unknown status: ${entry.status}` });
  }
  return errors;
}

/**
 * Throws when the entry is invalid.
 * @param {Partial<import("./models.js").TimeEntry>} entry
 */
export function assertValidTimeEntry(entry) {
  const errors = validateTimeEntry(entry);
  if (errors.length) {
    const err = new Error(errors.map((e) => e.message).join(" "));
    // @ts-ignore attach details for callers that want them
    err.validationErrors = errors;
    throw err;
  }
}
