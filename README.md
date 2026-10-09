# TimeEntry — Colleague Package

This branch is a clean, shareable snapshot of the current TimeEntry solution (web app Prototype v63 + Salesforce Transfer extension).

## Included

- `index.html` — TimeEntry web application shell
- `app.js` — current TimeEntry application logic
- `styles.css` — current application styling
- `transfer.html` — laptop transfer/import page
- `chrome-extension/` — Chrome extension used to transfer saved TimeEntry records into Salesforce
- `.nojekyll` — GitHub Pages static hosting compatibility

Older prototype/version files have intentionally been removed from this branch.

## Web app

The app is static HTML/CSS/JavaScript. It can be hosted on GitHub Pages or another static web host.

For local testing, serve this folder with any simple HTTP server rather than opening `index.html` directly from the filesystem.

## Chrome extension

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `chrome-extension` folder.
5. Open Salesforce Time Tracking.
6. Use **Fill Current Entry** first to validate the field mapping.
7. Once validated, use **Fill + Save & New** or **Run Entire Queue**.

The extension stores its queue and account mapping in Chrome local storage.

## Salesforce flow

The extension fills these Time Tracking fields:

1. Account
2. Date
3. Type
4. Number of Hours
5. Details

It then uses Salesforce **Save & New** to process the remaining queue.

The package also contains the current historical-capture functionality in the extension.

## Important internal-data note

This source snapshot contains internal account-code mappings and historical Time Tracking data from the working prototype. Share only with an authorized colleague. If the package will be distributed more broadly, sanitize those mappings and historical records first.

## Current versions

- Web app: Prototype v63
- Salesforce Transfer extension: see `chrome-extension/manifest.json`

## Original repository

`Carlos-Aguirre1/TimeEntry`

This branch exists only as a clean colleague/share package. Development should continue on `main`.
