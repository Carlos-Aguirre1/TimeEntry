/** @typedef {import("../domain/models.js").TimeEntry} TimeEntry */

/**
 * @typedef {{entryId: string, ok: boolean, externalId?: string, message?: string}} SubmissionResult
 */

/**
 * TimeEntryDestination boundary: where saved entries are eventually submitted
 * (for example Salesforce). TE0 ships only a local no-op destination so the
 * UI/application layers are wired for submission without any integration.
 * @typedef {Object} TimeEntryDestination
 * @property {string} name
 * @property {(entries: TimeEntry[]) => Promise<SubmissionResult[]>} submit
 */

/**
 * Keeps entries local. Marks every entry as accepted without leaving the device.
 * @implements {TimeEntryDestination}
 */
export class LocalOnlyDestination {
  constructor() {
    this.name = "Local only";
  }
  /** @param {TimeEntry[]} entries */
  async submit(entries) {
    return entries.map((e) => ({ entryId: e.id, ok: true, message: "Stored locally" }));
  }
}
