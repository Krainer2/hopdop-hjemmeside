// HOPDOP banliste - bans, mutes og kicks via /api/straffe. Lavet af Krainer2
(function () {
  var H = window.HD;
  var PR_SIDE = 25;
  var TYPER = [
    { id: 'alle', navn: 'Alle' },
    { id: 'BAN', navn: 'Bans' },
    { id: 'MUTE', navn: 'Mutes' },
    { id: 'KICK', navn: 'Kicks' },
    { id: 'OPH', navn: 'Ophævelser' }
  ];
  var BADGE = { BAN: ['Ban', 'roed'], MUTE: ['Mute', 'gul'], KICK: ['Kick', 'blaa'], UNBAN: ['Unban', ''], UNMUTE: ['Unmute', ''] };
  var poster = [], opdateret = 0, type = 'alle', kunAktive = false, soeg = '', side = 1;
  var el = function (id) { return document.getElementById(id); };

  // Start-filter fra adressen, fx banliste.html?type=BAN&aktive=1&q=navn
  var q = new URLSearchParams(location.search);
  if (q.get('type')) type = q.get('type').toUpperCase() === 'ALLE' ? 'alle' : q.get('type').toUpperCase();
  if (q.get('aktive') === '1') kunAktive = true;
  if (q.get('q')) soeg = q.get('q').toLowerCase();
  el('bl-kunaktive').checked = kunAktive;
  el('bl-soeg').value = q.get('q') || '';

  function typeKnapper() {
    el('bl-typer').innerHTML = '';
    TYPER.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip';
      b.textContent = t.navn;
      b.setAttribute('aria-pressed', t.id === type ? 'true' : 'false');
      b.addEventListener('click', function () { type = t.id; side = 1; typeKnapper(); tegn(); });
      el('bl-typer').appendChild(b);
    });
  }

  function status(p) {
    if (p.type === 'KICK' || p.type === 'UNBAN' || p.type === 'UNMUTE') return '<span class="bl-lille">-</span>';
    if (p.aktiv) {
      if (p.til === -1) return '<span class="badge roed">Aktiv · permanent</span>';
      return '<span class="badge roed">Aktiv</span><div class="bl-lille">til ' + H.esc(H.dato(p.til)) + '</div>';
    }
    return '<span class="badge graa">Udløbet / ophævet</span>';
  }

  function filtreret() {
    return poster.filter(function (p) {
      if (type === 'OPH') { if (p.type !== 'UNBAN' && p.type !== 'UNMUTE') return false; }
      else if (type !== 'alle' && p.type !== type) return false;
      if (kunAktive && !p.aktiv) return false;
      if (soeg) {
        var hay = (p.n + ' ' + (p.grund || '') + ' ' + (p.af || '')).toLowerCase();
        if (hay.indexOf(soeg) === -1) return false;
      }
      return true;
    });
  }

  function tegn() {
    var liste = filtreret();
    var antal = Math.max(1, Math.ceil(liste.length / PR_SIDE));
    if (side > antal) side = antal;
    var boks = el('bl-liste');
    if (!poster.length) {
      boks.innerHTML = '<p class="tom">' + (opdateret ? 'Ingen straffe endnu. Godt gået, alle sammen!' : 'Serveren har ikke sendt data endnu.') + '</p>';
      el('bl-sider').innerHTML = '';
      return;
    }
    if (!liste.length) {
      boks.innerHTML = '<p class="tom">Ingen straffe matcher din søgning.</p>';
      el('bl-sider').innerHTML = '';
      return;
    }
    var html = '<table class="bl-tabel"><thead><tr><th scope="col">Spiller</th><th scope="col">Type</th><th scope="col">Grund</th><th scope="col">Varighed</th><th scope="col">Givet af</th><th scope="col">Dato</th><th scope="col">Status</th></tr></thead><tbody>';
    liste.slice((side - 1) * PR_SIDE, side * PR_SIDE).forEach(function (p) {
      var b = BADGE[p.type] || [p.type, ''];
      html += '<tr>' +
        '<td data-l="Spiller"><a class="bl-spiller" href="' + H.profil(p.n) + '"><img class="hoved" alt="" loading="lazy" src="' + H.hoved(p.u) + '">' + H.esc(p.n) + '</a></td>' +
        '<td data-l="Type"><span class="badge ' + b[1] + '">' + b[0] + '</span></td>' +
        '<td data-l="Grund">' + H.esc(p.grund || '-') + (p.strike ? '<div class="bl-lille">Strike ' + H.esc(p.strike) + '</div>' : '') + '</td>' +
        '<td data-l="Varighed">' + H.esc(p.varighed || '-') + '</td>' +
        '<td data-l="Givet af">' + H.esc(p.af || '-') + '</td>' +
        '<td data-l="Dato">' + H.esc(p.gaettet && p.naar ? p.naar : H.dato(p.tid)) + '</td>' +
        '<td data-l="Status">' + status(p) + '</td></tr>';
    });
    boks.innerHTML = html + '</tbody></table>';
    H.sider(el('bl-sider'), side, antal, function (s) { side = s; tegn(); el('bl-typer').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  }

  function tal() {
    var aktiveBans = poster.filter(function (p) { return p.aktiv && p.type === 'BAN'; }).length;
    var aktiveMutes = poster.filter(function (p) { return p.aktiv && p.type === 'MUTE'; }).length;
    var kicks = poster.filter(function (p) { return p.type === 'KICK'; }).length;
    var kort = [['Aktive bans', aktiveBans], ['Aktive mutes', aktiveMutes], ['Kicks i alt', kicks], ['Straffe i alt', poster.length]];
    el('bl-tal').innerHTML = kort.map(function (k) { return '<div class="kort"><b>' + H.tal(k[1]) + '</b><span class="daempet">' + k[0] + '</span></div>'; }).join('');
    el('bl-info').textContent = opdateret ? 'Sidst opdateret ' + H.siden(opdateret) + '.' : '';
  }

  function hent() {
    H.api('straffe', { auth: false }).then(function (d) {
      poster = d.poster || [];
      opdateret = d.opdateret;
      tal();
      tegn();
    }).catch(function () {
      el('bl-liste').innerHTML = '<p class="tom">Kunne ikke hente banlisten lige nu. Prøv igen om lidt.</p>';
    });
  }

  el('bl-kunaktive').addEventListener('change', function (e) { kunAktive = e.target.checked; side = 1; tegn(); });
  el('bl-soeg').addEventListener('input', function (e) { soeg = e.target.value.trim().toLowerCase(); side = 1; tegn(); });
  typeKnapper();
  hent();
  setInterval(hent, 60000);
})();
