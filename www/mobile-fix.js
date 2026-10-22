/* Clarix mobile layout fixes — injected by the Android app on every page load.
   CSS-only adjustments plus inline max-width on over-wide elements.
   It never moves or inserts DOM nodes React owns, so it can't break the app. */
(function () {
  if (window.__clarixMobileFix) return;
  window.__clarixMobileFix = true;

  var css = [
    '@media (max-width: 900px) {',
    '  html, body { max-width: 100%; overflow-x: hidden !important; }',
    '  *, *::before, *::after { box-sizing: border-box; }',
    '  img, video, svg { max-width: 100% !important; height: auto; }',
    '  canvas { max-width: 100% !important; }',
    '  iframe, embed, object { width: 100% !important; max-width: 100% !important; }',
    /* tables scroll sideways instead of stretching the page */
    '  table { display: block !important; width: 100% !important; max-width: 100% !important;',
    '          overflow-x: auto !important; -webkit-overflow-scrolling: touch; }',
    '  th, td { white-space: nowrap; padding: 6px 8px !important; font-size: 13px; }',
    /* bootstrap grid: stack columns full width */
    '  .container, .container-fluid, .container-sm, .container-md, .container-lg, .container-xl {',
    '      max-width: 100% !important; padding-left: 10px !important; padding-right: 10px !important; }',
    '  .row { margin-left: 0 !important; margin-right: 0 !important; }',
    '  .row > [class*="col"] { flex: 0 0 100% !important; max-width: 100% !important; width: 100% !important;',
    '      padding-left: 4px !important; padding-right: 4px !important; }',
    '  .card { margin-bottom: 12px; max-width: 100%; }',
    '  .card-body { padding: 12px !important; }',
    /* popups, menus, buttons, forms */
    '  .modal-dialog { margin: 8px !important; max-width: calc(100% - 16px) !important; }',
    '  .dropdown-menu { max-width: calc(100vw - 16px); }',
    '  .btn-toolbar, .btn-group, .nav-tabs, .pagination { flex-wrap: wrap !important; }',
    '  .nav-tabs { overflow-x: auto; }',
    '  input, select, textarea { font-size: 16px !important; max-width: 100%; }',
    '  h1, .h1 { font-size: 1.5rem !important; } h2, .h2 { font-size: 1.3rem !important; }',
    '  h3, .h3 { font-size: 1.15rem !important; }',
    '}'
  ].join('\n');

  function addStyle() {
    if (document.getElementById('clarix-mobile-fix')) return;
    var s = document.createElement('style');
    s.id = 'clarix-mobile-fix';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  function fixViewport() {
    if (!document.head) return;
    var m = document.querySelector('meta[name="viewport"]');
    if (!m) { m = document.createElement('meta'); m.name = 'viewport'; document.head.appendChild(m); }
    m.content = 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover';
  }

  /* Anything still wider than the screen: cap it, and let it scroll if its content can't shrink */
  function fitWide() {
    var vw = document.documentElement.clientWidth;
    if (!vw || vw > 900 || !document.body) return;
    var els = document.body.getElementsByTagName('*');
    var n = Math.min(els.length, 4000);
    for (var i = 0; i < n; i++) {
      var el = els[i];
      if (el.__clarixFit || el.tagName === 'svg' || el.closest('svg')) continue;
      var r = el.getBoundingClientRect();
      if (r.width > vw + 2) {
        var cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.display === 'inline') continue;
        el.style.maxWidth = '100%';
        el.__clarixFit = true;
        if (el.scrollWidth > el.clientWidth + 4 && el.tagName !== 'TABLE') {
          el.style.overflowX = 'auto';
        }
      }
    }
  }

  var timer = null;
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { addStyle(); fitWide(); }, 300);
  }

  function start() {
    addStyle();
    fixViewport();
    fitWide();
    /* single-page app: re-check whenever the page content changes */
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
