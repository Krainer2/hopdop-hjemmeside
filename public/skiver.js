// HOPDOP - skjult minispil: skydeskiver i baggrunden på forsiden. Lavet af Krainer2
(function () {
  var hero = document.getElementById('top');
  if (!hero) return;
  var roligt = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pixel-skydeskive i Minecraft "target block"-stil (16x16)
  function skiveSvg(pil) {
    var r = '';
    var ringe = ['#E8DCC8', '#C0392B', '#E8DCC8', '#C0392B', '#E8DCC8', '#C0392B'];
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
      var d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      var f = d > 7 ? ((x + y) % 3 === 0 ? '#5E4320' : '#7A5A2E') : ringe[Math.min(5, Math.floor((7.5 - d) / 1.3))];
      if (d <= 7 && (x * 7 + y * 3) % 11 === 0) f = f === '#C0392B' ? '#A93226' : '#D9CBB2';
      r += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + f + '"/>';
    }
    var p = pil == null ? '' : '<g transform="rotate(' + pil + ' 8 8)"><rect x="8" y="7.5" width="9" height="1" fill="#6B4423"/><rect x="16" y="6.5" width="2" height="1" fill="#E5E5E5"/><rect x="16" y="8.5" width="2" height="1" fill="#E5E5E5"/><rect x="7" y="7.25" width="1.5" height="1.5" fill="#9A9A9A"/></g>';
    return '<svg viewBox="-3 -3 22 22" width="100%" height="100%" aria-hidden="true" style="display:block;shape-rendering:crispEdges;overflow:visible"><rect x="-0.6" y="-0.6" width="17.2" height="17.2" fill="#05060C"/>' + r + p + '</svg>';
  }

  var css = document.createElement('style');
  css.textContent = [
    '@keyframes hdsSvaev{0%,100%{transform:translateY(0) rotate(var(--r))}50%{transform:translateY(-12px) rotate(calc(var(--r) * -1))}}',
    '@keyframes hdsInd{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}',
    '@keyframes hdsRamt{to{opacity:0;transform:scale(1.6) rotate(25deg)}}',
    '#hd-skiver{position:absolute;inset:0;z-index:2;pointer-events:none}',
    '.hds{position:absolute;pointer-events:auto;cursor:crosshair;filter:drop-shadow(0 0 14px rgba(255,120,60,.35));animation:hdsInd .5s ease-out both;-webkit-tap-highlight-color:transparent}',
    '.hds > div{width:100%;height:100%;animation:hdsSvaev var(--t) ease-in-out infinite;animation-delay:var(--d)}',
    '.hds:hover{filter:drop-shadow(0 0 18px rgba(255,140,60,.7)) brightness(1.1)}',
    '.hds.ramt{pointer-events:none;animation:hdsRamt .35s ease-in forwards}',
    '@media (prefers-reduced-motion: reduce){.hds > div{animation:none}.hds,.hds.ramt{animation-duration:.01s}}'
  ].join('\n');
  document.head.appendChild(css);

  var lag = document.createElement('div');
  lag.id = 'hd-skiver';
  lag.setAttribute('aria-hidden', 'true');
  hero.appendChild(lag);

  // Konfetti-lærred
  var c = document.createElement('canvas');
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9998';
  document.body.appendChild(c);
  var ctx = c.getContext('2d'), dele = [], koerer = false;
  function str() { var dpr = window.devicePixelRatio || 1; c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  str();
  window.addEventListener('resize', str);
  var FARVER = ['#C0392B', '#E8DCC8', '#4ADE80', '#86EFAC', '#F472B6', '#FACC15', '#7DD3FC'];
  function konfetti(x, y) {
    var antal = roligt ? 14 : 42;
    for (var i = 0; i < antal; i++) {
      var v = Math.random() * Math.PI * 2, fart = 2 + Math.random() * 5;
      dele.push({ x: x, y: y, vx: Math.cos(v) * fart, vy: Math.sin(v) * fart - 3, s: Math.random() < 0.4 ? 7 : 4,
        f: FARVER[Math.floor(Math.random() * FARVER.length)], liv: 0, max: 900 + Math.random() * 700, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4 });
    }
    if (!koerer) { koerer = true; forrige = performance.now(); requestAnimationFrame(tegn); }
  }
  var forrige = 0;
  function tegn(nu) {
    var dt = Math.min(40, nu - forrige) / 16; forrige = nu;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = dele.length - 1; i >= 0; i--) {
      var p = dele[i];
      p.liv += dt * 16;
      if (p.liv >= p.max) { dele.splice(i, 1); continue; }
      p.vy += 0.22 * dt; p.vx *= Math.pow(0.985, dt);
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      ctx.save();
      ctx.globalAlpha = Math.min(1, 1.6 * (1 - p.liv / p.max));
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.f;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
      ctx.restore();
    }
    if (dele.length) requestAnimationFrame(tegn); else { koerer = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  // Find et ledigt sted i toppen, som ikke dækker tekst, knapper eller logo
  function optaget() {
    var h = hero.getBoundingClientRect();
    var sel = '#top h1, #top p, #top a, #top button, #top .hd-svaev, #top [data-tekst="hero.badge"], #top label, #top input';
    return Array.prototype.map.call(hero.querySelectorAll(sel), function (e) {
      var r = e.getBoundingClientRect();
      return { x1: r.left - h.left - 24, y1: r.top - h.top - 24, x2: r.right - h.left + 24, y2: r.bottom - h.top + 24 };
    }).filter(function (r) { return r.x2 > r.x1 && r.y2 > r.y1; });
  }
  function nytSted(str, andre) {
    var bredde = hero.clientWidth, hoejde = hero.clientHeight;
    var blok = optaget();
    for (var forsoeg = 0; forsoeg < 60; forsoeg++) {
      var x = 16 + Math.random() * Math.max(1, bredde - str - 32);
      var y = 70 + Math.random() * Math.max(1, hoejde - str - 140);
      var r = { x1: x, y1: y, x2: x + str, y2: y + str };
      var ramler = blok.concat(andre).some(function (b) { return r.x1 < b.x2 && r.x2 > b.x1 && r.y1 < b.y2 && r.y2 > b.y1; });
      if (!ramler) return { x: x, y: y };
    }
    return null;
  }

  var antal = window.innerWidth < 760 ? 2 : 4;
  var skiver = [];
  function placering(undtagen) {
    return skiver.filter(function (s) { return s !== undtagen && s.pos; }).map(function (s) {
      return { x1: s.pos.x - 30, y1: s.pos.y - 30, x2: s.pos.x + s.str + 30, y2: s.pos.y + s.str + 30 };
    });
  }
  function spawn(s) {
    s.str = 52 + Math.round(Math.random() * 30);
    var pos = nytSted(s.str, placering(s));
    if (!pos) { s.pos = null; setTimeout(function () { spawn(s); }, 2000); return; }
    s.pos = pos;
    var el = document.createElement('div');
    el.className = 'hds';
    el.style.cssText = 'left:' + pos.x + 'px;top:' + pos.y + 'px;width:' + s.str + 'px;height:' + s.str + 'px';
    var pil = Math.random() < 0.4 ? Math.round(Math.random() * 360) : null;
    el.innerHTML = '<div style="--r:' + (Math.random() * 16 - 8).toFixed(1) + 'deg;--t:' + (4 + Math.random() * 3).toFixed(1) + 's;--d:-' + (Math.random() * 4).toFixed(1) + 's">' + skiveSvg(pil) + '</div>';
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      if (el.classList.contains('ramt')) return;
      var r = el.getBoundingClientRect();
      konfetti(r.left + r.width / 2, r.top + r.height / 2);
      el.classList.add('ramt');
      setTimeout(function () { el.remove(); }, 400);
      s.pos = null;
      setTimeout(function () { spawn(s); }, 900 + Math.random() * 1600);
    });
    lag.appendChild(el);
    s.el = el;
  }
  function start() {
    for (var i = 0; i < antal; i++) { var s = {}; skiver.push(s); spawn(s); }
  }
  // Vent til skrift og logo har fundet deres plads
  if (document.readyState === 'complete') setTimeout(start, 600);
  else window.addEventListener('load', function () { setTimeout(start, 600); });

  // Flyt skiver der havner oven i noget, hvis vinduet ændrer størrelse
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      skiver.forEach(function (s) { if (s.el) s.el.remove(); s.pos = null; });
      skiver.forEach(spawn);
    }, 400);
  });
})();
