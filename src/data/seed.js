// Fictional demo data. No real customer information.
// Later this file is replaced by a Salesforce-backed CustomerRepository.

/** @type {import("../domain/models.js").Tam} */
export const DEMO_TAM = { id: "tam_demo", name: "Alex Rivera", email: "alex.rivera@example.com" };

/** @type {import("../domain/models.js").Customer[]} */
export const DEMO_CUSTOMERS = [
  { id: "cust_001", name: "Northwind Logistics", accountId: "ACC-10421", territory: "Central", active: true },
  { id: "cust_002", name: "Harbourview Health", accountId: "ACC-10488", territory: "Central", active: true },
  { id: "cust_003", name: "Summit Retail Group", accountId: "ACC-10502", territory: "Central", active: true },
  { id: "cust_004", name: "Bluefin Transit Authority", accountId: "ACC-10533", territory: "Central", active: true },
  { id: "cust_005", name: "Cascade Field Services", accountId: "ACC-10590", territory: "Central", active: true },
  { id: "cust_006", name: "Ironbridge Manufacturing", accountId: "ACC-10612", territory: "Central", active: true },
  { id: "cust_007", name: "Lakeside Utilities", accountId: "ACC-10677", territory: "Central", active: true },
  { id: "cust_008", name: "Meridian Hospitality", accountId: "ACC-10701", territory: "Central", active: true },
  { id: "cust_009", name: "Pinecrest School District", accountId: "ACC-10745", territory: "Central", active: true },
  { id: "cust_010", name: "Vantage Couriers", accountId: "ACC-10790", territory: "Central", active: true },
  { id: "cust_011", name: "Orchard Grocers", accountId: "ACC-10822", territory: "Central", active: false },
];

/** @type {import("../domain/models.js").Portfolio[]} */
export const DEMO_PORTFOLIOS = [
  {
    id: "pf_central",
    tamId: DEMO_TAM.id,
    name: "Central Territory",
    customerIds: DEMO_CUSTOMERS.map((c) => c.id),
  },
];
