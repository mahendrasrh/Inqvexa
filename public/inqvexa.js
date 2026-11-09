/* INQVEXA site behaviour — carried over from the approved design (theme.js). */
/* INQVEXA theme engine — property-aware inline-style remapping.
   React serializes inline hex colors to rgb(), so CSS attribute-substring
   overrides are unreliable. This walks [style] elements and rewrites the
   declarations it understands, keeping each element's original style so
   switching back is lossless. */
(function () {
  var KEY = 'inqvexa-theme';

  function norm(v) {
    return v.replace(/\s+/g, '');
  }

  // dark value -> light value, grouped by the kind of property it appears on
  var SURFACE = {
    'rgb(7,17,31)': 'rgb(241, 245, 250)',
    'rgb(11,22,40)': 'rgb(230, 236, 245)',
    'rgb(5,13,24)': 'rgb(222, 230, 241)',
    'rgb(16,29,49)': 'rgb(235, 240, 247)',
    'rgb(21,39,68)': 'rgb(226, 234, 244)',
    'rgb(14,27,46)': 'rgb(255, 255, 255)'
  };
  var INK = {
    'rgb(255,255,255)': 'rgb(11, 22, 40)',
    'rgb(232,237,245)': 'rgb(15, 27, 45)',
    'rgb(220,229,240)': 'rgb(20, 34, 54)',
    'rgb(220,234,246)': 'rgb(20, 34, 54)',
    'rgb(169,183,201)': 'rgb(70, 90, 115)',
    'rgb(159,176,198)': 'rgb(70, 90, 115)',
    'rgb(195,206,221)': 'rgb(62, 80, 103)',
    'rgb(143,160,183)': 'rgb(74, 91, 113)',
    'rgb(175,187,205)': 'rgb(70, 90, 115)',
    'rgb(122,140,165)': 'rgb(97, 116, 140)',
    'rgb(132,148,168)': 'rgb(97, 116, 140)',
    'rgb(95,113,137)': 'rgb(97, 116, 140)',
    'rgb(159,178,204)': 'rgb(97, 116, 140)',
    'rgb(34,211,238)': 'rgb(13, 116, 143)',
    'rgb(127,227,245)': 'rgb(13, 116, 143)',
    'rgb(240,145,63)': 'rgb(186, 71, 20)',
    'rgb(245,195,169)': 'rgb(150, 58, 18)',
    'rgb(226,88,34)': 'rgb(184, 67, 15)'
  };

  function mapSurface(value) {
    var out = value;
    Object.keys(SURFACE).forEach(function (k) {
      var re = new RegExp(k.replace(/[()]/g, '\\$&').replace(/,/g, ',\\s*'), 'gi');
      out = out.replace(re, SURFACE[k]);
    });
    // translucent white panels become solid white cards
    out = out.replace(/rgba\(\s*255,\s*255,\s*255,\s*0?\.0[0-9]+\s*\)/gi, 'rgb(255, 255, 255)');
    // translucent midnight chrome becomes translucent paper
    out = out.replace(/rgba\(\s*7,\s*17,\s*31,\s*[0-9.]+\s*\)/gi, 'rgba(243, 246, 251, 0.88)');
    out = out.replace(/rgba\(\s*11,\s*22,\s*40,\s*[0-9.]+\s*\)/gi, 'rgb(255, 255, 255)');
    out = out.replace(/rgba\(\s*16,\s*29,\s*49,\s*[0-9.]+\s*\)/gi, 'rgb(255, 255, 255)');
    // faint white grid lines need to become faint dark lines
    out = out.replace(/rgba\(\s*255,\s*255,\s*255,\s*0?\.03[0-9]*\s*\)/gi, 'rgba(11, 22, 40, 0.06)');
    return out;
  }

  function mapInk(value) {
    var out = value;
    Object.keys(INK).forEach(function (k) {
      var re = new RegExp(k.replace(/[()]/g, '\\$&').replace(/,/g, ',\\s*'), 'gi');
      out = out.replace(re, INK[k]);
    });
    return out;
  }

  function mapLine(value) {
    var out = value;
    out = out.replace(/rgba\(\s*255,\s*255,\s*255,\s*[0-9.]+\s*\)/gi, 'rgb(214, 223, 235)');
    Object.keys(SURFACE).forEach(function (k) {
      var re = new RegExp(k.replace(/[()]/g, '\\$&').replace(/,/g, ',\\s*'), 'gi');
      out = out.replace(re, 'rgb(214, 223, 235)');
    });
    return out;
  }

  function convert(css) {
    return css.split(';').map(function (decl) {
      var i = decl.indexOf(':');
      if (i < 0) return decl;
      var prop = decl.slice(0, i).trim().toLowerCase();
      var val = decl.slice(i + 1);
      if (prop === 'color' || prop === '-webkit-text-fill-color') return decl.slice(0, i + 1) + mapInk(val);
      if (prop.indexOf('border') === 0 || prop === 'outline' || prop === 'outline-color') {
        return decl.slice(0, i + 1) + mapLine(val);
      }
      if (prop === 'background' || prop === 'background-color' || prop === 'background-image') {
        return decl.slice(0, i + 1) + mapSurface(val);
      }
      if (prop === 'box-shadow') {
        return decl.slice(0, i + 1) + val.replace(/rgba\(\s*0,\s*0,\s*0,\s*[0-9.]+\s*\)/gi, 'rgba(11, 22, 40, 0.12)');
      }
      return decl;
    }).join(';');
  }

  function apply(theme) {
    var light = theme === 'light';
    document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark');
    var nodes = document.querySelectorAll('[style]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var cur = el.getAttribute('style') || '';
      if (el.__inqOrig === undefined || (el.__inqLast !== undefined && cur !== el.__inqLast)) el.__inqOrig = cur;
      var next = light ? convert(el.__inqOrig) : el.__inqOrig;
      if (next !== cur) el.setAttribute('style', next);
      el.__inqLast = next;
    }
    document.body.style.background = light ? '#F4F7FB' : '#07111F';
    document.body.style.color = light ? '#0B1628' : '#E8EDF5';
  }

  function current() {
    try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; }
  }

  function set(theme) {
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    apply(theme);
  }

  // re-apply after React re-renders replace inline styles
  var pending = null;
  function schedule() {
    if (current() !== 'light') return;
    if (pending) return;
    pending = setTimeout(function () { pending = null; apply('light'); }, 60);
  }

  window.INQVEXATheme = { apply: apply, set: set, current: current, schedule: schedule };
  (function () { var s = document.createElement('style'); s.textContent = 'html[data-theme="light"] header{background:rgba(243,246,251,.92)!important;border-bottom-color:rgb(214,223,235)!important}'; (document.head || document.documentElement).appendChild(s); })();

  function autoHideHeader() {
    var st = document.createElement('style');
    st.textContent = 'header{transition:transform .35s cubic-bezier(.22,.7,.3,1)!important;will-change:transform}' +
      'html[data-hdr="hidden"] header{transform:translateY(-110%)!important}' +
      'html[data-hdr="hidden"] section[style*="sticky"]{top:0!important}' +
      'section[style*="sticky"]{transition:top .35s cubic-bezier(.22,.7,.3,1)}';
    document.head.appendChild(st);
    var last = window.scrollY, ticking = false, holdUntil = 0, userScroll = 0;
    function hold() { holdUntil = Date.now() + 900; }
    // only real user scrolling (wheel / touch / keys / scrollbar) may reveal the header
    ['wheel', 'touchmove'].forEach(function (ev) { window.addEventListener(ev, function () { userScroll = Date.now(); }, { passive: true }); });
    window.addEventListener('keydown', function (e) { if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(e.key)) userScroll = Date.now(); });
    window.addEventListener('pointerdown', function (e) { if (e.target === document.documentElement) userScroll = Date.now(); });
    // clicks that change content or jump to anchors keep the header state as it is
    document.addEventListener('click', function (e) { if (!(e.target.closest && e.target.closest('header'))) hold(); }, true);
    window.addEventListener('hashchange', hold);
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        if (document.documentElement.hasAttribute('data-menu-open')) { ticking = false; return; }
        var y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight)), d = y - last, now = Date.now();
        var held = now < holdUntil && now - userScroll > 150;
        if (y < 90) { if (!held || y < 4) document.documentElement.removeAttribute('data-hdr'); }
        else if (d > 6) document.documentElement.setAttribute('data-hdr', 'hidden');
        else if (d < -6 && !held) document.documentElement.removeAttribute('data-hdr');
        if (Math.abs(d) > 6) last = y;
        ticking = false;
      });
    }, { passive: true });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') setTimeout(function () {
        var a = document.activeElement;
        if (a && a.closest && a.closest('header')) document.documentElement.removeAttribute('data-hdr');
      }, 0);
    });
  }

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  function motionLayer() {
    var css = [
      '@keyframes inqPageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
      '@keyframes inqFlow{to{stroke-dashoffset:-40}}',
      '@keyframes inqTravel{0%{offset-distance:0%;opacity:0}8%{opacity:1}92%{opacity:1}100%{offset-distance:100%;opacity:0}}',
      '@keyframes inqBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}',
      '@keyframes inqBreath{0%,100%{opacity:.45}50%{opacity:1}}',
      '@keyframes inqRing{0%{transform:scale(.8);opacity:.7}100%{transform:scale(1.7);opacity:0}}',
      '@keyframes inqSweep{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}',
      '@keyframes vaPulse{0%,100%{box-shadow:0 0 0 0 rgba(226,88,34,.35)}50%{box-shadow:0 0 0 14px rgba(226,88,34,0)}}',
      '@keyframes inqBar{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}',
      '@keyframes inqStep{0%,100%{border-color:rgba(255,255,255,.12)}12%,30%{border-color:rgba(240,145,63,.8);box-shadow:0 0 0 4px rgba(226,88,34,.12)}}',
            '[data-btn]{position:relative;display:inline-flex!important;align-items:center;justify-content:center;gap:0;transform:none!important;transition:background-color .25s ease,border-color .25s ease,color .25s ease,box-shadow .3s ease,scale .15s ease!important}',
      '[data-btn]:focus-visible{outline:2px solid #F0913F;outline-offset:3px}',
      '[data-btn] [data-arw]{display:inline-block;margin-left:8px;transition:transform .3s cubic-bezier(.22,.7,.3,1)}',
      '[data-btn]:hover [data-arw]{transform:translateX(4px)}',
      '[data-btn="primary"]{box-shadow:0 6px 18px rgba(226,88,34,.22)!important}',
      '[data-btn="primary"]:hover{background:#CC4A18!important;color:#fff!important}',
      '[data-btn="ghost"]:hover{border-color:#F0913F!important;background:rgba(240,145,63,.08)!important}',
      'html[data-theme="light"] [data-btn="ghost"]:hover{background:rgba(226,88,34,.06)!important;color:#0B1628!important}',
      'header nav a{position:relative;padding:4px 0}',
      'header nav a::after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:2px;border-radius:2px;background:#E25822;transform:scaleX(0);transform-origin:left;transition:transform .3s cubic-bezier(.22,.7,.3,1)}',
      'header nav a:hover::after,header nav a[aria-current]::after{transform:scaleX(1)}',
      'html[data-scrolled] header{box-shadow:0 10px 30px rgba(5,13,24,.28)}',
      '[data-back]{white-space:nowrap;display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);border-radius:10px;padding:8px 14px 8px 11px;font-size:14px;font-weight:600;color:#DCE5F0!important;margin-bottom:18px;transition:border-color .2s ease,color .2s ease,transform .2s ease}',
      '[data-back]:hover{border-color:#E25822;color:#E25822!important}',
      'html[data-theme="light"] [data-back]{background:#fff;border-color:#C6D1E0;color:#33465C!important}',
      '[data-fab-wrap]{position:fixed!important;right:16px;bottom:16px;z-index:200}',
      '[data-fab]:hover,[data-soc]:hover,[data-prod]:hover,[data-btn]:hover,[data-back]:hover{transform:none!important;translate:none!important;scale:none!important}',
      '[data-fab]:hover{box-shadow:0 10px 24px rgba(5,13,24,.3)!important}',
      '[data-inq-rv="0"]{opacity:0;transform:translateY(26px)}',
      '[data-inq-rv]{transition:opacity .75s cubic-bezier(.22,.7,.3,1),transform .75s cubic-bezier(.22,.7,.3,1)}',
      '[data-inq-rv="1"] [data-stg]{animation:inqPageIn .6s cubic-bezier(.22,.7,.3,1) both}',
      '[data-par]{translate:0 var(--py,0);transition:translate .1s linear}',
      '[data-hv-flow]{stroke-dasharray:4 6;animation:inqFlow 2.6s linear infinite}',
      '[data-hv-bob]{animation:inqBob 6s ease-in-out infinite}',
      '[data-hv-dot]{offset-rotate:0deg;animation:inqTravel 4.5s cubic-bezier(.45,.05,.55,.95) infinite}',
      '[data-hv-tilt]{transition:transform .5s cubic-bezier(.22,.7,.3,1)}',
      '@media (max-width:760px){[data-par]{translate:none!important}[data-hv-bob]{animation:none}}',
      '@media print{[data-inq-rv]{opacity:1!important;transform:none!important}}',
      '@media (prefers-reduced-motion: reduce){body>*{animation:none!important}[data-inq-rv]{opacity:1!important;transform:none!important}[data-hv-smil]{display:none}[data-hv-flow],[data-hv-bob]{animation:none!important}}'
    ].join('\n');
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    // scrolled header state + hero parallax
    var parTick = false;
    function onScroll() {
      if (window.scrollY > 10) document.documentElement.setAttribute('data-scrolled', '1');
      else document.documentElement.removeAttribute('data-scrolled');
      if (REDUCED || parTick || window.innerWidth < 900 || !FINE) return; parTick = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        var els = document.querySelectorAll('[data-par]');
        for (var i = 0; i < els.length; i++) {
          var k = parseFloat(els[i].getAttribute('data-par')) || .08;
          els[i].style.setProperty('--py', (y * k).toFixed(1) + 'px');
        }
        parTick = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // section reveal for pages without their own reveal system
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.setAttribute('data-inq-rv', '1'); io.unobserve(en.target); } });
    }, { threshold: .08 }) : null;
    function scanSections() {
      if (REDUCED || !io) return;
      if (document.querySelector('[data-r],[data-rv]')) return;
      var vh = window.innerHeight || 800;
      var secs = document.querySelectorAll('x-dc section, body > div section');
      for (var i = 0; i < secs.length; i++) {
        var s = secs[i];
        if (s.hasAttribute('data-inq-rv') || s.closest('header') || /sticky/.test(s.getAttribute('style') || '')) continue;
        if (s.getBoundingClientRect().top < vh * .9) { s.setAttribute('data-inq-rv', '1'); continue; }
        s.setAttribute('data-inq-rv', '0'); io.observe(s);
      }
    }
    function wrapArrows() {
      var bs = document.querySelectorAll('[data-btn]');
      for (var i = 0; i < bs.length; i++) {
        var b = bs[i]; if (b.querySelector('[data-arw]')) continue;
        var n = b.lastChild;
        if (n && n.nodeType === 3 && /\s*→\s*$/.test(n.nodeValue)) {
          n.nodeValue = n.nodeValue.replace(/\s*→\s*$/, '');
          var s = document.createElement('span'); s.setAttribute('data-arw', '1'); s.setAttribute('aria-hidden', 'true'); s.textContent = '→'; b.appendChild(s);
        }
      }
    }
    wrapArrows(); setTimeout(wrapArrows, 300); setTimeout(wrapArrows, 1200);
    if ('MutationObserver' in window) { var wt; new MutationObserver(function () { clearTimeout(wt); wt = setTimeout(wrapArrows, 120); }).observe(document.body, { childList: true, subtree: true, characterData: true }); }
    setTimeout(scanSections, 120);
    setTimeout(function () {
      var p = document.querySelectorAll('[data-inq-rv="0"]');
      for (var i = 0; i < p.length; i++) p[i].setAttribute('data-inq-rv', '1');
    }, 4000);

    // [data-back] links follow their href (Solutions page)

    // page transitions handled by the INQVEXA loader/curtain (see bottom of file)
  }

  function boot() {
    apply(current());
    autoHideHeader();
    motionLayer();
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].type === 'childList' && muts[i].addedNodes.length) { schedule(); return; }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();


