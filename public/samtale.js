(function () {
  var m = document.getElementById('m');
  function el(tag, cls, tekst) { var e = document.createElement(tag); if (cls) e.className = cls; if (tekst != null) e.textContent = tekst; return e; }
  function tid(t) { return new Date(t).toLocaleString('da-DK', { timeZone: 'Europe/Copenhagen', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  function sikkerUrl(u) { return /^https:\/\//i.test(u) ? u : '#'; }
  var id = new URLSearchParams(location.search).get('id');
  if (!id) { m.innerHTML = ''; m.appendChild(el('div', 'fejl', 'Linket mangler et id.')); return; }
  fetch('/api/samtale?id=' + encodeURIComponent(id)).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); }).then(function (r) {
    m.innerHTML = '';
    if (!r.ok) { m.appendChild(el('div', 'fejl', r.d.fejl || 'Kunne ikke hente samtalen.')); return; }
    var d = r.d;
    document.title = 'Ticket ' + d.ticket + ' - HOPDOP';
    var k = el('div', 'krumme', 'Samtaler / HOPDOP / Ticket ' + d.ticket); m.appendChild(k);
    var kort = el('div', 'kort'); var h = el('h1', null, 'Ticket ' + d.ticket + ' '); h.appendChild(el('span', 'maerke', 'Lukket')); kort.appendChild(h);
    var l1 = el('div', 'meta', 'Åbnet af '); l1.appendChild(el('span', 'hl', d.aabnetAf || 'ukendt')); if (d.aabnet) l1.appendChild(document.createTextNode('  ' + tid(d.aabnet))); kort.appendChild(l1);
    if (d.type) { var l2 = el('div', 'meta', 'Type: '); l2.appendChild(el('b', null, d.type)); kort.appendChild(l2); }
    var svar = {}; d.beskeder.forEach(function (b) { if (!svar[b.a]) svar[b.a] = 0; svar[b.a]++; });
    var l3 = el('div', 'meta'); l3.appendChild(el('b', null, 'Svar')); kort.appendChild(l3);
    Object.keys(svar).forEach(function (n) { var x = el('div', 'meta'); x.appendChild(el('span', 'hl', n)); x.appendChild(document.createTextNode('  ' + svar[n] + ' beskeder')); kort.appendChild(x); });
    m.appendChild(kort);
    var s = el('div', 'samtale');
    d.beskeder.forEach(function (b) {
      var r = el('div', 'msg'); var av = el('div', 'av', (b.a || '?').charAt(0)); if (b.f && /^https:\/\//.test(b.f)) { av.style.backgroundImage = 'url("' + b.f.replace(/"/g, '%22') + '")'; av.textContent = ''; }
      var c = el('div'); var top = el('div', 'top'); top.appendChild(el('span', 'navn' + (b.bot ? ' bot' : ''), b.a)); if (b.bot) top.appendChild(el('span', 'app', 'APP')); top.appendChild(el('span', 'tid', tid(b.t))); c.appendChild(top);
      if (b.x) c.appendChild(el('div', 'tekst', b.x));
      b.e.forEach(function (e) { var eb = el('div', 'embed'); if (e.t) eb.appendChild(el('b', null, e.t)); if (e.x) eb.appendChild(el('div', 'tekst', e.x)); c.appendChild(eb); });
      b.v.forEach(function (v) { var a = el('a', 'fil', '📎 ' + (v.n || 'fil')); a.href = sikkerUrl(v.u); a.target = '_blank'; a.rel = 'noopener noreferrer'; c.appendChild(a); c.appendChild(document.createElement('br')); });
      r.appendChild(av); r.appendChild(c); s.appendChild(r);
    });
    m.appendChild(s);
    var bund = el('div', 'bund', 'Lukket af ' + (d.lukketAf || 'ukendt')); bund.appendChild(el('small', null, 'Ticketten blev lukket ' + tid(d.lukket))); m.appendChild(bund);
  }).catch(function () { m.innerHTML = ''; m.appendChild(el('div', 'fejl', 'Kunne ikke hente samtalen.')); });
})();
