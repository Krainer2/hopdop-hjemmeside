// HOPDOP spillerprofil. Lavet af Krainer2
(function () {
  var H = window.HD;
  var el = function (id) { return document.getElementById(id); };
  var navn = (new URLSearchParams(location.search).get('navn') || '').trim();
  el('sp-navn').value = navn;

  el('sp-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var n = el('sp-navn').value.trim();
    if (n) location.href = H.profil(n);
  });

  // Placering i en kategori (1 = bedst)
  function plads(alle, s, fn) {
    var v = fn(s);
    if (!(v > 0)) return null;
    var bedre = 0;
    for (var i = 0; i < alle.length; i++) if (fn(alle[i]) > v) bedre++;
    return bedre + 1;
  }

  function stat(label, vaerdi, p) {
    return '<div class="sp-stat"><span class="daempet">' + label + '</span><span><b>' + H.esc(vaerdi) + '</b>' +
      (p ? '<span class="plads">#' + p + '</span>' : '') + '</span></div>';
  }

  var migL = H.login();
  var straffeAdgang = !!(migL && (migL.rolle === 'admin' || migL.rolle === 'ejer'));

  function vis(stats, straffe, staff) {
    var boks = el('sp-indhold');
    var forslag = el('sp-forslag');
    forslag.innerHTML = stats.spillere.slice(0, 2000).map(function (s) { return '<option value="' + H.esc(s.n) + '">'; }).join('');
    if (!navn) {
      boks.innerHTML = '<div class="kort tom">Skriv et Minecraft-navn for at se spillerens stats.</div>';
      return;
    }
    var s = stats.spillere.filter(function (x) { return x.n.toLowerCase() === navn.toLowerCase(); })[0];
    if (!s) {
      boks.innerHTML = '<div class="kort tom">Vi kender ingen spiller ved navn <b>' + H.esc(navn) + '</b> endnu. Spilleren skal have været på serveren.</div>';
      return;
    }
    document.title = s.n + ' - HOPDOP';
    var alle = stats.spillere;
    var online = stats.online.some(function (n) { return n.toLowerCase() === s.n.toLowerCase(); });
    var team = stats.teams.filter(function (t) { return t.m.some(function (m) { return m.u === s.u; }); })[0];
    var rolle = team ? (team.m.filter(function (m) { return m.u === s.u; })[0] || {}).r : '';
    var st = staff.filter(function (x) { return x.navn.toLowerCase() === s.n.toLowerCase(); })[0];
    var kd = s.k / Math.max(1, s.d);

    var html = '<div class="kort sp-top"><img alt="" src="' + H.hoved(s.u, 120) + '"><div><h1>' + H.esc(s.n) + '</h1><div class="badges">' +
      (online ? '<span class="badge">Online nu</span>' : '<span class="badge graa">Offline</span>') +
      (st ? '<span class="badge gul">' + H.esc(st.rolle) + '</span>' : '') +
      (team ? '<span class="badge blaa">Team ' + H.esc(team.n) + (rolle ? ' · ' + H.esc(rolle.charAt(0) + rolle.slice(1).toLowerCase().replace('_', '-')) : '') + '</span>' : '') +
      (straffe.some(function (p) { return p.u === s.u && p.type === 'BAN' && p.aktiv; }) ? '<span class="badge roed">Bannet</span>' : '') +
      '</div></div></div>';

    html += '<div class="sp-grupper">';
    html += '<div class="kort sp-gruppe"><h3>PvP</h3>' +
      stat('Kills', H.tal(s.k), plads(alle, s, function (x) { return x.k; })) +
      stat('Døde', H.tal(s.d)) +
      stat('K/D', H.tal(kd, 2), s.k >= 10 ? plads(alle, s, function (x) { return x.k >= 10 ? x.k / Math.max(1, x.d) : 0; }) : null) + '</div>';
    html += '<div class="kort sp-gruppe"><h3>Aktivitet</h3>' +
      '<div id="sp-spilletid"></div>' +
      stat('Daily-streak', H.tal(s.ds) + ' dage', plads(alle, s, function (x) { return x.ds; })) + '</div>';
    if (team) {
      html += '<div class="kort sp-gruppe"><h3>Team ' + H.esc(team.n) + '</h3>' +
        stat('Level', team.lvl) + stat('KOTH-sejre', H.tal(team.koth)) + stat('Kills / døde', H.tal(team.k) + ' / ' + H.tal(team.d)) +
        stat('Medlemmer', team.m.map(function (m) { return m.n; }).join(', ')) + '</div>';
    }
    html += '</div>';

    // Straffe vises kun for Admin og Ejer
    var mine = straffe.filter(function (p) { return p.u === s.u; });
    if (straffeAdgang) html += '<div class="kort" style="margin-top:16px"><h3>Straffe <span class="badge graa" style="font-size:11px">Kun Admin+</span></h3>';
    if (straffeAdgang && !mine.length) html += '<p class="daempet" style="margin:10px 0 0">Ingen straffe. Rent bord!</p>';
    (straffeAdgang ? mine : []).slice(0, 30).forEach(function (p) {
      var cls = p.type === 'BAN' ? 'roed' : p.type === 'MUTE' ? 'gul' : p.type === 'KICK' ? 'blaa' : '';
      html += '<div class="sp-straf"><span class="badge ' + cls + '">' + H.esc(p.type) + '</span><div><b>' + H.esc(p.grund || (p.type.indexOf('UN') === 0 ? 'Ophævet' : '-')) + '</b>' +
        '<div class="daempet" style="font-size:14px">' + H.esc([p.varighed, p.af ? 'af ' + p.af : '', p.gaettet && p.naar ? p.naar : H.dato(p.tid)].filter(Boolean).join(' · ')) +
        (p.aktiv ? ' · <span style="color:var(--t-fca5a5, #FCA5A5)">aktiv</span>' : '') + '</div></div></div>';
    });
    if (straffeAdgang) html += '</div>';
    boks.innerHTML = html;
    // Kun Admin og Ejer: knap til at rette spillerens stats direkte her
    if (straffeAdgang) {
      var top = boks.querySelector('.sp-top');
      var retKnap = document.createElement('button');
      retKnap.type = 'button';
      retKnap.className = 'knap sp-ret-knap';
      retKnap.innerHTML = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>Ret stats';
      top.appendChild(retKnap);
      var panel = document.createElement('form');
      panel.className = 'kort sp-ret skjult';
      panel.innerHTML = '<h3 style="margin:0 0 6px">Ret stats for ' + H.esc(s.n) + '</h3>' +
        '<p class="daempet" style="margin:0 0 14px;font-size:14px">Vises med det samme her og gemmes på serveren ved næste sync (eller skriv /websync).</p>' +
        '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">' +
        '<div class="felt"><label for="sp-ret-k">Kills</label><input id="sp-ret-k" type="number" min="0" step="1" value="' + (s.k || 0) + '"></div>' +
        '<div class="felt"><label for="sp-ret-d">Døde</label><input id="sp-ret-d" type="number" min="0" step="1" value="' + (s.d || 0) + '"></div>' +
        '<div class="felt"><label for="sp-ret-ds">Daily-streak</label><input id="sp-ret-ds" type="number" min="0" step="1" value="' + (s.ds || 0) + '"></div></div>' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px"><button class="knap groen" type="submit">Gem</button><button class="knap" type="button" data-luk>Annuller</button><button class="knap roed" type="button" data-nulstil>Nulstil stats</button><span class="sp-ret-besked" role="status"></span></div>';
      top.insertAdjacentElement('afterend', panel);
      retKnap.addEventListener('click', function () { panel.classList.toggle('skjult'); });
      panel.querySelector('[data-luk]').addEventListener('click', function () { panel.classList.add('skjult'); });
      var nul = panel.querySelector('[data-nulstil]');
      nul.addEventListener('click', function () {
        if (nul.dataset.klar !== '1') {
          nul.dataset.klar = '1';
          nul.textContent = 'Sikker? Klik igen';
          setTimeout(function () { nul.dataset.klar = ''; nul.textContent = 'Nulstil stats'; }, 5000);
          return;
        }
        ['k', 'd', 'ds'].forEach(function (f) { el('sp-ret-' + f).value = 0; });
        panel.requestSubmit ? panel.requestSubmit() : panel.dispatchEvent(new Event('submit', { cancelable: true }));
      });
      panel.addEventListener('submit', function (e) {
        e.preventDefault();
        var besked = panel.querySelector('.sp-ret-besked');
        var aendr = ['k', 'd', 'ds'].map(function (f) { return { felt: f, v: Math.max(0, Math.trunc(Number(el('sp-ret-' + f).value) || 0)) }; })
          .filter(function (x) { return x.v !== (Number(s[x.felt]) || 0); });
        if (!aendr.length) { besked.textContent = 'Ingen ændringer.'; return; }
        besked.textContent = 'Gemmer...';
        aendr.reduce(function (p, x) {
          return p.then(function () { return H.api('statsaendring', { method: 'POST', body: { navn: s.n, felt: x.felt, handling: 'saet', v: x.v } }); })
            .then(function () { s[x.felt] = x.v; });
        }, Promise.resolve()).then(function () {
          besked.textContent = 'Gemt! Serveren får det ved næste sync.';
          setTimeout(function () { location.reload(); }, 900);
        }).catch(function (err) { besked.textContent = err.message; });
      });
    }
    // Spilletid er privat: kun du selv (logget ind) eller staff kan se den
    var mig = H.login();
    var felt = document.getElementById('sp-spilletid');
    if (felt && mig && (mig.rolle !== 'spiller' || mig.navn.toLowerCase() === s.n.toLowerCase())) {
      H.api('spilletid?navn=' + encodeURIComponent(s.n)).then(function (j) {
        felt.innerHTML = stat('Spilletid', H.tid(j.ot)) + '<div class="daempet" style="font-size:12px;padding-top:4px">Kun du' + (mig.rolle !== 'spiller' ? ' og staff' : '') + ' kan se dette.</div>';
      }).catch(function () {});
    }
  }

  Promise.all([
    H.api('stats' + (straffeAdgang ? '?t=' + Date.now() : ''), { auth: false }),
    (straffeAdgang ? H.api('straffe') : Promise.reject()).catch(function () { return { poster: [] }; }),
    H.api('staff', { auth: false }).catch(function () { return { staff: [] }; })
  ]).then(function (r) { vis(r[0], r[1].poster || [], r[2].staff || []); })
    .catch(function () { el('sp-indhold').innerHTML = '<div class="kort tom">Kunne ikke hente spilleren lige nu.</div>'; });
})();