/* INQVEXA page transition — cross-fade, never a blank screen */
(function () {
  if (window.__inqPT) return; window.__inqPT = true;
  window.addEventListener('unhandledrejection', function (e) { var m = e.reason && (e.reason.message || String(e.reason)); if (/Transition was aborted|ViewTransition/i.test(m || '')) e.preventDefault(); });
  window.addEventListener('pageswap', function (e) { if (e.viewTransition && e.viewTransition.finished) e.viewTransition.finished.catch(function () {}); });
  window.addEventListener('pagereveal', function (e) { if (e.viewTransition) { ['ready', 'finished', 'updateCallbackDone'].forEach(function (k) { if (e.viewTransition[k]) e.viewTransition[k].catch(function () {}); }); } });
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var light = false; try { light = localStorage.getItem('inqvexa-theme') === 'light'; } catch (e) {}
  if (light && !root.getAttribute('data-theme')) root.setAttribute('data-theme', 'light');
  var VT = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('view-transition-name: none');
  var E = 'cubic-bezier(.22,.7,.3,1)';
  var css = [
    'html{background-color:#07111F}',
    'html[data-theme="light"]{background-color:#F7F9FC!important}',
    (window.top === window ? '@view-transition{navigation:auto}' : ''),
    '::view-transition-old(root){animation:inqVtOut 220ms ease-out both}',
    '::view-transition-new(root){animation:inqVtIn 320ms ' + E + ' both}',
    '@keyframes inqVtOut{to{opacity:.0;transform:translateY(-6px)}}',
    '@keyframes inqVtIn{from{opacity:.0;transform:translateY(8px)}}',
    VT ? '' : '@keyframes inqPtIn{from{opacity:.78;transform:translateY(6px)}to{opacity:1;transform:none}}',
    VT ? '' : 'body>*{animation:inqPtIn 300ms ' + E + ' backwards!important}',
    '#inq-pt-line{position:fixed;left:0;top:0;height:2px;width:100%;z-index:2147483000;pointer-events:none;background:linear-gradient(90deg,#E25822,#F0913F);transform:scaleX(0);transform-origin:left;opacity:0}',
    'html[data-inq-leave] #inq-pt-line{opacity:1;transform:scaleX(.9);transition:transform 420ms ' + E + ',opacity 100ms ease}',
    '@media (prefers-reduced-motion: reduce){::view-transition-old(root),::view-transition-new(root){animation-duration:1ms!important}body>*{animation:none!important}#inq-pt-line{display:none}}'
  ].filter(Boolean).join('\n');
  var st = document.createElement('style'); st.textContent = css; (document.head || root).appendChild(st);
  function line() {
    if (document.getElementById('inq-pt-line') || !document.body) return;
    var l = document.createElement('div'); l.id = 'inq-pt-line'; l.setAttribute('aria-hidden', 'true'); document.body.appendChild(l);
  }
  if (document.body) line(); else document.addEventListener('DOMContentLoaded', line);
  window.addEventListener('pageshow', function () { root.removeAttribute('data-inq-leave'); });
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var href = a.getAttribute('href') || '';
    if (/^(mailto:|tel:|sms:|javascript:|data:)/i.test(href)) return;
    var u; try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin || /\.(pdf|zip|png|jpe?g|svg|webp|xml|txt)$/i.test(u.pathname) || u.pathname.indexOf('/api/') === 0) return;
    if (u.pathname === location.pathname && u.search === location.search) {
      if (u.hash) {
        var id = decodeURIComponent(u.hash.slice(1)), el = id && document.getElementById(id);
        if (el) { e.preventDefault(); history.pushState(null, '', u.hash); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: RM ? 'auto' : 'smooth' }); try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (err) {} }
      }
      return;
    }
    line();
    root.setAttribute('data-inq-leave', '1');
  });
})();

