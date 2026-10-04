/** @typedef {import("../domain/models.js").Portfolio} Portfolio */

/**
 * PortfolioRepository boundary: which customers belong to which TAM.
 * @typedef {Object} PortfolioRepository
 * @property {(tamId: string) => Promise<Portfolio[]>} listForTam
 * @property {(id: string) => Promise<Portfolio | null>} getById
 */

/**
 * @implements {PortfolioRepository}
 */
export class SeededPortfolioRepository {
  /** @param {Portfolio[]} portfolios */
  constructor(portfolios) {
    this.portfolios = portfolios.map((p) => ({ ...p, customerIds: [...p.customerIds] }));
  }
  /** @param {string} tamId */
  async listForTam(tamId) {
    return this.portfolios.filter((p) => p.tamId === tamId).map((p) => ({ ...p, customerIds: [...p.customerIds] }));
  }
  /** @param {string} id */
  async getById(id) {
    const p = this.portfolios.find((x) => x.id === id);
    return p ? { ...p, customerIds: [...p.customerIds] } : null;
  }
}
