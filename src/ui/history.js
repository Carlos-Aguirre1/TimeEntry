import { esc, must, $$ } from "./dom.js";
import { hoursText, statusLabel } from "./format.js";
import { entriesByDate } from "../domain/totals.js";
import { formatDateFriendly, WEEKDAY_SHORT, weekdayIndex, formatWeekRange } from "../domain/dates.js";

/**
 * Time entry history grouped by date, with a lightweight weekly summary.
 * @param {import("../app/timeEntryService.js").TimeEntryService} service
 * @param {import("./router.js").Router} router
 */
export function createHistoryScreen(service, router) {
  const root = must("#historyScreen");

  async function render() {
    const [entries, customers, summary] = await Promise.all([
      service.listEntries(),
      service.listPortfolioCustomers(),
      service.dashboardSummary(),
    ]);
    const names = new Map(customers.map((c) => [c.id, c.name]));
    const groups = entriesByDate(entries);
    const today = service.today();

    root.innerHTML = `
      <section class="card screen-head">
        <div class="screen-nav"><button type="button" class="back-btn" data-go="/">‹ Home</button></div>
        <h2>History</h2>
        <p>${entries.length} ${entries.length === 1 ? "entry" : "entries"} recorded</p>
      </section>
      <section class="card">
        <div class="section-head"><h3>This week</h3><small>${esc(formatWeekRange(today))}</small></div>
        <div class="week-strip" data-testid="historyWeek">
          ${summary.weekBreakdown.map((d) => `<div class="${d.date === today ? "is-today" : ""} ${d.minutes ? "" : "is-empty"}"><small>${WEEKDAY_SHORT[weekdayIndex(d.date)]}</small><b>${esc(hoursText(d.minutes).replace(" h", ""))}</b></div>`).join("")}
        </div>
        <div class="week-total"><span>Weekly total</span><b data-testid="historyWeekTotal">${esc(hoursText(summary.weekMinutes))}</b></div>
      </section>
      ${groups.length
        ? groups.map((g) => `
          <section class="card history-day" data-date="${g.date}">
            <div class="section-head"><h3>${esc(formatDateFriendly(g.date, today))}</h3><b>${esc(hoursText(g.minutes))}</b></div>
            <ul class="entry-list">
              ${g.entries.map((e) => `<li><button type="button" class="entry-row" data-entry="${esc(e.id)}">
                  <span class="entry-customer">${esc(names.get(e.customerId) || "Unknown customer")}</span>
                  <span class="entry-notes">${esc(e.notes || "")}</span>
                  <span class="badge badge-${esc(e.status)}">${esc(statusLabel(e.status))}</span>
                  <b class="entry-hours">${esc(hoursText(e.durationMinutes))}</b>
                </button></li>`).join("")}
            </ul>
          </section>`).join("")
        : `<section class="card"><p class="empty">No entries yet. Open <b>My Portfolio</b>, pick a customer and save your first entry.</p>
             <button type="button" class="primary" data-go="/portfolio">My Portfolio →</button></section>`}`;

    $$("[data-go]", root).forEach((b) => (b.onclick = () => router.go(/** @type {string} */ (b.dataset.go))));
    $$("[data-entry]", root).forEach((b) => (b.onclick = () => router.go(`/entry/${b.dataset.entry}`)));
  }

  return { render };
}