/* INQVEXA connected card grids + staggered reveal */
(function () {
  if (window.__inqCards) return; window.__inqCards = true;
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var E = 'cubic-bezier(.22,.7,.3,1)';
  var css = [
    '[data-cg]{gap:0!important;align-items:stretch!important;border:1px solid var(--cg-c)!important;border-radius:18px;overflow:hidden;background-clip:padding-box}',
    '[data-cg]>*{position:relative;margin:0!important;z-index:0;border:0!important;border-right:1px solid var(--cg-c)!important;border-bottom:1px solid var(--cg-c)!important;border-radius:0!important;box-shadow:none!important;height:auto!important;min-height:100%;transform:none!important;transition:background-color .35s ' + E + ',background-image .35s ' + E + '}',
    '[data-cg]>[data-cg-r]{border-right:0!important}',
    '[data-cg]>[data-cg-b]{border-bottom:0!important}',
    '[data-cg]>* svg,[data-cg]>* [data-icon-chip]{transition:transform .35s ' + E + '}',
    '[data-cg]>* a[href]:not([data-btn]){transition:color .25s ease,letter-spacing .25s ease}',
    '[data-cg-arrow]{display:inline-block;transition:transform .3s ' + E + '}',
    '[data-cg]>*:hover [data-cg-arrow],a:hover>[data-cg-arrow]{transform:translateX(4px)}',
    '[data-cg]>[data-r],[data-cg]>[data-rv],[data-cg]>[data-inq-rv]{opacity:1!important;translate:none}',
    '[data-cg]>*{isolation:isolate}',
    '[data-cg]>*::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:0;transition:opacity .35s ' + E + ';background:radial-gradient(420px circle at var(--mx,50%) var(--my,0%),var(--cg-h),transparent 62%)}',
    '[data-cg]>*:hover::after{opacity:1}',
    '[data-cg]>* h3,[data-cg]>* h4{transition:color .3s ease}',
    '[data-cg]>*:hover h3,[data-cg]>*:hover h4{color:#E25822!important}',
    '[data-cg-wait]>*{opacity:0}',
    '[data-cg-go]>*{animation:inqCgIn .7s ' + E + ' both;animation-delay:calc(var(--cgi,0) * 70ms)}',
    '@keyframes inqCgIn{from{opacity:0;translate:0 14px;filter:saturate(.6)}to{opacity:1;translate:0 0;filter:none}}',
    '@media (prefers-reduced-motion: reduce){[data-cg-wait]>*{opacity:1!important}[data-cg-go]>*{animation:none!important}[data-cg]>*::before{transition:none}}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  function bgOf(el) {
    while (el && el !== document.documentElement) {
      var c = getComputedStyle(el).backgroundColor, m = c && c.match(/rgba?\(([^)]+)\)/);
      if (m) { var p = m[1].split(',').map(parseFloat); if (p.length < 4 || p[3] > .5) return p; }
      el = el.parentElement;
    }
    return [7, 17, 31];
  }
  function isLight(p) { return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) > 150; }
  function cardLike(c) {
    if (c.nodeType !== 1 || /^(INPUT|SELECT|TEXTAREA|LABEL|BUTTON)$/.test(c.tagName)) return false;
    var cs = getComputedStyle(c);
    if (c.hasAttribute('data-cg-done')) return true;
    if (cs.borderTopStyle === 'none' || !(parseFloat(cs.borderTopWidth) > 0)) return false;
    if (parseFloat(cs.borderTopLeftRadius) < 8) return false;
    if (c.querySelector('input,select,textarea')) return false;
    return (c.textContent || '').trim().length >= 3;
  }
  var io = ('IntersectionObserver' in window && !RM) ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.removeAttribute('data-cg-wait'); en.target.setAttribute('data-cg-go', '1'); io.unobserve(en.target); } });
  }, { threshold: .1 }) : null;

  function scan() {
    var grids = document.querySelectorAll('section div, section ul');
    for (var i = 0; i < grids.length; i++) {
      var g = grids[i];
      if (g.closest('header,footer,form,[role="img"],#top,[data-no-connect],[data-va-arch]')) continue;
      if (g.querySelector(':scope > [data-jr], :scope > [data-on], :scope > [data-active], :scope > [aria-selected], :scope > [aria-pressed]')) continue;
      if (g.querySelector(':scope > [data-va-link], :scope > [data-flow-arrow]') || g.querySelector(':scope > * > [data-flow-arrow]')) continue;
      var d = getComputedStyle(g).display;
      if (d !== 'grid' && d !== 'inline-grid') continue;
      var kids = Array.prototype.filter.call(g.children, function (k) { return getComputedStyle(k).display !== 'none'; });
      if (kids.length < 3) { if (g.hasAttribute('data-cg')) g.removeAttribute('data-cg'); continue; }
      var trackN = getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length;
      var skip = trackN < 2 || kids.some(function (k) { return k.hasAttribute('data-btn') || k.querySelector(':scope > [data-btn]'); });
      if (!skip) { var w0 = kids[0].getBoundingClientRect().width; skip = kids.slice(0, trackN).some(function (k) { return Math.abs(k.getBoundingClientRect().width - w0) > 3; }); }
      if (!skip) skip = kids.some(function (k) { return k.getBoundingClientRect().height < 56; });
      if (skip || !kids.every(cardLike)) {
        if (g.hasAttribute('data-cg')) { g.removeAttribute('data-cg'); g.removeAttribute('data-cg-wait'); g.removeAttribute('data-cg-go'); kids.forEach(function (k) { k.removeAttribute('data-cg-r'); k.removeAttribute('data-cg-b'); if (k.hasAttribute('data-cg-span')) { k.style.gridColumn = ''; k.removeAttribute('data-cg-span'); } }); }
        continue;
      }
      var light = isLight(bgOf(kids[0]));
      g.style.setProperty('--cg-c', light ? 'rgba(11,22,40,.11)' : 'rgba(255,255,255,.11)');
      g.style.setProperty('--cg-h', light ? 'rgba(226,88,34,.10)' : 'rgba(240,145,63,.14)');
      kids.forEach(function (k, n) {
        k.setAttribute('data-cg-done', '1'); k.style.setProperty('--cgi', Math.min(n, 10));
        var arrows = k.querySelectorAll('span');
        for (var a = 0; a < arrows.length; a++) if (arrows[a].children.length === 0 && arrows[a].textContent.trim() === '→') arrows[a].setAttribute('data-cg-arrow', '1');
      });
      var cols = getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
      kids.forEach(function (k) { if (k.hasAttribute('data-cg-span')) { k.style.gridColumn = ''; k.removeAttribute('data-cg-span'); } });
      var rem = kids.length % cols;
      if (cols > 1 && rem) { var last = kids[kids.length - 1]; last.style.gridColumn = 'span ' + (cols - rem + 1); last.setAttribute('data-cg-span', '1'); }
      var edge = function () {
        kids.forEach(function (k) { k.removeAttribute('data-cg-r'); k.removeAttribute('data-cg-b'); });
        var gr = g.getBoundingClientRect(), bl = parseFloat(getComputedStyle(g).borderRightWidth) || 1;
        kids.forEach(function (k) {
          var r = k.getBoundingClientRect();
          if (r.right >= gr.right - bl - 2) k.setAttribute('data-cg-r', '1');
          if (r.bottom >= gr.bottom - bl - 2) k.setAttribute('data-cg-b', '1');
        });
      };
      if (!g.hasAttribute('data-cg')) {
        g.setAttribute('data-cg', '1');
        requestAnimationFrame(edge);
        if (io && g.getBoundingClientRect().top > (window.innerHeight || 800) * .9) { g.setAttribute('data-cg-wait', '1'); io.observe(g); }
      } else edge();
    }
  }
  if (!RM && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('[data-cg]>*');
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });
  }
  var tmr;
  function queue() { clearTimeout(tmr); tmr = setTimeout(scan, 140); }
  function start() {
    scan(); setTimeout(scan, 600);
    setTimeout(function () { var w = document.querySelectorAll('[data-cg-wait]'); for (var i = 0; i < w.length; i++) { w[i].removeAttribute('data-cg-wait'); w[i].setAttribute('data-cg-go', '1'); } }, 5000);
    if ('MutationObserver' in window) new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) { var n = ms[i].target; if (n.id === 'inq-pt-line') continue; queue(); return; }
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', queue);
    var T = window.INQVEXATheme;
    if (T && T.set && !T.__cgWrap) { var s0 = T.set; T.set = function () { var r = s0.apply(this, arguments); setTimeout(scan, 80); return r; }; T.__cgWrap = true; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 200); });
  else setTimeout(start, 200);
})();




