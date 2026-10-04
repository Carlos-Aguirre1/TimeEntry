import { must } from "./dom.js";

let timer = 0;

/**
 * Shows a brief confirmation message at the bottom of the screen.
 * @param {string} text
 * @param {{kind?: "success" | "info" | "error", duration?: number}} [opts]
 */
export function toast(text, opts = {}) {
  const el = must("#toast");
  el.textContent = text;
  el.dataset.kind = opts.kind || "success";
  el.classList.add("show");
  clearTimeout(timer);
  timer = window.setTimeout(() => el.classList.remove("show"), opts.duration ?? 2600);
}
