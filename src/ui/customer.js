import { esc, must, $, $$ } from "./dom.js";
import { hoursText, relativeDate, statusLabel } from "./format.js";
import { formatDurationWords } from "../domain/duration.js";
import { TimeForm } from "./timeForm.js";
import { toast } from "./toast.js";
import { initials } from "./dashboard.js";

/**
 * Customer workspace: the fastest path. Customer → time → Save.
 * @param {import("../app/timeEntryService.js").TimeEntryService} service
 * @param {import("./router.js").Router} router
 */
export function createCustomerScreen(service, router) {
  const root = must("#customerScreen");
  /** @type {TimeForm | null} */
  let form = null;

  /** @param {Record<string,string>} params */
  async function render(params) {
    const customer = await service.getCustomer(params.id);
    if (!customer) {
      root.innerHTML = `<section class="card"><p>Customer not found.</p><button type="button" class="ghost" data-go="/portfolio">‹ My Portfolio</button></section>`;
      $$("[data-go]", root).forEach((b) => (b.onclick = () => router.go(/** @type {string} */ (b.dataset.go))));
      return;
    }
    const entries = await service.listEntriesForCustomer(customer.id);
    const today = service.today();
    const todayMinutes = entries.filter((e) => e.date === today).reduce((n, e) => n + e.durationMinutes, 0);
    const weekMinutes = (await service.customerSummaries()).find((s) => s.customer.id === customer.id)?.weekMinutes || 0;

    root.innerHTML = `
      <section class="card screen-head sticky-head">
        <div class="screen-nav">
          <button type="button" class="back-btn" data-go="/portfolio">‹ My Portfolio</button>
          <button type="button" class="back-btn" data-go="/">Home</button>
        </div>
        <div class="customer-head">
          <span class="avatar lg">${esc(initials(customer.name))}</span>
          <div>
            <h2 data-testid="customerName">${esc(customer.name)}</h2>
            <p>${esc([customer.accountId, customer.territory].filter(Boolean).join(" • "))}</p>
          </div>
        </div>
        <div class="mini-metrics">
          <div><small>Today</small><b data-testid="customerToday">${esc(hoursText(todayMinutes))}</b></div>
          <div><small>This week</small><b data-testid="customerWeek">${esc(hoursText(weekMinutes))}</b></div>
          <div><small>Entries</small><b>${entries.length}</b></div>
        </div>
      </section>

      <section class="card entry-card" data-testid="enterTime">
        <h3>Enter Time</h3>
        <div id="timeFormRoot"></div>
        <div class="actions">
          <button type="button" class="primary save-btn" id="saveEntryBtn" disabled>Save</button>
          <p id="entryMessage" class="form-message" aria-live="polite"></p>
        </div>
      </section>

      <section class="card">
        <div class="section-head"><h3>Recent entries</h3><small>${entries.length ? `${entries.length} total` : ""}</small></div>
        ${entries.length
          ? `<ul class="entry-list" data-testid="customerEntries">${entries.slice(0, 8).map((e) => `
              <li><button type="button" class="entry-row" data-entry="${esc(e.id)}">
                <span class="entry-date">${esc(relativeDate(e.date, today))}</span>
                <span class="entry-notes">${esc(e.notes || "")}</span>
                <span class="badge badge-${esc(e.status)}">${esc(statusLabel(e.status))}</span>
                <b class="entry-hours">${esc(hoursText(e.durationMinutes))}</b>
              </button></li>`).join("")}</ul>`
          : `<p class="empty">No time recorded for this customer yet.</p>`}
      </section>`;

    $$("[data-go]", root).forEach((b) => (b.onclick = () => router.go(/** @type {string} */ (b.dataset.go))));
    $$("[data-entry]", root).forEach((b) => (b.onclick = () => router.go(`/entry/${b.dataset.entry}`)));

    const saveBtn = /** @type {HTMLButtonElement} */ (must("#saveEntryBtn"));
    const message = must("#entryMessage");
    const formRoot = must("#timeFormRoot");
    form = new TimeForm(formRoot, {
      today: () => service.today(),
      idPrefix: "single",
      onChange: () => { saveBtn.disabled = !form?.isComplete(); message.textContent = ""; },
    });
    saveBtn.disabled = !form.isComplete();

    saveBtn.onclick = async () => {
      if (!form || !form.isComplete()) return;
      const v = form.value;
      saveBtn.disabled = true;
      try {
        const saved = await service.recordTime({
          customerId: customer.id,
          date: v.date,
          durationMinutes: /** @type {number} */ (v.durationMinutes),
          notes: v.notes,
        });
        toast(`Saved ${formatDurationWords(saved.durationMinutes)} for ${customer.name}`);
        await render(params);
        const msg = $("#entryMessage");
        if (msg) {
          msg.innerHTML = `<span class="ok">✓ Saved ${esc(formatDurationWords(saved.durationMinutes))} • ${esc(relativeDate(saved.date, service.today()))}</span>
            <button type="button" class="ghost small" data-go="/portfolio">Next customer ›</button>`;
          $$("[data-go]", msg).forEach((b) => (b.onclick = () => router.go(/** @type {string} */ (b.dataset.go))));
        }
      } catch (err) {
        message.textContent = err instanceof Error ? err.message : "Could not save.";
        saveBtn.disabled = false;
      }
    };
  }

  return { render };
}
