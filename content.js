/*
 * Blacklite content script.
 * Applies/removes the bold-override class on <html> based on the
 * per-site state stored in chrome.storage.local, and reacts to
 * toggle messages sent from the background service worker.
 */

(() => {
  const TOGGLE_CLASS = "blacklite-no-bold";
  const GOOGLE_HOST_PATTERN = /(^|\.)google\.[a-z.]{2,}$/i;

  // Safety net in case this ever runs on a Google host (e.g. redirects).
  if (GOOGLE_HOST_PATTERN.test(location.hostname)) {
    return;
  }

  function applyState(active) {
    document.documentElement.classList.toggle(TOGGLE_CLASS, active);
  }

  const hostname = location.hostname;
  chrome.storage.local.get(hostname, (result) => {
    applyState(Boolean(result[hostname]));
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === "BLACKLITE_TOGGLE") {
      applyState(Boolean(message.active));
    }
  });
})();
