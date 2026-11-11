# Blacklite - Bold Override (Chrome Extension)

A Manifest V3 Chrome extension that adds a toolbar button next to the
address bar. Clicking it toggles a style override that disables bold
text (`font-weight: normal !important`) on the **current site**.
Google sites (google.com, Gmail, YouTube, and regional Google domains)
are always excluded and the button is disabled on them.

> **Why Manifest V3?** Chrome fully disabled Manifest V2 extensions
> starting with Chrome 138 (July 2025) and removed remaining MV2
> listings from the Web Store by August 2026, so an MV2 build would no
> longer load in current Chrome.

## How it works

- `manifest.json` - MV3 manifest declaring the toolbar action, the
  background service worker, and a content script injected on every
  page except Google domains.
- `background.js` - Service worker that listens for the toolbar
  button click, flips the per-site toggle state in
  `chrome.storage.local`, updates the badge ("ON"/blank - shown when
  the override is **off**, as a reminder), and messages the content
  script (falling back to `chrome.scripting.executeScript` if the
  content script isn't present yet).
- `content.js` - Applies/removes the `blacklite-no-bold` class on
  `<html>` based on stored state and on messages from the background
  script.
- `override.css` - CSS rule scoped to
  `html.blacklite-no-bold` that forces normal font weight everywhere.
- `icons/` - Toolbar/store icons (32/48/128 px), scaled down from
  `D:\github\BlackIncNano\src\BlackIncNano.png`.

State is stored per-hostname, so the override persists per site across
page reloads and browser restarts, independent of other sites.

## Load it in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this folder
   (`D:\azure\blacklite-new`).
4. Pin the "Blacklite - Bold Override" icon to the toolbar if desired.
5. Visit any non-Google site and click the icon to toggle the bold
   override. The badge shows "ON" while the override is **off** (as a
   reminder that bold text is still showing normally); it clears once
   you click to turn the override on. The button is disabled (greyed
   out) on Google sites.

## Notes / next steps

- Icons (`icons/icon32.png`, `icon48.png`, `icon128.png`) are scaled
  from `D:\github\BlackIncNano\src\BlackIncNano.png`; re-run the scaling
  step if that source image changes.
- The Google-domain exclusion list in `manifest.json` and the
  `GOOGLE_HOST_PATTERN` regex in `background.js`/`content.js` cover the
  most common Google properties; add more domains there if needed.
