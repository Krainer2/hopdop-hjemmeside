// HOPDOP admin-panel. Lavet af Krainer2
(function () {
  var H = window.HD, S = window.HD_ANSOG;
  var el = function (id) { return document.getElementById(id); };
  var ROLLE_NAVN = { ejer: 'Ejer', admin: 'Admin', mod: 'Mod' };
  var mig = null;

  // ---------- Login ----------
  var FEJL = {
    'sa-ikke-sat-op': 'Login med SuperAwesome er ikke sat op endnu (SA_CLIENT_ID og SA_CLIENT_SECRET mangler i Netlify).',
    'afvist': 'Du afviste login på SuperAwesome.',
    'login-udloebet': 'Login tog for lang tid. Prøv igen.',
    'ugyldig-state': 'Noget gik galt med login. Prøv igen.',
    'sa-token-fejl': 'SuperAwesome godkendte ikke login. Tjek at redirect-URL og client secret er rigtige.',
    'sa-profil-fejl': 'Kunne ikke hente din Minecraft-profil fra SuperAwesome.',
    'sa-utilgaengelig': 'SuperAwesome svarer ikke lige nu. Prøv igen om lidt.',
    'sa-fejl': 'SuperAwesome gav en fejl. Prøv igen.'
  };
  function visLogin(besked) {
    el('ad-panel').classList.add('skjult');
    el('ad-login').classList.remove('skjult');
    el('ad-login-fejl').textContent = besked || '';
  }
  var hash = decodeURIComponent(location.hash.replace(/^#fejl=/, ''));
  var hashFejl = '';
  if (location.hash.indexOf('#fejl=') === 0) {
    hashFejl = hash.indexOf('ingen-adgang:') === 0
      ? hash.slice(13) + ' står ikke på staff-listen som Mod, Admin eller Ejer. Bed en Ejer om at tilføje dig.'
      : (FEJL[hash] || 'Login fejlede.');
    history.replaceState(null, '', 'admin.html');
  }

  el('ad-kodeform').addEventListener('submit', function (e) {
    e.preventDefault();
    var knap = e.target.querySelector('button');
    knap.disabled = true;
    H.api('login', { method: 'POST', auth: false, body: { brugernavn: el('ad-bruger').value.trim(), kode: el('ad-kode').value } })
      .then(function (j) { try { localStorage.setItem('hopdop-login', JSON.stringify(j)); } catch (er) {} start(); })
      .catch(function (err) { el('ad-login-fejl').textContent = err.status === 404 ? 'Login virker kun, når siden kører på Netlify fra GitHub.' : err.message; })
      .then(function () { knap.disabled = false; });
  });
  el('ad-logud').addEventListener('click', function () {
    try { localStorage.removeItem('hopdop-login'); } catch (e) {}
    visLogin('Du er logget ud.');
  });

  // ---------- Faner ----------
  var faneHentet = {};
  function fane(id) {
    document.querySelectorAll('.ad-menu [data-fane]').forEach(function (b) {
      if (b.dataset.fane === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-indhold]').forEach(function (d) { d.classList.toggle('skjult', d.dataset.indhold !== id); });
    history.replaceState(null, '', '#' + id);
    if (id === 'ansog') hentAnsog();
    if (id === 'staff') hentStaff();
    if (id === 'log') hentLog();
    if (id === 'oversigt') hentOversigt();
  }
  document.querySelectorAll('.ad-menu [data-fane]').forEach(function (b) {
    b.addEventListener('click', function () { fane(b.dataset.fane); });
  });

  function fejlHaandter(err) {
    if (err && err.status === 401) { try { localStorage.removeItem('hopdop-login'); } catch (e) {} visLogin('Dit login er udløbet. Log ind igen.'); }
    throw err;
  }

  // ---------- Oversigt ----------
  function hentOversigt() {
    H.api('oversigt').catch(fejlHaandter).then(function (o) {
      var s = o.sync;
      var gammel = !s || Date.now() - s.sidst > 15 * 60 * 1000;
      var tal = [
        ['Sidst synkroniseret', s ? H.siden(s.sidst) : 'Aldrig', s ? H.tal(s.spillere) + ' spillere · ' + H.tal(s.teams) + ' teams' : 'Kør /websync på serveren', gammel],
        ['Nye ansøgninger', H.tal(o.nyeAnsogninger), 'Venter på svar', o.nyeAnsogninger > 0],
        ['Aktive bans', H.tal(o.aktiveBans), H.tal(o.straffe) + ' straffe i alt'],
        ['Staff', H.tal(o.staff), 'personer på listen']
      ];
      el('ad-tal').innerHTML = tal.map(function (t) {
        return '<div class="kort"' + (t[3] ? ' style="border-color:#4A3610"' : '') + '><span class="daempet">' + t[0] + '</span><b>' + H.esc(t[1]) + '</b><span class="daempet" style="font-size:13px">' + H.esc(t[2]) + '</span></div>';
      }).join('');
      var tjek = [
        [o.webNoegleKlar, 'WEB_NOEGLE er sat i Netlify', 'Mangler: sæt WEB_NOEGLE i Netlify og den samme nøgle i WebSync.sk'],
        [!!s, 'Serveren har sendt data (WebSync.sk virker)', 'Serveren har ikke sendt data endnu: læg WebSync.sk på serveren og skriv /websync'],
        [s && !gammel, 'Data er friske (under 15 minutter gamle)', 'Data er over 15 minutter gamle: tjek at serveren kører, og at WebSync.sk er loadet'],
        [o.saKlar, 'Login med SuperAwesome er sat op', 'Mangler: SA_CLIENT_ID og SA_CLIENT_SECRET i Netlify']
      ];
      el('ad-tjek').innerHTML = tjek.map(function (t) {
        return '<li><span class="badge ' + (t[0] ? '' : 'roed') + '">' + (t[0] ? 'OK' : 'Mangler') + '</span><span>' + H.esc(t[0] ? t[1] : t[2]) + '</span></li>';
      }).join('') + (o.syncFejl && (!s || o.syncFejl.tid > s.sidst) ? '<li><span class="badge roed">Fejl</span><span>Seneste sync fejlede ' + H.esc(H.siden(o.syncFejl.tid)) + ': ' + H.esc(o.syncFejl.fejl) + '</span></li>' : '');
      opdaterNye(o.nyeAnsogninger);
    }).catch(function () {});
  }
  function opdaterNye(n) {
    var b = el('ad-nye');
    b.textContent = n;
    b.classList.toggle('skjult', !n);
  }

  // ---------- Ansøgninger ----------
  var ansog = [], anStatus = 'ny', anType = 'alle', anValgt = null;
  var STATUS = [['ny', 'Nye'], ['godkendt', 'Godkendte'], ['afvist', 'Afviste'], ['alle', 'Alle']];
  var TYPE = [['alle', 'Alle typer'], ['staff', 'Staff'], ['bygger', 'Bygger'], ['unban', 'Unban']];
  function chipRk(boks, liste, vaerdi, saet) {
    boks.innerHTML = '';
    liste.forEach(function (x) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = x[1];
      b.setAttribute('aria-pressed', x[0] === vaerdi ? 'true' : 'false');
      b.addEventListener('click', function () { saet(x[0]); });
      boks.appendChild(b);
    });
  }
  function hentAnsog() {
    H.api('ansog').catch(fejlHaandter).then(function (j) {
      ansog = j.ansogninger || [];
      opdaterNye(ansog.filter(function (a) { return a.status === 'ny'; }).length);
      tegnAnsog();
    }).catch(function () {});
  }
  function tegnAnsog() {
    chipRk(el('ad-an-status'), STATUS, anStatus, function (v) { anStatus = v; tegnAnsog(); });
    chipRk(el('ad-an-type'), TYPE, anType, function (v) { anType = v; tegnAnsog(); });
    var l = ansog.filter(function (a) { return (anStatus === 'alle' || a.status === anStatus) && (anType === 'alle' || a.type === anType); });
    var boks = el('ad-an-liste');
    if (!l.length) { boks.innerHTML = '<p class="tom">Ingen ansøgninger her.</p>'; return; }
    boks.innerHTML = '';
    l.forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'ad-an-raekke';
      if (a.id === anValgt) b.setAttribute('aria-current', 'true');
      b.innerHTML = '<img class="hoved" alt=""><span style="flex:1;min-width:0"><b></b><br><span class="daempet" style="font-size:13px"></span></span><span class="badge"></span>';
      b.querySelector('img').src = H.hoved(a.felter.mcnavn);
      b.querySelector('b').textContent = a.felter.mcnavn;
      b.querySelector('.daempet').textContent = (S[a.type] ? S[a.type].navn : a.type) + ' · ' + H.siden(a.oprettet);
      var st = b.querySelector('.badge');
      st.textContent = a.status === 'ny' ? 'Ny' : a.status === 'godkendt' ? 'Godkendt' : 'Afvist';
      st.className = 'badge ' + (a.status === 'ny' ? 'gul' : a.status === 'afvist' ? 'roed' : '');
      b.addEventListener('click', function () { anValgt = a.id; tegnAnsog(); detalje(a); });
      boks.appendChild(b);
    });
  }
  function detalje(a) {
    var s = S[a.type] || { navn: a.type, felter: [] };
    var labels = {};
    s.felter.forEach(function (f) { labels[f.id] = f.label; });
    var html = '<div style="display:flex;gap:14px;align-items:center;margin-bottom:16px"><img class="hoved" style="width:56px;height:56px" alt="" src="' + H.hoved(a.felter.mcnavn, 56) + '"><div><h2>' + H.esc(a.felter.mcnavn) + '</h2><span class="daempet">' + H.esc(s.navn) + '-ansøgning · ' + H.esc(H.dato(a.oprettet)) + ' · kode ' + H.esc(a.kode) + '</span></div></div>';
    html += '<p style="margin:0 0 16px"><a href="' + H.profil(a.felter.mcnavn) + '" target="_blank" rel="noopener">Se spillerens profil og straffe</a></p><dl>';
    Object.keys(a.felter).forEach(function (k) {
      html += '<div class="ad-svar"><dt>' + H.esc(labels[k] || k) + '</dt><dd>' + H.esc(a.felter[k] || '-') + '</dd></div>';
    });
    html += '</dl>';
    if (a.behandletAf) html += '<p class="daempet">Behandlet af ' + H.esc(a.behandletAf) + ' ' + H.esc(H.dato(a.behandlet)) + '</p>';
    html += '<div class="felt" style="margin-top:12px"><label for="ad-an-note">Besked til ansøgeren (vises når de tjekker deres kode)</label><textarea id="ad-an-note" rows="3"></textarea></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="knap groen" type="button" data-s="godkendt">Godkend</button><button class="knap roed" type="button" data-s="afvist">Afvis</button>' +
      (a.status !== 'ny' ? '<button class="knap" type="button" data-s="ny">Sæt tilbage til ny</button>' : '') + '</div><p id="ad-an-besked" role="status" class="daempet"></p>';
    var boks = el('ad-an-detalje');
    boks.innerHTML = html;
    el('ad-an-note').value = a.note || '';
    boks.querySelectorAll('[data-s]').forEach(function (b) {
      b.addEventListener('click', function () {
        b.disabled = true;
        H.api('ansog', { method: 'PATCH', body: { id: a.id, status: b.dataset.s, note: el('ad-an-note').value } })
          .catch(fejlHaandter)
          .then(function (j) {
            ansog = ansog.map(function (x) { return x.id === a.id ? j.ansogning : x; });
            opdaterNye(ansog.filter(function (x) { return x.status === 'ny'; }).length);
            tegnAnsog();
            detalje(j.ansogning);
            el('ad-an-besked').textContent = 'Gemt.';
          })
          .catch(function (err) { el('ad-an-besked').textContent = err.message; b.disabled = false; });
      });
    });
    if (window.innerWidth < 900) boks.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- Staff ----------
  var ROLLER = ['Ejer', 'Admin', 'Mod', 'Helper', 'Bygger'];
  function kanRetteStaff() { return mig && (mig.rolle === 'ejer' || mig.rolle === 'admin'); }
  function staffRaekke(s) {
    var d = document.createElement('div');
    d.className = 'ad-st-raekke';
    d.innerHTML = '<img class="hoved" alt="">' +
      '<input aria-label="Minecraft-navn" placeholder="Minecraft-navn" class="navn" maxlength="16">' +
      '<select aria-label="Rolle" class="rolle">' + ROLLER.map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select>' +
      '<input aria-label="Titel (valgfri)" placeholder="Titel (valgfri)" class="titel" maxlength="40">' +
      '<button type="button" class="knap lille roed" aria-label="Fjern">Fjern</button>';
    d.querySelector('.navn').value = s.navn || '';
    d.querySelector('.rolle').value = s.rolle || 'Mod';
    d.querySelector('.titel').value = s.titel || '';
    d.querySelector('img').src = H.hoved(s.navn || 'MHF_Steve');
    d.querySelector('.navn').addEventListener('change', function (e) { d.querySelector('img').src = H.hoved(e.target.value || 'MHF_Steve'); });
    d.querySelector('button').addEventListener('click', function () { d.remove(); });
    if (!kanRetteStaff()) d.querySelectorAll('input,select,button').forEach(function (x) { x.disabled = true; });
    if (mig.rolle !== 'ejer' && (s.rolle === 'Ejer' || s.rolle === 'Admin')) d.querySelectorAll('input,select,button').forEach(function (x) { x.disabled = true; });
    if (mig.rolle !== 'ejer') Array.prototype.forEach.call(d.querySelectorAll('.rolle option'), function (o) { if ((o.value === 'Ejer' || o.value === 'Admin') && o.value !== s.rolle) o.disabled = true; });
    return d;
  }
  function hentStaff() {
    el('ad-st-tilfoej').disabled = el('ad-st-gem').disabled = !kanRetteStaff();
    if (!kanRetteStaff()) el('ad-st-info').textContent = 'Kun Admins og Ejere kan ændre staff-listen.';
    H.api('staff').catch(fejlHaandter).then(function (j) {
      var boks = el('ad-st-raekker');
      boks.innerHTML = '';
      (j.staff || []).forEach(function (s) { boks.appendChild(staffRaekke(s)); });
      if (!j.staff || !j.staff.length) boks.appendChild(staffRaekke({ navn: mig.navn, rolle: mig.rolle === 'ejer' ? 'Ejer' : 'Mod' }));
    }).catch(function () {});
  }
  el('ad-st-tilfoej').addEventListener('click', function () { el('ad-st-raekker').appendChild(staffRaekke({ rolle: 'Mod' })); });
  el('ad-st-gem').addEventListener('click', function () {
    var liste = [];
    el('ad-st-raekker').querySelectorAll('.ad-st-raekke').forEach(function (d) {
      var n = d.querySelector('.navn').value.trim();
      if (n) liste.push({ navn: n, rolle: d.querySelector('.rolle').value, titel: d.querySelector('.titel').value.trim() });
    });
    el('ad-st-besked').textContent = 'Gemmer...';
    H.api('staff', { method: 'PUT', body: { staff: liste } }).catch(fejlHaandter)
      .then(function (j) { el('ad-st-besked').textContent = 'Gemt - ' + j.staff.length + ' personer.'; hentStaff(); })
      .catch(function (err) { el('ad-st-besked').textContent = err.message; });
  });

  // ---------- Log ----------
  function hentLog() {
    H.api('log').catch(fejlHaandter).then(function (j) {
      var ul = el('ad-log');
      ul.innerHTML = '';
      if (!j.log.length) { ul.innerHTML = '<li class="daempet">Intet endnu.</li>'; return; }
      j.log.forEach(function (p) {
        var li = document.createElement('li');
        li.innerHTML = '<b></b> <span class="daempet"></span><br><span></span>';
        li.querySelector('b').textContent = p.navn;
        li.querySelector('.daempet').textContent = H.dato(p.tid) + ' · ' + (p.handling || 'tekster');
        li.querySelector('span:last-child').textContent = p.detaljer || (p.antal ? 'Ændrede ' + p.antal + ' tekster' : '');
        ul.appendChild(li);
      });
    }).catch(function () {});
  }

  // ---------- Start ----------
  function start() {
    mig = H.login();
    if (!mig) { visLogin(hashFejl); return; }
    el('ad-login').classList.add('skjult');
    el('ad-panel').classList.remove('skjult');
    el('ad-mig-navn').textContent = mig.navn;
    el('ad-mig-rolle').textContent = ROLLE_NAVN[mig.rolle] || mig.rolle;
    el('ad-mig-hoved').src = H.hoved(mig.uuid || mig.navn, 40);
    var f = location.hash.replace('#', '');
    fane(['oversigt', 'ansog', 'staff', 'tekster', 'log'].indexOf(f) !== -1 ? f : 'oversigt');
  }
  start();
})();
