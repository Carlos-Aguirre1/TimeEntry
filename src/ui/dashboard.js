import { esc, must } from "./dom.js";
import { hoursText, relativeDate } from "./format.js";
import { WEEKDAY_LABELS, weekdayIndex, formatWeekRange } from "../domain/dates.js";

/**
 * @param {import("../app/timeEntryService.js").TimeEntryService} service
 * @param {import("./router.js").Router} router
 */
export function createDashboardScreen(service, router) {
  const root = must("#dashboardScreen");

  async function render() {
    const s = await service.dashboardSummary();
    const tam = service.session.currentTam;
    const pct = s.weeklyTargetMinutes ? Math.min(100, Math.round((s.weekMinutes / s.weeklyTargetMinutes) * 100)) : 0;
    const days = s.weekBreakdown.filter((d, i) => i < 5 || d.minutes > 0 || d.date === s.today);

    root.innerHTML = `
      <section class="card hero-card">
        <small>TAM DASHBOARD</small>
        <h2>Hello, ${esc(tam.name.split(" ")[0])}</h2>
        <p>Record customer time in seconds. Pick a customer, tap a duration, save.</p>
        <button type="button" class="primary cta" id="goPortfolioBtn">My Portfolio <span>→</span></button>
      </section>

      <section class="metric-row">
        <div class="card metric">
          <small>Today</small>
          <strong data-testid="todayTotal">${esc(hoursText(s.todayMinutes))}</strong>
          <span>${s.todayMinutes ? "entered so far" : "nothing entered yet"}</span>
        </div>
        <div class="card metric">
          <small>This week</small>
          <strong data-testid="weekTotal">${esc(hoursText(s.weekMinutes))}</strong>
          <span>${s.weekEntryCount} ${s.weekEntryCount === 1 ? "entry" : "entries"} • target ${esc(hoursText(s.weeklyTargetMinutes))}</span>
          <div class="bar" aria-label="Weekly progress"><i style="width:${pct}%"></i></div>
        </div>
      </section>

      <section class="card">
        <div class="section-head">
          <h3>This week</h3>
          <small>${esc(formatWeekRange(s.today))}</small>
        </div>
        <ul class="week-list" data-testid="weekBreakdown">
          ${days.map((d) => `<li class="${d.date === s.today ? "is-today" : ""} ${d.minutes ? "" : "is-empty"}" data-date="${d.date}">
              <span>${WEEKDAY_LABELS[weekdayIndex(d.date)]}</span><b>${esc(hoursText(d.minutes))}</b></li>`).join("")}
        </ul>
        <div class="week-total"><span>Weekly total</span><b>${esc(hoursText(s.weekMinutes))}</b></div>
      </section>

      <section class="card">
        <div class="section-head"><h3>Recent customers</h3><small>last 7 days</small></div>
        ${s.recentCustomers.length
          ? `<div class="recent-list">${s.recentCustomers.slice(0, 6).map((r) => `
              <button type="button" class="recent-row" data-customer="${esc(r.customer.id)}">
                <span class="avatar">${esc(initials(r.customer.name))}</span>
                <span class="recent-name"><strong>${esc(r.customer.name)}</strong><small>${esc(relativeDate(/** @type {any} */ (r.lastEntry).date, s.today))} • ${esc(hoursText(/** @type {any} */ (r.lastEntry).durationMinutes))}</small></span>
                <span class="recent-week">${esc(hoursText(r.weekMinutes))}<small>this week</small></span>
              </button>`).join("")}</div>`
          : `<p class="empty">No time recorded in the last 7 days. Open <b>My Portfolio</b> to get started.</p>`}
      </section>

      <section class="metric-row three">
        <button type="button" class="card metric mini" id="quietBtn">
          <small>No recent time</small><strong>${s.quietCustomers.length}</strong><span>customers • 14+ days</span>
        </button>
        <div class="card metric mini"><small>Saved</small><strong>${s.savedCount}</strong><span>entries</span></div>
        <div class="card metric mini"><small>Submitted</small><strong>${s.submittedCount}</strong><span>entries</span></div>
      </section>`;

    must("#goPortfolioBtn").onclick = () => router.go("/portfolio");
    must("#quietBtn").onclick = () => router.go("/portfolio");
    root.querySelectorAll("[data-customer]").forEach((b) => {
      /** @type {HTMLElement} */ (b).onclick = () => router.go(`/customer/${/** @type {HTMLElement} */ (b).dataset.customer}`);
    });
  }

  return { render };
}

/** @param {string} name */
export function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}
