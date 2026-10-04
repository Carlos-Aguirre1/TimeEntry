import { createTimeEntry } from "../domain/models.js";
import { assertValidTimeEntry } from "../domain/validation.js";
import { todayISO, addDays } from "../domain/dates.js";
import {
  dailyTotalMinutes,
  weeklyTotalMinutes,
  weeklyBreakdown,
  totalsByCustomer,
  entriesInWeek,
  latestEntryByCustomer,
} from "../domain/totals.js";

/** @typedef {import("../domain/models.js").TimeEntry} TimeEntry */
/** @typedef {import("../domain/models.js").Customer} Customer */
/** @typedef {import("../data/timeEntryRepository.js").TimeEntryRepository} TimeEntryRepository */
/** @typedef {import("../data/customerRepository.js").CustomerRepository} CustomerRepository */
/** @typedef {import("../data/portfolioRepository.js").PortfolioRepository} PortfolioRepository */
/** @typedef {import("../data/timeEntryDestination.js").TimeEntryDestination} TimeEntryDestination */
/** @typedef {import("./session.js").Session} Session */

/**
 * @typedef {Object} NewEntryInput
 * @property {string} customerId
 * @property {string} date YYYY-MM-DD
 * @property {number} durationMinutes
 * @property {string} [notes]
 */

/**
 * @typedef {Object} CustomerSummary
 * @property {Customer} customer
 * @property {number} weekMinutes
 * @property {number} todayMinutes
 * @property {TimeEntry | null} lastEntry
 */

/**
 * @typedef {Object} DashboardSummary
 * @property {string} today
 * @property {number} todayMinutes
 * @property {number} weekMinutes
 * @property {number} weekEntryCount
 * @property {{date: string, minutes: number}[]} weekBreakdown
 * @property {number} weeklyTargetMinutes
 * @property {CustomerSummary[]} recentCustomers   customers with an entry in the last 7 days, most recent first
 * @property {Customer[]} quietCustomers            active portfolio customers with no entry in the last 14 days
 * @property {number} draftCount
 * @property {number} savedCount
 * @property {number} submittedCount
 */

/** Default weekly target used for the dashboard progress indicator (40 h). */
export const DEFAULT_WEEKLY_TARGET_MINUTES = 40 * 60;

/**
 * Application service: the one place the UI goes to read and write time.
 * Coordinates repositories, validation and the submission destination.
 */
export class TimeEntryService {
  /**
   * @param {{
   *   session: Session,
   *   customers: CustomerRepository,
   *   portfolios: PortfolioRepository,
   *   entries: TimeEntryRepository,
   *   destination?: TimeEntryDestination,
   *   now?: () => Date,
   *   weeklyTargetMinutes?: number,
   * }} deps
   */
  constructor(deps) {
    this.session = deps.session;
    this.customers = deps.customers;
    this.portfolios = deps.portfolios;
    this.entries = deps.entries;
    this.destination = deps.destination;
    this.now = deps.now ?? (() => new Date());
    this.weeklyTargetMinutes = deps.weeklyTargetMinutes ?? DEFAULT_WEEKLY_TARGET_MINUTES;
    /** @type {Set<() => void>} */
    this.listeners = new Set();
  }

  /** Subscribe to data changes. Returns an unsubscribe function. */
  /** @param {() => void} fn */
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _emit() {
    for (const fn of this.listeners) fn();
  }

  /** Today's ISO date according to the injected clock. */
  today() {
    return todayISO(this.now());
  }

  // ---- Portfolio & customers -------------------------------------------

  /** Active customers across the current TAM's portfolios, alphabetical. */
  async listPortfolioCustomers() {
    const pfs = await this.portfolios.listForTam(this.session.tamId);
    const ids = [...new Set(pfs.flatMap((p) => p.customerIds))];
    const list = await this.customers.listByIds(ids);
    return list.filter((c) => c.active).sort((a, b) => a.name.localeCompare(b.name));
  }

  /** @param {string} id */
  async getCustomer(id) {
    return this.customers.getById(id);
  }

  /** Portfolio names for the current TAM (for headings). */
  async listPortfolios() {
    return this.portfolios.listForTam(this.session.tamId);
  }

  // ---- Entries -----------------------------------------------------------

