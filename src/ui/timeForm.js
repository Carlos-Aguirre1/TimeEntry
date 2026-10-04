// Shared "how much time, on which day" control used by single and bulk entry.
import { DURATION_OPTIONS, formatDurationWords, isValidDurationMinutes } from "../domain/duration.js";
import { addDays, isValidISODate, formatDateFriendly } from "../domain/dates.js";
import { esc, $, $$ } from "./dom.js";

/**
 * @typedef {Object} TimeFormValue
 * @property {string} date
 * @property {number | null} durationMinutes
 * @property {string} notes
 */

export class TimeForm {
  /**
   * @param {HTMLElement} root
   * @param {{today: () => string, onChange?: (v: TimeFormValue) => void, idPrefix?: string}} opts
   */
  constructor(root, opts) {
    this.root = root;
    this.todayFn = opts.today;
    this.onChange = opts.onChange;
    this.idPrefix = opts.idPrefix || "tf";
    /** @type {TimeFormValue} */
    this.value = { date: this.todayFn(), durationMinutes: null, notes: "" };
    this.render();
  }

  render() {
    const today = this.todayFn();
    const p = this.idPrefix;
    this.root.innerHTML = `
      <div class="tf-block">
        <div class="tf-label">Date</div>
        <div class="date-chips" role="group" aria-label="Date">
          <button type="button" class="chip" data-date="${today}">Today</button>
          <button type="button" class="chip" data-date="${addDays(today, -1)}">Yesterday</button>
          <label class="chip chip-date" for="${p}-date"><span class="chip-date-text">Other…</span>
            <input id="${p}-date" type="date" max="${today}" aria-label="Pick a date"></label>
        </div>
      </div>
      <div class="tf-block">
        <div class="tf-label">Time spent</div>
        <div class="duration-grid" role="group" aria-label="Duration">
          ${DURATION_OPTIONS.map((m) => `<button type="button" class="duration-chip" data-minutes="${m}" aria-pressed="false">${esc(formatDurationWords(m).replace(/ hours?$/, ""))}<small>${m / 60 === 1 ? "hour" : "hours"}</small></button>`).join("")}
        </div>
      </div>
      <details class="tf-notes">
        <summary>Add a note (optional)</summary>
        <textarea id="${p}-notes" rows="3" placeholder="What did you work on?" maxlength="1000"></textarea>
      </details>`;

    $$(".chip[data-date]", this.root).forEach((b) => (b.onclick = () => this.setDate(/** @type {string} */ (b.dataset.date))));
    const dateInput = /** @type {HTMLInputElement} */ ($(`#${p}-date`, this.root));
    dateInput.onchange = () => { if (isValidISODate(dateInput.value)) this.setDate(dateInput.value); };
    $$(".duration-chip", this.root).forEach((b) => (b.onclick = () => this.setDuration(Number(b.dataset.minutes))));
    const notes = /** @type {HTMLTextAreaElement} */ ($(`#${p}-notes`, this.root));
    notes.oninput = () => { this.value.notes = notes.value; this._changed(); };
    this.paint();
  }

  /** @param {string} iso */
  setDate(iso) {
    this.value.date = iso;
    this.paint();
    this._changed();
  }

  /** @param {number} minutes Tapping the selected chip again clears it. */
  setDuration(minutes) {
    this.value.durationMinutes = this.value.durationMinutes === minutes ? null : minutes;
    this.paint();
    this._changed();
  }

  reset() {
    this.value = { date: this.todayFn(), durationMinutes: null, notes: "" };
    const notes = /** @type {HTMLTextAreaElement | null} */ ($(`#${this.idPrefix}-notes`, this.root));
    if (notes) notes.value = "";
    const details = /** @type {HTMLDetailsElement | null} */ ($(".tf-notes", this.root));
    if (details) details.open = false;
    this.paint();
  }

  isComplete() {
    return isValidDurationMinutes(this.value.durationMinutes) && isValidISODate(this.value.date);
  }

  paint() {
    const today = this.todayFn();
    const quick = [today, addDays(today, -1)];
    $$(".chip[data-date]", this.root).forEach((b) => b.classList.toggle("active", b.dataset.date === this.value.date));
    const custom = $(".chip-date", this.root);
    const customText = $(".chip-date-text", this.root);
    const isCustom = !quick.includes(this.value.date);
    if (custom) custom.classList.toggle("active", isCustom);
    if (customText) customText.textContent = isCustom ? formatDateFriendly(this.value.date, today) : "Other…";
    const dateInput = /** @type {HTMLInputElement | null} */ ($(`#${this.idPrefix}-date`, this.root));
    if (dateInput) dateInput.value = this.value.date;
    $$(".duration-chip", this.root).forEach((b) => {
      const on = Number(b.dataset.minutes) === this.value.durationMinutes;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  _changed() {
    if (this.onChange) this.onChange({ ...this.value });
  }
}