/* INQVEXA back-to-top button */
(function () {
  if (window.__inqTop) return; window.__inqTop = true;
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = [
    '#inq-top{position:fixed;left:18px;bottom:18px;z-index:210;width:48px;height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(11,22,40,.92);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 12px 30px rgba(5,13,24,.35);opacity:0;visibility:hidden;transform:translateY(14px) scale(.9);transition:opacity .3s ease,transform .35s cubic-bezier(.22,.7,.3,1),visibility .3s,background-color .25s ease,border-color .25s ease;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
    '#inq-top[data-show="1"]{opacity:1;visibility:visible;transform:none}',
    '#inq-top:hover{background:#E25822;border-color:#E25822}',
        '#inq-top:focus-visible{outline:2px solid #F0913F;outline-offset:3px}',
    '#inq-top svg{position:relative;transition:transform .3s cubic-bezier(.22,.7,.3,1)}',
    '#inq-top .ring{position:absolute;inset:-1px;width:calc(100% + 2px);height:calc(100% + 2px);pointer-events:none}',
    '#inq-top .ring rect{fill:none;stroke:#4F7CFF;stroke-width:2;stroke-linecap:round;transition:stroke-dashoffset .1s linear}',
    'html[data-theme="light"] #inq-top{background:rgba(255,255,255,.95);border-color:#D5DEEA;color:#0B1628;box-shadow:0 12px 30px rgba(11,22,40,.12)}',
    'html[data-theme="light"] #inq-top:hover{background:#E25822;border-color:#E25822;color:#fff}',
    '@media (max-width:560px){#inq-top{left:14px;bottom:14px;width:44px;height:44px}}',
    '@media print{#inq-top{display:none}}'
  ].join('\n');
  function mount() {
    if (document.getElementById('inq-top')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var b = document.createElement('button');
    b.id = 'inq-top'; b.type = 'button'; b.setAttribute('aria-label', 'Back to top'); b.title = 'Back to top';
    b.innerHTML = '<svg class="ring" viewBox="0 0 50 50" preserveAspectRatio="none" aria-hidden="true"><rect x="1" y="1" width="48" height="48" rx="14" ry="14" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"></rect></svg>' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
    document.body.appendChild(b);
    var ring = b.querySelector('.ring rect'), tick = false;
    function upd() {
      tick = false;
      var y = window.scrollY || document.documentElement.scrollTop;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      b.setAttribute('data-show', y > Math.min(400, window.innerHeight * .6) ? '1' : '0');
      ring.setAttribute('stroke-dashoffset', (100 - Math.min(1, y / max) * 100).toFixed(1));
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd);
    b.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
      var h = document.querySelector('header'); if (h) document.documentElement.removeAttribute('data-hdr');
      var skip = document.querySelector('h1'); if (skip) { skip.setAttribute('tabindex', '-1'); setTimeout(function () { skip.focus({ preventScroll: true }); }, RM ? 0 : 600); }
    });
    upd();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();


/* INQVEXA logo: blue-lettered on light surfaces, white-lettered on dark */
(function () {
  if (window.__inqLogo) return; window.__inqLogo = true;
  var LIGHT = '/images/logo/inqvexa-logo.png', DARK = '/images/logo/inqvexa-logo-white.png';
  function bgLum(el) {
    while (el && el !== document.documentElement) {
      var c = getComputedStyle(el).backgroundColor, m = c && c.match(/rgba?\(([^)]+)\)/);
      if (m) { var v = m[1].split(',').map(parseFloat); if (v.length < 4 || v[3] > .5) return (.2126 * v[0] + .7152 * v[1] + .0722 * v[2]) / 255; }
      el = el.parentElement;
    }
    return document.documentElement.getAttribute('data-theme') === 'light' ? 1 : 0;
  }
  function sync() {
    var ls = document.querySelectorAll('img[data-logo]');
    for (var i = 0; i < ls.length; i++) {
      var want = bgLum(ls[i].parentElement) > .55 ? LIGHT : DARK;
      if (ls[i].getAttribute('src') !== want) ls[i].setAttribute('src', want);
    }
  }
  var q; function queue() { clearTimeout(q); q = setTimeout(sync, 60); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync); else sync();
  setTimeout(sync, 300); setTimeout(sync, 1200);
  new MutationObserver(queue).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('load', sync);
})();


/* INQVEXA contrast guard — keeps every text run readable in dark and light mode */
(function () {
  if (window.__inqInk) return; window.__inqInk = true;
  var st = document.createElement('style');
  st.textContent = [
    '[data-ink="o-d"]{color:#B8430F!important}', '[data-ink="o-l"]{color:#F5A15C!important}',
    '[data-ink="c-d"]{color:#0E6F86!important}', '[data-ink="c-l"]{color:#67E3F5!important}',
    '[data-ink="b-d"]{color:#2F55D4!important}', '[data-ink="b-l"]{color:#9DB6FF!important}',
    '[data-ink="g-d"]{color:#52637A!important}', '[data-ink="g-l"]{color:#AEBBCC!important}',
    '[data-btn-ink="d"]{color:#0B1628!important;border-color:rgba(11,22,40,.3)!important}', '[data-btn-ink="d"]:hover{color:#B8430F!important;border-color:#E25822!important}',
    '[data-btn-ink="l"]{color:#FFFFFF!important;border-color:rgba(255,255,255,.4)!important}', '[data-btn-ink="l"]:hover{color:#F0913F!important;border-color:#F0913F!important}',
    '[data-btn-ink] svg{color:inherit!important;stroke:currentColor}'
  ].join('');
  document.head.appendChild(st);
  function rgb(s) { var m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; var p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function hex(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join(''); return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 }; }
  function lum(c) { return [c.r, c.g, c.b].map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [.2126, .7152, .0722][i]; }, 0); }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function grad(img) { var m = img.match(/rgba?\([^)]+\)|#[0-9a-f]{6}|#[0-9a-f]{3}\b/gi); if (!m) return null; for (var i = 0; i < m.length; i++) { var c = m[i][0] === '#' ? hex(m[i]) : rgb(m[i]); if (c && c.a > .6) return c; } return null; }
  var cache = new Map();
  function bgOf(el) {
    var chain = [];
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
      if (cache.has(e)) { var v = cache.get(e); chain.forEach(function (x) { cache.set(x, v); }); return v; }
      chain.push(e);
      var cs = getComputedStyle(e), c = rgb(cs.backgroundColor);
      if (c && c.a > .6) { chain.forEach(function (x) { cache.set(x, c); }); return c; }
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/url\(/.test(cs.backgroundImage)) { var g = grad(cs.backgroundImage); if (g) { chain.forEach(function (x) { cache.set(x, g); }); return g; } }
    }
    var d = rgb(getComputedStyle(document.body).backgroundColor) || { r: 7, g: 17, b: 31, a: 1 };
    chain.forEach(function (x) { cache.set(x, d); }); return d;
  }
  function family(c) { if (c.r > c.g + 40 && c.r > c.b + 40) return 'o'; if (c.g > c.r + 50 && c.b > c.r + 50 && c.g > 150) return 'c'; if (c.b > c.r + 60 && c.b > c.g + 30) return 'b'; return 'g'; }
  function run() {
    cache = new Map();
    var old = document.querySelectorAll('[data-ink]'); for (var i = 0; i < old.length; i++) old[i].removeAttribute('data-ink');
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n, done = new Set(), marks = [];
    while ((n = w.nextNode())) {
      var el = n.parentElement; if (!el || done.has(el)) continue; done.add(el);
      if (n.nodeValue.trim().length < 2) continue;
      if (el.closest('svg,script,style,[data-btn],button[type="submit"],#inq-top,[data-fab],[aria-hidden="true"],select,option,[data-no-ink]')) continue;
      var cs = getComputedStyle(el);
      if (cs.webkitTextFillColor && /rgba\(0, 0, 0, 0\)|transparent/.test(cs.webkitTextFillColor)) continue;
      var fg = rgb(cs.color); if (!fg || fg.a < .5) continue;
      var bg = bgOf(el), fs = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
      var need = (fs >= 24 || (fs >= 18.6 && bold)) ? 3 : 4.5;
      if (ratio(fg, bg) >= need) continue;
      var sat = Math.max(bg.r, bg.g, bg.b) - Math.min(bg.r, bg.g, bg.b);
      if (sat > 90 && lum(bg) < .5) continue; // text on brand/accent fills stays as designed
      if (lum(fg) > .85 && lum(bg) < .35) continue;
      var bgLight = lum(bg) > .35;
      var fgLight = lum(fg) > .35;
      marks.push([el, family(fg) + (bgLight ? '-d' : '-l')]);
    }
    for (var k = 0; k < marks.length; k++) marks[k][0].setAttribute('data-ink', marks[k][1]);
    // buttons and button-like links: keep label and outline readable on whatever surface they sit on
    var ob = document.querySelectorAll('[data-btn-ink]'); for (var b = 0; b < ob.length; b++) ob[b].removeAttribute('data-btn-ink');
    var btns = document.querySelectorAll('[data-btn]:not([data-btn="primary"]),button:not([data-btn]):not([aria-hidden="true"]),a[role="button"]');
    for (var q = 0; q < btns.length; q++) {
      var bt = btns[q];
      if (bt.closest('#inq-top,[data-fab],[data-no-ink],select')) continue;
      var r = bt.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
      var bcs = getComputedStyle(bt), bfg = rgb(bcs.color); if (!bfg) continue;
      var own = rgb(bcs.backgroundColor), bbg = (own && own.a > .6) ? own : bgOf(bt.parentElement || bt);
      if (own && own.a > .6) { var s2 = Math.max(own.r, own.g, own.b) - Math.min(own.r, own.g, own.b); if (s2 > 90) continue; }
      if (ratio(bfg, bbg) < 4.5) bt.setAttribute('data-btn-ink', lum(bbg) > .35 ? 'd' : 'l');
    }
  }
  var tmr = null;
  function queue() { clearTimeout(tmr); tmr = setTimeout(function () { requestAnimationFrame(run); }, 350); }
  function start() {
    queue();
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) { if (ms[i].type !== 'attributes' || ms[i].attributeName !== 'data-ink') { queue(); return; } }
    }).observe(document.body, { subtree: true, childList: true });
    new MutationObserver(queue).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('resize', queue);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.INQVEXAInk = { run: run };
})();

/* footer: balanced columns on tablet and mobile */
(function () {
  var st = document.createElement('style');
  st.textContent = '@media (max-width:1100px){footer div:has(> [data-foot-brand]){grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:32px 24px!important}footer [data-foot-brand]{grid-column:1/-1}}' +
    '@media (max-width:640px){footer div:has(> [data-foot-brand]){grid-template-columns:repeat(2,minmax(0,1fr))!important}}';
  document.head.appendChild(st);
})();


