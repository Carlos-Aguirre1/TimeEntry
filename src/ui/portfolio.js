import { esc, must, $$ } from "./dom.js";
import { hoursText, relativeDate } from "./format.js";
import { initials } from "./dashboard.js";

/**
 * Portfolio screen: customer cards with an optional bulk-selection mode.
 * The selection set lives here so it survives re-renders, following the
 * reference app's multi-select pattern.
 * @param {import("../app/timeEntryService.js").TimeEntryService} service
 * @param {import("./router.js").Router} router
 * @param {{selection: Set<string>}} shared  selected customer ids shared with the bulk screen
 */
export function createPortfolioScreen(service, router, shared) {
  const root = must("#portfolioScreen");
  let bulkMode = false;

  async function render() {
    const [summaries, portfolios] = await Promise.all([service.customerSummaries(), service.listPortfolios()]);
    const today = service.today();
    // Drop selections for customers no longer in the portfolio.
    const ids = new Set(summaries.map((s) => s.customer.id));
    for (const id of [...shared.selection]) if (!ids.has(id)) shared.selection.delete(id);
    if (!bulkMode && shared.selection.size) bulkMode = true;

    const title = portfolios.map((p) => p.name).join(", ") || "Portfolio";
    root.innerHTML = `
      <section class="card screen-head">
        <div class="screen-nav"><button type="button" class="back-btn" data-go="/">‹ Home</button></div>
        <h2>My Portfolio</h2>
        <p>${esc(title)} • ${summaries.length} ${summaries.length === 1 ? "customer" : "customers"}</p>
        <div class="toolbar">
          <button type="button" id="bulkModeBtn" class="${bulkMode ? "ghost" : "secondary"}">${bulkMode ? "Cancel bulk entry" : "Bulk Time Entry"}</button>
          <div class="quick-select ${bulkMode ? "" : "hidden"}">
            <button type="button" class="ghost" id="selectAllBtn">Select all</button>
            <button type="button" class="ghost" id="clearSelectionBtn">Clear</button>
          </div>
        </div>
      </section>
      <div id="selectionBar" class="selection-bar ${bulkMode ? "" : "hidden"}">
        <strong id="selectedCount">${shared.selection.size} ${shared.selection.size === 1 ? "customer" : "customers"} selected</strong>
        <button type="button" class="primary" id="enterSelectedBtn" ${shared.selection.size ? "" : "disabled"}>Enter time for selected</button>
      </div>
      <div class="customer-grid" data-testid="customerGrid">
        ${summaries.map((s) => customerCard(s, today, bulkMode, shared.selection.has(s.customer.id))).join("")}
      </div>`;

    $$("[data-go]", root).forEach((b) => (b.onclick = () => router.go(/** @type {string} */ (b.dataset.go))));
    must("#bulkModeBtn").onclick = () => { bulkMode = !bulkMode; if (!bulkMode) shared.selection.clear(); render(); };
    must("#selectAllBtn").onclick = () => { summaries.forEach((s) => shared.selection.add(s.customer.id)); render(); };
    must("#clearSelectionBtn").onclick = () => { shared.selection.clear(); render(); };
    must("#enterSelectedBtn").onclick = () => { if (shared.selection.size) router.go("/bulk"); };
    $$(".customer-card", root).forEach((card) => {
      card.onclick = () => {
        const id = /** @type {string} */ (card.dataset.id);
        if (bulkMode) {
          if (shared.selection.has(id)) shared.selection.delete(id); else shared.selection.add(id);
          render();
        } else {
          router.go(`/customer/${id}`);
        }
      };
    });
  }

  /** Leave bulk mode (called after a bulk save). */
  function exitBulkMode() { bulkMode = false; shared.selection.clear(); }

  return { render, exitBulkMode };
}

/**
 * @param {import("../app/timeEntryService.js").CustomerSummary} s
 * @param {string} today
 * @param {boolean} bulkMode
 * @param {boolean} selected
 */
function customerCard(s, today, bulkMode, selected) {
  const c = s.customer;
  const state = s.todayMinutes ? "today" : s.weekMinutes ? "week" : s.lastEntry ? "older" : "none";
  const stateText = s.todayMinutes
    ? `Today • ${hoursText(s.todayMinutes)}`
    : s.lastEntry
      ? `${relativeDate(s.lastEntry.date, today)} • ${hoursText(s.lastEntry.durationMinutes)}`
      : "No time yet";
  return `
    <button type="button" class="customer-card state-${state} ${selected ? "selected" : ""}" data-id="${esc(c.id)}" aria-pressed="${bulkMode ? String(selected) : "false"}">
      ${bulkMode ? `<span class="select-check" aria-hidden="true">${selected ? "✓" : ""}</span>` : ""}
      <span class="avatar">${esc(initials(c.name))}</span>
      <strong class="customer-name">${esc(c.name)}</strong>
      <small class="customer-account">${esc(c.accountId || "")}</small>
      <span class="customer-status">${esc(stateText)}</span>
      <span class="customer-week"><b>${esc(hoursText(s.weekMinutes))}</b> this week</span>
    </button>`;
}
