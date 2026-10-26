/* Clarix app page script
   - Login screen: upright (portrait), normal phone layout.
   - Every other screen: sideways (landscape), laid out at desktop width and
     scaled to fit, so it looks like Clarix on a laptop.
   - Login boxes work with the phone's own password manager; the app itself
     stores no user IDs or passwords. */
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

    if (mode === 'login') labelLoginBoxes();
    else {
      if (prev === 'login' && attempted) callNative('loginSucceeded');
      attempted = false;
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

  /* ---------- phone password manager ----------
     The app stores nothing. It labels the login boxes so the phone's password
     manager recognises them (suggests saved logins when the user ID box is tapped),
     and after a successful login asks the phone to offer "Save password?". */
  function usernameField(pw) {
    var scopes = [pw && pw.form, pw && pw.closest('.modal, .card, section, main, div'), document];
    for (var s = 0; s < scopes.length; s++) {
      var scope = scopes[s];
      if (!scope) continue;
      var named = scope.querySelectorAll('input[name="username"], input#username, input[name="login"], input[name="userId"], input[name="userid"], input[name="email"], input[type="email"], input[autocomplete="username"]');
      for (var i = 0; i < named.length; i++) if (visible(named[i])) return named[i];
      var inputs = scope.querySelectorAll('input[type="text"], input:not([type])');
      for (var j = 0; j < inputs.length; j++) if (visible(inputs[j])) return inputs[j];
    }
    return null;
  }

  function labelLoginBoxes() {
    var pw = passwordField();
    if (!pw) return;
    if (pw.getAttribute('autocomplete') !== 'current-password') pw.setAttribute('autocomplete', 'current-password');
    var user = usernameField(pw);
    if (user && user.getAttribute('autocomplete') !== 'username') user.setAttribute('autocomplete', 'username');
  }

  /* remember that Sign in was pressed, so the save offer is made only if it worked */
  var attempted = false;
  function markAttempt() {
    var pw = passwordField();
    if (pw && pw.value) attempted = true;
  }
  document.addEventListener('submit', markAttempt, true);
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('button, input[type="submit"], [role="button"]');
    if (b) markAttempt();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter') markAttempt(); }, true);

  /* ---------- watch for screen changes ---------- */
  var timer = null;
  var startedAt = Date.now();
  function check() {
    timer = null;
    /* on a cold start, wait for the page to draw before deciding (avoids a sideways flip on the login screen) */
    if (mode === null && !hasToken() && !passwordField() && Date.now() - startedAt < 4000) return;
    var next = isLoginScreen() ? 'login' : 'app';
    applyMode(next);
    if (mode === 'login') labelLoginBoxes();
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
