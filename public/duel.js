// HOPDOP duels - live fra serveren via /api/duel (Duel.sk -> WebSync.sk). Lavet af Krainer2
(function () {
  var H = window.HD;
  var el = function (id) { return document.getElementById(id); };
  var PR_SIDE = 20;

  // Hvad en kit-topliste kan sorteres efter (samme som uret i /duel top)
  var MAAL = [
    { id: 'sejre', navn: 'Sejre' },
    { id: 'winrate', navn: 'Win rate', info: 'Kræver mindst 5 dueller i kittet.' },
    { id: 'bs', navn: 'Bedste streak' },
    { id: 'st', navn: 'Streak lige nu' },
    { id: 'dueller', navn: 'Dueller' }
  ];

  var data = null, tavle = 'overall', maal = 'sejre', side = 1, soeg = '', opslagNavn = '';
  var overallCache = null;

  // ---------- Beregninger ----------
  function alle(s) { return s.s + s.t + s.d; }
  function wr(s) { return s.s + s.t > 0 ? Math.round(s.s / (s.s + s.t) * 100) : 0; }
  function kitStat(s, k) { return (s.ks && s.ks[k]) || null; }
  function kitV(s, k, m) {
    var x = kitStat(s, k);
    if (!x) return 0;
    var a = x.s + x.t + x.d;
    if (!a) return 0;
    if (m === 'winrate') return x.s + x.t >= 5 ? Math.round(x.s / (x.s + x.t) * 100) : 0;
    if (m === 'bs') return x.bs;
    if (m === 'st') return x.st;
    if (m === 'dueller') return a;
    return x.s;
  }
  function kitF(v, m) {
    if (m === 'winrate') return H.tal(v) + '%';
    if (m === 'bs' || m === 'st') return H.tal(v) + ' i træk';
    if (m === 'dueller') return H.tal(v) + (v === 1 ? ' duel' : ' dueller');
    return H.tal(v) + (v === 1 ? ' sejr' : ' sejre');
  }
  function kit(id) { return data.kits.filter(function (k) { return k.id === id; })[0]; }

  // Overall = gennemsnit af placeringen i rating, sejre, bedste streak og win rate (min. 10 dueller).
  // Lavest er bedst - præcis som "Overall" i /duel top på serveren.
  function overall() {
    if (overallCache) return overallCache;
    var sp = data.spillere;
    var w = function (s) { return s.s + s.t >= 10 ? wr(s) : -1; };
    var felter = [function (s) { return s.elo; }, function (s) { return s.s; }, function (s) { return s.bs; }, w];
    var score = {};
    sp.forEach(function (s) {
      var over = 0;
      felter.forEach(function (f) {
        var mig = f(s);
        for (var i = 0; i < sp.length; i++) if (f(sp[i]) > mig) over++;
      });
      score[s.u] = over / 4 + 1;
    });
    overallCache = sp.slice().sort(function (a, b) { return score[a.u] - score[b.u] || b.elo - a.elo; })
      .map(function (s, i) { return { x: s, v: score[s.u], plads: i + 1 }; });
    return overallCache;
  }
  function placering(liste, u) {
    for (var i = 0; i < liste.length; i++) if (liste[i].x.u === u) return liste[i].plads;
    return null;
  }

  // Rækker til den valgte topliste
  function raekker() {
    var r;
    if (tavle === 'overall') return overall();
    if (tavle === 'rating') {
      r = data.spillere.map(function (s) { return { x: s, v: s.elo }; });
    } else {
      var k = tavle.replace('kit-', '');
      r = data.spillere.map(function (s) { return { x: s, v: kitV(s, k, maal) }; }).filter(function (x) { return x.v > 0; });
    }
    r.sort(function (a, b) { return b.v - a.v || b.x.elo - a.x.elo; });
    r.forEach(function (x, i) { x.plads = i + 1; });
    return r;
  }
  function vaerdi(r) {
    if (tavle === 'overall') return H.tal(r.x.elo) + ' rating';
    if (tavle === 'rating') return H.tal(r.v) + ' rating';
    return kitF(r.v, maal);
  }
  function ekstra(r) {
    if (tavle === 'overall') return H.tal(r.x.s) + ' sejre · ' + wr(r.x) + '% win rate';
    if (tavle === 'rating') return H.tal(r.x.s) + 'W / ' + H.tal(r.x.t) + 'L';
    var x = kitStat(r.x, tavle.replace('kit-', ''));
    return x ? H.tal(x.s) + 'W / ' + H.tal(x.t) + 'L' : '';
  }

  // ---------- Tegning ----------
  function tegnTal() {
    var sp = data.spillere;
    var ialt = Math.round(sp.reduce(function (n, s) { return n + alle(s); }, 0) / 2);
    var kitTot = {};
    sp.forEach(function (s) { Object.keys(s.ks || {}).forEach(function (k) { var x = s.ks[k]; kitTot[k] = (kitTot[k] || 0) + x.s + x.t + x.d; }); });
    var mest = data.kits.slice().sort(function (a, b) { return (kitTot[b.id] || 0) - (kitTot[a.id] || 0); })[0];
    var topR = sp.slice().sort(function (a, b) { return b.elo - a.elo; })[0];
    var topS = sp.slice().sort(function (a, b) { return b.bs - a.bs; })[0];
    var kort = [
      ['Dueller spillet', H.tal(ialt), H.tal(sp.length) + ' duellister'],
      ['Mest spillede kit', mest && kitTot[mest.id] ? mest.n : '-', mest && kitTot[mest.id] ? H.tal(Math.round(kitTot[mest.id] / 2)) + ' dueller' : 'Ingen endnu'],
      ['Højeste rating', topR ? topR.n : '-', topR ? H.tal(topR.elo) + ' rating' : 'Ingen endnu'],
      ['Bedste streak', topS && topS.bs ? topS.n : '-', topS && topS.bs ? H.tal(topS.bs) + ' sejre i træk' : 'Ingen endnu']
    ];
    el('du-tal').innerHTML = kort.map(function (k) {
      return '<div class="kort"><small>' + H.esc(k[0]) + '</small><b>' + H.esc(k[1]) + '</b><span>' + H.esc(k[2]) + '</span></div>';
    }).join('');
  }

  function tegnKits() {
    var boks = el('du-kits');
    if (!data.kits.length) { boks.innerHTML = '<div class="kort tom">Der er ingen duel-kits endnu.</div>'; return; }
    boks.innerHTML = '';
    data.kits.forEach(function (k) {
      var spillede = 0, tot = 0;
      data.spillere.forEach(function (s) { var x = kitStat(s, k.id); if (x && x.s + x.t + x.d) { spillede++; tot += x.s + x.t + x.d; } });
      var top = data.spillere.map(function (s) { return { s: s, v: kitV(s, k.id, 'sejre') }; }).filter(function (x) { return x.v > 0; })
        .sort(function (a, b) { return b.v - a.v; }).slice(0, 3);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kort du-kit';
      b.setAttribute('aria-pressed', tavle === 'kit-' + k.id ? 'true' : 'false');
      b.innerHTML = '<div class="du-kit-top"><span class="du-ikon">' + H.kitIkon(k.ikon) + '</span><div><h3></h3>' +
        (k.aktiv ? '' : '<span class="badge graa">Slået fra</span>') + '</div></div>' +
        '<div class="du-kit-tal"><div><small>Dueller</small><b>' + H.tal(Math.round(tot / 2)) + '</b></div><div><small>Spillere</small><b>' + H.tal(spillede) + '</b></div></div>' +
        '<div class="du-kit-top3">' + (top.length ? top.map(function (t, i) {
          return '<span style="display:flex;align-items:center;gap:8px"><span class="p" style="color:' + ['#FACC15', '#D1D5DB', '#FDBA74'][i] + '">' + (i + 1) + '</span>' +
            '<img alt="" loading="lazy" src="' + H.hoved(t.s.u, 22, t.s.n) + '"><span class="n">' + H.esc(t.s.n) + '</span><span class="v">' + kitF(t.v, 'sejre') + '</span></span>';
        }).join('') : '<span class="daempet">Ingen sejre endnu</span>') + '</div>' +
        '<span class="du-mere">Se topliste →</span>';
      b.querySelector('h3').textContent = k.n;
      b.addEventListener('click', function () {
        tavle = 'kit-' + k.id; side = 1; skift();
        el('toplister').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      boks.appendChild(b);
    });
  }

  function chips() {
    var t = el('du-tavler');
    t.innerHTML = '';
    var valg = [['overall', 'Overall', null], ['rating', 'Rating', null]].concat(data ? data.kits.map(function (k) { return ['kit-' + k.id, k.n, k.ikon]; }) : []);
    valg.forEach(function (v) {
      var b = document.createElement('button');
      b.className = 'chip'; b.type = 'button'; b.setAttribute('role', 'tab');
      b.style.cssText = 'display:inline-flex;align-items:center;gap:8px';
      b.innerHTML = (v[2] ? '<span style="display:inline-flex;width:18px;height:18px">' + H.kitIkon(v[2]).replace('<svg', '<svg width="18" height="18" style="shape-rendering:crispEdges"') + '</span>' : '') + '<span></span>';
      b.lastChild.textContent = v[1];
      b.setAttribute('aria-selected', v[0] === tavle ? 'true' : 'false');
      b.addEventListener('click', function () { tavle = v[0]; side = 1; skift(); });
      t.appendChild(b);
    });
    var m = el('du-maal');
    m.innerHTML = '';
    m.classList.toggle('skjult', tavle.indexOf('kit-') !== 0);
    MAAL.forEach(function (x) {
      var b = document.createElement('button');
      b.className = 'chip'; b.type = 'button'; b.setAttribute('role', 'tab');
      b.textContent = x.navn;
      b.setAttribute('aria-selected', x.id === maal ? 'true' : 'false');
      b.addEventListener('click', function () { maal = x.id; side = 1; skift(); });
      m.appendChild(b);
    });
  }

  function tegnListe() {
    if (!data) return;
    var titel = el('du-navn');
    var under = el('du-under');
    if (tavle === 'overall') { titel.textContent = 'Overall'; under.textContent = 'De bedste duellister samlet set: rating, sejre, bedste streak og win rate (min. 10 dueller) lagt sammen.'; }
    else if (tavle === 'rating') { titel.textContent = 'Rating'; under.textContent = 'Elo-rating. Alle starter på 1000, og slår du en bedre spiller, får du flere point.'; }
    else {
      var k = kit(tavle.replace('kit-', ''));
      var m = MAAL.filter(function (x) { return x.id === maal; })[0];
      titel.innerHTML = '<span class="du-ikon lille">' + H.kitIkon(k ? k.ikon : '') + '</span><span></span>';
      titel.lastChild.textContent = (k ? k.n : 'Kit') + ' · ' + m.navn;
      under.textContent = (m.info || 'Kun dueller spillet med dette kit tæller.');
    }
    var rk = raekker();
    var online = {};
    (data.online || []).forEach(function (n) { online[n.toLowerCase()] = true; });

    var pod = el('du-podie');
    pod.innerHTML = '';
    if (!soeg) {
      rk.slice(0, 3).forEach(function (r, i) {
        var a = document.createElement('a');
        a.href = H.profil(r.x.n);
        a.className = 'lb-pod p' + (i + 1);
        a.innerHTML = '<span class="plads">#' + (i + 1) + '</span><img alt="" loading="lazy" src="' + H.hoved(r.x.u, 72, r.x.n) + '"><b></b><span class="v"></span>';
        a.querySelector('b').textContent = r.x.n;
        a.querySelector('.v').textContent = vaerdi(r);
        pod.appendChild(a);
      });
    }
    var liste = soeg ? rk.filter(function (r) { return r.x.n.toLowerCase().indexOf(soeg) !== -1; }) : rk.slice(3);
    var antalSider = Math.max(1, Math.ceil(liste.length / PR_SIDE));
    if (side > antalSider) side = antalSider;
    var ol = el('du-liste');
    ol.innerHTML = '';
    if (!rk.length) ol.innerHTML = '<li class="tom">Ingen er på denne liste endnu. Spil en duel!</li>';
    else if (!liste.length && soeg) ol.innerHTML = '<li class="tom">Ingen spillere matcher "' + H.esc(soeg) + '".</li>';
    liste.slice((side - 1) * PR_SIDE, side * PR_SIDE).forEach(function (r) {
      var li = document.createElement('li');
      if (soeg) li.className = 'fremhaev';
      li.innerHTML = '<a><span class="nr">' + r.plads + '</span><img class="hoved" alt="" loading="lazy"><span class="navn"></span>' +
        (online[r.x.n.toLowerCase()] ? '<span class="on" title="Online"></span>' : '') + '<span class="v"></span></a>';
      var a = li.firstChild;
      a.href = H.profil(r.x.n);
      a.querySelector('img').src = H.hoved(r.x.u, 32, r.x.n);
      a.querySelector('.navn').textContent = r.x.n;
      var e = ekstra(r);
      a.querySelector('.v').innerHTML = H.esc(vaerdi(r)) + (e ? '<div class="ekstra">' + H.esc(e) + '</div>' : '');
      ol.appendChild(li);
    });
    H.sider(el('du-sider'), side, antalSider, function (s) { side = s; tegnListe(); el('du-navn').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }

  // ---------- Spiller-opslag ----------
  function tegnOpslag() {
    var boks = el('du-opslag');
    if (!opslagNavn || !data) return;
    var s = data.spillere.filter(function (x) { return x.n.toLowerCase() === opslagNavn.toLowerCase(); })[0];
    if (!s) { boks.innerHTML = '<p class="daempet" style="font-size:14px;margin:12px 0 0">' + H.esc(opslagNavn) + ' har ikke spillet en duel endnu.</p>'; return; }
    var ratingListe = data.spillere.slice().sort(function (a, b) { return b.elo - a.elo; });
    var rPlads = ratingListe.indexOf(s) + 1;
    var oPlads = placering(overall(), s.u);
    var linje = function (l, v, p) { return '<div class="du-linje"><span class="daempet">' + l + '</span><span><b>' + H.esc(v) + '</b>' + (p ? '<span class="plads">#' + p + '</span>' : '') + '</span></div>'; };
    var html = '<div class="du-sp-top"><img alt="" src="' + H.hoved(s.u, 56, s.n) + '"><div><h3></h3><a href="' + H.profil(s.n) + '" style="font-size:13px">Se hele profilen →</a></div></div>' +
      linje('Overall', '#' + oPlads, null) +
      linje('Rating', H.tal(s.elo), rPlads) +
      linje('Sejre / tab / uafgjort', H.tal(s.s) + ' / ' + H.tal(s.t) + ' / ' + H.tal(s.d)) +
      linje('Win rate', wr(s) + '%') +
      linje('Streak (bedste)', H.tal(s.st) + ' (' + H.tal(s.bs) + ')') +
      linje('Denne uge / måned', H.tal(s.us) + ' / ' + H.tal(s.ms) + ' sejre') +
      (s.gev ? linje('Indsats i alt', (s.gev > 0 ? '+$' : '-$') + H.tal(Math.abs(s.gev))) : '');
    var kits = data.kits.map(function (k) { return { k: k, x: kitStat(s, k.id) }; }).filter(function (o) { return o.x && o.x.s + o.x.t + o.x.d; })
      .sort(function (a, b) { return (b.x.s + b.x.t + b.x.d) - (a.x.s + a.x.t + a.x.d); });
    html += '<div class="du-pr-kit">' + (kits.length ? kits.map(function (o) {
      var x = o.x, a = x.s + x.t + x.d, w = x.s + x.t ? Math.round(x.s / (x.s + x.t) * 100) : 0;
      return '<div class="r"><span class="du-ikon lille">' + H.kitIkon(o.k.ikon) + '</span><div><b>' + H.esc(o.k.n) + '</b><div class="daempet">' + H.tal(a) + ' dueller · ' + w + '%</div></div>' +
        '<div class="tal">' + H.tal(x.s) + 'W / ' + H.tal(x.t) + 'L<br>streak ' + H.tal(x.st) + ' · bedste ' + H.tal(x.bs) + '</div></div>';
    }).join('') : '<p class="daempet" style="font-size:14px;margin:0">Ingen kit-stats endnu.</p>') + '</div>';
    boks.innerHTML = html;
    boks.querySelector('h3').textContent = s.n;
  }

  // ---------- Hash og opdatering ----------
  function laesHash() {
    var h = location.hash.replace('#', '').split('/');
    if (h[0] === 'overall' || h[0] === 'rating' || /^kit-\d+$/.test(h[0])) tavle = h[0];
    if (h[1] && MAAL.some(function (m) { return m.id === h[1]; })) maal = h[1];
  }
  function skift() {
    if (location.hash !== '#saadan' && location.hash !== '#kits') history.replaceState(null, '', '#' + tavle + (tavle.indexOf('kit-') === 0 ? '/' + maal : ''));
    chips();
    tegnListe();
    if (data) tegnKits();
  }

  function hent() {
    H.api('duel', { auth: false }).then(function (d) {
      data = d;
      overallCache = null;
      if (tavle.indexOf('kit-') === 0 && !kit(tavle.replace('kit-', ''))) tavle = 'overall';
      el('du-info').textContent = d.opdateret
        ? 'Opdateres automatisk fra serveren · sidst ' + H.siden(d.opdateret) + ' · ' + H.tal(d.spillere.length) + ' duellister og ' + H.tal(d.kits.length) + ' kits'
        : 'Serveren har ikke sendt duel-data endnu. Tallene dukker op, så snart WebSync kører med Duel.sk.';
      el('du-forslag').innerHTML = d.spillere.map(function (s) { return '<option value="' + H.esc(s.n) + '">'; }).join('');
      tegnTal();
      tegnKits();
      chips();
      tegnListe();
      tegnOpslag();
    }).catch(function () {
      el('du-info').textContent = 'Kunne ikke hente duels lige nu. Prøv igen om lidt.';
    });
  }

  el('du-soeg').addEventListener('input', function (e) { soeg = e.target.value.trim().toLowerCase(); side = 1; tegnListe(); });
  el('du-opslag-form').addEventListener('submit', function (e) { e.preventDefault(); opslagNavn = el('du-opslag-navn').value.trim(); tegnOpslag(); });
  window.addEventListener('hashchange', function () { laesHash(); chips(); tegnListe(); });
  laesHash();
  chips();
  hent();
  setInterval(hent, 60000);
})();
