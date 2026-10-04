import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryStorage } from "../../src/data/storage.js";
import { LocalTimeEntryRepository, TIME_ENTRY_STORAGE_KEY } from "../../src/data/timeEntryRepository.js";
import { createTimeEntry } from "../../src/domain/models.js";

test("entries persist through the storage boundary and survive a new repository instance (refresh)", async () => {
  const storage = new MemoryStorage();
  const repo = new LocalTimeEntryRepository(storage);
  const a = createTimeEntry({ customerId: "c1", tamId: "t", date: "2026-10-05", durationMinutes: 90 });
  const b = createTimeEntry({ customerId: "c2", tamId: "t", date: "2026-10-05", durationMinutes: 60 });
  await repo.save(a);
  await repo.save(b);

  const reloaded = new LocalTimeEntryRepository(storage); // simulates page refresh
  const list = await reloaded.listForTam("t");
  assert.equal(list.length, 2);
  assert.deepEqual(list.map((e) => e.id).sort(), [a.id, b.id].sort());
});

test("saving the same id replaces, different ids never overwrite each other", async () => {
  const repo = new LocalTimeEntryRepository(new MemoryStorage());
  const a = createTimeEntry({ customerId: "c1", tamId: "t", date: "2026-10-05", durationMinutes: 90 });
  await repo.save(a);
  await repo.save({ ...a, durationMinutes: 120 });
  assert.equal((await repo.listForTam("t")).length, 1);
  assert.equal((await repo.getById(a.id))?.durationMinutes, 120);
  await repo.saveMany([
    createTimeEntry({ customerId: "c1", tamId: "t", date: "2026-10-05", durationMinutes: 30 }),
    createTimeEntry({ customerId: "c1", tamId: "t", date: "2026-10-05", durationMinutes: 30 }),
  ]);
  assert.equal((await repo.listForTam("t")).length, 3);
});

test("remove and clear", async () => {
  const storage = new MemoryStorage();
  const repo = new LocalTimeEntryRepository(storage);
  const a = createTimeEntry({ customerId: "c1", tamId: "t", date: "2026-10-05", durationMinutes: 90 });
  await repo.save(a);
  assert.equal(await repo.remove(a.id), true);
  assert.equal(await repo.remove(a.id), false);
  await repo.clear();
  assert.equal(storage.getItem(TIME_ENTRY_STORAGE_KEY), null);
});

test("corrupt storage falls back to an empty list", async () => {
  const storage = new MemoryStorage();
  storage.setItem(TIME_ENTRY_STORAGE_KEY, "{not json");
  const repo = new LocalTimeEntryRepository(storage);
  assert.deepEqual(await repo.listForTam("t"), []);
});
