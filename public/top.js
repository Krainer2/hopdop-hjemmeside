// HOPDOP - banner, online-tæller, tema-knap og konto-menu (bruges på alle sider). Lavet af Krainer2
(function () {
  var root = document.documentElement;
  var IP = 'hopdop.superawesome.dk';
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function hent(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function saet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  var css = document.createElement('style');
  css.textContent = [
    '.hdt-banner{--bn:#6EF08F;--bn-rgb:110,240,143;position:fixed;z-index:60;left:50%;bottom:22px;width:min(640px,calc(100% - 32px));box-sizing:border-box;display:flex;align-items:center;gap:16px;padding:14px 14px 14px 18px;border-radius:18px;font:500 15px Inter,system-ui,sans-serif;color:#E8F1EC;background:linear-gradient(135deg,rgba(var(--bn-rgb),.16),rgba(8,13,11,.92) 55%);border:1px solid rgba(var(--bn-rgb),.35);box-shadow:0 18px 50px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.4),0 0 40px rgba(var(--bn-rgb),.12);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transform:translate(-50%,140%);opacity:0;transition:transform .6s cubic-bezier(.2,1.3,.4,1),opacity .4s}',
    '.hdt-banner.vis{transform:translate(-50%,0);opacity:1}',
    '.hdt-banner::before{content:"";position:absolute;left:18px;right:18px;top:-1px;height:2px;background:linear-gradient(90deg,transparent,var(--bn),transparent);opacity:.8}',
    '.hdt-bn-ikon{flex:none;width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:rgba(var(--bn-rgb),.14);color:var(--bn);position:relative}',
    '.hdt-bn-ikon::after{content:"";position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:var(--bn);box-shadow:0 0 0 0 rgba(var(--bn-rgb),.7);animation:hdtPuls 1.8s infinite}',
    '@keyframes hdtPuls{70%{box-shadow:0 0 0 10px rgba(var(--bn-rgb),0)}100%{box-shadow:0 0 0 0 rgba(var(--bn-rgb),0)}}',
    '.hdt-bn-tekst{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;line-height:1.35}',
    '.hdt-bn-tekst small{font:700 11px Silkscreen,monospace;letter-spacing:2px;color:var(--bn);text-transform:uppercase}',
    '.hdt-banner a{flex:none;display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 16px;border-radius:11px;font-weight:700;font-size:14px;text-decoration:none;color:#06120B;background:var(--bn);box-shadow:0 3px 0 rgba(0,0,0,.35),0 0 18px rgba(var(--bn-rgb),.35);transition:transform .15s}',
    '.hdt-banner a:hover{transform:translateY(-2px);color:#06120B}',
    '.hdt-banner button{flex:none;width:34px;height:34px;border:0;border-radius:9px;background:transparent;color:inherit;font-size:20px;line-height:1;cursor:pointer;opacity:.6}',
    '.hdt-banner button:hover{opacity:1;background:rgba(255,255,255,.08)}',
    '.hdt-banner.hdt-gul{--bn:#F5C542;--bn-rgb:245,197,66}.hdt-banner.hdt-roed{--bn:#FF6B5E;--bn-rgb:255,107,94}.hdt-banner.hdt-blaa{--bn:#7DD3FC;--bn-rgb:125,211,252}',
    ':root[data-tema="lyst"] .hdt-banner{color:#14251B;background:linear-gradient(135deg,rgba(var(--bn-rgb),.22),rgba(255,255,255,.95) 55%);box-shadow:0 18px 40px rgba(0,0,0,.15)}',
    '@media (max-width:560px){.hdt-banner{flex-wrap:wrap;bottom:12px;gap:10px;padding:12px 10px 12px 14px}.hdt-bn-ikon{display:none}.hdt-bn-tekst{flex:1 1 0}.hdt-banner button{order:2}.hdt-banner a{order:3;flex:1 1 100%;justify-content:center}}',
    '.hdt-boks{display:flex;align-items:center;gap:8px;position:relative}',
    '.hdt-online{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--hdt-kant,#24402F);background:var(--hdt-bg,rgba(15,24,19,.8));color:var(--hdt-daempet,#A9BFB1);font:500 13px Inter,system-ui,sans-serif;white-space:nowrap}',
    '.hdt-online i{width:8px;height:8px;border-radius:50%;background:#4ADE80;display:inline-block}',
    '.hdt-online.off i{background:#EF4444}',
    '.hdt-knap{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:40px;height:40px;padding:0 10px;border-radius:10px;border:1px solid transparent;background:transparent;color:var(--hdt-tekst,#E6F2EA);font:600 14px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none}',
    '.hdt-knap:hover{background:var(--hdt-hover,rgba(255,255,255,.06))}',
    '.hdt-konto{border-color:#4ADE80;padding:0 12px 0 6px}',
    '.hdt-konto img{width:28px;height:28px;border-radius:6px;image-rendering:pixelated;background:#24402F}',
    '.hdt-logind{border-color:var(--hdt-kant,#24402F);padding:0 14px}',
    '.hdt-menu{position:absolute;right:0;top:calc(100% + 8px);min-width:200px;padding:6px;border-radius:12px;border:1px solid var(--hdt-kant,#24402F);background:var(--hdt-menu,#0F1813);box-shadow:0 18px 40px rgba(0,0,0,.45);z-index:60;display:flex;flex-direction:column}',
    '.hdt-menu[hidden]{display:none}',
    '.hdt-menu a,.hdt-menu button{display:flex;align-items:center;gap:12px;min-height:42px;padding:8px 12px;border-radius:8px;border:0;background:transparent;color:var(--hdt-tekst,#E6F2EA);font:500 15px Inter,system-ui,sans-serif;text-align:left;text-decoration:none;cursor:pointer;width:100%}',
    '.hdt-menu a:hover,.hdt-menu button:hover{background:var(--hdt-hover,rgba(255,255,255,.06))}',
    '.hdt-menu .ud{color:#F87171}',
    '.hdt-menu .valgt{color:#4ADE80}',
    '.hdt-menu hr{border:0;border-top:1px solid var(--hdt-kant,#24402F);margin:4px 0;width:100%}',
    '.hdt-menu svg,.hdt-knap svg{flex:none}',
    '.hdt-tema-knap svg{transition:transform .5s ease}.hdt-tema-knap.er-sol{color:#D97706}.hdt-tema-knap.er-maane{color:#C7D2FE}.hdt-tema-knap.er-maane svg{animation:hdtSol .6s ease}.hdt-tema-knap.er-sol svg{animation:hdtSol .6s ease}',
    '@keyframes hdtSol{from{transform:rotate(-90deg) scale(.6);opacity:0}to{transform:none;opacity:1}}',
    ':root[data-tema="lyst"]{--hdt-kant:#C3D6CA;--hdt-bg:rgba(255,255,255,.85);--hdt-daempet:#4B6355;--hdt-tekst:#14251B;--hdt-hover:rgba(0,0,0,.05);--hdt-menu:#FFFFFF}',
    ':root[data-tema="lyst"] .hdt-menu{box-shadow:0 18px 40px rgba(0,0,0,.15)}',
    '@media (max-width:760px){.hdt-online{display:none}}'
  ].join('\n');
  document.head.appendChild(css);

  var IKON = {
    maane: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.5 2.5a9.5 9.5 0 1 0 7 15.9A8 8 0 0 1 14.5 2.5z"/><path fill="currentColor" opacity=".7" d="M18 3.5l.6 1.4 1.4.6-1.4.6L18 7.5l-.6-1.4-1.4-.6 1.4-.6zM21 9l.4.9.9.4-.9.4-.4.9-.4-.9-.9-.4.9-.4z"/></svg>',
    sol: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 1.5v2.5M12 20v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M1.5 12H4M20 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>',
    skaerm: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    person: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
    skjold: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/></svg>',
    ud: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
    pil: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
  };

  // Luk åbne menuer ved klik udenfor eller Escape
  var aabne = [];
  function lukAlle(undtagen) {
    aabne.forEach(function (m) { if (m.menu !== undtagen) { m.menu.hidden = true; m.knap.setAttribute('aria-expanded', 'false'); } });
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.hdt-boks')) lukAlle();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lukAlle(); });
  function dropdown(boks, knap, menu) {
    menu.hidden = true;
    knap.setAttribute('aria-haspopup', 'true');
    knap.setAttribute('aria-expanded', 'false');
    knap.addEventListener('click', function () {
      var aaben = menu.hidden;
      lukAlle(menu);
      menu.hidden = !aaben;
      knap.setAttribute('aria-expanded', aaben ? 'true' : 'false');
    });
    aabne.push({ menu: menu, knap: knap });
  }

  // ---------- Tema ----------
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  function valgtTema() { return hent('hopdop-tema') || 'moerkt'; }
  function anvendTema() {
    var v = valgtTema();
    var lys = v === 'lyst' || (v === 'system' && mq && mq.matches);
    root.setAttribute('data-tema', lys ? 'lyst' : 'moerkt');
    document.querySelectorAll('.hdt-tema-knap').forEach(function (k) { var sys = v === 'system'; k.innerHTML = sys ? IKON.skaerm : (lys ? IKON.sol : IKON.maane); k.classList.toggle('er-sol', lys && !sys); k.classList.toggle('er-maane', !lys && !sys); k.setAttribute('aria-label', (sys ? 'System-tema' : lys ? 'Lyst tema' : 'Mørkt tema') + ' (skift tema)'); });
    document.querySelectorAll('.hdt-tema-menu button').forEach(function (b) { b.classList.toggle('valgt', b.dataset.tema === v); b.setAttribute('aria-checked', b.dataset.tema === v ? 'true' : 'false'); });
    window.dispatchEvent(new Event('hdtema'));
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', anvendTema);

  function temaKnap(mount) {
    var boks = document.createElement('div');
    boks.className = 'hdt-boks';
    boks.innerHTML = '<button type="button" class="hdt-knap hdt-tema-knap" aria-label="Skift tema"></button>' +
      '<div class="hdt-menu hdt-tema-menu" role="menu" style="right:auto;left:50%;transform:translateX(-50%);min-width:170px">' +
      '<button type="button" role="menuitemradio" data-tema="lyst">' + IKON.sol + 'Lyst</button>' +
      '<button type="button" role="menuitemradio" data-tema="moerkt">' + IKON.maane + 'Mørkt</button>' +
      '<button type="button" role="menuitemradio" data-tema="system">' + IKON.skaerm + 'System</button></div>';
    mount.appendChild(boks);
    var menu = boks.querySelector('.hdt-menu');
    dropdown(boks, boks.querySelector('.hdt-tema-knap'), menu);
    menu.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { saet('hopdop-tema', b.dataset.tema); anvendTema(); lukAlle(); });
    });
  }

  // ---------- Konto ----------
  function login() {
    try {
      var l = JSON.parse(hent('hopdop-login'));
      if (l && l.token && l.udloeb > Date.now()) return l;
    } catch (e) {}
    return null;
  }
  function kontoKnap(mount) {
    var l = login();
    var boks = document.createElement('div');
    boks.className = 'hdt-boks';
    if (!l) {
      var til = location.pathname + location.search;
      boks.innerHTML = '<a class="hdt-knap hdt-logind" href="/api/sa/start?til=' + encodeURIComponent(til) + '">' + IKON.person + 'Log ind</a>';
      mount.appendChild(boks);
      return;
    }
    var staff = l.rolle && l.rolle !== 'spiller';
    boks.innerHTML = '<button type="button" class="hdt-knap hdt-konto"><img alt="" src="https://mc-heads.net/avatar/' + encodeURIComponent(l.uuid || l.navn) + '/28"><span>' + esc(l.navn) + '</span>' + IKON.pil + '</button>' +
      '<div class="hdt-menu" role="menu">' +
      '<a role="menuitem" href="spiller.html?navn=' + encodeURIComponent(l.navn) + '">' + IKON.person + 'Min profil</a>' +
      (staff ? '<a role="menuitem" href="admin.html">' + IKON.skjold + 'Admin-panel</a>' : '') +
      ((l.rolle === 'admin' || l.rolle === 'ejer') ? '<a role="menuitem" href="admin.html#stats">' + IKON.skjold + 'Ret stats</a>' : '') +
      '<hr><button type="button" role="menuitem" class="ud">' + IKON.ud + 'Log ud</button></div>';
    mount.appendChild(boks);
    dropdown(boks, boks.querySelector('.hdt-konto'), boks.querySelector('.hdt-menu'));
    boks.querySelector('.ud').addEventListener('click', function () {
      saet('hopdop-login', null);
      location.reload();
    });
  }

  // ---------- Online-tæller ----------
  function onlineTaeller(mount) {
    var s = document.createElement('span');
    s.className = 'hdt-online';
    s.innerHTML = '<i></i><span>... online</span>';
    mount.appendChild(s);
    fetch('https://api.mcsrvstat.us/3/' + IP).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.online) s.querySelector('span').textContent = ((d.players && d.players.online) || 0) + ' online';
      else { s.classList.add('off'); s.querySelector('span').textContent = 'Offline'; }
    }).catch(function () { s.querySelector('span').textContent = 'online'; });
  }

  // ---------- Banner ----------
  function banner() {
    fetch('/api/banner').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var b = j && j.banner;
      if (!b || !b.aktiv || !b.tekst) return;
      if (hent('hopdop-banner-luk') === b.id) return;
      var d = document.createElement('div');
      d.className = 'hdt-banner hdt-' + (b.farve || 'groen');
      d.setAttribute('role', 'region');
      d.setAttribute('aria-label', 'Besked fra HOPDOP');
      d.innerHTML = '<span class="hdt-bn-ikon" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg></span>' +
        '<span class="hdt-bn-tekst"><small>Nyt fra HOPDOP</small><span></span></span>' +
        (b.link && b.linkTekst ? '<a></a>' : '') + '<button type="button" aria-label="Luk besked">×</button>';
      d.querySelector('.hdt-bn-tekst span').textContent = b.tekst;
      if (b.link && b.linkTekst) { var a = d.querySelector('a'); a.href = b.link; a.textContent = b.linkTekst.replace(/\s*[→>]+\s*$/, '') + ' →'; }
      d.querySelector('button').addEventListener('click', function () {
        saet('hopdop-banner-luk', b.id); d.classList.remove('vis'); setTimeout(function () { d.remove(); }, 600);
      });
      document.body.appendChild(d);
      setTimeout(function () { d.classList.add('vis'); }, 1200);
    }).catch(function () {});
  }

  // ---------- Glow omkring de vigtige ting ----------
  var glow = document.createElement('style');
  glow.textContent = [
    '@keyframes hdtPuls{0%,100%{text-shadow:0 0 18px rgba(74,222,128,.45),0 0 42px rgba(74,222,128,.22)}50%{text-shadow:0 0 26px rgba(74,222,128,.7),0 0 60px rgba(74,222,128,.35)}}',
    '@keyframes hdtLogo{0%,100%{filter:drop-shadow(0 0 22px rgba(74,222,128,.28)) drop-shadow(0 0 60px rgba(255,170,70,.14))}50%{filter:drop-shadow(0 0 32px rgba(74,222,128,.42)) drop-shadow(0 0 80px rgba(255,170,70,.22))}}',
    /* Logoet i headeren */
    '.hd-logo b,header a[href="#top"] > span:first-child{text-shadow:3px 3px 0 #0E3B1F,0 0 18px rgba(74,222,128,.55),0 0 38px rgba(74,222,128,.25)}',
    /* Den grønne linje i overskriften på forsiden (ligesom "hyggeligste") */
    '[data-tekst="hero.titel2"]{animation:hdtPuls 3.5s ease-in-out infinite}',
    /* Det store logo på forsiden */
    '.hd-svaev svg{animation:hdtLogo 5s ease-in-out infinite}',
    /* Vigtige knapper og IP-boksen */
    'button[data-kopier]{box-shadow:inset 0 -5px 0 #16A34A,0 0 22px rgba(74,222,128,.45) !important}',
    'a[href*="discord.gg"]{box-shadow:inset 0 -5px 0 #3C45A5,0 0 22px rgba(88,101,242,.4) !important}',
    '.hdt-konto{box-shadow:0 0 16px rgba(74,222,128,.35)}',
    '#status-prik{box-shadow:0 0 10px rgba(74,222,128,.9)}',
    '.side-top h1{text-shadow:0 0 28px rgba(74,222,128,.25)}',
    '.knap.groen{box-shadow:inset 0 -4px 0 #16A34A,0 0 18px rgba(74,222,128,.4)}',
    ':root[data-tema="lyst"] .hd-logo b{text-shadow:3px 3px 0 #BBF7D0,0 0 14px rgba(22,163,74,.35)}',
    ':root[data-tema="lyst"] .side-top h1{text-shadow:none}',
    '@media (prefers-reduced-motion: reduce){[data-tekst="hero.titel2"],.hd-svaev svg{animation:none}}'
  ].join('\n');
  document.head.appendChild(glow);

  // ---------- Spor efter musen (små pixel-blade der falder og forsvinder) ----------
  (function () {
    var roligt = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (roligt || touch) return;
    var c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(c);
    var ctx = c.getContext('2d'), dpr = 1, dele = [], koerer = false, sidst = 0, lx = -1, ly = -1;
    var FARVER = ['#4ADE80', '#86EFAC', '#F9A8D4', '#F472B6', '#FACC15', '#FFD27A'];
    function str() { dpr = window.devicePixelRatio || 1; c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    str();
    window.addEventListener('resize', str);
    window.addEventListener('mousemove', function (e) {
      var nu = performance.now();
      var afst = lx < 0 ? 99 : Math.hypot(e.clientX - lx, e.clientY - ly);
      if (nu - sidst < 24 || afst < 10) return;
      sidst = nu; lx = e.clientX; ly = e.clientY;
      var antal = 1;
      for (var i = 0; i < antal; i++) {
        dele.push({
          x: e.clientX + (Math.random() - 0.5) * 8, y: e.clientY + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 0.5, vy: 0.15 + Math.random() * 0.45,
          s: Math.random() < 0.3 ? 4 : 3,
          f: FARVER[Math.floor(Math.random() * FARVER.length)],
          liv: 0, max: 800 + Math.random() * 700, rot: Math.random() < 0.5
        });
      }
      if (dele.length > 90) dele.splice(0, dele.length - 90);
      if (!koerer) { koerer = true; requestAnimationFrame(tegn); }
    }, { passive: true });
    var forrige = performance.now();
    function tegn(nu) {
      var dt = Math.min(50, nu - forrige); forrige = nu;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (var i = dele.length - 1; i >= 0; i--) {
        var p = dele[i];
        p.liv += dt;
        if (p.liv >= p.max) { dele.splice(i, 1); continue; }
        p.x += p.vx * dt / 16 + Math.sin((p.liv + i * 40) / 300) * 0.15;
        p.y += p.vy * dt / 16;
        var a = 1 - p.liv / p.max;
        ctx.globalAlpha = a * a;
        ctx.fillStyle = p.f;
        ctx.shadowColor = p.f;
        ctx.shadowBlur = 8;
        var s = p.s * (0.6 + 0.4 * a);
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.round(s), Math.round(s));
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (dele.length) requestAnimationFrame(tegn); else koerer = false;
    }
  })();

  // ---------- Søgning (Ctrl+K): spillere, teams, staff, sider, kits og FAQ ----------
  (function () {
    var forside = /(^\/$|index\.html$)/.test(location.pathname) || location.pathname === '';
    var F = forside ? '' : 'index.html';
    var mig = null;
    try { mig = JSON.parse(localStorage.getItem('hopdop-login')); } catch (e) {}
    var erAdmin = mig && mig.udloeb > Date.now() && (mig.rolle === 'admin' || mig.rolle === 'ejer');
    var SIDER = [
      ['Forside', F + '#top', 'Side'], ['Features', F + '#features', 'Side'], ['Kits', F + '#kits', 'Side'],
      ['KOTH', F + '#koth', 'Side'], ['FAQ', F + '#faq', 'Side'], ['Leaderboards', 'leaderboards.html', 'Side'],
      ['Staff', 'staff.html', 'Side'], ['Regler', 'regler.html', 'Side'], ['Forum', 'ansog.html', 'Side'], ['Ansøg om staff', 'ansog.html?type=staff', 'Side'], ['Ansøg som bygger', 'ansog.html?type=bygger', 'Side'],
      ['Unban-ansøgning', 'ansog.html?type=unban', 'Side'], ['Discord', 'https://discord.gg/GE6Ku6Znh', 'Link'], ['Staff login', 'admin.html', 'Side']
    ];
    if (erAdmin) SIDER.push(['Banliste', 'banliste.html', 'Side'], ['Ret stats', 'admin.html#stats', 'Admin']);
    ['Diamond', 'Bard', 'Archer', 'Rogue', 'Reaper'].forEach(function (k) { SIDER.push([k + ' kit', F + '#kits', 'Kit']); });
    ['Hvordan joiner jeg?', 'Er serveren pay-to-win?', 'Hvordan søger jeg staff?', 'Jeg er blevet bannet - hvad nu?', 'Hvordan virker kits?'].forEach(function (q) { SIDER.push([q, F + '#faq', 'FAQ']); });

    var data = null;
    function hentData() {
      if (data) return Promise.resolve(data);
      return Promise.all([
        fetch('/api/stats').then(function (r) { return r.json(); }).catch(function () { return {}; }),
        fetch('/api/staff').then(function (r) { return r.json(); }).catch(function () { return {}; })
      ]).then(function (r) {
        data = { spillere: r[0].spillere || [], teams: r[0].teams || [], staff: r[1].staff || [] };
        return data;
      });
    }

    // Lup i topbaren, der folder sig ud til et søgefelt
    var holder = document.querySelector('.nd-knapper');
    if (!holder) return;
    var boks = document.createElement('div');
    boks.className = 'nd-soeg';
    boks.innerHTML = '<div class="nd-soeg-in"><button type="button" class="nd-soeg-knap" aria-label="Søg (Ctrl+K)" aria-expanded="false"><svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></button>' +
      '<label class="sr" for="nd-soeg-input">Søg</label><input id="nd-soeg-input" type="search" autocomplete="off" placeholder="Søg spiller, team, side..." tabindex="-1"></div>' +
      '<ul class="nd-soeg-res" role="listbox" hidden></ul>';
    holder.insertBefore(boks, holder.firstChild);
    var knap = boks.querySelector('button'), input = boks.querySelector('input'), ul = boks.querySelector('ul'), valgt = 0, res = [];

    function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function point(tekst, q) {
      var t = tekst.toLowerCase();
      if (t === q) return 100; if (t.indexOf(q) === 0) return 80; if (t.indexOf(q) > -1) return 50; return 0;
    }
    function soeg() {
      var q = input.value.trim().toLowerCase();
      res = [];
      if (q) {
        SIDER.forEach(function (s) { var p = point(s[0], q); if (p) res.push({ t: s[0], h: s[1], type: s[2], p: p - 5 }); });
        if (data) {
          data.spillere.forEach(function (s) { var p = point(s.n, q); if (p) res.push({ t: s.n, h: 'spiller.html?navn=' + encodeURIComponent(s.n), type: 'Spiller', p: p + 2, hoved: s.u, info: s.k + ' kills' }); });
          data.teams.forEach(function (t) { var p = point(t.n, q); if (p) res.push({ t: t.n, h: 'leaderboards.html#teams/tlvl', type: 'Team', p: p + 1, info: (t.m ? t.m.length : 0) + ' medl.' }); });
          data.staff.forEach(function (s) { var p = point(s.navn, q); if (p) res.push({ t: s.navn, h: 'staff.html', type: s.rolle, p: p, hoved: s.navn }); });
        }
        res.sort(function (a, b) { return b.p - a.p || a.t.localeCompare(b.t); });
        res = res.slice(0, 8);
      }
      valgt = 0;
      tegn();
    }
    function tegn() {
      if (!input.value.trim()) { ul.hidden = true; return; }
      ul.hidden = false;
      if (!res.length) { ul.innerHTML = '<li class="nd-soeg-tom">Ingen resultater</li>'; return; }
      ul.innerHTML = res.map(function (r, i) {
        var ikon = r.hoved ? '<img alt="" src="https://mc-heads.net/avatar/' + encodeURIComponent(r.hoved) + '/28">' : '<span class="nd-soeg-prik"></span>';
        return '<li role="option" aria-selected="' + (i === valgt) + '"><a href="' + esc(r.h) + '">' + ikon + '<span class="nd-soeg-t">' + esc(r.t) + (r.info ? ' <small>' + esc(r.info) + '</small>' : '') + '</span><span class="nd-soeg-type">' + esc(r.type) + '</span></a></li>';
      }).join('');
    }
    var bar = boks.closest('.nd-top-in');
    function aaben() {
      boks.classList.add('aaben');
      if (bar) bar.classList.add('soeg-aaben');
      knap.setAttribute('aria-expanded', 'true');
      input.tabIndex = 0;
      setTimeout(function () { input.focus(); }, 30);
      hentData().then(soeg);
    }
    function luk() {
      boks.classList.remove('aaben');
      if (bar) bar.classList.remove('soeg-aaben');
      knap.setAttribute('aria-expanded', 'false');
      input.tabIndex = -1;
      input.value = '';
      ul.hidden = true;
    }
    knap.addEventListener('click', function () { boks.classList.contains('aaben') ? (input.value ? input.focus() : luk()) : aaben(); });
    input.addEventListener('input', soeg);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); valgt = Math.min(res.length - 1, valgt + 1); tegn(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); valgt = Math.max(0, valgt - 1); tegn(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var maal = res[valgt] ? res[valgt].h : (input.value.trim() ? 'spiller.html?navn=' + encodeURIComponent(input.value.trim()) : null);
        if (maal) { luk(); location.href = maal; }
      } else if (e.key === 'Escape') { luk(); knap.focus(); }
    });
    ul.addEventListener('click', function (e) { if (e.target.closest('a')) setTimeout(luk, 0); });
    document.addEventListener('click', function (e) { if (!boks.contains(e.target) && boks.classList.contains('aaben')) luk(); });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); boks.classList.contains('aaben') ? luk() : aaben(); }
    });
  })();

  // Monter alt
  document.querySelectorAll('[data-hd-online]').forEach(onlineTaeller);
  document.querySelectorAll('[data-hd-tema]').forEach(temaKnap);
  document.querySelectorAll('[data-hd-konto]').forEach(kontoKnap);
  anvendTema();
  banner();
  // Kopiér IP i topbaren
  document.querySelectorAll('.nd-ip').forEach(function (k) {
    k.addEventListener('click', function () {
      var ip = k.getAttribute('data-ip'), gammel = k.innerHTML;
      var faerdig = function () { k.innerHTML = '<b>IP</b>Kopieret!'; setTimeout(function () { k.innerHTML = gammel; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(ip).then(faerdig, faerdig); else faerdig();
    });
  });
  window.HDTop = { anvendTema: anvendTema };
})();
