/* Clarix app — desktop view on phones.
   The app runs in landscape and lays every page out at a desktop width,
   then Android scales it down to fit the screen, so pages (including the
   embedded Power BI reports) look the same as on a laptop. */
(function () {
  if (window.__clarixDesktopView) return;
  window.__clarixDesktopView = true;

  var DESKTOP_WIDTH = 1280;

  function setDesktopViewport() {
    if (!document.head) return;
    var m = document.querySelector('meta[name="viewport"]');
    if (!m) {
      m = document.createElement('meta');
      m.name = 'viewport';
      document.head.appendChild(m);
    }
    /* no initial-scale: Android zooms out so the whole width fits the screen.
       no viewport-fit=cover: keeps content clear of the phone's status bar. */
    var want = 'width=' + DESKTOP_WIDTH + ', user-scalable=yes, maximum-scale=5';
    if (m.getAttribute('content') !== want) m.setAttribute('content', want);
  }

  function start() {
    setDesktopViewport();
    /* the website may rewrite the viewport tag on navigation — keep ours */
    new MutationObserver(setDesktopViewport)
      .observe(document.head, { childList: true, subtree: true, attributes: true });
  }

  if (document.head) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
