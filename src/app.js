// Composition root: wires data, application and UI layers together.
import { DEMO_TAM, DEMO_CUSTOMERS, DEMO_PORTFOLIOS } from "./data/seed.js";
import { browserStorage } from "./data/storage.js";
import { SeededCustomerRepository } from "./data/customerRepository.js";
import { SeededPortfolioRepository } from "./data/portfolioRepository.js";
import { LocalTimeEntryRepository } from "./data/timeEntryRepository.js";
import { LocalOnlyDestination } from "./data/timeEntryDestination.js";
import { Session } from "./app/session.js";
import { TimeEntryService } from "./app/timeEntryService.js";
import { Router } from "./ui/router.js";
import { createDashboardScreen } from "./ui/dashboard.js";
import { createPortfolioScreen } from "./ui/portfolio.js";
import { createCustomerScreen } from "./ui/customer.js";
import { createBulkScreen } from "./ui/bulk.js";
import { createHistoryScreen } from "./ui/history.js";
import { createEntryDetailScreen } from "./ui/entryDetail.js";
import { $$ } from "./ui/dom.js";

/**
 * Builds the service graph. Exported so tests can construct the app with
 * their own storage or clock.
 * @param {{storage?: import("./data/storage.js").KeyValueStorage, now?: () => Date}} [opts]
 */
export function createApp(opts = {}) {
  const session = new Session(DEMO_TAM);
  const service = new TimeEntryService({
    session,
    customers: new SeededCustomerRepository(DEMO_CUSTOMERS),
    portfolios: new SeededPortfolioRepository(DEMO_PORTFOLIOS),
    entries: new LocalTimeEntryRepository(opts.storage ?? browserStorage()),
    destination: new LocalOnlyDestination(),
    now: opts.now,
  });
  return { session, service };
}

export function startUI() {
  const { service } = createApp();
  const shared = { selection: /** @type {Set<string>} */ (new Set()) };

  /** @type {Router} */
  let router;
  // Screens need the router and the router needs the screens; resolve lazily.
  const lazy = /** @type {Router} */ (new Proxy({}, { get: (_, k) => (/** @type {any} */ (router))[k] }));
  const screens = {
    dashboard: createDashboardScreen(service, lazy),
    portfolio: createPortfolioScreen(service, lazy, shared),
    history: createHistoryScreen(service, lazy),
    entry: createEntryDetailScreen(service, lazy),
    customer: createCustomerScreen(service, lazy),
  };
  const bulk = createBulkScreen(service, lazy, shared, screens.portfolio);

  router = new Router([
    { name: "dashboard", pattern: /^\/?$/, sectionId: "dashboardScreen", nav: "home", render: screens.dashboard.render },
    { name: "portfolio", pattern: /^\/portfolio\/?$/, sectionId: "portfolioScreen", nav: "portfolio", render: screens.portfolio.render },
    { name: "customer", pattern: /^\/customer\/([^/]+)\/?$/, paramNames: ["id"], sectionId: "customerScreen", nav: "portfolio", render: screens.customer.render },
    { name: "bulk", pattern: /^\/bulk\/?$/, sectionId: "bulkScreen", nav: "portfolio", render: bulk.render },
    { name: "history", pattern: /^\/history\/?$/, sectionId: "historyScreen", nav: "history", render: screens.history.render },
    { name: "entry", pattern: /^\/entry\/([^/]+)\/?$/, paramNames: ["id"], sectionId: "entryScreen", nav: "history", render: screens.entry.render },
  ]);

  $$("[data-nav]").forEach((b) => (b.onclick = () => router.go(/** @type {string} */ (b.dataset.path))));
  service.onChange(() => { /* screens re-render themselves after writes */ });
  router.start();
  // @ts-ignore expose for debugging / e2e inspection only
  window.__timeentry = { service, router };
  return { service, router };
}

if (typeof document !== "undefined" && document.getElementById("app-shell")) {
  startUI();
}
