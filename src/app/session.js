/** @typedef {import("../domain/models.js").Tam} Tam */

/**
 * Who is using the app. TE0 has a single demo TAM; later this is populated
 * from real authentication without changing consumers.
 */
export class Session {
  /** @param {Tam} tam */
  constructor(tam) {
    this.tam = tam;
  }
  /** @returns {Tam} */
  get currentTam() {
    return this.tam;
  }
  get tamId() {
    return this.tam.id;
  }
}
