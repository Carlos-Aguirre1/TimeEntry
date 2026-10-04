import { readJSON, writeJSON } from "./storage.js";

/** @typedef {import("../domain/models.js").TimeEntry} TimeEntry */
/** @typedef {import("./storage.js").KeyValueStorage} KeyValueStorage */

/**
 * TimeEntryRepository boundary. A server/API implementation can replace the
 * local one without touching the UI or domain layers.
 * @typedef {Object} TimeEntryRepository
 * @property {(tamId: string) => Promise<TimeEntry[]>} listForTam
 * @property {(id: string) => Promise<TimeEntry | null>} getById
 * @property {(entry: TimeEntry) => Promise<TimeEntry>} save      Insert or replace by id.
 * @property {(entries: TimeEntry[]) => Promise<TimeEntry[]>} saveMany
 * @property {(id: string) => Promise<boolean>} remove
 * @property {() => Promise<void>} clear
 */

export const TIME_ENTRY_STORAGE_KEY = "timeentry.entries.v1";

/**
 * @typedef {{version: 1, entries: TimeEntry[]}} StoredEnvelope
 */

/**
 * Time entry repository persisted through a KeyValueStorage (localStorage in
 * the browser, MemoryStorage in tests). Every write rewrites the full list,
 * which is fine for a single-user prototype.
 * @implements {TimeEntryRepository}
 */
export class LocalTimeEntryRepository {
  /**
   * @param {KeyValueStorage} storage
   * @param {string} [key]
   */
  constructor(storage, key = TIME_ENTRY_STORAGE_KEY) {
    this.storage = storage;
    this.key = key;
  }

  /** @returns {TimeEntry[]} */
  _readAll() {
    const env = readJSON(this.storage, this.key, /** @type {StoredEnvelope | null} */ (null));
    if (!env || !Array.isArray(env.entries)) return [];
    return env.entries.filter((e) => e && typeof e.id === "string");
  }

  /** @param {TimeEntry[]} entries */
  _writeAll(entries) {
    /** @type {StoredEnvelope} */
    const env = { version: 1, entries };
    writeJSON(this.storage, this.key, env);
  }

  /** @param {string} tamId */
  async listForTam(tamId) {
    return this._readAll().filter((e) => e.tamId === tamId).map((e) => ({ ...e }));
  }

  /** @param {string} id */
  async getById(id) {
    const e = this._readAll().find((x) => x.id === id);
    return e ? { ...e } : null;
  }

  /** @param {TimeEntry} entry */
  async save(entry) {
    const all = this._readAll();
    const i = all.findIndex((x) => x.id === entry.id);
    if (i >= 0) all[i] = { ...entry };
    else all.push({ ...entry });
    this._writeAll(all);
    return { ...entry };
  }

  /** @param {TimeEntry[]} entries */
  async saveMany(entries) {
    const all = this._readAll();
    for (const entry of entries) {
      const i = all.findIndex((x) => x.id === entry.id);
      if (i >= 0) all[i] = { ...entry };
      else all.push({ ...entry });
    }
    this._writeAll(all);
    return entries.map((e) => ({ ...e }));
  }

  /** @param {string} id */
  async remove(id) {
    const all = this._readAll();
    const next = all.filter((x) => x.id !== id);
    if (next.length === all.length) return false;
    this._writeAll(next);
    return true;
  }

  async clear() {
    this.storage.removeItem(this.key);
  }
}
