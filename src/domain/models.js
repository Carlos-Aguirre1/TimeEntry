// Core domain types for TimeEntry. Plain objects with JSDoc types so they can
// be serialised to any store and later mapped to Salesforce records.

/**
 * @typedef {"draft" | "saved" | "submitted"} TimeEntryStatus
 */

/** Ordered list of statuses. New statuses can be appended later. */
export const TIME_ENTRY_STATUSES = /** @type {const} */ (["draft", "saved", "submitted"]);

/**
 * @typedef {Object} Tam
 * @property {string} id
 * @property {string} name
 * @property {string} [email]
 */

/**
 * @typedef {Object} Portfolio
 * @property {string} id
 * @property {string} tamId
 * @property {string} name
 * @property {string[]} customerIds
 */

/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} name
 * @property {string} [accountId]   Optional external/account identifier (future Salesforce Account Id)
 * @property {string} [territory]   Optional territory / portfolio label
 * @property {boolean} active
 */

/**
 * @typedef {Object} TimeEntry
 * @property {string} id
 * @property {string} customerId
 * @property {string} tamId
 * @property {string} date            YYYY-MM-DD (local calendar date)
 * @property {number} durationMinutes Canonical duration. Never store hours.
 * @property {string} [notes]
 * @property {TimeEntryStatus} status
 * @property {string} createdAt       ISO timestamp
 * @property {string} updatedAt       ISO timestamp
 */

/**
 * Generates a unique id. Uses crypto.randomUUID when available.
 * @param {string} [prefix]
 */
export function newId(prefix = "te") {
  const c = globalThis.crypto;
  const rand = c && typeof c.randomUUID === "function"
    ? c.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
}

/**
 * Creates a new TimeEntry with timestamps and default status.
 * Does not validate; see validation.js.
 * @param {{customerId: string, tamId: string, date: string, durationMinutes: number, notes?: string, status?: TimeEntryStatus}} input
 * @param {{now?: Date, id?: string}} [opts]
 * @returns {TimeEntry}
 */
export function createTimeEntry(input, opts = {}) {
  const now = (opts.now ?? new Date()).toISOString();
  return {
    id: opts.id ?? newId("te"),
    customerId: input.customerId,
    tamId: input.tamId,
    date: input.date,
    durationMinutes: input.durationMinutes,
    notes: (input.notes ?? "").trim() || undefined,
    status: input.status ?? "saved",
    createdAt: now,
    updatedAt: now,
  };
}
