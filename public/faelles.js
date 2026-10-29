// HOPDOP - fælles hjælpere til undersider. Lavet af Krainer2
(function () {
  var H = window.HD = {};
  H.IP = 'hopdop.superawesome.dk';
  H.DISCORD = 'https://discord.gg/GE6Ku6Znh';

  H.esc = function (t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  H.tal = function (n, dec) {
    var v = Number(n) || 0;
    return v.toLocaleString('da-DK', { maximumFractionDigits: dec == null ? 0 : dec, minimumFractionDigits: dec || 0 });
  };
  H.tid = function (sek) {
    sek = Math.max(0, Math.round(Number(sek) || 0));
    var t = Math.floor(sek / 3600), m = Math.floor((sek % 3600) / 60);
    if (t >= 24) return Math.floor(t / 24) + 'd ' + (t % 24) + 't';
    return t + 't ' + m + 'm';
  };
  H.dato = function (ms) {
    if (!ms) return '';
    return new Date(ms).toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' });
  };
  H.siden = function (ms) {
    if (!ms) return 'aldrig';
    var s = Math.round((Date.now() - ms) / 1000);
    if (s < 60) return 'lige nu';
    if (s < 3600) return Math.floor(s / 60) + ' min. siden';
    if (s < 86400) return Math.floor(s / 3600) + ' t. siden';
    return Math.floor(s / 86400) + ' dage siden';
  };
  H.hoved = function (uuidEllerNavn, str) {
    return 'https://mc-heads.net/avatar/' + encodeURIComponent(uuidEllerNavn || 'MHF_Steve') + '/' + (str || 32);
  };
  H.profil = function (navn) { return 'spiller.html?navn=' + encodeURIComponent(navn); };

  H.login = function () {
    try {
      var l = JSON.parse(localStorage.getItem('hopdop-login'));
      if (l && l.token && l.udloeb > Date.now()) return l;
    } catch (e) {}
    return null;
  };
  H.api = function (sti, valg) {
    valg = valg || {};
    var headers = valg.headers || {};
    var l = H.login();
    if (l && valg.auth !== false) headers['Authorization'] = 'Bearer ' + l.token;
    if (valg.body && typeof valg.body !== 'string') {
      headers['Content-Type'] = 'application/json';
      valg.body = JSON.stringify(valg.body);
    }
    valg.headers = headers;
    return fetch('/api/' + sti, valg).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.fejl || ('Fejl ' + r.status)); e.status = r.status; throw e; }
        return j;
      });
    });
  };

  // Sideskift-knapper
  H.sider = function (boks, side, antal, vaelg) {
    boks.innerHTML = '';
    if (antal <= 1) return;
    function knap(tekst, s, aktiv, slaaFra, label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = tekst;
      if (label) b.setAttribute('aria-label', label);
      if (aktiv) b.setAttribute('aria-current', 'page');
      b.disabled = !!slaaFra;
      b.addEventListener('click', function () { vaelg(s); });
      boks.appendChild(b);
    }
    knap('‹', side - 1, false, side <= 1, 'Forrige side');
    var vis = [];
    for (var i = 1; i <= antal; i++) {
      if (i === 1 || i === antal || Math.abs(i - side) <= 2) vis.push(i);
      else if (vis[vis.length - 1] !== '…') vis.push('…');
    }
    vis.forEach(function (v) {
      if (v === '…') { var s = document.createElement('span'); s.textContent = '…'; s.className = 'daempet'; boks.appendChild(s); }
      else knap(String(v), v, v === side, false, 'Side ' + v);
    });
    knap('›', side + 1, false, side >= antal, 'Næste side');
  };

  // Header og footer på alle undersider
  var aktiv = document.body.getAttribute('data-side') || '';
  var links = [
    ['index.html', 'Forside', 'forside'],
    ['leaderboards.html', 'Leaderboards', 'leaderboards'],
    ['staff.html', 'Staff', 'staff'],
    ['ansog.html', 'Ansøg', 'ansog'],
    ['index.html#faq', 'FAQ', 'faq']
  ];
  // Banlisten er kun for Admin og Ejer
  var migNu = H.login();
  if (migNu && (migNu.rolle === 'admin' || migNu.rolle === 'ejer')) links.splice(2, 0, ['banliste.html', 'Banliste', 'banliste']);
  var top = document.getElementById('hd-top');
  if (top) {
    top.className = 'nd-top';
    var lnk = function (l) { return '<a href="' + l[0] + '"' + (l[2] === aktiv ? ' aria-current="page"' : '') + '>' + l[1] + '</a>'; };
    var del = links.length - 3;
    top.innerHTML = '<div class="nd-top-hoved"><div class="nd-top-in">' +
      '<nav class="nd-nav nd-nav-v" aria-label="Hovedmenu">' + links.slice(0, del).map(lnk).join('') + '</nav>' +
      '<a class="nd-logo" href="index.html" aria-label="HOPDOP - forside"><img src="assets/apple-touch-icon.png" alt=""></a>' +
      '<nav class="nd-nav nd-nav-h" aria-label="Menu">' + links.slice(del).map(lnk).join('') + '</nav></div></div>' +
      '<div class="nd-top-under"><div class="nd-top-in">' +
      '<div class="nd-under-v"><button type="button" class="nd-ip" data-ip="' + H.IP + '" title="Kopiér IP"><b>IP</b>' + H.IP + '</button><span data-hd-online></span></div>' +
      '<div class="nd-knapper"><span data-hd-tema></span><span data-hd-konto></span><a class="nd-discord" href="' + H.DISCORD + '">Discord</a></div></div></div>';
  }
  var bund = document.getElementById('hd-bund');
  if (bund) {
    bund.className = 'nd-footer';
    bund.innerHTML = '<div style="height:14px;background:#5DA03B;box-shadow:inset 0 -4px 0 #477F2C"></div>' +
      '<div class="nd-jord"><div style="max-width:1240px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:space-between;gap:24px;align-items:center">' +
      '<div style="display:flex;flex-direction:column;gap:6px"><span style="font-family:Silkscreen,monospace;font-weight:700;font-size:24px;color:#6EF08F;text-shadow:3px 3px 0 #0B3A1C">HOPDOP</span>' +
      '<span style="font-size:13px;color:#E2D3BF">' + H.IP + ' · Ikke tilknyttet Minecraft, Mojang eller Microsoft.</span></div>' +
      '<nav aria-label="Footer" style="display:flex;flex-wrap:wrap;gap:18px;font-family:Pixelify Sans,sans-serif;font-size:16px">' +
      links.map(function (l) { return '<a style="color:#fff" href="' + l[0] + '">' + l[1] + '</a>'; }).join('') +
      '</nav></div></div><div class="nd-bedrock"></div>';
  }
})();
