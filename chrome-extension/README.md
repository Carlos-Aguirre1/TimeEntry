# TimeEntry Salesforce Transfer — Chrome Extension

This is an unpacked Manifest V3 Chrome extension for transferring sanitized TimeEntry queue records into a Salesforce Time Tracking form.

## Privacy model

The public repository contains only account codes such as BL / IS / HC.

Real Salesforce account names are entered by the user inside the extension popup and stored in `chrome.storage.local` on that laptop. They are not committed to this repository.

Example local mapping:

```
BL=Real Salesforce Account Name
IS=Another Real Salesforce Account Name
```

## Install in Chrome

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Turn **Developer mode** on.
4. Click **Load unpacked**.
5. Select the repository's `chrome-extension` folder.
6. Pin **TimeEntry Salesforce Transfer** to the Chrome toolbar.

## First Salesforce test

1. Open Salesforce.
2. Open the **New Time Tracking** form manually.
3. In the extension, enter and save the account-code mapping.
4. Paste a TimeEntry JSON queue.
5. Click **Fill Current Entry** first.
6. Confirm Account, Date, Type, Number of Hours, and Details are correct.
7. Only then test **Fill + Save & New**.
8. Use **Run Entire Queue** only after the single-entry test is confirmed.

Salesforce Lightning DOM can differ between organizations. If a field is not detected, take a screenshot of the visible Salesforce form and the extension error so the selectors can be adjusted.
