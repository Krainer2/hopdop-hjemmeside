// HOPDOP ansøgninger. Lavet af Krainer2
(function () {
  var H = window.HD, S = window.HD_ANSOG;
  var el = function (id) { return document.getElementById(id); };
  var valgt = null;

  function mineKoder() {
    try { return JSON.parse(localStorage.getItem('hopdop-ansog') || '[]') || []; } catch (e) { return []; }
  }
  function gemKode(kode, type) {
    var l = mineKoder().filter(function (x) { return x.kode !== kode; });
    l.unshift({ kode: kode, type: type, tid: Date.now() });
    try { localStorage.setItem('hopdop-ansog', JSON.stringify(l.slice(0, 10))); } catch (e) {}
    visMine();
  }

  // Valg af type
  Object.keys(S).forEach(function (id) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'kort an-type';
    b.setAttribute('role', 'listitem');
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<b></b><span class="daempet"></span><span class="badge" style="align-self:flex-start">Ansøg</span>';
    b.querySelector('b').textContent = S[id].navn;
    b.querySelector('.daempet').textContent = S[id].tekst;
    b.dataset.id = id;
    b.addEventListener('click', function () { vaelg(id); });
    el('an-typer').appendChild(b);
  });

  function vaelg(id) {
    valgt = id;
    var s = S[id];
    el('an-typer').querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.id === id ? 'true' : 'false'); });
    el('an-titel').textContent = 'Ansøg som ' + s.navn.toLowerCase();
    if (id === 'unban') el('an-titel').textContent = 'Unban-ansøgning';
    el('an-tekst').textContent = s.tekst;
    var boks = el('an-felter');
    boks.innerHTML = '';
    s.felter.forEach(function (f) {
      var d = document.createElement('div');
      d.className = 'felt';
      var fid = 'an-f-' + f.id;
      if (f.type === 'ja') {
        d.innerHTML = '<label class="an-ja"><input type="checkbox" id="' + fid + '"> <span></span></label>';
        d.querySelector('span').textContent = f.label + (f.krav ? ' *' : '');
      } else {
        d.innerHTML = '<label for="' + fid + '"><span></span>' + (f.krav ? ' <span class="an-krav" aria-hidden="true">*</span>' : '') + '</label>';
        d.querySelector('span').textContent = f.label;
        var inp;
        if (f.type === 'lang' || f.type === 'links') { inp = document.createElement('textarea'); inp.rows = f.type === 'links' ? 3 : 5; }
        else if (f.type === 'valg') {
          inp = document.createElement('select');
          inp.innerHTML = '<option value="">Vælg...</option>' + f.valg.map(function (v) { return '<option>' + H.esc(v) + '</option>'; }).join('');
        } else {
          inp = document.createElement('input');
          inp.type = f.type === 'tal' ? 'number' : 'text';
          if (f.min != null) inp.min = f.min;
          if (f.max != null) inp.max = f.max;
          if (f.id === 'mcnavn') { inp.maxLength = 16; inp.autocomplete = 'username'; }
        }
        inp.id = fid;
        if (f.krav) inp.required = true;
        if (f.minLaengde) inp.placeholder = 'Mindst ' + f.minLaengde + ' tegn';
        d.appendChild(inp);
      }
      boks.appendChild(d);
    });
    el('an-fejl').textContent = '';
    el('an-form').classList.remove('skjult');
    el('an-kvit').classList.add('skjult');
    el('an-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  el('an-tilbage').addEventListener('click', function () {
    el('an-form').classList.add('skjult');
    el('an-typer').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  el('an-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var s = S[valgt], felter = {}, fejl = '';
    s.felter.forEach(function (f) {
      var inp = el('an-f-' + f.id);
      var v = f.type === 'ja' ? (inp.checked ? 'Ja' : '') : inp.value.trim();
      felter[f.id] = v;
      if (fejl) return;
      if (f.krav && !v) fejl = 'Udfyld: ' + f.label;
      else if (f.id === 'mcnavn' && !/^[A-Za-z0-9_]{3,16}$/.test(v)) fejl = 'Skriv dit rigtige Minecraft-navn (3-16 tegn, kun bogstaver, tal og _).';
      else if (f.minLaengde && v.length < f.minLaengde) fejl = '"' + f.label + '" skal være mindst ' + f.minLaengde + ' tegn (du har ' + v.length + ').';
      else if (f.type === 'tal' && v && (Number(v) < f.min || Number(v) > f.max)) fejl = '"' + f.label + '" skal være mellem ' + f.min + ' og ' + f.max + '.';
      if (fejl) inp.focus();
    });
    if (fejl) { el('an-fejl').textContent = fejl; return; }
    var knap = el('an-send');
    knap.disabled = true;
    knap.textContent = 'Sender...';
    H.api('ansog', { method: 'POST', auth: false, body: { type: valgt, felter: felter, hjemmeside: el('an-hjemmeside').value } })
      .then(function (j) {
        gemKode(j.kode, S[valgt].navn);
        el('an-form').classList.add('skjult');
        var k = el('an-kvit');
        k.classList.remove('skjult');
        k.innerHTML = '<h2>Tak! Din ansøgning er sendt</h2><p class="daempet">Gem din kode. Med den kan du se, om ansøgningen er godkendt:</p>' +
          '<p class="an-kode">' + H.esc(j.kode) + '</p><p class="daempet" style="margin:0">Koden er også gemt i din browser nederst på siden. Staff svarer typisk inden for et par dage.</p>';
        k.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function (err) { el('an-fejl').textContent = err.message || 'Kunne ikke sende. Prøv igen.'; })
      .then(function () { knap.disabled = false; knap.textContent = 'Send ansøgning'; });
  });

  var STATUS = { ny: ['Venter på svar', 'gul'], godkendt: ['Godkendt', ''], afvist: ['Afvist', 'roed'] };
  function tjek(kode) {
    el('an-status').innerHTML = '<span class="daempet">Henter...</span>';
    H.api('ansog?kode=' + encodeURIComponent(kode), { auth: false }).then(function (a) {
      var st = STATUS[a.status] || [a.status, 'graa'];
      el('an-status').innerHTML = '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b>' + H.esc(a.type) + '-ansøgning fra ' + H.esc(a.mcnavn) + '</b><span class="badge ' + st[1] + '">' + st[0] + '</span></div>' +
        '<p class="daempet" style="margin:6px 0 0">Sendt ' + H.esc(H.dato(a.oprettet)) + (a.behandlet ? ' · behandlet ' + H.esc(H.dato(a.behandlet)) : '') + '</p>' +
        (a.note ? '<p style="margin:8px 0 0"><b>Besked fra staff:</b> ' + H.esc(a.note) + '</p>' : '');
    }).catch(function (err) { el('an-status').innerHTML = '<span style="color:var(--t-fca5a5, #FCA5A5)">' + H.esc(err.message) + '</span>'; });
  }
  el('an-tjek').addEventListener('submit', function (e) {
    e.preventDefault();
    var k = el('an-kode').value.trim().toUpperCase();
    if (k) tjek(k);
  });
  function visMine() {
    var l = mineKoder();
    var b = el('an-mine');
    if (!l.length) { b.innerHTML = ''; return; }
    b.innerHTML = '<p class="daempet" style="margin:0 0 6px;font-size:14px">Dine ansøgninger fra denne browser:</p><div class="chips"></div>';
    l.forEach(function (x) {
      var c = document.createElement('button');
      c.type = 'button'; c.className = 'chip';
      c.textContent = x.type + ' · ' + x.kode;
      c.addEventListener('click', function () { el('an-kode').value = x.kode; tjek(x.kode); });
      b.querySelector('.chips').appendChild(c);
    });
  }
  visMine();

  var start = new URLSearchParams(location.search).get('type');
  if (start && S[start]) vaelg(start);
})();
