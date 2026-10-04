/** @param {string} sel @param {ParentNode} [root] */
export function $(sel, root = document) {
  return /** @type {HTMLElement | null} */ (root.querySelector(sel));
}

/** @param {string} sel @param {ParentNode} [root] */
export function $$(sel, root = document) {
  return /** @type {HTMLElement[]} */ ([...root.querySelectorAll(sel)]);
}

/** @param {string} sel */
export function must(sel) {
  const el = $(sel);
  if (!el) throw new Error(`Missing element: ${sel}`);
  return el;
}

/**
 * Escapes text for safe insertion into innerHTML templates.
 * @param {unknown} value
 */
export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * @param {HTMLElement} el
 * @param {boolean} hidden
 */
export function setHidden(el, hidden) {
  el.classList.toggle("hidden", hidden);
}
