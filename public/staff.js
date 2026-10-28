// HOPDOP staff-liste. Lavet af Krainer2
(function () {
  var H = window.HD;
  var ORDEN = ['Ejer', 'Admin', 'Mod', 'Helper', 'Bygger'];
  var FLERTAL = { Ejer: 'Ejere', Admin: 'Admins', Mod: 'Moderatorer', Helper: 'Helpere', Bygger: 'Byggere' };
  var FARVE = { Ejer: 'gul', Admin: 'roed', Mod: 'blaa', Helper: '', Bygger: 'graa' };
  document.getElementById('st-discord').href = H.DISCORD;

  Promise.all([
    H.api('staff', { auth: false }),
    H.api('stats', { auth: false }).catch(function () { return { online: [] }; })
  ]).then(function (r) {
    var staff = r[0].staff || [];
    var online = {};
    (r[1].online || []).forEach(function (n) { online[n.toLowerCase()] = true; });
    var boks = document.getElementById('st-liste');
    if (!staff.length) { boks.innerHTML = '<div class="kort tom">Staff-listen er ikke udfyldt endnu.</div>'; return; }
    var html = '';
    ORDEN.forEach(function (rolle) {
      var folk = staff.filter(function (s) { return s.rolle === rolle; });
      if (!folk.length) return;
      html += '<section class="st-gruppe"><h2>' + FLERTAL[rolle] + ' <span class="badge ' + FARVE[rolle] + '">' + folk.length + '</span></h2><div class="st-kort">';
      folk.forEach(function (s) {
        var on = online[s.navn.toLowerCase()];
        html += '<a class="st-person" href="' + H.profil(s.navn) + '"><img alt="" loading="lazy" src="' + H.hoved(s.navn, 72) + '"><b>' + H.esc(s.navn) + '</b>' +
          '<span class="badge ' + FARVE[rolle] + '">' + H.esc(s.titel || rolle) + '</span>' +
          '<span class="st-on' + (on ? ' ja' : '') + '"><i></i>' + (on ? 'Online' : 'Offline') + '</span></a>';
      });
      html += '</div></section>';
    });
    boks.innerHTML = html;
  }).catch(function () {
    document.getElementById('st-liste').innerHTML = '<div class="kort tom">Kunne ikke hente staff-listen lige nu.</div>';
  });
})();
