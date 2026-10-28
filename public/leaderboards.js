// HOPDOP leaderboards - live fra serveren via /api/stats. Lavet af Krainer2
(function () {
  var H = window.HD;
  var PR_SIDE = 20;

  // v = værdi, f = formatering, team = tavlen viser teams
  var KATEGORIER = [
    { id: 'pvp', navn: 'PvP', tavler: [
      { id: 'kills', navn: 'Kills', v: function (s) { return s.k; }, f: function (v) { return H.tal(v) + ' kills'; } },
      { id: 'doede', navn: 'Døde', v: function (s) { return s.d; }, f: function (v) { return H.tal(v) + ' døde'; } },
      { id: 'kd', navn: 'K/D', v: function (s) { return s.k >= 10 ? s.k / Math.max(1, s.d) : 0; }, f: function (v) { return H.tal(v, 2) + ' K/D'; }, info: 'Kræver mindst 10 kills.' }
    ] },
    { id: 'teams', navn: 'Teams', tavler: [
      { id: 'koth', navn: 'KOTH-sejre', team: true, v: function (t) { return t.koth; }, f: function (v) { return H.tal(v) + ' KOTH'; } },
      { id: 'tkills', navn: 'Team-kills', team: true, v: function (t) { return t.k; }, f: function (v) { return H.tal(v) + ' kills'; } },
      { id: 'tlvl', navn: 'Team-level', team: true, v: function (t) { return t.lvl * 100000 + t.k; }, f: function (v, t) { return 'Level ' + t.lvl; } },
      { id: 'tkd', navn: 'Team K/D', team: true, v: function (t) { return t.k >= 10 ? t.k / Math.max(1, t.d) : 0; }, f: function (v) { return H.tal(v, 2) + ' K/D'; }, info: 'Kræver mindst 10 kills.' }
    ] },
    { id: 'fisk', navn: 'Fiskeri', tavler: [
      { id: 'flvl', navn: 'Fiske-level', v: function (s) { return s.ff > 0 ? s.fl * 1e9 + s.fx : 0; }, f: function (v, s) { return 'Level ' + s.fl; } },
      { id: 'fangst', navn: 'Fangster', v: function (s) { return s.ff; }, f: function (v) { return H.tal(v) + ' fisk'; } },
      { id: 'rare', navn: 'Rare fangster', v: function (s) { return s.fr; }, f: function (v) { return H.tal(v) + ' rare'; } },
      { id: 'mega', navn: 'Mega Rare', v: function (s) { return s.fm; }, f: function (v) { return H.tal(v) + ' mega'; } },
      { id: 'pvpfisk', navn: 'PvP-fangster', v: function (s) { return s.fp; }, f: function (v) { return H.tal(v) + ' fangster'; } }
    ] },
    { id: 'vagt', navn: 'Vagt og tyveri', tavler: [
      { id: 'vagtposter', navn: 'Vagtposter', v: function (s) { return s.vp; }, f: function (v) { return H.tal(v) + ' poster'; } },
      { id: 'vagtrare', navn: 'Sjældne vagt-fund', v: function (s) { return s.vr; }, f: function (v) { return H.tal(v) + ' fund'; } },
      { id: 'roev', navn: 'Røverier', v: function (s) { return s.tr; }, f: function (v) { return H.tal(v) + ' røverier'; } },
      { id: 'roevpenge', navn: 'Røvet for', v: function (s) { return s.tp; }, f: function (v) { return '$' + H.tal(v); } },
      { id: 'spasser', navn: 'Spassermine-besøg', v: function (s) { return s.st; }, f: function (v) { return H.tal(v) + ' gange'; } },
      { id: 'blocks', navn: 'Blocks i spasserminen', v: function (s) { return s.sm; }, f: function (v) { return H.tal(v) + ' blocks'; } }
    ] },
    { id: 'aktiv', navn: 'Aktivitet', tavler: [
      { id: 'spilletid', navn: 'Spilletid', v: function (s) { return s.ot; }, f: function (v) { return H.tid(v); } },
      { id: 'daily', navn: 'Daily-streak', v: function (s) { return s.ds; }, f: function (v) { return H.tal(v) + ' dage'; } }
    ] }
  ];

  var data = null, katId = 'pvp', tavleId = 'kills', side = 1, soeg = '';
  var el = function (id) { return document.getElementById(id); };

  function laesHash() {
    var h = location.hash.replace('#', '').split('/');
    var k = KATEGORIER.filter(function (x) { return x.id === h[0]; })[0];
    if (k) { katId = k.id; tavleId = (k.tavler.filter(function (t) { return t.id === h[1]; })[0] || k.tavler[0]).id; }
  }
  function kat() { return KATEGORIER.filter(function (k) { return k.id === katId; })[0]; }
  function tavle() { return kat().tavler.filter(function (t) { return t.id === tavleId; })[0]; }

  function chips() {
    el('lb-kat').innerHTML = '';
    KATEGORIER.forEach(function (k) {
      var b = document.createElement('button');
      b.className = 'chip'; b.type = 'button'; b.setAttribute('role', 'tab');
      b.textContent = k.navn;
      b.setAttribute('aria-selected', k.id === katId ? 'true' : 'false');
      b.addEventListener('click', function () { katId = k.id; tavleId = k.tavler[0].id; side = 1; skift(); });
      el('lb-kat').appendChild(b);
    });
    el('lb-tavler').innerHTML = '';
    kat().tavler.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'chip'; b.type = 'button'; b.setAttribute('role', 'tab');
      b.textContent = t.navn;
      b.setAttribute('aria-selected', t.id === tavleId ? 'true' : 'false');
      b.addEventListener('click', function () { tavleId = t.id; side = 1; skift(); });
      el('lb-tavler').appendChild(b);
    });
  }
  function skift() {
    history.replaceState(null, '', '#' + katId + '/' + tavleId);
    chips();
    tegn();
  }

  function raekker() {
    var t = tavle();
    var kilde = t.team ? data.teams : data.spillere;
    var r = kilde.map(function (x) { return { x: x, v: Number(t.v(x)) || 0 }; })
      .filter(function (r) { return r.v > 0; })
      .sort(function (a, b) { return b.v - a.v; });
    r.forEach(function (x, i) { x.plads = i + 1; });
    return r;
  }

  function navnOgLink(r, t) {
    if (t.team) return { navn: r.x.n, link: null, hoved: r.x.leder || r.x.n, under: r.x.m.length + (r.x.m.length === 1 ? ' medlem' : ' medlemmer') };
    return { navn: r.x.n, link: H.profil(r.x.n), hoved: r.x.u, under: '' };
  }

  function tegn() {
    if (!data) return;
    var t = tavle();
    el('lb-navn').textContent = t.navn + (t.team ? '' : '');
    var alle = raekker();
    var online = {};
    data.online.forEach(function (n) { online[n.toLowerCase()] = true; });

    // Podie
    var pod = el('lb-podie');
    pod.innerHTML = '';
    if (!soeg) {
      alle.slice(0, 3).forEach(function (r, i) {
        var n = navnOgLink(r, t);
        var a = document.createElement(n.link ? 'a' : 'div');
        if (n.link) a.href = n.link;
        a.className = 'lb-pod p' + (i + 1);
        a.innerHTML = '<span class="plads">#' + (i + 1) + '</span><img alt="" loading="lazy" src="' + H.hoved(n.hoved, 72) + '"><b></b><span class="v"></span>';
        a.querySelector('b').textContent = n.navn;
        a.querySelector('.v').textContent = t.f(r.v, r.x) + (n.under ? ' · ' + n.under : '');
        pod.appendChild(a);
      });
    }

    // Liste
    var liste = soeg ? alle.filter(function (r) { return r.x.n.toLowerCase().indexOf(soeg) !== -1; }) : alle.slice(3);
    var antalSider = Math.max(1, Math.ceil(liste.length / PR_SIDE));
    if (side > antalSider) side = antalSider;
    var ol = el('lb-liste');
    ol.innerHTML = '';
    if (!alle.length) ol.innerHTML = '<li class="tom">Ingen har point i denne kategori endnu.</li>';
    else if (!liste.length) ol.innerHTML = '<li class="tom">' + (soeg ? 'Ingen spillere matcher "' + H.esc(soeg) + '".' : '') + '</li>';
    liste.slice((side - 1) * PR_SIDE, side * PR_SIDE).forEach(function (r) {
      var n = navnOgLink(r, t);
      var li = document.createElement('li');
      if (soeg) li.className = 'fremhaev';
      var a = document.createElement(n.link ? 'a' : 'div');
      if (n.link) a.href = n.link;
      else a.style.cssText = 'display:flex;align-items:center;gap:12px;padding:11px 12px;border-bottom:1px solid var(--k-18251d, #18251D)';
      a.innerHTML = '<span class="nr">' + r.plads + '</span><img class="hoved" alt="" loading="lazy" src="' + H.hoved(n.hoved) + '"><span class="navn"></span>' +
        (!t.team && online[r.x.n.toLowerCase()] ? '<span class="on" title="Online"></span>' : '') + '<span class="v"></span>';
      a.querySelector('.navn').textContent = n.navn + (n.under ? ' · ' + n.under : '');
      a.querySelector('.v').textContent = t.f(r.v, r.x);
      li.appendChild(a);
      ol.appendChild(li);
    });
    H.sider(el('lb-sider'), side, antalSider, function (s) { side = s; tegn(); el('lb-navn').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }

  function info() {
    el('lb-info').textContent = data.opdateret
      ? 'Opdateres automatisk fra serveren · sidst ' + H.siden(data.opdateret) + ' · ' + H.tal(data.spillere.length) + ' spillere og ' + H.tal(data.teams.length) + ' teams'
      : 'Serveren har ikke sendt data endnu. Tallene dukker op, så snart WebSync kører.';
    el('lb-online-antal').textContent = data.online.length ? data.online.length + ' spillere er online' : 'Ingen online lige nu';
    var ul = el('lb-online');
    ul.innerHTML = '';
    data.online.forEach(function (n) {
      var li = document.createElement('li');
      li.innerHTML = '<a><img class="hoved" alt="" loading="lazy"><span></span></a>';
      li.querySelector('a').href = H.profil(n);
      li.querySelector('img').src = H.hoved(n);
      li.querySelector('span').textContent = n;
      ul.appendChild(li);
    });
  }

  function hent() {
    H.api('stats', { auth: false }).then(function (d) {
      data = d;
      info();
      tegn();
    }).catch(function () {
      el('lb-info').textContent = 'Kunne ikke hente leaderboards lige nu. Prøv igen om lidt.';
    });
  }

  el('lb-soeg').addEventListener('input', function (e) { soeg = e.target.value.trim().toLowerCase(); side = 1; tegn(); });
  window.addEventListener('hashchange', function () { laesHash(); chips(); tegn(); });
  laesHash();
  chips();
  hent();
  setInterval(hent, 60000);
})();
