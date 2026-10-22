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

  /* ---------- Power BI reports ---------- */
  var CUSTOM = 1, MOBILE_PORTRAIT = 2, FIT_TO_PAGE = 0, FIT_TO_WIDTH = 1;
  var fullHost = null, btn = null;

  var pbiCss = [
    '.clarix-pbi-full { position: fixed !important; top: 0 !important; left: 0 !important;',
    '  right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important;',
    '  max-width: none !important; min-height: 0 !important; margin: 0 !important;',
    '  z-index: 2147483640 !important; background: #fff !important; }',
    'html.clarix-pbi-lock, html.clarix-pbi-lock body { overflow: hidden !important; }',
    '#clarix-pbi-full-btn { position: fixed; right: 14px; bottom: 18px; z-index: 2147483647;',
    '  background: #1d4ed8; color: #fff; border: 0; border-radius: 22px; padding: 10px 16px;',
    '  font: 600 14px system-ui, -apple-system, Roboto, sans-serif; box-shadow: 0 4px 14px rgba(0,0,0,.25); }',
    '#clarix-pbi-full-btn.clarix-full { top: 8px; bottom: auto; right: 8px; padding: 6px 12px;',
    '  font-size: 13px; background: rgba(17,24,39,.75); }'
  ].join('\n');

  function addPbiStyle() {
    if (document.getElementById('clarix-pbi-style')) return;
    var s = document.createElement('style');
    s.id = 'clarix-pbi-style';
    s.textContent = pbiCss;
    (document.head || document.documentElement).appendChild(s);
  }

  function nativeLandscape(on) {
    try {
      var C = window.Capacitor;
      if (!C) return;
      var P = (C.Plugins && C.Plugins.ClarixNative) ||
              (C.registerPlugin ? C.registerPlugin('ClarixNative') : null);
      if (P) settle(P.setLandscape({ on: !!on }));
    } catch (e) {}
  }

  function settle(p) { if (p && p.catch) p.catch(function () {}); }

  function setImp(el, prop, val) { el.style.setProperty(prop, val, 'important'); }

  function findEmbedHost(iframe) {
    var el = iframe;
    for (var i = 0; el && i < 8; i++, el = el.parentElement) {
      if (el.powerBiEmbed) return el;
    }
    return null;
  }

  function isReport(host) {
    var e = host.powerBiEmbed;
    if (!e || typeof e.updateSettings !== 'function') return false;
    var t = e.embedtype || (e.config && e.config.type);
    return !t || String(t).toLowerCase() === 'report';
  }

  function reportHosts() {
    var out = [];
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
      if ((frames[i].getAttribute('src') || '').indexOf('powerbi') === -1) continue;
      var h = findEmbedHost(frames[i]);
      if (h && out.indexOf(h) === -1 && isReport(h)) out.push(h);
    }
    return out;
  }

  function styleFrame(host) {
    var f = host.querySelector('iframe');
    if (f) { setImp(f, 'width', '100%'); setImp(f, 'height', '100%'); f.style.border = '0'; }
  }

  /* does the current report page have a phone layout saved in Power BI? */
  function checkMobileLayout(host) {
    if (host.__clarixHasMobile !== undefined) return Promise.resolve(host.__clarixHasMobile);
    try {
      return host.powerBiEmbed.getActivePage().then(function (page) {
        host.__clarixPageSize = page.defaultSize;
        return page.hasLayout ? page.hasLayout(MOBILE_PORTRAIT) : false;
      }).then(function (has) {
        host.__clarixHasMobile = !!has;
        return host.__clarixHasMobile;
      }).catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  /* upright phone: phone layout if it exists, otherwise desktop page fitted to width, no blank space */
  function layoutInline(host) {
    if (host === fullHost || window.innerWidth > 900) return;
    host.__clarixW = window.innerWidth;
    checkMobileLayout(host).then(function (hasMobile) {
      if (host === fullHost) return;
      setImp(host, 'width', '100%');
      setImp(host, 'max-width', '100%');
      styleFrame(host);
      var h;
      if (hasMobile) {
        var top = Math.max(0, host.getBoundingClientRect().top + window.scrollY);
        h = Math.max(480, window.innerHeight - Math.min(top, 160) - 8);
        settle(host.powerBiEmbed.updateSettings({ layoutType: MOBILE_PORTRAIT }));
      } else {
        var sz = host.__clarixPageSize;
        var ratio = (sz && sz.width && sz.height) ? sz.height / sz.width : 9 / 16;
        h = Math.round(host.clientWidth * ratio) + 8;
        settle(host.powerBiEmbed.updateSettings({
          layoutType: CUSTOM, customLayout: { displayOption: FIT_TO_WIDTH }
        }));
      }
      setImp(host, 'height', h + 'px');
      setImp(host, 'min-height', h + 'px');
    });
  }

  function enterFull(host) {
    fullHost = host;
    host.__clarixSaved = host.getAttribute('style') || '';
    host.classList.add('clarix-pbi-full');
    document.documentElement.classList.add('clarix-pbi-lock');
    styleFrame(host);
    nativeLandscape(true);
    settle(host.powerBiEmbed.updateSettings({
      layoutType: CUSTOM, customLayout: { displayOption: FIT_TO_PAGE }
    }));
    updateButton();
  }

  function autoFull(host) {
    host.__clarixAutoPending = true;
    setTimeout(function () {
      if (!fullHost && !host.__clarixUserExited && document.body.contains(host)) enterFull(host);
    }, 700);
  }

  function exitFull() {
    var host = fullHost;
    if (host) host.__clarixUserExited = true;
    fullHost = null;
    nativeLandscape(false);
    document.documentElement.classList.remove('clarix-pbi-lock');
    if (host) {
      host.classList.remove('clarix-pbi-full');
      host.setAttribute('style', host.__clarixSaved || '');
      setTimeout(function () { layoutInline(host); }, 600);
    }
    updateButton();
  }
  window.__clarixExitFull = exitFull;

  function updateButton() {
    var hosts = reportHosts();
    if (fullHost && hosts.indexOf(fullHost) === -1) { exitFull(); return; } /* navigated away */
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'clarix-pbi-full-btn';
      btn.type = 'button';
      btn.addEventListener('click', function () {
        if (fullHost) { exitFull(); return; }
        var h = reportHosts()[0];
        if (h) enterFull(h);
      });
    }
    if (!btn.parentNode && document.body) document.body.appendChild(btn);
    btn.textContent = fullHost ? '✕  Exit full screen' : '⤢  Full screen';
    btn.className = fullHost ? 'clarix-full' : '';
    btn.style.display = (fullHost || hosts.length) ? 'block' : 'none';
  }

  function fixPowerBI() {
    addPbiStyle();
    var hosts = reportHosts();
    for (var i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      if (!host.__clarixHooked && typeof host.powerBiEmbed.on === 'function') {
        host.__clarixHooked = true;
        var relayout = (function (h) {
          return function () { h.__clarixHasMobile = undefined; h.__clarixW = 0; layoutInline(h); };
        })(host);
        host.powerBiEmbed.on('loaded', relayout);
        host.powerBiEmbed.on('pageChanged', relayout);
      }
      if (host !== fullHost && host.__clarixW !== window.innerWidth) layoutInline(host);
    }
    /* open dashboards straight in landscape full screen, fitted to the screen */
    if (!fullHost) {
      for (var j = 0; j < hosts.length; j++) {
        if (!hosts[j].__clarixUserExited && !hosts[j].__clarixAutoPending) {
          autoFull(hosts[j]);
          break;
        }
      }
    }
    updateButton();
  }

  var timer = null;
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { addStyle(); fitWide(); fixPowerBI(); }, 300);
  }

  function start() {
    addStyle();
    fixViewport();
    fitWide();
    fixPowerBI();
    /* reports load late — check again a few times after start */
    [1500, 4000, 8000].forEach(function (t) { setTimeout(fixPowerBI, t); });
    /* single-page app: re-check whenever the page content changes */
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
