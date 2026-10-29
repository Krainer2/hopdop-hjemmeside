// HOPDOP - regler: kapitler glider ind, indholdsfortegnelse følger med og "læst"-bar. Lavet af Krainer2
(function () {
  var kap = Array.prototype.slice.call(document.querySelectorAll('.rg-kap'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.rg-index a'));
  var bar = Array.prototype.slice.call(document.querySelectorAll('.rg-bar i'));
  var tekst = document.getElementById('rg-laest-tekst');
  var laest = {};
  function opdater() {
    var midt = window.innerHeight * 0.4, aktiv = null;
    kap.forEach(function (k, i) {
      var r = k.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.88) k.classList.add('ind');
      if (r.top <= midt) aktiv = k.id;
      if (r.bottom < window.innerHeight && r.top < window.innerHeight * 0.88) laest[k.id] = true;
    });
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 4) kap.forEach(function (k) { laest[k.id] = true; });
    links.forEach(function (l) { l.classList.toggle('aktiv', l.getAttribute('href') === '#' + aktiv); });
    var n = 0;
    kap.forEach(function (k, i) { var ja = !!laest[k.id]; if (ja) n++; if (bar[i]) bar[i].classList.toggle('ja', ja); });
    if (tekst) tekst.textContent = n === kap.length ? 'Alle regler læst - godt gået!' : 'Læst ' + n + ' af ' + kap.length;
  }
  var venter = false;
  window.addEventListener('scroll', function () { if (!venter) { venter = true; requestAnimationFrame(function () { venter = false; opdater(); }); } }, { passive: true });
  window.addEventListener('resize', opdater);
  opdater();

  // Kopiér link til et kapitel (godt til staff der skal henvise til en regel)
  document.querySelectorAll('.rg-link').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = location.origin + location.pathname + '#' + b.getAttribute('data-link');
      var ok = function () { b.textContent = 'Kopieret!'; setTimeout(function () { b.textContent = 'Kopiér link'; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok, ok); else ok();
    });
  });
})();
