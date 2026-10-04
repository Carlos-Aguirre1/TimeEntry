// TE0 acceptance flow, run on desktop and mobile projects (see playwright.config.js).
import { test, expect } from "@playwright/test";

/** Clear persisted entries before each test so runs are independent. */
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/#/");
});

test("app starts on the TAM dashboard", async ({ page }) => {
  await expect(page).toHaveTitle(/TimeEntry/);
  await expect(page.getByRole("heading", { name: /Hello, Alex/ })).toBeVisible();
  await expect(page.getByTestId("todayTotal")).toHaveText("0.0 h");
  await expect(page.getByTestId("weekTotal")).toHaveText("0.0 h");
  await expect(page.getByRole("button", { name: /My Portfolio/ }).first()).toBeVisible();
});

test("primary acceptance flow: dashboard → portfolio → customer → 1.5 hours → save → history → totals", async ({ page }) => {
  // 3. Click My Portfolio
  await page.locator("#goPortfolioBtn").click();
  await expect(page).toHaveURL(/#\/portfolio/);
  await expect(page.getByRole("heading", { name: "My Portfolio" })).toBeVisible();

  // 4. Customer cards render (8-12 seeded)
  const cards = page.locator(".customer-card");
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(8);
  expect(count).toBeLessThanOrEqual(12);
  await expect(cards.first()).toContainText("No time yet");

  // 5. Select a customer
  const first = cards.first();
  const name = (await first.locator(".customer-name").textContent())?.trim() || "";
  await first.click();
  await expect(page).toHaveURL(/#\/customer\//);
  await expect(page.getByTestId("customerName")).toHaveText(name);

  // 6. Enter Time workspace is open
  await expect(page.getByTestId("enterTime").getByRole("heading", { name: "Enter Time" })).toBeVisible();
  const save = page.locator("#saveEntryBtn");
  await expect(save).toBeDisabled();

  // 7. Choose 1.5 hours
  await page.locator('.duration-chip[data-minutes="90"]').click();
  await expect(page.locator('.duration-chip[data-minutes="90"]')).toHaveAttribute("aria-pressed", "true");
  await expect(save).toBeEnabled();

  // 8. Save → 9. confirmation
  await save.click();
  await expect(page.locator("#toast")).toContainText(`Saved 1.5 hours for ${name}`);
  await expect(page.locator("#entryMessage")).toContainText("Saved 1.5 hours");
  await expect(page.getByTestId("customerToday")).toHaveText("1.5 h");
  await expect(page.getByTestId("customerEntries").locator(".entry-row")).toHaveCount(1);
  await expect(page.getByTestId("customerEntries")).toContainText("1.5 h");

  // 10. Entry appears in history
  await page.locator('.top-nav [data-nav="history"]').click();
  await expect(page).toHaveURL(/#\/history/);
  await expect(page.locator(".history-day")).toHaveCount(1);
  await expect(page.locator(".history-day").first()).toContainText(name);
  await expect(page.locator(".history-day").first()).toContainText("1.5 h");
  await expect(page.locator(".history-day").first()).toContainText("Saved");
  await expect(page.getByTestId("historyWeekTotal")).toHaveText("1.5 h");

  // 11. Dashboard totals reflect the new entry
  await page.locator('.top-nav [data-nav="home"]').click();
  await expect(page.getByTestId("todayTotal")).toHaveText("1.5 h");
  await expect(page.getByTestId("weekTotal")).toHaveText("1.5 h");
  await expect(page.getByTestId("weekBreakdown").locator("li.is-today b")).toHaveText("1.5 h");
  await expect(page.locator(".recent-row")).toHaveCount(1);
  await expect(page.locator(".recent-row").first()).toContainText(name);

  // 12. Repeat for another customer without friction
  await page.locator('.top-nav [data-nav="portfolio"]').click();
  const second = page.locator(".customer-card").nth(1);
  const name2 = (await second.locator(".customer-name").textContent())?.trim() || "";
  await second.click();
  await page.locator('.duration-chip[data-minutes="120"]').click();
  await page.locator("#saveEntryBtn").click();
  await expect(page.locator("#toast")).toContainText(`Saved 2 hours for ${name2}`);
  await page.locator('.top-nav [data-nav="home"]').click();
  await expect(page.getByTestId("todayTotal")).toHaveText("3.5 h");
  await expect(page.getByTestId("weekTotal")).toHaveText("3.5 h");
  await expect(page.locator(".recent-row")).toHaveCount(2);

  // Portfolio cards show the recorded status
  await page.locator('.top-nav [data-nav="portfolio"]').click();
  await expect(page.locator(".customer-card.state-today")).toHaveCount(2);
  await expect(page.locator(".customer-card").first()).toContainText("Today • 1.5 h");
});

test("multiple entries for the same customer do not overwrite each other", async ({ page }) => {
  await page.goto("/#/customer/cust_001");
  await page.locator('.duration-chip[data-minutes="30"]').click();
  await page.locator("#saveEntryBtn").click();
  await expect(page.locator("#toast")).toContainText("Saved 0.5 hours");
  await page.locator('.duration-chip[data-minutes="60"]').click();
  await page.locator("#saveEntryBtn").click();
  await expect(page.getByTestId("customerEntries").locator(".entry-row")).toHaveCount(2);
  await expect(page.getByTestId("customerToday")).toHaveText("1.5 h");
});

test("entries persist across a page refresh", async ({ page }) => {
  await page.goto("/#/customer/cust_003");
  await page.locator('.duration-chip[data-minutes="150"]').click();
  await page.locator("#saveEntryBtn").click();
  await expect(page.locator("#toast")).toContainText("Saved 2.5 hours");

  await page.reload();
  await expect(page.getByTestId("customerToday")).toHaveText("2.5 h");
  await expect(page.getByTestId("customerEntries").locator(".entry-row")).toHaveCount(1);
  await page.goto("/#/");
  await expect(page.getByTestId("todayTotal")).toHaveText("2.5 h");
});

test("bulk time entry creates one entry per selected customer", async ({ page }) => {
  await page.goto("/#/portfolio");
  await page.locator("#bulkModeBtn").click();
  await expect(page.locator("#selectionBar")).toBeVisible();
  await expect(page.locator("#enterSelectedBtn")).toBeDisabled();
  await page.locator(".customer-card").nth(0).click();
  await page.locator(".customer-card").nth(1).click();
  await page.locator(".customer-card").nth(2).click();
  await expect(page.locator("#selectedCount")).toHaveText("3 customers selected");
  await expect(page.locator(".customer-card.selected")).toHaveCount(3);
  // Deselect one by tapping again
  await page.locator(".customer-card").nth(2).click();
  await expect(page.locator("#selectedCount")).toHaveText("2 customers selected");

  await page.locator("#enterSelectedBtn").click();
  await expect(page).toHaveURL(/#\/bulk/);
  await expect(page.getByTestId("bulkCount")).toContainText("2 customers selected");
  await page.locator('.duration-chip[data-minutes="60"]').click();
  await page.locator("#bulkSaveBtn").click();
  await expect(page.locator("#toast")).toContainText("Saved 1 hour for 2 customers");
  await expect(page).toHaveURL(/#\/portfolio/);
  await expect(page.locator("#selectionBar")).toBeHidden();
  await expect(page.locator(".customer-card.state-today")).toHaveCount(2);

  await page.goto("/#/history");
  await expect(page.locator(".history-day .entry-row")).toHaveCount(2);
  await expect(page.getByTestId("historyWeekTotal")).toHaveText("2.0 h");
});

test("yesterday's entry lands on the right day and in weekly totals", async ({ page }) => {
  await page.goto("/#/customer/cust_002");
  await page.getByRole("button", { name: "Yesterday" }).click();
  await page.locator('.duration-chip[data-minutes="240"]').click();
  await page.locator("#saveEntryBtn").click();
  await expect(page.locator("#toast")).toContainText("Saved 4 hours");
  await expect(page.getByTestId("customerToday")).toHaveText("0.0 h");
  await page.goto("/#/history");
  await expect(page.locator(".history-day").first().getByRole("heading")).toContainText(/Yesterday|\w{3}, \w{3} \d+/);
  await expect(page.locator(".history-day").first()).toContainText("4.0 h");
});

test("entry detail opens from history and can be deleted", async ({ page }) => {
  await page.goto("/#/customer/cust_004");
  await page.locator('.duration-chip[data-minutes="90"]').click();
  await page.locator("#saveEntryBtn").click();
  await expect(page.locator("#toast")).toContainText("Saved");
  await page.goto("/#/history");
  await page.locator("#historyScreen .entry-row").first().click();
  await expect(page).toHaveURL(/#\/entry\//);
  await expect(page.getByTestId("entryDuration")).toHaveText("1.5 h");
  page.once("dialog", (d) => d.accept());
  await page.locator("#deleteEntryBtn").click();
  await expect(page).toHaveURL(/#\/history/);
  await expect(page.locator(".history-day")).toHaveCount(0);
});

test("no reference-app terminology appears in the rendered UI", async ({ page }) => {
  const forbidden = /\b(soccer|coach|coaches|player|players|evaluation|evaluations|roster|jersey|team|teams|rating|ratings)\b/i;
  for (const route of ["/#/", "/#/portfolio", "/#/customer/cust_001", "/#/history", "/#/bulk"]) {
    await page.goto(route);
    await page.waitForTimeout(100);
    const text = await page.locator("body").innerText();
    expect(text, `route ${route}`).not.toMatch(forbidden);
  }
});

test("key touch targets are at least 44px tall", async ({ page }) => {
  await page.goto("/#/customer/cust_001");
  for (const sel of [".duration-chip", "#saveEntryBtn", ".chip", ".back-btn", ".top-nav button"]) {
    const boxes = await page.locator(sel).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    for (const h of boxes) expect(h, sel).toBeGreaterThanOrEqual(44);
  }
  await page.goto("/#/portfolio");
  const cardHeights = await page.locator(".customer-card").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  for (const h of cardHeights) expect(h).toBeGreaterThanOrEqual(100);
});

test("layout has no horizontal overflow", async ({ page }) => {
  for (const route of ["/#/", "/#/portfolio", "/#/customer/cust_001", "/#/history"]) {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `route ${route}`).toBeLessThanOrEqual(1);
  }
});
