// HOPDOP staff-side: "Vores Staff Team" + "Vores Vagt Team" (kun for staff). Lavet af Krainer2
(function () {
  var H = window.HD;
  var HOLD = {
    staff: {
      orden: ['Ejer', 'Admin', 'Mod', 'Helper', 'Bygger'],
      flertal: { Ejer: 'Ejere', Admin: 'Admins', Mod: 'Moderatorer', Helper: 'Helpere', Bygger: 'Byggere' },
      farve: { Ejer: 'gul', Admin: 'roed', Mod: 'blaa', Helper: '', Bygger: 'graa' },
      titel: 'Vores <span>Staff</span> Team',
      over: 'HOPDOP',
      tekst: 'De her folk holder HOPDOP kørende, hjælper spillere og sørger for fair kampe. Brug for hjælp? Skriv til os på <a href="' + H.DISCORD + '">Discord</a>.',
      tom: 'Staff-listen er ikke udfyldt endnu.'
    },
    vagt: {
      orden: ['Vagtchef', 'Vagt'],
      flertal: { Vagtchef: 'Vagtchefer', Vagt: 'Vagter' },
      farve: { Vagtchef: 'orange', Vagt: 'orange' },
      titel: 'Vores <span>Vagt</span> Team',
      over: 'Fængslets vagter',
      tekst: 'Vagterne holder styr på fangerne, passer vagtposterne og sørger for ro i fængslet. Holdet er kun synligt for staff.',
      tom: 'Der er ingen vagter på listen endnu. Tilføj dem under Staff-liste i admin-panelet med rollen Vagtchef eller Vagt.'
    }
  };
  var staff = [], online = {}, valgt = 'staff', vagtAdgang = false;
  var el = function (id) { return document.getElementById(id); };
  var obs = 'IntersectionObserver' in window ? new IntersectionObserver(function (l) {
    l.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('ind'); obs.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null;

  function tegn() {
    var h = HOLD[valgt];
    document.body.classList.toggle('vagt', valgt === 'vagt');
    el('st-titel').innerHTML = h.titel;
    el('st-over').textContent = h.over;
    el('st-tekst').innerHTML = h.tekst;
    el('st-cta').classList.toggle('skjult', valgt === 'vagt');
    el('fane-staff').setAttribute('aria-selected', valgt === 'staff');
    el('fane-vagt').setAttribute('aria-selected', valgt === 'vagt');
    document.title = 'Vores ' + (valgt === 'vagt' ? 'Vagt' : 'Staff') + ' Team - HOPDOP';

    var html = '', hop = '', nr = 0;
    h.orden.forEach(function (rolle) {
      var folk = staff.filter(function (s) { return s.rolle === rolle; });
      if (!folk.length) return;
      var id = 'gruppe-' + rolle.toLowerCase();
      hop += '<a href="#' + id + '">' + h.flertal[rolle] + ' · ' + folk.length + '</a>';
      html += '<section class="st-gruppe" id="' + id + '"><h2 class="st-vis">' + h.flertal[rolle] + ' <span class="badge ' + h.farve[rolle] + '">' + folk.length + '</span></h2>' +
        '<div class="st-kort' + (valgt === 'vagt' ? ' vagt-kort' : '') + '">';
      folk.forEach(function (s, i) {
        nr++;
        var on = online[s.navn.toLowerCase()];
        html += '<a class="st-person st-vis" style="--i:' + (i % 6) + '" href="' + H.profil(s.navn) + '">' +
          (valgt === 'vagt' ? '<span class="vagt-nr">VAGT #' + (nr < 10 ? '0' : '') + nr + '</span>' : '') +
          '<img alt="" loading="lazy" src="' + H.hoved(s.navn, 76) + '"><b>' + H.esc(s.navn) + '</b>' +
          '<span class="badge ' + h.farve[rolle] + '">' + H.esc(s.titel || rolle) + '</span>' +
          '<span class="st-on' + (on ? ' ja' : '') + '"><i></i>' + (on ? 'Online' : 'Offline') + '</span></a>';
      });
      html += '</div></section>';
    });
    if (!html) html = '<div class="kort tom">' + h.tom + '</div>';
    if (valgt === 'vagt') html = '<div class="vagt-info st-vis"><span>🔒</span><span><b>Kun for staff.</b> Spillere kan ikke se Vagt Team, og det står ikke i menuen for dem.</span></div>' + html;
    el('st-hop').innerHTML = hop;
    el('st-liste').innerHTML = html;
    document.querySelectorAll('#st-liste .st-vis').forEach(function (n) { obs ? obs.observe(n) : n.classList.add('ind'); });
  }

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
    H.api('stats', { auth: false }).catch(function () { return { online: [] }; })
  ]).then(function (r) {
    staff = r[0].staff || [];
    vagtAdgang = !!r[0].vagtAdgang;
    (r[1].online || []).forEach(function (n) { online[n.toLowerCase()] = true; });
    el('fane-vagt').classList.toggle('skjult', !vagtAdgang);
    vaelg(location.hash === '#vagt' ? 'vagt' : 'staff');
  }).catch(function () {
    el('st-liste').innerHTML = '<div class="kort tom">Kunne ikke hente staff-listen lige nu.</div>';
  });
})();
