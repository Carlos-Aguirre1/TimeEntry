// Minimal key/value storage boundary so repositories work in the browser
// (localStorage) and in Node tests (memory) with identical behaviour.

/**
 * @typedef {Object} KeyValueStorage
 * @property {(key: string) => string | null} getItem
 * @property {(key: string, value: string) => void} setItem
 * @property {(key: string) => void} removeItem
 */

/** In-memory storage for tests and for browsers where localStorage is unavailable. */
export class MemoryStorage {
  constructor() {
    /** @type {Map<string, string>} */
    this.map = new Map();
  }
  /** @param {string} key */
  getItem(key) {
    return this.map.has(key) ? /** @type {string} */ (this.map.get(key)) : null;
  }
  /** @param {string} key @param {string} value */
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  /** @param {string} key */
  removeItem(key) {
    this.map.delete(key);
  }
}

/**
 * Returns window.localStorage when it is usable, otherwise a MemoryStorage.
 * Private browsing modes can throw on access, so probe it.
 * @returns {KeyValueStorage}
 */
export function browserStorage() {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return new MemoryStorage();
    const probe = "__timeentry_probe__";
    ls.setItem(probe, "1");
    ls.removeItem(probe);
    return ls;
  } catch {
    return new MemoryStorage();
  }
}

/**
 * Reads JSON from storage, returning `fallback` on missing or corrupt data.
 * @template T
 * @param {KeyValueStorage} storage
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
export function readJSON(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    if (raw == null) return fallback;
    return /** @type {T} */ (JSON.parse(raw));
  } catch {
    return fallback;
  }
}

/**
 * @param {KeyValueStorage} storage
 * @param {string} key
 * @param {unknown} value
 */
export function writeJSON(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}
