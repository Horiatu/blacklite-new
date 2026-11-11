/*
 * Blacklite background service worker (Manifest V3).
 * Tracks per-site toggle state in chrome.storage.local and keeps the
 * toolbar action's badge/enabled-state in sync with the active tab.
 */

const TOGGLE_CLASS = "blacklite-bold-active";
const BADGE_COLOR = "#1a73e8";
// Matches google.com, google.co.uk, google.de, etc. so the extension never
// activates on Google's own properties.
const GOOGLE_HOST_PATTERN = /(^|\.)google\.[a-z.]{2,}$/i;

function isGoogleUrl(url) {
  try {
    return GOOGLE_HOST_PATTERN.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isTogglableUrl(url) {
  return Boolean(url) && /^https?:\/\//i.test(url) && !isGoogleUrl(url);
}

async function getActiveState(hostname) {
  debugger;
  const result = await chrome.storage.local.get(hostname);
  return Boolean(result[hostname]);
}

async function updateActionForTab(tabId, url) {
 if (!isTogglableUrl(url)) {
    await chrome.action.disable(tabId);
    await chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }

  await chrome.action.enable(tabId);
  const hostname = new URL(url).hostname;
  const active = await getActiveState(hostname);
  await chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR });
  // Badge shows "ON" when the override is OFF, so it only appears as a
  // reminder while bold text is still showing normally on the page.
  await chrome.action.setBadgeText({ tabId, text: active ? "ON" : "" });
}

// Re-applies updateActionForTab to every open tab whose hostname's stored
// state just changed, so all tabs on that site (not just the one that
// triggered the change) stay in sync with chrome.storage.
async function syncTabsForHosts(hostnames) {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.map((tab) => {
      if (tab.id === undefined || !isTogglableUrl(tab.url)) {
        return undefined;
      }
      if (!hostnames.has(new URL(tab.url).hostname)) {
        return undefined;
      }
      return updateActionForTab(tab.id, tab.url);
    })
  );
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    updateActionForTab(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  updateActionForTab(tabId, tab.url);
});

// Whenever a site's stored toggle state changes (from a click, another
// tab, or any other writer), re-sync every open tab for that site via
// updateActionForTab so the badge never drifts from chrome.storage.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }
  syncTabsForHosts(new Set(Object.keys(changes)));
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!isTogglableUrl(tab.url)) {
    return;
  }

  const hostname = new URL(tab.url).hostname;
  const nextActive = !(await getActiveState(hostname));
  await chrome.storage.local.set({ [hostname]: nextActive });
  // Badge updates are handled by the storage.onChanged listener above.

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "BLACKLITE_TOGGLE", active: nextActive });
  } catch {
    // Content script may not be injected yet (e.g. page loaded before install).
    // Fall back to direct injection via the scripting API.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: (className, active) => {
        document.body.classList.toggle(className, active);
      },
      args: [TOGGLE_CLASS, nextActive],
    });
  }
});
