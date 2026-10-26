/* Clarix app page script
   - Login screen: upright (portrait), normal phone layout.
   - Every other screen: sideways (landscape), laid out at desktop width and
     scaled to fit, so it looks like Clarix on a laptop.
   - Remembers the user ID and password after a successful login and fills
     them in next time (stored encrypted on the phone by the app). */
(function () {
  if (window.__clarixPageScript) return;
  window.__clarixPageScript = true;

  var DESKTOP_WIDTH = 1280;
  var TOKEN_KEY = 'jhi-authenticationToken';

  /* ---------- talking to the app ---------- */
  function plugin() {
    var C = window.Capacitor;
    if (!C) return null;
    return (C.Plugins && C.Plugins.ClarixNative) ||
           (C.registerPlugin ? C.registerPlugin('ClarixNative') : null);
  }
  function callNative(method, args) {
    try {
      var P = plugin();
      if (P && typeof P[method] === 'function') {
        var r = P[method](args || {});
        if (r && r.catch) return r.catch(function () { return null; });
        return Promise.resolve(r);
      }
    } catch (e) {}
    return Promise.resolve(null);
  }

  /* ---------- which screen are we on? ---------- */
  function visible(el) { return !!(el && el.getClientRects().length && !el.disabled); }

  function passwordField() {
    var ps = document.querySelectorAll('input[type="password"]');
    for (var i = 0; i < ps.length; i++) if (visible(ps[i])) return ps[i];
    return null;
  }

  function hasToken() {
    try { return !!(localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)); }
    catch (e) { return false; }
  }

  function isLoginScreen() {
    var path = (location.pathname + location.hash).toLowerCase();
    if (/\/account\/(password|reset|register|activate)/.test(path)) return false;
    if (/\/(login|signin|sign-in)(\/|\?|$)/.test(path)) return true;
    return !!passwordField() && !hasToken();
  }

  /* ---------- layout ---------- */
  function setViewport(content) {
    if (!document.head) return;
    var m = document.querySelector('meta[name="viewport"]');
    if (!m) { m = document.createElement('meta'); m.name = 'viewport'; document.head.appendChild(m); }
    if (m.getAttribute('content') !== content) m.setAttribute('content', content);
  }
  function viewportFor(mode) {
    return mode === 'login'
      ? 'width=device-width, initial-scale=1'
      : 'width=' + DESKTOP_WIDTH + ', user-scalable=yes, maximum-scale=5';
  }

  var mode = null;

  function applyMode(next) {
    if (next === mode) return;
    var prev = mode;
    mode = next;
    setViewport(viewportFor(mode));
    callNative('setOrientation', { mode: mode === 'login' ? 'portrait' : 'landscape' });

    if (mode === 'login') {
      filledThisVisit = false;
      fillSavedLogin();
    } else {
      if (prev === 'login' && pending) { callNative('saveLogin', pending); }
      pending = null;
      ensureFitted();
    }
  }

  /* If the page didn't zoom out to the desktop width after turning, reload once. */
  function ensureFitted() {
    setTimeout(function () {
      var vv = window.visualViewport;
      if (mode !== 'app' || !vv || vv.width >= DESKTOP_WIDTH * 0.85) return;
      var last = 0;
      try { last = +sessionStorage.getItem('clarixFitReload') || 0; } catch (e) {}
      if (Date.now() - last < 15000) return;
      try { sessionStorage.setItem('clarixFitReload', String(Date.now())); } catch (e) {}
      location.reload();
    }, 1500);
  }

  /* ---------- remember user ID & password ---------- */
  var pending = null;          /* typed on the login screen, saved once login succeeds */
  var filledThisVisit = false;

  function usernameField(pw) {
    var scope = (pw && pw.form) || document;
    var named = scope.querySelector('input[name="username"], input#username, input[name="login"], input[name="email"], input[type="email"]');
    if (visible(named)) return named;
    var inputs = scope.querySelectorAll('input[type="text"], input:not([type])');
    for (var i = 0; i < inputs.length; i++) if (visible(inputs[i])) return inputs[i];
    return null;
  }

  function setReactValue(el, value) {
    var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fillSavedLogin() {
    if (filledThisVisit) return;
    var pw = passwordField();
    if (!pw) return;
    filledThisVisit = true;
    callNative('getLogin').then(function (saved) {
      if (!saved || !saved.username || !saved.password) return;
      var pwNow = passwordField();
      if (!pwNow) return;
      var user = usernameField(pwNow);
      if (user && !user.value) setReactValue(user, saved.username);
      if (!pwNow.value) setReactValue(pwNow, saved.password);
      var remember = document.querySelector('input[type="checkbox"][name="rememberMe"], input[type="checkbox"]#rememberMe');
      if (remember && !remember.checked) remember.click();
    });
  }

  function captureLogin() {
    if (mode !== 'login') return;
    var pw = passwordField();
    var user = usernameField(pw);
    if (pw && user && pw.value && user.value) pending = { username: user.value, password: pw.value };
  }
  document.addEventListener('submit', captureLogin, true);
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('button, input[type="submit"]');
    if (b) captureLogin();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter') captureLogin(); }, true);

  /* ---------- watch for screen changes ---------- */
  var timer = null;
  var startedAt = Date.now();
  function check() {
    timer = null;
    /* on a cold start, wait for the page to draw before deciding (avoids a sideways flip on the login screen) */
    if (mode === null && !hasToken() && !passwordField() && Date.now() - startedAt < 4000) return;
    var next = isLoginScreen() ? 'login' : 'app';
    applyMode(next);
    if (mode === 'login') fillSavedLogin();
    /* keep our viewport if the site rewrites it */
    setViewport(viewportFor(mode));
  }
  function schedule() { if (!timer) timer = setTimeout(check, 250); }

  function start() {
    check();
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('hashchange', schedule);
    window.addEventListener('popstate', schedule);
    window.addEventListener('storage', schedule);
    setInterval(check, 2000);
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
