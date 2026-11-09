/* INQVEXA page runtime: reveal-on-scroll, theme toggle, active nav,
   and the state switcher for pre-rendered variants (tabs, journeys, demos).
   Every page is fully server-rendered; this script only toggles which
   pre-rendered variant is visible. It then loads /inqvexa.js (site-wide behaviour). */
(function () {
  'use strict';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- active navigation ---------- */
  function norm(p) { return (p || '/').replace(/\/+$/, '') || '/'; }
  var here = norm(location.pathname);
  document.querySelectorAll('header nav a[href]').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '#' || /^https?:/.test(href)) return;
    var target = norm(href.split('#')[0]);
    var on = target === here || (target !== '/' && here.indexOf(target + '/') === 0);
    if (on) { a.setAttribute('aria-current', 'page'); a.style.color = '#fff'; a.style.fontWeight = '600'; }
    else { a.removeAttribute('aria-current'); a.style.color = '#AFBBCD'; a.style.fontWeight = ''; }
  });

  /* ---------- theme toggle ---------- */
  function currentTheme() { try { return localStorage.getItem('inqvexa-theme') === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; } }
  function paintToggles() {
    var label = currentTheme() === 'light' ? 'Dark mode' : 'Light mode';
    document.querySelectorAll('[data-inq-theme-toggle]').forEach(function (b) { if (!b.querySelector('*')) b.textContent = label; });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-inq-theme-toggle]');
    if (!b) return;
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    if (window.INQVEXATheme && window.INQVEXATheme.set) window.INQVEXATheme.set(next);
    else { try { localStorage.setItem('inqvexa-theme', next); } catch (err) {} root.setAttribute('data-theme', next); }
    setTimeout(paintToggles, 0);
  });

  /* ---------- reveal on scroll ---------- */
  function reveal() {
    var vh = window.innerHeight || 800;
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }) : null;
    function show(el) {
      if (el.hasAttribute('data-rv')) el.setAttribute('data-in', '1');
      if (el.hasAttribute('data-r')) { el.style.opacity = '1'; el.style.transform = 'none'; }
    }
    var rs = Array.prototype.slice.call(document.querySelectorAll('[data-r]'));
    if (!RM) rs.forEach(function (el, i) {
      if (el.getBoundingClientRect().top < vh) return;
      var d = (i % 5) * 70;
      el.style.opacity = '0'; el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity .7s cubic-bezier(.22,.7,.3,1) ' + d + 'ms, transform .7s cubic-bezier(.22,.7,.3,1) ' + d + 'ms';
    });
    var all = document.querySelectorAll('[data-rv],[data-r]');
    all.forEach(function (el) {
      if (RM || !io || el.getBoundingClientRect().top < vh) show(el); else io.observe(el);
    });
    setTimeout(function () { all.forEach(show); }, 3500);
  }

  /* ---------- pre-rendered state variants ---------- */
  function showVariant(axis, value) {
    document.querySelectorAll('[data-sv="' + axis + '"]').forEach(function (el) {
      if (el.getAttribute('data-sv-v') === String(value)) el.removeAttribute('hidden'); else el.setAttribute('hidden', '');
    });
  }
  function states() {
    var node = document.getElementById('inq-sv');
    if (!node) return;
    var cfg; try { cfg = JSON.parse(node.textContent || '{}'); } catch (e) { return; }
    Object.keys(cfg).forEach(function (axis) {
      var c = cfg[axis], vals = c.values;
      if (c.mode === 'tabs') tabs(axis, c);
      else if (c.mode === 'interval') interval(axis, vals, c.ms);
      else if (c.mode === 'timeline') timeline(axis, vals, c.ms, c.reduced);
    });
  }
  function tabs(axis, c) {
    var keys = c.keys || [];
    function detail() {
      var best = null, size = 0;
      document.querySelectorAll('[data-sv="' + axis + '"]:not([hidden])').forEach(function (el) {
        var h = el.getBoundingClientRect().height; if (h > size) { size = h; best = el; }
      });
      return best;
    }
    function go(i, scroll) {
      showVariant(axis, i);
      if (!scroll) return;
      var d = detail(); if (!d) return;
      var bar = document.querySelector('section[data-tabbar]') || document.getElementById(location.pathname.indexOf('/services') === 0 ? 'services' : 'solutions');
      var top = d.getBoundingClientRect().top + window.scrollY - (bar ? bar.offsetHeight : 0);
      root.setAttribute('data-hdr', 'hidden');
      window.scrollTo({ top: Math.max(0, top), behavior: RM ? 'auto' : 'smooth' });
      if (!RM && d.animate) d.querySelectorAll('[data-sd]').forEach(function (el, k) {
        el.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: k * 70, easing: 'cubic-bezier(.22,.7,.3,1)', fill: 'backwards' });
      });
      d.querySelectorAll('details[open]').forEach(function (x) { x.removeAttribute('open'); });
    }
    function fromHash(scroll) {
      var k = decodeURIComponent((location.hash || '').slice(1));
      var i = keys.indexOf(k);
      if (i > -1) go(i, scroll);
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-tab-go]');
      if (!b) return;
      e.preventDefault();
      var i = parseInt(b.getAttribute('data-tab-go'), 10);
      try { history.replaceState(null, '', '#' + keys[i]); } catch (err) {}
      go(i, true);
    });
    window.addEventListener('hashchange', function () { fromHash(true); });
    fromHash(false);
  }
  function interval(axis, vals, ms) {
    var i = 0, t = null, max = vals.length - 1;
    function start() {
      clearInterval(t); i = 0; showVariant(axis, vals[0]);
      if (RM) { showVariant(axis, vals[max]); return; }
      t = setInterval(function () { if (i >= max) { clearInterval(t); return; } i++; showVariant(axis, vals[i]); }, ms || 1400);
    }
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-sv-replay]')) start(); });
    start();
  }
  function timeline(axis, vals, ms, reduced) {
    if (RM) { showVariant(axis, vals[reduced != null ? reduced : vals.length - 1]); return; }
    var i = 0;
    (function step() {
      showVariant(axis, vals[i]);
      var wait = ms[i] || 900;
      i = (i + 1) % vals.length;
      setTimeout(step, wait);
    })();
  }

  function boot() {
    reveal();
    states();
    var s = document.createElement('script');
    s.src = '/inqvexa.js';
    s.onload = paintToggles;
    document.body.appendChild(s);
    paintToggles();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
