# TimeEntry — TAM Time Entry

A fast, card-based time entry application for Technical Account Managers (TAMs).

The core workflow is deliberately short:

**Home → My Portfolio → Customer → Enter Time → Save**

TimeEntry is a member of the same product family as the existing field-entry prototype and
reuses its interaction model (one screen at a time, card grids, multi-select bulk workflow,
sticky header, local persistence) while modelling a TAM business domain.

## Run

There is no build step. The app is static HTML/CSS/JS using ES modules, so it must be served
over HTTP (opening `index.html` directly from the file system blocks module loading).

```bash
npm install
npm run dev          # http://127.0.0.1:4173
```

Any static host (for example GitHub Pages) can serve the repository root as-is.

## Validate

```bash
npm run build        # syntax + module-graph check (no bundler)
npm run typecheck    # tsc --checkJs over JSDoc types
npm run lint         # eslint
npm run test:unit    # node --test  (domain, repositories, service, terminology guard)
npm run test:e2e     # Playwright acceptance flow on desktop + mobile viewports
npm test             # unit + e2e
```

## Architecture

```
index.html, styles.css          shell + design tokens (navy / gold / white cards)
src/app.js                      composition root: wires data → application → UI
src/domain/                     pure domain code, no DOM, no storage
  duration.js                   minutes-based duration options and formatting
  dates.js                      ISO dates, Monday-first weeks
  models.js                     Tam, Portfolio, Customer, TimeEntry (+ status model)
  validation.js                 time entry validation
  totals.js                     daily / weekly / per-customer totals from durationMinutes
src/data/                       persistence boundaries
  storage.js                    KeyValueStorage (localStorage or memory)
  seed.js                       fictional demo TAM, portfolio and customers
  customerRepository.js         CustomerRepository (seeded now, Salesforce later)
  portfolioRepository.js        PortfolioRepository (TAM → Portfolio → Customers)
  timeEntryRepository.js        TimeEntryRepository (local, versioned envelope)
  timeEntryDestination.js       TimeEntryDestination (submission boundary, local no-op)
src/app/                        application layer
  session.js                    current TAM
  timeEntryService.js           the API the UI uses: record / bulk / update / delete / summaries
src/ui/                         screens and shared controls (hash router, one <section> per screen)
tests/unit/                     node:test
tests/e2e/                      Playwright
```

Rules the code follows:

- `durationMinutes` is the only stored duration. Hours are formatted for display only.
- Dates are `YYYY-MM-DD` local calendar strings. Weeks start on Monday.
- The UI never touches storage directly; it goes through `TimeEntryService`, which goes through
  repositories. Swapping localStorage for an API means replacing one repository class.
- Status model: `draft` → `saved` → `submitted`. TE0 saves entries as `saved`; `submitted` is
  reached only via the `TimeEntryDestination` boundary (not exposed in the TE0 UI).

## Data safety

Only fictional demo customers are seeded. No credentials, tokens or Salesforce connectivity
exist in this repository. Entries are stored in the browser's localStorage on the device.
