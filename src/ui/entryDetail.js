import { esc, must, $$ } from "./dom.js";
import { hoursText, statusLabel } from "./format.js";
import { formatDateFriendly } from "../domain/dates.js";
import { toast } from "./toast.js";

/**
 * Single entry view. Deleting is allowed for non-submitted entries.
 * @param {import("../app/timeEntryService.js").TimeEntryService} service
 * @param {import("./router.js").Router} router
 */
export function createEntryDetailScreen(service, router) {
  const root = must("#entryScreen");

  /** @param {Record<string,string>} params */
  async function render(params) {
    const entry = await service.getEntry(params.id);
    if (!entry) {
      root.innerHTML = `<section class="card"><p>Entry not found.</p><button type="button" class="ghost" data-go="/history">‹ History</button></section>`;
      $$("[data-go]", root).forEach((b) => (b.onclick = () => router.go(/** @type {string} */ (b.dataset.go))));
      return;
    }
    const customer = await service.getCustomer(entry.customerId);
    const canDelete = entry.status !== "submitted";
    root.innerHTML = `
      <section class="card screen-head">
        <div class="screen-nav">
          <button type="button" class="back-btn" data-go="/history">‹ History</button>
          <button type="button" class="back-btn" data-go="/customer/${esc(entry.customerId)}">Customer</button>
        </div>
        <h2>${esc(customer?.name || "Unknown customer")}</h2>
        <p>${esc(formatDateFriendly(entry.date, service.today()))} • ${esc(entry.date)}</p>
      </section>
      <section class="card detail-card">
        <div class="detail-grid">
          <div><small>Duration</small><b data-testid="entryDuration">${esc(hoursText(entry.durationMinutes))}</b><span>${entry.durationMinutes} minutes</span></div>
          <div><small>Status</small><b><span class="badge badge-${esc(entry.status)}">${esc(statusLabel(entry.status))}</span></b></div>
          <div><small>Recorded</small><b>${esc(new Date(entry.createdAt).toLocaleString())}</b></div>
          <div><small>Updated</small><b>${esc(new Date(entry.updatedAt).toLocaleString())}</b></div>
        </div>
        <div class="detail-notes"><small>Notes</small><p>${entry.notes ? esc(entry.notes) : "<i>No note</i>"}</p></div>
        <div class="actions">
          <button type="button" class="ghost danger" id="deleteEntryBtn" ${canDelete ? "" : "disabled"}>Delete entry</button>
          <p class="form-message">${canDelete ? "" : "Submitted entries cannot be deleted here."}</p>
        </div>
      </section>`;
    $$("[data-go]", root).forEach((b) => (b.onclick = () => router.go(/** @type {string} */ (b.dataset.go))));
    must("#deleteEntryBtn").onclick = async () => {
      if (!canDelete) return;
      if (!confirm("Delete this time entry?")) return;
      const ok = await service.deleteEntry(entry.id);
      if (ok) { toast("Entry deleted", { kind: "info" }); router.go("/history"); }
    };
  }

  return { render };
}
