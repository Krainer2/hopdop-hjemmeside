// HOPDOP staff-side: holdet vist som et Minecraft-inventar + spotlight med hel krop.
// Staff Team for alle, Vagt Team kun for staff der er logget ind. Lavet af Krainer2
(function () {
  var H = window.HD;
  var HOLD = {
    staff: {
      orden: ['Ejer', 'Admin', 'Mod', 'Helper', 'Bygger'],
      flertal: { Ejer: 'Ejere', Admin: 'Admins', Mod: 'Moderatorer', Helper: 'Helpere', Bygger: 'Byggere' },
      om: { Ejer: 'Har det sidste ord', Admin: 'Styrer serveren', Mod: 'Holder orden', Helper: 'Hjælper nye spillere', Bygger: 'Bygger maps og spawn' },
      over: 'HOPDOP STAFF',
      titel: 'Folkene <em>bag</em> serveren',
      tekst: 'Holdet der kører HOPDOP, hjælper spillere og sørger for fair kampe. Vælg et hoved for at se personen i fuld størrelse. Et lilla glimt betyder at de er online lige nu. Brug for hjælp? Skriv på <a href="' + H.DISCORD + '">Discord</a>.',
      inv: 'STAFF',
      tom: 'Staff-listen er ikke udfyldt endnu.'
    },
    vagt: {
      orden: ['Vagtchef', 'Vagt'],
      flertal: { Vagtchef: 'Vagtchefer', Vagt: 'Vagter' },
      om: { Vagtchef: 'Leder vagterne', Vagt: 'Passer fængslet' },
      over: 'FÆNGSLETS VAGTER',
      titel: 'Vagterne <em>i</em> fængslet',
      tekst: 'Vagterne holder styr på fangerne, passer vagtposterne og sørger for ro i fængslet.',
      inv: 'VAGTREGISTER',
      tom: 'Der er ingen vagter på listen endnu. Tilføj dem under Staff-liste i admin-panelet med rollen Vagtchef eller Vagt.'
    }
  };
  var staff = [], online = {}, spillere = {}, valgt = 'staff', vagtAdgang = false, valgtNavn = {};
  var el = function (id) { return document.getElementById(id); };
  var tip = el('sf-tip');
  var mus = matchMedia('(hover: hover)').matches;

  function info(s) { return spillere[s.navn.toLowerCase()] || null; }
  function erOn(s) { return !!online[s.navn.toLowerCase()]; }
  function hoved(s, str) { var p = info(s); return H.hoved(p && p.u, str, s.navn); }
  function krop(s, str) { var p = info(s); return H.krop(p && p.u, str, s.navn); }
  function holdFolk() {
    var h = HOLD[valgt];
    return h.orden.reduce(function (l, r) { return l.concat(staff.filter(function (s) { return s.rolle === r; })); }, []);
  }
  function tal(v) { var n = Number(v); return isFinite(n) ? n : 0; }

  // ---------- Inventaret ----------
  function tegn() {
    var h = HOLD[valgt];
    var folk = holdFolk();
    document.body.classList.toggle('vagt', valgt === 'vagt');
    el('sf-over').textContent = h.over;
    el('sf-titel').innerHTML = h.titel;
    el('sf-tekst').innerHTML = h.tekst;
    el('sf-inv-titel').textContent = h.inv;
    el('fane-staff').setAttribute('aria-selected', valgt === 'staff');
    el('fane-vagt').setAttribute('aria-selected', valgt === 'vagt');
    document.title = (valgt === 'vagt' ? 'Vagter' : 'Staff') + ' - HOPDOP';

    var antalOn = folk.filter(erOn).length;
    el('sf-chips').innerHTML =
      '<span class="sf-chip"><b>' + folk.length + '</b> på holdet</span>' +
      '<span class="sf-chip"><i></i><b>' + antalOn + '</b> online nu</span>';
    el('sf-inv-antal').textContent = folk.length + (folk.length === 1 ? ' PERSON' : ' PERSONER');
    el('sf-vagtinfo').innerHTML = valgt === 'vagt' ? '<div class="vagt-info"><span>🔒</span><span><b>Kun for staff.</b> Spillere kan ikke se vagterne, og fanen står ikke i menuen for dem.</span></div>' : '';

    var html = '', nr = 0;
    h.orden.forEach(function (rolle) {
      var l = staff.filter(function (s) { return s.rolle === rolle; });
      if (!l.length) return;
      var k = 'r-' + rolle.toLowerCase();
      html += '<div class="sf-raekke ' + k + '"><div class="sf-rang"><b>' + h.flertal[rolle] + '</b><small>' + h.om[rolle] + '</small></div><div class="sf-slots">';
      l.forEach(function (s) {
        nr++;
        html += '<button type="button" class="sf-slot ' + k + (erOn(s) ? ' on' : '') + '" data-navn="' + H.esc(s.navn) + '" data-nr="' + nr + '" aria-pressed="false" aria-label="' + H.esc(s.navn) + ', ' + H.esc(s.titel || rolle) + (erOn(s) ? ', online' : '') + '">' +
          '<img alt="" loading="lazy" src="' + hoved(s, 40) + '"></button>';
      });
      html += '</div></div>';
    });
    if (html && valgt === 'staff') {
      html += '<div class="sf-raekke r-helper"><div class="sf-rang"><b>Din plads?</b><small>Vi søger staff og byggere</small></div><div class="sf-slots">' +
        '<a class="sf-slot ny" href="ansog.html?type=staff" data-ny="1" aria-label="Ansøg om at blive staff">+</a></div></div>';
    }
    el('sf-liste').innerHTML = html || '<div class="tom">' + h.tom + '</div>';
    el('sf-inv-bund').innerHTML = folk.length ? '<span><span class="sf-glimt-ikon"></span>Glimt = online nu</span><span>' + (mus ? 'Hold musen over et hoved for info, klik for at vælge' : 'Tryk på et hoved for at se personen') + '</span>' : '';

    // Vælg den sidst valgte (eller den første) person
    var forrige = valgtNavn[valgt];
    var start = folk.filter(function (s) { return s.navn === forrige; })[0] || folk[0];
    if (start) vis(start, false); else el('sf-spot').innerHTML = '';
    el('sf-spot').classList.toggle('skjult', !start);
  }

  // ---------- Spotlight ----------
  function vis(s, animer) {
    valgtNavn[valgt] = s.navn;
    var k = 'r-' + s.rolle.toLowerCase();
    var p = info(s), on = erOn(s);
    var kills = p ? tal(p.k) : null, doede = p ? tal(p.d) : null;
    var kd = p ? (doede ? (kills / doede).toFixed(2) : kills.toFixed(2)) : null;
    var slot = document.querySelector('.sf-slot[data-navn="' + CSS.escape(s.navn) + '"]');
    document.querySelectorAll('.sf-slot[aria-pressed]').forEach(function (b) { b.setAttribute('aria-pressed', b === slot); });
    var nr = slot ? Number(slot.getAttribute('data-nr')) : 1;
    var spot = el('sf-spot');
    spot.className = 'sf-spot ' + k;
    spot.innerHTML =
      '<div class="sf-scene">' +
        (valgt === 'vagt' ? '<span class="sf-vagtnr">VAGT-ID #' + (nr < 10 ? '0' : '') + nr + '</span>' : '') +
        '<div class="sf-tag' + (animer ? ' sf-skift' : '') + '"><span>' + H.esc(s.rolle.toUpperCase()) + '</span>' + H.esc(s.navn) + '</div>' +
        '<img class="sf-krop' + (animer ? ' sf-skift' : '') + '" alt="' + H.esc(s.navn) + '" src="' + krop(s, 180) + '">' +
        '<span class="sf-sokkel"></span>' +
      '</div>' +
      '<div class="sf-info">' +
        '<span class="sf-rangtekst">' + H.esc(s.titel || s.rolle) + '</span>' +
        '<h2>' + H.esc(s.navn) + '</h2>' +
        '<span class="sf-status' + (on ? ' ja' : '') + '"><i></i>' + (on ? 'Online på serveren nu' : 'Ikke online lige nu') + '</span>' +
        '<div class="sf-tal">' +
          '<div><b>' + (p ? kills : '–') + '</b><span>Kills</span></div>' +
          '<div><b>' + (p ? doede : '–') + '</b><span>Døde</span></div>' +
          '<div><b>' + (p ? kd : '–') + '</b><span>K/D</span></div>' +
        '</div>' +
        '<a class="knap groen" href="' + H.profil(s.navn) + '">Se profil</a>' +
      '</div>';
  }

  // ---------- Tooltip ----------
  function visTip(slot, x, y) {
    if (slot.getAttribute('data-ny')) {
      tip.className = 'sf-tip vis r-helper';
      tip.innerHTML = '<b>Ledig plads</b><span class="t">Klik for at ansøge</span>';
    } else {
      var s = staff.filter(function (q) { return q.navn === slot.getAttribute('data-navn'); })[0];
      if (!s) return;
      var on = erOn(s);
      tip.className = 'sf-tip vis r-' + s.rolle.toLowerCase();
      tip.innerHTML = '<b>' + H.esc(s.navn) + '</b>' +
        '<div>' + H.esc(s.titel || s.rolle) + '</div>' +
        '<div class="' + (on ? 'g' : 'm') + '">' + (on ? '● Online' : '● Offline') + '</div>' +
        '<div class="t">Klik for at vælge</div>';
    }
    flyt(x, y);
  }
  function flyt(x, y) {
    var w = tip.offsetWidth, hh = tip.offsetHeight;
    var l = x + 16, t = y - hh - 10;
    if (l + w > innerWidth - 8) l = x - w - 16;
    if (t < 8) t = y + 20;
    tip.style.left = l + 'px'; tip.style.top = t + 'px';
  }
  function skjulTip() { tip.className = 'sf-tip'; }

  var liste = el('sf-liste');
  liste.addEventListener('mousemove', function (e) {
    var b = e.target.closest('.sf-slot');
    if (!b) return skjulTip();
    if (!tip.classList.contains('vis') || tip.getAttribute('data-for') !== (b.getAttribute('data-navn') || '+')) {
      tip.setAttribute('data-for', b.getAttribute('data-navn') || '+');
      visTip(b, e.clientX, e.clientY);
    } else flyt(e.clientX, e.clientY);
  });
  liste.addEventListener('mouseleave', skjulTip);
  liste.addEventListener('focusin', function (e) {
    var b = e.target.closest('.sf-slot');
    if (!b || mus === false) return;
    var r = b.getBoundingClientRect();
    tip.setAttribute('data-for', b.getAttribute('data-navn') || '+');
    visTip(b, r.right - 8, r.top + 8);
  });
  liste.addEventListener('focusout', skjulTip);
  addEventListener('scroll', skjulTip, { passive: true });
  liste.addEventListener('click', function (e) {
    var b = e.target.closest('.sf-slot[data-navn]');
    if (!b) return;
    var s = staff.filter(function (q) { return q.navn === b.getAttribute('data-navn'); })[0];
    if (!s) return;
    vis(s, true);
    // På mobil ligger spotlight over listen - rul op til den
    var r = el('sf-spot').getBoundingClientRect();
    if (r.bottom < 80 || r.top > innerHeight) el('sf-spot').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // ---------- Faner ----------
  function vaelg(hold) {
    if (hold === 'vagt' && !vagtAdgang) hold = 'staff';
    valgt = hold;
    try { history.replaceState(null, '', hold === 'vagt' ? '#vagt' : location.pathname + location.search); } catch (e) {}
    tegn();
  }
  el('fane-staff').addEventListener('click', function () { vaelg('staff'); });
  el('fane-vagt').addEventListener('click', function () { vaelg('vagt'); });

  Promise.all([
    H.api('staff'),
    H.api('stats', { auth: false }).catch(function () { return { online: [], spillere: [] }; })
  ]).then(function (r) {
    staff = r[0].staff || [];
    vagtAdgang = !!r[0].vagtAdgang;
    (r[1].online || []).forEach(function (n) { online[String(n).toLowerCase()] = true; });
    (r[1].spillere || []).forEach(function (p) { if (p && p.n) spillere[String(p.n).toLowerCase()] = p; });
    el('fane-vagt').classList.toggle('skjult', !vagtAdgang);
    el('sf-faner').classList.toggle('skjult', !vagtAdgang);
    vaelg(location.hash === '#vagt' ? 'vagt' : 'staff');
  }).catch(function () {
    el('sf-liste').innerHTML = '<div class="tom">Kunne ikke hente staff-listen lige nu.</div>';
    el('sf-spot').classList.add('skjult');
  });
})();