/* INQVEXA card motion: no card lift/pop — icons animate instead */
(function () {
  if (window.__inqCardIcon) return; window.__inqCardIcon = true;
  var st = document.createElement('style');
  st.textContent = [
    // neutralise card lift / scale / pop on hover and on reveal
    '[data-va]:hover,[data-wwa]:hover,[data-vm]:hover,[data-cg]>*:hover,[data-sd]>*:hover,a[data-va]:hover,[data-ind]:hover,[data-card]:hover{transform:none!important;translate:none!important;scale:none!important}',
    '[data-cg]>*,[data-cg-go]>*,[data-cg-wait]>*{animation:none!important}',
    '[data-va] [data-va-img]:hover,[data-va]:hover img{transform:none!important}',
    // icon animation — the chip stays still; only the drawing inside and the colour move
    '@keyframes inqIcoDraw{from{stroke-dashoffset:var(--ico-len,60)}to{stroke-dashoffset:0}}',
    '@keyframes inqIcoRedraw{0%{stroke-dashoffset:0}45%{stroke-dashoffset:var(--ico-len,60)}100%{stroke-dashoffset:0}}',
    '@keyframes inqIcoRedraw2{0%{stroke-dashoffset:0}45%{stroke-dashoffset:var(--ico-len,60)}100%{stroke-dashoffset:0}}',
    '@keyframes inqIcoHue{0%,100%{background-color:#E25822;filter:none}50%{background-color:#F0913F;filter:saturate(1.1)}}',
    '@keyframes inqIcoInk{0%,100%{color:#fff}50%{color:#FFE7D6}}',
    ':is([data-icon-chip],[data-va-ico],[data-wwa-ico]){transform:none!important;animation:none!important;transition:background-color .45s ease,color .45s ease}',
    ':is([data-icon-chip],[data-va-ico],[data-wwa-ico]) svg{transform:none!important;animation:none!important;overflow:visible}',
    ':is([data-icon-chip],[data-va-ico],[data-wwa-ico]) svg :is(path,polyline,line,polygon,rect,circle,ellipse){stroke-dasharray:var(--ico-len,60);stroke-dashoffset:0;transition:stroke .45s ease}',
    '[data-ico-seen] :is([data-icon-chip],[data-va-ico],[data-wwa-ico]) svg :is(path,polyline,line,polygon,rect,circle,ellipse){animation:inqIcoDraw 1.1s cubic-bezier(.22,.7,.3,1) both}',
    '[data-ico-seen] :is([data-icon-chip],[data-va-ico],[data-wwa-ico]){animation:inqIcoInk 5s ease-in-out 1.2s infinite!important}',
    ':is([data-va],[data-wwa],[data-vm],[data-cg]>*,[data-sd]>*,[data-card]):hover :is([data-icon-chip],[data-va-ico],[data-wwa-ico]){color:#FFE7D6!important}',
    ':is([data-va],[data-wwa],[data-vm],[data-cg]>*,[data-sd]>*,[data-card]):hover :is([data-icon-chip],[data-va-ico],[data-wwa-ico]) svg :is(path,polyline,line,polygon,rect,circle,ellipse){animation:inqIcoRedraw 1s cubic-bezier(.45,.05,.3,1) both!important;animation-delay:0s!important;stroke:#FFF3EA}',
    '@media (prefers-reduced-motion: reduce){[data-icon-chip],[data-va-ico],[data-wwa-ico],[data-icon-chip] *,[data-va-ico] *,[data-wwa-ico] *{animation:none!important;transition:none!important}}'
  ].join('\n');
  document.head.appendChild(st);
  function mark() {
    var cards = document.querySelectorAll('[data-va],[data-wwa],[data-vm],[data-cg]>*,[data-sd]>*,[data-card]');
    if (!('IntersectionObserver' in window)) { cards.forEach(function (c) { c.setAttribute('data-ico-seen', '1'); }); return; }
    var io = mark.io || (mark.io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var el = e.target; var idx = Array.prototype.indexOf.call(el.parentNode ? el.parentNode.children : [], el); var ic = el.querySelector('[data-icon-chip],[data-va-ico],[data-wwa-ico]'); if (ic) { var d = (Math.max(0, idx) % 6) * 0.08; ic.querySelectorAll('path,polyline,line,polygon,rect,circle,ellipse').forEach(function (p, j) { try { var L = Math.ceil(p.getTotalLength ? p.getTotalLength() : 60) || 60; p.style.setProperty('--ico-len', L); } catch (x) {} p.style.animationDelay = (d + j * 0.06) + 's'; }); ic.style.animationDelay = (1.2 + d * 3) + 's'; } el.setAttribute('data-ico-seen', '1'); mark.io.unobserve(el); } });
    }, { threshold: .2 }));
    cards.forEach(function (c) { if (!c.hasAttribute('data-ico-seen') && !c.__icoObs) { c.__icoObs = 1; io.observe(c); } });
  }
  var tm = null; function q() { clearTimeout(tm); tm = setTimeout(mark, 200); }
  document.addEventListener('pointerover', function (e) {
    var card = e.target.closest && e.target.closest('[data-va],[data-wwa],[data-vm],[data-cg]>*,[data-sd]>*,[data-card]');
    if (!card || card.contains(e.relatedTarget)) return;
    var ic = card.querySelector('[data-icon-chip],[data-va-ico],[data-wwa-ico]'); if (!ic) return;
    card.__icoFlip = !card.__icoFlip;
    ic.querySelectorAll('path,polyline,line,polygon,rect,circle,ellipse').forEach(function (p, j) {
      p.style.setProperty('animation', (card.__icoFlip ? 'inqIcoRedraw2' : 'inqIcoRedraw') + ' 1s cubic-bezier(.45,.05,.3,1) ' + (j * 0.05) + 's both', 'important');
    });
  });
  document.addEventListener('pointerout', function (e) {
    var card = e.target.closest && e.target.closest('[data-va],[data-wwa],[data-vm],[data-cg]>*,[data-sd]>*,[data-card]');
    if (!card || card.contains(e.relatedTarget)) return;
    var ic = card.querySelector('[data-icon-chip],[data-va-ico],[data-wwa-ico]'); if (!ic) return;
    ic.querySelectorAll('path,polyline,line,polygon,rect,circle,ellipse').forEach(function (p) { p.style.removeProperty('animation'); p.style.animation = 'none'; });
  });
  function start() { mark(); new MutationObserver(q).observe(document.body, { childList: true, subtree: true }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();


/* INQVEXA mobile & tablet menu — replaces the wrapped nav row under 1024px */
(function () {
  if (window.__inqMenu) return; window.__inqMenu = true;
  var BP = 1023;
  var st = document.createElement('style');
  st.textContent = [
    '@media (max-width:' + BP + 'px){',
    '  [data-hdr-row]{flex-wrap:nowrap!important;row-gap:0!important;min-height:64px!important;padding:10px 18px!important;gap:12px!important}',
    '  [data-hdr-nav]{display:none!important}',
    '  header [data-hdr-row="1"] > a:first-child{margin-right:0!important}',
    '  header [data-hdr-row="1"] > a:first-child img{height:32px!important}',
    '  header [data-hdr-row="1"] > div:last-of-type{margin-left:auto!important;gap:10px!important}',
    '  [data-inq-burger]{display:inline-flex!important}',
    '}',
    '@media (max-width:560px){ header [data-btn="primary"]{display:none!important} [data-hdr-row]{padding:8px 16px!important} }',
    '[data-inq-burger]{display:none;width:44px;height:44px;flex:none;align-items:center;justify-content:center;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);cursor:pointer;padding:0;color:inherit}',
    'html[data-theme="light"] [data-inq-burger]{border-color:rgba(11,22,40,.18);background:#fff}',
    '[data-inq-burger] i{position:relative;display:block;width:18px;height:2px;border-radius:2px;background:currentColor;transition:background .2s}',
    '[data-inq-burger] i::before,[data-inq-burger] i::after{content:"";position:absolute;left:0;width:18px;height:2px;border-radius:2px;background:currentColor;transition:transform .3s cubic-bezier(.22,.7,.3,1),top .3s}',
    '[data-inq-burger] i::before{top:-6px}[data-inq-burger] i::after{top:6px}',
    'html[data-menu-open] [data-inq-burger] i{background:transparent}',
    'html[data-menu-open] [data-inq-burger] i::before{top:0;transform:rotate(45deg)}',
    'html[data-menu-open] [data-inq-burger] i::after{top:0;transform:rotate(-45deg)}',
    '#inq-menu{position:fixed;left:0;right:0;bottom:0;top:var(--hdr-h,64px);z-index:79;background:#07111F;overflow-y:auto;overscroll-behavior:contain;padding:18px 20px calc(28px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:4px;opacity:0;transform:translateY(-8px);pointer-events:none;transition:opacity .25s ease,transform .3s cubic-bezier(.22,.7,.3,1)}',
    'html[data-theme="light"] #inq-menu{background:#F7F9FC}',
    'html[data-menu-open] #inq-menu{opacity:1;transform:none;pointer-events:auto}',
    '#inq-menu a.m{display:flex;align-items:center;justify-content:space-between;min-height:54px;padding:0 6px;border-bottom:1px solid rgba(255,255,255,.08);font-size:20px;font-weight:700;letter-spacing:-.015em;color:#fff;text-decoration:none}',
    'html[data-theme="light"] #inq-menu a.m{color:#0B1628;border-bottom-color:#E2E8F0}',
    '#inq-menu a.m::after{content:"→";color:#E25822;font-weight:700}',
    '#inq-menu a.m[aria-current]{color:#F0913F}',
    '#inq-menu .cta{margin-top:22px;display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:12px;background:#E25822;color:#fff;font-weight:700;font-size:16.5px;text-decoration:none}',
    'html[data-menu-open] body{overflow:hidden}',
    'html[data-menu-open] header{transform:none!important}',
    '@media (min-width:' + (BP + 1) + 'px){#inq-menu{display:none!important}}',
    '@media (prefers-reduced-motion: reduce){#inq-menu,[data-inq-burger] i::before,[data-inq-burger] i::after{transition:none!important}}'
  ].join('\n');
  document.head.appendChild(st);
  var root = document.documentElement;
  function close() { root.removeAttribute('data-menu-open'); var b = document.querySelector('[data-inq-burger]'); if (b) { b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Open menu'); } }
  function build() {
    var row = document.querySelector('[data-hdr-row]'), nav = document.querySelector('[data-hdr-nav]');
    if (!row || !nav || row.querySelector('[data-inq-burger]')) return;
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-inq-burger', '1');
    b.setAttribute('aria-label', 'Open menu'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'inq-menu');
    b.appendChild(document.createElement('i'));
    row.appendChild(b);
    var m = document.getElementById('inq-menu');
    if (!m) { m = document.createElement('nav'); m.id = 'inq-menu'; m.setAttribute('aria-label', 'Mobile'); document.body.appendChild(m); }
    m.innerHTML = '';
    nav.querySelectorAll('a[href]').forEach(function (a) {
      var x = document.createElement('a'); x.className = 'm'; x.href = a.getAttribute('href'); x.textContent = a.textContent.trim();
      if (a.hasAttribute('aria-current')) x.setAttribute('aria-current', a.getAttribute('aria-current'));
      m.appendChild(x);
    });
    var cta = row.querySelector('[data-btn="primary"]');
    if (cta) { var c = document.createElement('a'); c.className = 'cta'; c.href = cta.getAttribute('href'); c.textContent = cta.textContent.trim(); m.appendChild(c); }
    b.addEventListener('click', function () {
      var open = !root.hasAttribute('data-menu-open');
      if (open) { var hh = document.querySelector('header'); root.style.setProperty('--hdr-h', (hh ? Math.round(hh.getBoundingClientRect().bottom) : 64) + 'px'); root.setAttribute('data-menu-open', '1'); root.removeAttribute('data-hdr'); b.setAttribute('aria-expanded', 'true'); b.setAttribute('aria-label', 'Close menu'); var f = m.querySelector('a'); if (f) f.focus({ preventScroll: true }); }
      else close();
    });
    m.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.hasAttribute('data-menu-open')) { close(); var b = document.querySelector('[data-inq-burger]'); if (b) b.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > BP) close(); });
  var tries = 0; (function wait() { build(); if (!document.querySelector('[data-inq-burger]') && tries++ < 40) setTimeout(wait, 150); })();
  new MutationObserver(function () { if (!document.querySelector('[data-inq-burger]')) build(); }).observe(document.documentElement, { childList: true, subtree: true });
})();

/* small-screen polish: comfortable edges, lighter motion, safe-area floating buttons */
(function () {
  var st = document.createElement('style');
  st.textContent = [
    '@media (max-width:767px){',
    '  section{padding-left:18px!important;padding-right:18px!important}',
    '  h1{font-size:clamp(32px,9vw,44px)!important;line-height:1.08!important}',
    '  h2{font-size:clamp(26px,7.2vw,36px)!important}',
    '  [data-par]{translate:none!important}',
    '  input,select,textarea{min-height:46px;font-size:16px!important}',
    '  [data-fab],#inq-top{margin-bottom:env(safe-area-inset-bottom)}',
    '}',
    'html{scroll-padding-top:80px}'
  ].join('\n');
  document.head.appendChild(st);
})();


/* Solutions / Services tab bars: one swipeable row on tablet & mobile */
(function () {
  var st = document.createElement('style');
  st.textContent = [
    '@media (max-width:1023px){',
    '  section[data-tabbar="solutions"],section[data-tabbar="services"]{top:var(--hdr-h,65px)!important;padding:0!important}',
    '  html[data-hdr="hidden"] section[data-tabbar="solutions"],html[data-hdr="hidden"] section[data-tabbar="services"]{top:0!important}',
    '  section[data-tabbar="solutions"] > div:not([data-tabs-hint]):not([data-tabs-dots]):not([data-tabs-wrap]),section[data-tabbar="services"] > div:not([data-tabs-hint]):not([data-tabs-dots]):not([data-tabs-wrap]),section[data-tabbar="solutions"] > [data-tabs-wrap] > div,section[data-tabbar="services"] > [data-tabs-wrap] > div{flex-wrap:nowrap!important;overflow-x:auto!important;overscroll-behavior-x:contain;scroll-snap-type:x proximity;scrollbar-width:none;padding:10px 16px!important;gap:8px!important;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 16px,#000 calc(100% - 28px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 16px,#000 calc(100% - 28px),transparent 100%)}',
    '  section[data-tabbar="solutions"] div::-webkit-scrollbar,section[data-tabbar="services"] div::-webkit-scrollbar{display:none}',
    '  section[data-tabbar="solutions"] > div > button,section[data-tabbar="services"] > div > button,section[data-tabbar="solutions"] > [data-tabs-wrap] > div > button,section[data-tabbar="services"] > [data-tabs-wrap] > div > button{flex:0 0 auto;scroll-snap-align:start;padding:8px 14px!important;font-size:13.5px!important;min-height:40px}',
    '}'
  ].join('\n');
  document.head.appendChild(st);
  function centerActive() {
    if (window.innerWidth > 1023) return;
    ['solutions', 'services'].forEach(function (id) {
      var bar = document.querySelector('section#' + id + ' [data-tabs-wrap] > div') || document.querySelector('section#' + id + ' > div'); if (!bar) return;
      var btns = bar.querySelectorAll('button'), act = null;
      for (var i = 0; i < btns.length; i++) { var bg = getComputedStyle(btns[i]).backgroundColor; if (/226, 88, 34|rgb\(226,88,34/.test(bg) || btns[i].getAttribute('aria-pressed') === 'true' || btns[i].getAttribute('aria-selected') === 'true') { act = btns[i]; break; } }
      if (!act) return;
      var ar = act.getBoundingClientRect(), br = bar.getBoundingClientRect();
      var visible = ar.left >= br.left + 12 && ar.right <= br.right - 44;
      var target = visible && bar.scrollLeft < 24 ? 0 : act.offsetLeft - (bar.clientWidth - act.offsetWidth) / 2;
      target = Math.max(0, Math.min(target, bar.scrollWidth - bar.clientWidth));
      if (target < 24 && act === bar.querySelector('button')) target = 0;
      if (Math.abs(bar.scrollLeft - target) > 2) bar.scrollTo({ left: target, behavior: 'smooth' });
    });
  }
  var tm; function q() { clearTimeout(tm); tm = setTimeout(centerActive, 120); }
  function centerBtn(bar, btn) {
    if (!bar || !btn || window.innerWidth > 1023) return;
    var br = bar.getBoundingClientRect(), r = btn.getBoundingClientRect();
    var max = bar.scrollWidth - bar.clientWidth;
    var target = bar.scrollLeft + (r.left - br.left) - (bar.clientWidth - r.width) / 2;
    target = Math.max(0, Math.min(max, target));
    if (btn === bar.querySelector('button') ) target = 0;
    bar.scrollTo({ left: target, behavior: 'smooth' });
  }
  function start() {
    q();
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('section[data-tabbar="solutions"] button:not([data-tabs-arrow]),section[data-tabbar="services"] button:not([data-tabs-arrow])');
      if (!btn) return;
      var bar = btn.parentElement;
      requestAnimationFrame(function () { centerBtn(bar, btn); });
    });
    window.addEventListener('hashchange', q); window.addEventListener('resize', q);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  setTimeout(centerActive, 1200);
})();


/* scroll affordance for the swipeable tab rows */
(function () {
  var BP = 1023;
  var st = document.createElement('style');
  st.textContent = [
    '@media (max-width:' + BP + 'px){',
    '  section[data-tabbar="solutions"],section[data-tabbar="services"]{position:sticky}',
    '  [data-tabs-wrap]{position:relative}',
    '  [data-tabs-hint]{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 16px 0;font-family:"IBM Plex Mono",monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#8E9BAD}',
    '  html[data-theme="light"] [data-tabs-hint]{color:#5A6B81}',
    '  [data-tabs-hint] b{font-weight:600;color:#F0913F;letter-spacing:.04em}',
    '  [data-tabs-hint] .sw{display:inline-flex;align-items:center;gap:6px}',
    '  [data-tabs-hint] .sw i{display:inline-block;font-style:normal;animation:tabNudge 1.6s ease-in-out infinite}',
    '  [data-tabs-arrow]{position:absolute;top:50%;margin-top:-17px;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.18);background:#101D31;color:#fff;font-size:16px;line-height:1;cursor:pointer;z-index:2;box-shadow:0 6px 16px rgba(5,13,24,.4);transition:opacity .2s ease}',
    '  html[data-theme="light"] [data-tabs-arrow]{background:#fff;color:#0B1628;border-color:#D6DEEA;box-shadow:0 6px 16px rgba(11,22,40,.12)}',
    '  [data-tabs-arrow="l"]{left:6px}[data-tabs-arrow="r"]{right:6px}',
    '  [data-tabs-arrow],[data-tabs-arrow][hidden]{display:none!important}',
    '  [data-tabs-wrap][data-at-start] > div{-webkit-mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 28px),transparent 100%)!important;mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 28px),transparent 100%)!important}',
    '  [data-tabs-dots]{display:flex;justify-content:center;gap:5px;padding:0 0 8px}',
    '  [data-tabs-dots] span{height:3px;border-radius:3px;background:rgba(255,255,255,.18);transition:width .25s ease,background .25s ease;width:10px}',
    '  html[data-theme="light"] [data-tabs-dots] span{background:#D6DEEA}',
    '  [data-tabs-dots] span.on{width:22px;background:#E25822}',
    '  section[data-tabbar="solutions"] > [data-tabs-wrap] > div,section[data-tabbar="services"] > [data-tabs-wrap] > div{padding:8px 16px 10px 16px!important;scroll-padding-inline:16px 48px;scroll-snap-type:none!important}',
    '}',
    '@media (min-width:' + (BP + 1) + 'px){[data-tabs-hint],[data-tabs-arrow],[data-tabs-dots]{display:none!important}}',
    '@keyframes tabNudge{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}',
    '@media (prefers-reduced-motion: reduce){[data-tabs-hint] .sw i{animation:none}}'
  ].join('\n');
  document.head.appendChild(st);
  function setup(id, noun) {
    var sec = document.querySelector('section#' + id); if (!sec) return;
    var bar = sec.querySelector(':scope > div') ; if (!bar || sec.querySelector('[data-tabs-wrap]')) return;
    if (!bar.querySelector('button')) return;
    var wrap = document.createElement('div'); wrap.setAttribute('data-tabs-wrap', '1');
    bar.parentNode.insertBefore(wrap, bar); wrap.appendChild(bar);
    var n = bar.querySelectorAll('button').length;
    var hint = document.createElement('div'); hint.setAttribute('data-tabs-hint', '1');
    hint.innerHTML = '<span>' + noun + '</span><span class="sw" aria-hidden="true">Swipe <i>→</i></span>';
    sec.insertBefore(hint, wrap);
    var L = document.createElement('button'), R = document.createElement('button');
    [[L, 'l', '‹', 'Scroll ' + noun + ' left'], [R, 'r', '›', 'Scroll ' + noun + ' right']].forEach(function (a) { a[0].type = 'button'; a[0].setAttribute('data-tabs-arrow', a[1]); a[0].setAttribute('aria-label', a[3]); a[0].textContent = a[2]; wrap.appendChild(a[0]); });
    L.addEventListener('click', function () { bar.scrollBy({ left: -bar.clientWidth * .7, behavior: 'smooth' }); });
    R.addEventListener('click', function () { bar.scrollBy({ left: bar.clientWidth * .7, behavior: 'smooth' }); });
    var dots = document.createElement('div'); dots.setAttribute('data-tabs-dots', '1'); dots.setAttribute('aria-hidden', 'true');
    sec.appendChild(dots);
    function upd() {
      var max = bar.scrollWidth - bar.clientWidth;
      L.hidden = bar.scrollLeft < 6; R.hidden = bar.scrollLeft > max - 6;
      if (L.hidden) wrap.setAttribute('data-at-start', '1'); else wrap.removeAttribute('data-at-start');
      var pages = Math.max(1, Math.ceil(bar.scrollWidth / Math.max(1, bar.clientWidth)));
      if (dots.children.length !== pages) { dots.innerHTML = ''; for (var i = 0; i < pages; i++) dots.appendChild(document.createElement('span')); }
      var cur = max > 0 ? Math.round(bar.scrollLeft / max * (pages - 1)) : 0;
      for (var j = 0; j < dots.children.length; j++) dots.children[j].className = j === cur ? 'on' : '';
      hint.querySelector('.sw').style.visibility = max > 6 && bar.scrollLeft < max - 6 ? 'visible' : 'hidden';
      dots.style.display = max > 6 ? '' : 'none';
    }
    bar.addEventListener('scroll', function () { requestAnimationFrame(upd); }, { passive: true });
    window.addEventListener('resize', upd);
    setTimeout(upd, 50); setTimeout(upd, 1400);
    if (!sessionStorage.getItem('inq-tabs-peek-' + id) && window.innerWidth <= BP && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      try { sessionStorage.setItem('inq-tabs-peek-' + id, '1'); } catch (e) {}
      setTimeout(function () { if (bar.scrollLeft < 6) { bar.scrollTo({ left: 70, behavior: 'smooth' }); setTimeout(function () { bar.scrollTo({ left: 0, behavior: 'smooth' }); }, 650); } }, 1600);
    }
  }
  var tries = 0;
  (function wait() { setup('solutions', 'solutions'); setup('services', 'services'); if ((!document.querySelector('[data-tabs-wrap]')) && tries++ < 40) setTimeout(wait, 150); })();
})();


/* back-to-top joins the Call / WhatsApp / Email stack (right side, below Email) */
(function () {
  var st = document.createElement('style');
  st.textContent = [
    '[data-fab-wrap] #inq-top{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;align-self:center;flex:none;overflow:visible;margin-top:calc(-1 * var(--fab-gap,10px));max-height:0;min-height:0;height:48px;opacity:0;visibility:hidden;transform:translateY(10px) scale(.9);transition:max-height .35s cubic-bezier(.22,.7,.3,1),margin-top .35s cubic-bezier(.22,.7,.3,1),opacity .3s ease,transform .35s cubic-bezier(.22,.7,.3,1),visibility .35s,background .25s ease,border-color .25s ease}',
    '[data-fab-wrap] #inq-top[data-show="1"]{max-height:48px;margin-top:0;opacity:1;visibility:visible;transform:none}',
    '@media (max-width:560px){[data-fab-wrap] #inq-top{height:44px;width:44px}[data-fab-wrap] #inq-top[data-show="1"]{max-height:44px}}'
  ].join('\n');
  document.head.appendChild(st);
  function dock() {
    var b = document.getElementById('inq-top'), w = document.querySelector('[data-fab-wrap]');
    if (!b || !w) return false;
    if (b.parentNode !== w || w.lastElementChild !== b) {
      w.appendChild(b);
      var g = getComputedStyle(w).rowGap || getComputedStyle(w).gap; w.style.setProperty('--fab-gap', (g && g !== 'normal') ? g : '10px');
      var fab = w.querySelector('[data-fab]'); if (fab) { var r = fab.getBoundingClientRect(); if (r.width > 20) { b.style.width = r.width + 'px'; b.style.height = r.height + 'px'; } }
    }
    return true;
  }
  var n = 0; (function wait() { if (!dock() && n++ < 60) setTimeout(wait, 150); })();
  new MutationObserver(function () { dock(); }).observe(document.documentElement, { childList: true, subtree: true });
})();


/* INQVEXA FAQ accordion — one consistent design on every page + FAQPage schema where missing */
(function () {
  if (window.__inqFaq) return; window.__inqFaq = true;
  var st = document.createElement('style');
  st.textContent = [
    'details{border:1px solid #E6ECF4!important;background:#FFFFFF!important;border-radius:14px!important;padding:0!important;overflow:hidden;transition:border-color .25s ease,box-shadow .25s ease,background .25s ease}',
    'details:hover{border-color:#CBD6E4!important}',
    'details[open]{border-color:rgba(226,88,34,.55)!important;box-shadow:0 12px 30px rgba(11,22,40,.07);background:linear-gradient(180deg,#FFF8F4,#FFFFFF 70%)!important}',
    'details>summary{list-style:none;display:flex!important;align-items:center;justify-content:space-between;gap:16px;padding:17px 20px!important;cursor:pointer;font-size:16px!important;font-weight:700!important;line-height:1.4!important;color:#0B1628!important;outline:none}',
    'details>summary::-webkit-details-marker{display:none}',
    'details>summary::marker{content:""}',
    'details>summary::after{content:"";flex:none;width:30px;height:30px;border-radius:9px;background:#F1F4F9 url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%230B1628%27 stroke-width=%272.4%27 stroke-linecap=%27round%27%3E%3Cline x1=%2712%27 y1=%275%27 x2=%2712%27 y2=%2719%27/%3E%3Cline x1=%275%27 y1=%2712%27 x2=%2719%27 y2=%2712%27/%3E%3C/svg%3E") center/14px no-repeat;transition:background-color .25s ease}',
    'details[open]>summary::after{background-color:#E25822;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27white%27 stroke-width=%272.4%27 stroke-linecap=%27round%27%3E%3Cline x1=%275%27 y1=%2712%27 x2=%2719%27 y2=%2712%27/%3E%3C/svg%3E")}',
    'details>summary:focus-visible{box-shadow:inset 0 0 0 2px #F0913F;border-radius:14px}',
    'details>summary~*{margin:0!important;padding:0 20px 18px!important;font-size:15.5px!important;line-height:1.65!important;color:#4A5B71!important}',
    'details[open]>summary~*{animation:inqFaqIn .35s cubic-bezier(.22,.7,.3,1) both}',
    '@keyframes inqFaqIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}',
    '@media (max-width:560px){details>summary{padding:15px 16px!important;font-size:15.5px!important}details>summary~*{padding:0 16px 16px!important}}',
    '@media (prefers-reduced-motion: reduce){details,details>summary::after,details[open]>summary~*{transition:none!important;animation:none!important}}'
  ].join('\n');
  document.head.appendChild(st);
  // close all FAQs when the content they belong to changes (tab switch / page load)
  function closeAll() { document.querySelectorAll('details[open]').forEach(function (d) { d.open = false; }); }
  var sig = '';
  function faqSig() { return Array.prototype.map.call(document.querySelectorAll('details > summary'), function (s) { return s.textContent.trim(); }).join('|'); }
  function checkSig() { var n = faqSig(); if (n !== sig) { if (sig) closeAll(); sig = n; } }
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('section[data-tabbar="solutions"] button,section[data-tabbar="services"] button,[data-tabs-wrap] button')) { closeAll(); setTimeout(function () { closeAll(); sig = faqSig(); }, 60); }
  }, true);
  window.addEventListener('hashchange', function () { closeAll(); });
  window.addEventListener('pageshow', function () { closeAll(); });
  new MutationObserver(function () { checkSig(); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  // one open at a time within a group
  document.addEventListener('toggle', function (e) {
    var d = e.target; if (!d || d.tagName !== 'DETAILS' || !d.open) return;
    var p = d.parentElement; if (!p) return;
    Array.prototype.forEach.call(p.querySelectorAll(':scope > details[open], :scope > * > details[open]'), function (o) { if (o !== d) o.open = false; });
  }, true);
  // FAQPage JSON-LD from the visible FAQ when the page has none of its own
  function hasStatic() { return !!Array.prototype.find.call(document.querySelectorAll('script[type="application/ld+json"]:not(#inq-faq-ld)'), function (s) { return /"FAQPage"/.test(s.textContent); }); }
  function write() {
    if (hasStatic()) { var old = document.getElementById('inq-faq-ld'); if (old) old.remove(); return; }
    var ds = document.querySelectorAll('details'); if (!ds.length) return;
    var items = [], seen = {};
    ds.forEach(function (d) {
      var s = d.querySelector('summary'); if (!s) return;
      var q = s.textContent.trim(); var a = Array.prototype.map.call(d.querySelectorAll('summary ~ *'), function (x) { return x.textContent.trim(); }).join(' ').trim();
      if (!q || !a || seen[q]) return; seen[q] = 1;
      items.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } });
    });
    if (!items.length) return;
    var el = document.getElementById('inq-faq-ld'); if (!el || !el.isConnected) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'inq-faq-ld'; document.head.appendChild(el); }
    var json = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items });
    if (el.textContent !== json) el.textContent = json;
  }
  var tm; function q() { clearTimeout(tm); tm = setTimeout(write, 300); }
  function start() { q(); new MutationObserver(q).observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();


/* mobile scroll hardening */
(function () {
  var st = document.createElement('style');
  st.textContent = [
    'html,body{overflow-x:clip;max-width:100%}',
    '@supports not (overflow:clip){html,body{overflow-x:hidden}}',
    '@media (max-width:1023px){',
    '  html{scroll-behavior:auto}',
    '  [data-inq-rv="0"]{opacity:1!important;transform:none!important}',
    '  [data-hv-bob],[data-par]{animation:none!important;translate:none!important}',
    '  header{will-change:transform}',
    '  img,svg,video,canvas{max-width:100%}',
    '}'
  ].join('\n');
  document.head.appendChild(st);
  var root = document.documentElement;
  function reset() { root.removeAttribute('data-menu-open'); document.body && (document.body.style.overflow = ''); }
  window.addEventListener('pageshow', reset);
  window.addEventListener('orientationchange', function () { setTimeout(reset, 200); });
})();


/* tag the real sticky tab bars (Solutions / Services pages only) */
(function () {
  function tag() {
    ['solutions', 'services'].forEach(function (id) {
      var s = document.getElementById(id);
      if (!s || s.tagName !== 'SECTION' || s.hasAttribute('data-tabbar')) return;
      var st = s.getAttribute('style') || '';
      if (/sticky/.test(st) && s.querySelector('button')) s.setAttribute('data-tabbar', id);
    });
  }
  tag();
  var n = 0; (function w() { tag(); if (n++ < 40 && !document.querySelector('[data-tabbar]')) setTimeout(w, 150); })();
  new MutationObserver(tag).observe(document.documentElement, { childList: true, subtree: true });
})();


/* Solution detail pages — mobile optimisation (pages that contain the architecture diagram) */
(function () {
  var S = 'html:has([data-va-arch])';
  var st = document.createElement('style');
  st.textContent = [
    '@media (max-width:640px){',
    S + ' section{padding-top:40px!important;padding-bottom:40px!important}',
    S + ' section h2{margin-bottom:12px!important}',
    S + ' section p[data-rv]{font-size:16px!important;margin-bottom:20px!important}',
    // intro 5 words
    S + ' [data-g5="1"]:has(> div > div + div[style*="800"]){gap:6px!important}',
    S + ' section:nth-of-type(2) [data-g5="1"]{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:6px!important}',
    S + ' section:nth-of-type(2) [data-g5="1"] > div{padding:14px 2px!important;border-radius:12px!important}',
    S + ' section:nth-of-type(2) [data-g5="1"] > div > div:last-child{font-size:12px!important}',
    // how it works steps: compact rows
    S + ' [data-g7="1"]{grid-template-columns:minmax(0,1fr)!important;gap:8px!important;padding-left:0!important;row-gap:8px!important}',
    S + ' [data-g7="1"]::before,' + S + ' [data-g7="1"]::after,' + S + ' [data-g7="1"] > *::before,' + S + ' [data-g7="1"] > *::after{display:none!important}',
    S + ' [data-g7="1"] > [data-vstep]{display:grid!important;grid-template-columns:38px minmax(0,1fr)!important;column-gap:12px!important;row-gap:2px!important;align-items:start!important;padding:14px!important;border-radius:14px!important;border-width:1px!important;min-height:0!important;margin:0!important;transform:none!important}',
    S + ' [data-g7="1"] > [data-vstep] > div:first-child{grid-row:1/3}',
    S + ' [data-g7="1"] > [data-vstep] h3{margin:2px 0 0!important;font-size:15.5px!important}',
    S + ' [data-g7="1"] > [data-vstep] p{font-size:14px!important;margin:0!important}',
    // capability & implementation cards
    S + ' [data-g3="1"]{grid-template-columns:minmax(0,1fr)!important;gap:10px!important}',
    S + ' [data-g3="1"] > [data-va]{padding:18px!important;display:grid;grid-template-columns:42px minmax(0,1fr);column-gap:14px;align-items:start}',
    S + ' [data-g3="1"] > [data-va] > [data-va-ico]{grid-row:1/3}',
    S + ' [data-g3="1"] > [data-va] > h3{margin:0 0 4px!important;font-size:16.5px!important}',
    S + ' [data-g3="1"] > [data-va] > p{font-size:14.5px!important}',
    S + ' [data-g3="1"] > [data-va]:not(:has([data-va-ico])){display:block}',
    // use cases: 2 columns of short pills
    S + ' [data-g3="1"]:has(> [data-va] > span:first-child:last-child), ' + S + ' [data-g3="1"]:has(> [data-va] > span + span:last-child){grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}',
    S + ' [data-g3="1"] > [data-va]:has(> span + span:last-child){display:flex!important;padding:12px!important;gap:8px!important}',
    S + ' [data-g3="1"] > [data-va] > span + span:last-child{font-size:13.5px!important;line-height:1.3}',
    // governance chips
    S + ' [data-g3="1"] > div:not([data-va]){padding:11px 12px!important;font-size:13.5px!important}',
    // architecture: vertical stack with down connectors
    S + ' [data-va-arch]{grid-template-columns:minmax(0,1fr)!important;row-gap:0!important}',
    S + ' [data-va-arch] > [data-va-link]{height:26px!important;width:2px!important;justify-self:center;background:linear-gradient(180deg,rgba(240,145,63,.15),rgba(240,145,63,.6),rgba(240,145,63,.15))!important}',
    S + ' [data-va-arch] > [data-va-link] span{display:none!important}',
    S + ' [data-va-arch] > div:not([data-va-link]){padding:16px!important}',
    S + ' [data-va-arch] [data-va-chips]{grid-template-columns:repeat(2,minmax(0,1fr))!important}',
    // journey + continuous improvement flow
    S + ' [data-g5="1"]{grid-template-columns:minmax(0,1fr)!important;gap:8px!important}',
    S + ' [data-g5="1"] [data-flow-arrow]{display:none!important}',
    S + ' [data-g5="1"] > [data-va]:has(> [data-va-ico]){padding:18px!important;display:grid;grid-template-columns:42px minmax(0,1fr);column-gap:14px;align-items:start}',
    S + ' [data-g5="1"] > [data-va]:has(> [data-va-ico]) > [data-va-ico]{grid-row:1/3}',
    S + ' [data-g5="1"] > [data-va]:has(> [data-va-ico]) > h3{margin:0 0 4px!important;font-size:16.5px!important}',
    S + ' [data-g5="1"] > [data-va]:has(> [data-va-ico]) > p{font-size:14.5px!important}',
    S + ' [data-g5="1"]:has(> [data-va] > span + span:last-child){grid-template-columns:repeat(2,minmax(0,1fr))!important}',
    S + ' [data-g5="1"] > [data-va]:has(> span + span:last-child){display:flex!important;padding:12px!important;gap:8px!important}',
    S + ' [data-g5="1"] > [data-va] > span + span:last-child{font-size:13.5px!important;line-height:1.3}',
    S + ' [data-jr]{padding:14px 16px!important}',
    // human + tech split
    S + ' [data-g2="1"]{grid-template-columns:minmax(0,1fr)!important;gap:12px!important}',
    S + ' [data-g2="1"] > [data-va]{padding:20px!important}',
    S + ' [data-g2="1"] > [data-va] > div:last-child{grid-template-columns:minmax(0,1fr)!important;gap:8px!important}',
    S + ' [data-g2="1"] > [data-va] > div:last-child > div{font-size:15px!important}',
    // why inqvexa pills
    S + ' section [data-rv][style*="flex-wrap:wrap"] > span[style*="border-radius:10px"]{padding:9px 12px!important;font-size:14px!important}',
    // related solutions
    S + ' a[data-va][style*="justify-content:space-between"]{padding:15px 16px!important;font-size:14.5px!important}',
    // CTA
    S + ' section:last-of-type [data-btn]{width:100%;text-align:center;justify-content:center}',
    '}',
    '@media (max-width:380px){' + S + ' section:nth-of-type(2) [data-g5="1"] > div > div:last-child{font-size:10.5px!important}' + S + ' [data-g3="1"]:has(> [data-va] > span + span:last-child){grid-template-columns:minmax(0,1fr)!important}}'
  ].join('\n');
  document.head.appendChild(st);
})();


/* Mobile length reduction — tighter rhythm on phones, all pages */
(function () {
  var st = document.createElement('style');
  st.textContent = [
    '@media (max-width:640px){',
    '  x-dc section,body section{padding-top:34px!important;padding-bottom:34px!important;padding-left:18px!important;padding-right:18px!important}',
    '  section[data-tabbar]{padding-top:8px!important;padding-bottom:8px!important}',
    '  section h1{font-size:clamp(30px,8.4vw,38px)!important;line-height:1.08!important}',
    '  section h2{font-size:clamp(24px,6.6vw,30px)!important;line-height:1.14!important;margin-bottom:10px!important}',
    '  section h3{line-height:1.25!important}',
    '  section p{line-height:1.55!important}',
    '  section > div{gap:22px!important}',
    '  section > div > div{row-gap:0}',
    '  [data-par]{max-width:340px!important;margin-left:auto!important;margin-right:auto!important}',
    '  section [data-r],section [data-rv]{margin-top:0}',
    '  section div[style*="margin-top:48px"],section div[style*="margin-top:40px"]{margin-top:22px!important}',
    '  section div[style*="margin-top:32px"],section div[style*="margin-top:30px"],section div[style*="margin-top:28px"]{margin-top:18px!important}',
    '  section div[style*="padding:34px"],section div[style*="padding:32px"],section div[style*="padding:30px"],section div[style*="padding:28px"]{padding:20px!important}',
    '  section div[style*="padding:26px"],section div[style*="padding:24px"]{padding:18px!important}',
    '  section div[style*="display:grid"][style*="gap:22px"],section div[style*="display:grid"][style*="gap:20px"],section div[style*="display:grid"][style*="gap:18px"]{gap:12px!important}',
    '  section div[style*="display:grid"][style*="gap:44px"],section div[style*="display:grid"][style*="gap:48px"],section div[style*="display:grid"][style*="gap:40px"]{gap:24px!important}',
    '  details{padding:13px 14px!important}',
    '  footer{padding-top:34px!important;padding-bottom:24px!important}',
    '  footer div:has(> [data-foot-brand]){gap:22px 18px!important}',
    '  footer [style*="gap:11px"]{gap:8px!important}',
    '}'
  ].join('\n');
  document.head.appendChild(st);
})();
