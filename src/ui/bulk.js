import { esc, must, $$ } from "./dom.js";
import { formatDurationWords } from "../domain/duration.js";
import { TimeForm } from "./timeForm.js";
import { toast } from "./toast.js";
import { initials } from "./dashboard.js";

/**
 * Bulk Time Entry: one duration/date applied to every selected customer,
 * producing one independent entry per customer.
 * @param {import("../app/timeEntryService.js").TimeEntryService} service
 * @param {import("./router.js").Router} router
 * @param {{selection: Set<string>}} shared
 * @param {{exitBulkMode: () => void}} portfolioScreen
 */
export function createBulkScreen(service, router, shared, portfolioScreen) {
  const root = must("#bulkScreen");

  async function render() {
    const customers = (await service.listPortfolioCustomers()).filter((c) => shared.selection.has(c.id));
    if (!customers.length) {
      root.innerHTML = `<section class="card screen-head">
        <div class="screen-nav"><button type="button" class="back-btn" data-go="/portfolio">‹ My Portfolio</button></div>
        <h2>Bulk Time Entry</h2><p>Select customers in My Portfolio first.</p></section>`;
      $$("[data-go]", root).forEach((b) => (b.onclick = () => router.go(/** @type {string} */ (b.dataset.go))));
      return;
    }
    root.innerHTML = `
      <section class="card screen-head">
        <div class="screen-nav"><button type="button" class="back-btn" data-go="/portfolio">‹ My Portfolio</button></div>
        <h2>Bulk Time Entry</h2>
        <p data-testid="bulkCount">${customers.length} ${customers.length === 1 ? "customer" : "customers"} selected • one entry each</p>
        <div class="selected-chips">
          ${customers.map((c) => `<span class="person-chip"><i>${esc(initials(c.name))}</i>${esc(c.name)}<button type="button" class="remove" data-remove="${esc(c.id)}" aria-label="Remove ${esc(c.name)}">×</button></span>`).join("")}
        </div>
      </section>
      <section class="card entry-card">
        <h3>Time for each customer</h3>
        <div id="bulkFormRoot"></div>
        <div class="actions">
          <button type="button" class="primary save-btn" id="bulkSaveBtn" disabled>Save ${customers.length} ${customers.length === 1 ? "entry" : "entries"}</button>
          <p id="bulkMessage" class="form-message" aria-live="polite"></p>
        </div>
      </section>`;

    $$("[data-go]", root).forEach((b) => (b.onclick = () => router.go(/** @type {string} */ (b.dataset.go))));
    $$("[data-remove]", root).forEach((b) => (b.onclick = () => { shared.selection.delete(/** @type {string} */ (b.dataset.remove)); render(); }));

    const saveBtn = /** @type {HTMLButtonElement} */ (must("#bulkSaveBtn"));
    const message = must("#bulkMessage");
    const form = new TimeForm(must("#bulkFormRoot"), {
      today: () => service.today(),
      idPrefix: "bulk",
      onChange: () => { saveBtn.disabled = !form.isComplete(); message.textContent = ""; },
    });

    saveBtn.onclick = async () => {
      if (!form.isComplete()) return;
      saveBtn.disabled = true;
      try {
        const saved = await service.recordTimeForCustomers({
          customerIds: customers.map((c) => c.id),
          date: form.value.date,
          durationMinutes: /** @type {number} */ (form.value.durationMinutes),
          notes: form.value.notes,
        });
        toast(`Saved ${formatDurationWords(/** @type {number} */ (form.value.durationMinutes))} for ${saved.length} customers`);
        portfolioScreen.exitBulkMode();
        await router.go("/portfolio");
      } catch (err) {
        message.textContent = err instanceof Error ? err.message : "Could not save.";
        saveBtn.disabled = false;
      }
    };
  }

  return { render };
}
