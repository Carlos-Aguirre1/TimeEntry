// Hash-based screen router. Each route maps to one <section> in index.html,
// mirroring the "one section visible at a time" model of the reference app
// while giving refresh-safe URLs and browser back support.
import { $$ } from "./dom.js";

/**
 * @typedef {Object} RouteMatch
 * @property {string} name
 * @property {Record<string, string>} params
 */

/**
 * @typedef {Object} ScreenDef
 * @property {string} name          route name
 * @property {RegExp} pattern       matches the hash path, capture groups become params
 * @property {string[]} [paramNames]
 * @property {string} sectionId     id of the <section> to show
 * @property {(params: Record<string,string>) => void | Promise<void>} render
 * @property {string} [nav]         id of the header nav button to mark active
 */

export class Router {
  /** @param {ScreenDef[]} screens */
  constructor(screens) {
    this.screens = screens;
    /** @type {RouteMatch | null} */
    this.current = null;
    this._onHash = () => { void this.handle(); };
  }

  start() {
    window.addEventListener("hashchange", this._onHash);
    return this.handle();
  }

  stop() {
    window.removeEventListener("hashchange", this._onHash);
  }

  /** @param {string} path e.g. "/customer/cust_001" */
  go(path) {
    const target = `#${path}`;
    if (location.hash === target) return this.handle();
    location.hash = target;
    return Promise.resolve();
  }

  /** @param {string} hash */
  match(hash) {
    const path = (hash || "#/").replace(/^#/, "") || "/";
    for (const s of this.screens) {
      const m = s.pattern.exec(path);
      if (m) {
        /** @type {Record<string,string>} */
        const params = {};
        (s.paramNames || []).forEach((n, i) => { params[n] = decodeURIComponent(m[i + 1] || ""); });
        return { screen: s, params };
      }
    }
    return null;
  }

  async handle() {
    let found = this.match(location.hash);
    if (!found) {
      location.replace("#/");
      found = this.match("#/");
      if (!found) return;
    }
    const { screen, params } = found;
    this.current = { name: screen.name, params };
    for (const sec of $$("main > section[data-screen]")) sec.classList.toggle("hidden", sec.id !== screen.sectionId);
    for (const btn of $$("[data-nav]")) btn.classList.toggle("active", btn.dataset.nav === screen.nav);
    document.body.dataset.screen = screen.name;
    await screen.render(params);
    window.scrollTo({ top: 0 });
  }

  /** Re-render the current screen (after data changes). */
  refresh() {
    if (!this.current) return Promise.resolve();
    const s = this.screens.find((x) => x.name === this.current?.name);
    return s ? Promise.resolve(s.render(this.current.params)) : Promise.resolve();
  }
}
