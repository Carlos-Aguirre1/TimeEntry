/** @typedef {import("../domain/models.js").Customer} Customer */

/**
 * CustomerRepository boundary. Any implementation (seeded, REST, Salesforce)
 * must provide these async methods.
 * @typedef {Object} CustomerRepository
 * @property {() => Promise<Customer[]>} list
 * @property {(ids: string[]) => Promise<Customer[]>} listByIds
 * @property {(id: string) => Promise<Customer | null>} getById
 */

/**
 * Customer repository backed by an in-memory list (seeded demo data for TE0).
 * @implements {CustomerRepository}
 */
export class SeededCustomerRepository {
  /** @param {Customer[]} customers */
  constructor(customers) {
    this.customers = customers.map((c) => ({ ...c }));
  }
  async list() {
    return this.customers.map((c) => ({ ...c }));
  }
  /** @param {string[]} ids */
  async listByIds(ids) {
    const set = new Set(ids);
    return this.customers.filter((c) => set.has(c.id)).map((c) => ({ ...c }));
  }
  /** @param {string} id */
  async getById(id) {
    const c = this.customers.find((x) => x.id === id);
    return c ? { ...c } : null;
  }
}
