/*
 * Blacklite content script.
 * Applies/removes the bold-active class on <body> based on the
 * per-site state stored in chrome.storage.local, and reacts to
 * toggle messages sent from the background service worker.
 */

(() => {
  const TOGGLE_CLASS = "blacklite-bold-active";
  const GOOGLE_HOST_PATTERN = /(^|\.)google\.[a-z.]{2,}$/i;

  // Safety net in case this ever runs on a Google host (e.g. redirects).
  if (GOOGLE_HOST_PATTERN.test(location.hostname)) {
    return;
  }

  function applyState(active) {
    // The script runs at document_start, so <body> may not exist yet;
    // wait for it before toggling the class.
    alert(`applyState called with active: ${active}`);
    if (document.body) {
      document.body.classList.toggle(TOGGLE_CLASS, active);
    } else {
      document.addEventListener(
        "DOMContentLoaded",
        () => document.body.classList.toggle(TOGGLE_CLASS, active),
        { once: true }
      );
    }
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