  /** All entries for the current TAM, newest first. */
  async listEntries() {
    const list = await this.entries.listForTam(this.session.tamId);
    return list.sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1));
  }

  /** @param {string} customerId */
  async listEntriesForCustomer(customerId) {
    return (await this.listEntries()).filter((e) => e.customerId === customerId);
  }

  /** @param {string} id */
  async getEntry(id) {
    return this.entries.getById(id);
  }

  /**
   * Records one time entry. Validates, persists, notifies listeners.
   * @param {NewEntryInput} input
   * @returns {Promise<TimeEntry>}
   */
  async recordTime(input) {
    const customer = await this.customers.getById(input.customerId);
    if (!customer) throw new Error("Unknown customer.");
    const entry = createTimeEntry(
      { ...input, tamId: this.session.tamId, status: "saved" },
      { now: this.now() },
    );
    assertValidTimeEntry(entry);
    const saved = await this.entries.save(entry);
    this._emit();
    return saved;
  }

  /**
   * Bulk workflow: the same duration/date/notes applied to several customers,
   * producing one independent entry per customer.
   * @param {{customerIds: string[], date: string, durationMinutes: number, notes?: string}} input
   * @returns {Promise<TimeEntry[]>}
   */
  async recordTimeForCustomers(input) {
    const ids = [...new Set(input.customerIds)];
    if (!ids.length) throw new Error("Select at least one customer.");
    const now = this.now();
    /** @type {TimeEntry[]} */
    const created = [];
    for (const customerId of ids) {
      const customer = await this.customers.getById(customerId);
      if (!customer) throw new Error("Unknown customer.");
      const entry = createTimeEntry(
        { customerId, tamId: this.session.tamId, date: input.date, durationMinutes: input.durationMinutes, notes: input.notes, status: "saved" },
        { now },
      );
      assertValidTimeEntry(entry);
      created.push(entry);
    }
    const saved = await this.entries.saveMany(created);
    this._emit();
    return saved;
  }

  /**
   * Updates an existing entry's editable fields.
   * @param {string} id
   * @param {Partial<Pick<TimeEntry, "date" | "durationMinutes" | "notes" | "status">>} patch
   */
  async updateEntry(id, patch) {
    const existing = await this.entries.getById(id);
    if (!existing || existing.tamId !== this.session.tamId) throw new Error("Entry not found.");
    /** @type {TimeEntry} */
    const next = { ...existing, ...patch, updatedAt: this.now().toISOString() };
    if (typeof next.notes === "string") next.notes = next.notes.trim() || undefined;
    assertValidTimeEntry(next);
    const saved = await this.entries.save(next);
    this._emit();
    return saved;
  }

  /** @param {string} id */
  async deleteEntry(id) {
    const existing = await this.entries.getById(id);
    if (!existing || existing.tamId !== this.session.tamId) return false;
    const ok = await this.entries.remove(id);
    if (ok) this._emit();
    return ok;
  }

  /**
   * Sends entries to the configured destination and marks them submitted when accepted.
   * Not exposed in the TE0 UI; present so the boundary exists.
   * @param {string[]} ids
   */
  async submitEntries(ids) {
    if (!this.destination) throw new Error("No submission destination configured.");
    const all = await this.listEntries();
    const chosen = all.filter((e) => ids.includes(e.id) && e.status !== "submitted");
    const results = await this.destination.submit(chosen);
    const accepted = new Set(results.filter((r) => r.ok).map((r) => r.entryId));
    const updated = chosen.filter((e) => accepted.has(e.id)).map((e) => ({ ...e, status: /** @type {const} */ ("submitted"), updatedAt: this.now().toISOString() }));
    if (updated.length) await this.entries.saveMany(updated);
    this._emit();
    return results;
  }

  // ---- Summaries -----------------------------------------------------------

  /**
   * Per-customer status used by the portfolio cards.
   * @returns {Promise<CustomerSummary[]>}
   */
  async customerSummaries() {
    const [customers, entries] = await Promise.all([this.listPortfolioCustomers(), this.listEntries()]);
    const today = this.today();
    const week = entriesInWeek(entries, today);
    const weekTotals = totalsByCustomer(week);
    const todayTotals = totalsByCustomer(entries.filter((e) => e.date === today));
    const latest = latestEntryByCustomer(entries);
    return customers.map((customer) => ({
      customer,
      weekMinutes: weekTotals.get(customer.id) || 0,
      todayMinutes: todayTotals.get(customer.id) || 0,
      lastEntry: latest.get(customer.id) || null,
    }));
  }

  /**
   * Everything the dashboard needs in one call.
   * @returns {Promise<DashboardSummary>}
   */
  async dashboardSummary() {
    const [entries, summaries] = await Promise.all([this.listEntries(), this.customerSummaries()]);
    const today = this.today();
    const week = entriesInWeek(entries, today);
    const cutoffRecent = addDays(today, -7);
    const cutoffQuiet = addDays(today, -14);
    const recentCustomers = summaries
      .filter((s) => s.lastEntry && s.lastEntry.date >= cutoffRecent)
      .sort((a, b) => {
        const ad = /** @type {TimeEntry} */ (a.lastEntry), bd = /** @type {TimeEntry} */ (b.lastEntry);
        return ad.date === bd.date ? (ad.createdAt < bd.createdAt ? 1 : -1) : ad.date < bd.date ? 1 : -1;
      });
    const quietCustomers = summaries.filter((s) => !s.lastEntry || s.lastEntry.date < cutoffQuiet).map((s) => s.customer);
    return {
      today,
      todayMinutes: dailyTotalMinutes(entries, today),
      weekMinutes: weeklyTotalMinutes(entries, today),
      weekEntryCount: week.length,
      weekBreakdown: weeklyBreakdown(entries, today),
      weeklyTargetMinutes: this.weeklyTargetMinutes,
      recentCustomers,
      quietCustomers,
      draftCount: entries.filter((e) => e.status === "draft").length,
      savedCount: entries.filter((e) => e.status === "saved").length,
      submittedCount: entries.filter((e) => e.status === "submitted").length,
    };
  }
}

