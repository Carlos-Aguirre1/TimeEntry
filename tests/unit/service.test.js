import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryStorage } from "../../src/data/storage.js";
import { LocalTimeEntryRepository } from "../../src/data/timeEntryRepository.js";
import { SeededCustomerRepository } from "../../src/data/customerRepository.js";
import { SeededPortfolioRepository } from "../../src/data/portfolioRepository.js";
import { LocalOnlyDestination } from "../../src/data/timeEntryDestination.js";
import { DEMO_TAM, DEMO_CUSTOMERS, DEMO_PORTFOLIOS } from "../../src/data/seed.js";
import { Session } from "../../src/app/session.js";
import { TimeEntryService } from "../../src/app/timeEntryService.js";

/** @param {{storage?: MemoryStorage, now?: Date}} [opts] */
function makeService(opts = {}) {
  const storage = opts.storage ?? new MemoryStorage();
  const now = opts.now ?? new Date(2026, 9, 7, 10, 0, 0); // Wed 7 Oct 2026
  const service = new TimeEntryService({
    session: new Session(DEMO_TAM),
    customers: new SeededCustomerRepository(DEMO_CUSTOMERS),
    portfolios: new SeededPortfolioRepository(DEMO_PORTFOLIOS),
    entries: new LocalTimeEntryRepository(storage),
    destination: new LocalOnlyDestination(),
    now: () => now,
  });
  return { service, storage };
}

test("seed data provides 8-12 active customers in the TAM portfolio", async () => {
  const { service } = makeService();
  const customers = await service.listPortfolioCustomers();
  assert.ok(customers.length >= 8 && customers.length <= 12, `got ${customers.length}`);
  assert.ok(customers.every((c) => c.active));
  assert.ok(customers.every((c) => c.id && c.name));
});

test("recordTime saves an entry with status saved and minutes as the canonical duration", async () => {
  const { service } = makeService();
  const entry = await service.recordTime({ customerId: "cust_001", date: "2026-10-07", durationMinutes: 90, notes: "  Kickoff call  " });
  assert.equal(entry.status, "saved");
  assert.equal(entry.durationMinutes, 90);
  assert.equal(entry.notes, "Kickoff call");
  assert.equal(entry.tamId, DEMO_TAM.id);
  assert.ok(entry.id && entry.createdAt && entry.updatedAt);
  const list = await service.listEntries();
  assert.equal(list.length, 1);
});

test("multiple entries for the same and different customers do not overwrite each other", async () => {
  const { service } = makeService();
  await service.recordTime({ customerId: "cust_001", date: "2026-10-07", durationMinutes: 90 });
  await service.recordTime({ customerId: "cust_001", date: "2026-10-07", durationMinutes: 60 });
  await service.recordTime({ customerId: "cust_002", date: "2026-10-07", durationMinutes: 120 });
  const list = await service.listEntries();
  assert.equal(list.length, 3);
  assert.equal(new Set(list.map((e) => e.id)).size, 3);
  const s = await service.dashboardSummary();
  assert.equal(s.todayMinutes, 270);
  assert.equal(s.weekMinutes, 270);
});

test("recordTime rejects invalid input", async () => {
  const { service } = makeService();
  await assert.rejects(() => service.recordTime({ customerId: "nope", date: "2026-10-07", durationMinutes: 30 }), /Unknown customer/);
  await assert.rejects(() => service.recordTime({ customerId: "cust_001", date: "2026-10-07", durationMinutes: 0 }), /how much time/);
  await assert.rejects(() => service.recordTime({ customerId: "cust_001", date: "bad", durationMinutes: 30 }), /valid date/);
  assert.equal((await service.listEntries()).length, 0);
});

test("bulk entry creates one independent entry per selected customer", async () => {
  const { service } = makeService();
  const saved = await service.recordTimeForCustomers({ customerIds: ["cust_001", "cust_002", "cust_003", "cust_003"], date: "2026-10-06", durationMinutes: 30, notes: "Weekly sync" });
  assert.equal(saved.length, 3);
  assert.deepEqual(saved.map((e) => e.customerId).sort(), ["cust_001", "cust_002", "cust_003"]);
  const totals = (await service.customerSummaries()).filter((s) => s.weekMinutes > 0);
  assert.equal(totals.length, 3);
  await assert.rejects(() => service.recordTimeForCustomers({ customerIds: [], date: "2026-10-06", durationMinutes: 30 }), /at least one/);
});

test("dashboard totals and weekly breakdown are computed from durationMinutes", async () => {
  const { service } = makeService();
  await service.recordTime({ customerId: "cust_001", date: "2026-10-05", durationMinutes: 390 }); // Mon
  await service.recordTime({ customerId: "cust_002", date: "2026-10-06", durationMinutes: 420 }); // Tue
  await service.recordTime({ customerId: "cust_003", date: "2026-10-07", durationMinutes: 330 }); // Wed (today)
  await service.recordTime({ customerId: "cust_001", date: "2026-10-08", durationMinutes: 480 }); // Thu
  await service.recordTime({ customerId: "cust_004", date: "2026-10-09", durationMinutes: 360 }); // Fri
  await service.recordTime({ customerId: "cust_004", date: "2026-09-30", durationMinutes: 60 });  // last week
  const s = await service.dashboardSummary();
  assert.equal(s.today, "2026-10-07");
  assert.equal(s.todayMinutes, 330);
  assert.equal(s.weekMinutes, 33 * 60);
  assert.deepEqual(s.weekBreakdown.map((d) => d.minutes), [390, 420, 330, 480, 360, 0, 0]);
  assert.equal(s.weekEntryCount, 5);
  assert.equal(s.savedCount, 6);
  assert.equal(s.recentCustomers[0].customer.id, "cust_004"); // most recent date first
  assert.ok(s.quietCustomers.every((c) => !["cust_001", "cust_002", "cust_003", "cust_004"].includes(c.id)));
});

test("entries persist across service instances sharing the same storage (refresh)", async () => {
  const storage = new MemoryStorage();
  const first = makeService({ storage }).service;
  await first.recordTime({ customerId: "cust_005", date: "2026-10-07", durationMinutes: 150 });
  const second = makeService({ storage }).service;
  const list = await second.listEntries();
  assert.equal(list.length, 1);
  assert.equal(list[0].durationMinutes, 150);
});

test("update and delete respect validation and ownership", async () => {
  const { service } = makeService();
  const e = await service.recordTime({ customerId: "cust_001", date: "2026-10-07", durationMinutes: 60 });
  const updated = await service.updateEntry(e.id, { durationMinutes: 120, notes: " changed " });
  assert.equal(updated.durationMinutes, 120);
  assert.equal(updated.notes, "changed");
  await assert.rejects(() => service.updateEntry(e.id, { durationMinutes: -5 }));
  assert.equal(await service.deleteEntry(e.id), true);
  assert.equal(await service.deleteEntry(e.id), false);
});

test("submission boundary marks entries submitted via the destination", async () => {
  const { service } = makeService();
  const e = await service.recordTime({ customerId: "cust_001", date: "2026-10-07", durationMinutes: 60 });
  const results = await service.submitEntries([e.id]);
  assert.equal(results[0].ok, true);
  assert.equal((await service.getEntry(e.id))?.status, "submitted");
});

test("listeners are notified on writes", async () => {
  const { service } = makeService();
  let calls = 0;
  const off = service.onChange(() => calls++);
  await service.recordTime({ customerId: "cust_001", date: "2026-10-07", durationMinutes: 60 });
  off();
  await service.recordTime({ customerId: "cust_001", date: "2026-10-07", durationMinutes: 60 });
  assert.equal(calls, 1);
});
