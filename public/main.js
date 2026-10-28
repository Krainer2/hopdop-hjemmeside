// HOPDOP forside - lavet af Krainer2
(function () {
  var IP = 'hopdop.superawesome.dk';
  var PIXEL = 'Pixelify Sans, sans-serif';

  // Tekster som admins kan ændre. rediger.js fylder dem ind fra serveren.
  var HD = window.HOPDOP = window.HOPDOP || { tekster: {} };
  function T(noegle, standard) {
    var v = HD.tekster[noegle];
    return typeof v === 'string' && v.length ? v : standard;
  }
  function tekstEl(tag, noegle, standard, stil) {
    var el = document.createElement(tag);
    el.dataset.tekst = noegle;
    el.dataset.standard = standard;
    el.textContent = T(noegle, standard);
    if (stil) el.style.cssText = stil;
    return el;
  }

  // ---------- Baggrund: bliver bag siden og sløres når man scroller ----------
  var sloer = document.getElementById('bg-sloer');
  var moerk = document.getElementById('bg-moerk');
  var venter = false;
  function opdaterBaggrund() {
    venter = false;
    var t = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.7)));
    if (sloer) sloer.style.opacity = String(t);
    if (moerk) moerk.style.opacity = String(t * 0.55);
  }
  window.addEventListener('scroll', function () {
    if (!venter) { venter = true; requestAnimationFrame(opdaterBaggrund); }
  }, { passive: true });
  opdaterBaggrund();

  // ---------- Live server-status ----------
  function saetStatus(online, tekst) {
    var prik = document.getElementById('status-prik');
    var label = document.getElementById('status-tekst');
    var antal = document.getElementById('status-spillere');
    if (label) label.textContent = online ? 'Online' : 'Offline';
    if (prik) prik.style.background = online ? '#4ADE80' : '#EF4444';
    if (prik && !online) prik.classList.remove('hd-puls');
    if (antal) antal.textContent = tekst;
  }
  function hentStatus() {
    fetch('https://api.mcsrvstat.us/3/' + IP)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.online) {
          var p = d.players || {};
          saetStatus(true, (p.online || 0) + ' / ' + (p.max || '?') + ' spillere');
        } else {
          saetStatus(false, 'Serveren er offline lige nu');
        }
      })
      .catch(function () { saetStatus(true, 'Kunne ikke hente spillere'); });
  }
  if (document.getElementById('status-spillere')) {
    hentStatus();
    setInterval(hentStatus, 60000);
  }

  // ---------- Kopiér IP ----------
  var status = document.getElementById('kopi-status');
  document.querySelectorAll('[data-kopier]').forEach(function (knap) {
    knap.addEventListener('click', function () {
      if (document.documentElement.hasAttribute('data-redigerer')) return;
      var faerdig = function () {
        document.querySelectorAll('[data-kopier]').forEach(function (k) { k.textContent = 'IP kopieret'; });
        if (status) status.textContent = 'Kopieret!';
        setTimeout(function () {
          document.querySelectorAll('[data-kopier]').forEach(function (k) { k.textContent = 'Spil nu'; });
          if (status) status.textContent = '';
        }, 2500);
      };
      try {
        navigator.clipboard.writeText(IP).then(faerdig, faerdig);
      } catch (e) { faerdig(); }
    });
  });

  // ---------- Kits ----------
  var kits = [
    { id: 'diamond', navn: 'Diamond', farve: '#3FD0E6', kant: '#157A8C', rolle: 'Frontlinje', rustning: 'Fuld diamond', vaaben: 'Diamond-sværd', ekstra: 'Instant health potions', evne: 'Tank: tager og deler skaden ud', tekst: 'Det klassiske kit. Du står forrest, tager presset og potter dig gennem kampen.' },
    { id: 'bard', navn: 'Bard', farve: '#F5C518', kant: '#9A7404', rolle: 'Support', rustning: 'Fuld guld', vaaben: 'Iron ingot og blaze powder', ekstra: 'Effekter til hele holdet', evne: 'Højreklik: Resistance (iron) eller Strength (blaze) til holdet', tekst: 'Holdets motor. Du holder dig lidt tilbage og giver dine holdkammerater effekterne, der vinder kampen.' },
    { id: 'archer', navn: 'Archer', farve: '#9C5B2E', kant: '#4A2711', rolle: 'Langdistance', rustning: 'Fuld læder', vaaben: 'Bue', ekstra: 'Speed', evne: 'Archer tag: ramte fjender tager ekstra skade i kort tid', tekst: 'Markér fjender på afstand, så dit hold kan gøre det af med dem.' },
    { id: 'rogue', navn: 'Rogue', farve: '#B8BEC6', kant: '#5A6069', rolle: 'Snigmorder', rustning: 'Fuld chainmail', vaaben: 'Guldsværd', ekstra: 'Speed og jump', evne: 'Backstab: slå bagfra med guldsværdet for stor skade', tekst: 'Snig dig rundt om kampen og ram bagfra, når de mindst venter det.' },
    { id: 'reaper', navn: 'Reaper', farve: '#9C5B2E', kant: '#5A6069', rolle: 'Jæger', rustning: 'Læderhjelm og -støvler, chainmail-bryst og -bukser', vaaben: 'Iron hoe', ekstra: '[Bestem selv]', evne: 'Høst: hits giver Wither, og et kill giver dig liv tilbage', tekst: 'Halv læder, halv chainmail. Reaperen jager sårede spillere og høster dem, før de når at potte.' }
  ];
  var tabs = document.getElementById('kit-tabs');
  var valgtKit = 'diamond';
  var aktivKnap = 'padding: 12px 18px; min-height: 48px; border-radius: 8px; border: 2px solid #4ADE80; background: #12261A; color: #F0FDF4; font-family: ' + PIXEL + '; font-weight: 700; font-size: 16px; cursor: pointer';
  var normalKnap = 'padding: 12px 18px; min-height: 48px; border-radius: 8px; border: 2px solid #1F3127; background: #0F1813; color: #C9DCD0; font-family: ' + PIXEL + '; font-weight: 700; font-size: 16px; cursor: pointer';
  function visKit(id) {
    valgtKit = id;
    var k = kits.filter(function (x) { return x.id === id; })[0] || kits[0];
    tabs.querySelectorAll('button').forEach(function (b) {
      var valgt = b.dataset.id === k.id;
      b.setAttribute('aria-selected', valgt ? 'true' : 'false');
      b.style.cssText = valgt ? aktivKnap : normalKnap;
    });
    document.querySelectorAll('[data-kit]').forEach(function (el) {
      var felt = el.dataset.kit;
      var noegle = 'kit.' + k.id + '.' + felt;
      el.dataset.tekst = noegle;
      el.dataset.standard = k[felt];
      el.textContent = T(noegle, k[felt]);
    });
    var boks = document.getElementById('kit-felt');
    if (boks) boks.style.cssText = 'display: block; width: 64px; height: 64px; border-radius: 6px; background: ' + k.farve + '; border: 4px solid ' + k.kant + '; box-shadow: inset -8px -8px 0 rgba(0, 0, 0, 0.25)';
  }
  function tegnKits() {
    if (!tabs) return;
    tabs.innerHTML = '';
    kits.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hd-knap';
      b.setAttribute('role', 'tab');
      b.dataset.id = k.id;
      var prik = document.createElement('span');
      prik.setAttribute('aria-hidden', 'true');
      prik.style.cssText = 'display: inline-block; width: 14px; height: 14px; margin-right: 10px; vertical-align: -2px; background: ' + k.farve + '; border: 2px solid ' + k.kant;
      b.appendChild(prik);
      b.appendChild(document.createTextNode(k.navn));
      b.addEventListener('click', function () { visKit(k.id); });
      tabs.appendChild(b);
    });
    visKit(valgtKit);
  }

  // ---------- Stem på idéer ----------
  var ideer = [
    { id: 'pas', titel: 'Sæson-pas', tekst: '30 niveauer med belønninger, som du låser op ved at spille - ikke ved at betale.' },
    { id: 'bounty', titel: 'Bounty-tavle', tekst: 'Sæt en dusør på en spiller med /bounty. Tavlen vises live her på siden og ved spawn.' },
    { id: 'events', titel: 'Weekend-events', tekst: 'Drop party, Last Man Standing og dobbelt fiske-XP hver weekend.' }
  ];
  var stemt = {};
  try { stemt = JSON.parse(localStorage.getItem('hopdop-stemmer') || '{}') || {}; } catch (e) { stemt = {}; }
  var liste = document.getElementById('ideer-liste');
  function tegnIdeer() {
    if (!liste) return;
    liste.innerHTML = '';
    ideer.forEach(function (i) {
      var har = !!stemt[i.id];
      var kort = document.createElement('div');
      kort.className = 'hd-kort';
      kort.style.cssText = 'background: #0F1813; border: 2px solid #1F3127; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 12px';
      var tag = document.createElement('span');
      tag.textContent = 'IDÉ';
      tag.style.cssText = 'align-self: flex-start; font-family: ' + PIXEL + '; font-size: 13px; color: #FACC15; border: 2px solid #3A2E07; padding: 3px 8px; border-radius: 4px';
      kort.appendChild(tag);
      kort.appendChild(tekstEl('h3', 'ide.' + i.id + '.titel', i.titel, 'margin: 0; font-family: ' + PIXEL + '; font-weight: 700; font-size: 22px; color: #F0FDF4'));
      kort.appendChild(tekstEl('p', 'ide.' + i.id + '.tekst', i.tekst, 'margin: 0; color: #C9DCD0; line-height: 1.65; flex: 1'));
      var bund = document.createElement('div');
      bund.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 12px';
      var info = document.createElement('span');
      info.style.cssText = 'color: #A9BFB1; font-size: 14px';
      info.textContent = har ? 'Du har stemt' : 'Klik for at stemme';
      var knap = document.createElement('button');
      knap.type = 'button';
      knap.className = 'hd-knap';
      knap.textContent = har ? 'Stemt' : 'Stem';
      knap.setAttribute('aria-pressed', har ? 'true' : 'false');
      knap.style.cssText = har
        ? 'padding: 11px 18px; min-height: 44px; border-radius: 8px; border: 2px solid #4ADE80; background: #12261A; color: #86EFAC; font-family: ' + PIXEL + '; font-weight: 700; font-size: 15px; cursor: pointer'
        : 'padding: 11px 18px; min-height: 44px; border-radius: 8px; border: 0; background: #4ADE80; color: #052E16; font-family: ' + PIXEL + '; font-weight: 700; font-size: 15px; box-shadow: inset 0 -4px 0 #16A34A; cursor: pointer';
      knap.addEventListener('click', function () {
        stemt[i.id] = !stemt[i.id];
        try { localStorage.setItem('hopdop-stemmer', JSON.stringify(stemt)); } catch (e) {}
        tegnIdeer();
      });
      bund.appendChild(info);
      bund.appendChild(knap);
      kort.appendChild(bund);
      liste.appendChild(kort);
    });
  }

  // ---------- FAQ ----------
  var faq = [
    { q: 'Hvordan joiner jeg?', a: 'Åbn Minecraft 1.8.9 (fx med Lunar Client), tilføj serveren hopdop.superawesome.dk og tryk join.' },
    { q: 'Er serveren pay-to-win?', a: 'Nej. Butikken giver kosmetik, ranks og keys, men alle kits og systemer kan låses op ved at spille.' },
    { q: 'Hvordan søger jeg staff?', a: 'Tryk på Ansøg i menuen øverst. Vi svarer på Discord, når ansøgningen er læst.' },
    { q: 'Jeg er blevet bannet - hvad nu?', a: 'Find dit ban på banlisten og send en unban-ansøgning. Har du forladt en screenshare, skal du skrive til staff på Discord.' },
    { q: 'Hvordan virker kits?', a: 'Du vælger et kit ved spawn. Hvert kit har sin egen rustning, sit våben og sin evne - se dem under Kits.' }
  ];
  var faqListe = document.getElementById('faq-liste');
  var aabenFaq = 0;
  function tegnFaq() {
    if (!faqListe) return;
    faqListe.innerHTML = '';
    faq.forEach(function (f, i) {
      var boks = document.createElement('div');
      boks.style.cssText = 'background: #0F1813; border: 2px solid #1F3127; border-radius: 10px; overflow: hidden';
      var knap = document.createElement('button');
      knap.type = 'button';
      knap.style.cssText = 'width: 100%; min-height: 56px; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 20px; background: transparent; border: 0; color: #F0FDF4; font-family: Inter, sans-serif; font-weight: 600; font-size: 16px; text-align: left; cursor: pointer';
      knap.appendChild(tekstEl('span', 'faq.' + i + '.q', f.q));
      var tegn = document.createElement('span');
      tegn.setAttribute('aria-hidden', 'true');
      tegn.style.cssText = 'font-family: ' + PIXEL + '; color: #4ADE80; font-size: 22px';
      knap.appendChild(tegn);
      var svar = tekstEl('p', 'faq.' + i + '.a', f.a, 'margin: 0; padding: 0 20px 18px; color: #C9DCD0; line-height: 1.65');
      svar.id = 'faq-svar-' + i;
      knap.setAttribute('aria-controls', svar.id);
      var saet = function (aaben) {
        knap.setAttribute('aria-expanded', aaben ? 'true' : 'false');
        tegn.textContent = aaben ? '-' : '+';
        svar.hidden = !aaben;
      };
      saet(i === aabenFaq);
      knap.addEventListener('click', function (e) {
        if (document.documentElement.hasAttribute('data-redigerer') && e.target !== knap && e.target !== tegn) return;
        aabenFaq = svar.hidden ? i : -1;
        saet(!svar.hidden ? false : true);
      });
      boks.appendChild(knap);
      boks.appendChild(svar);
      faqListe.appendChild(boks);
    });
  }

  // Tegn alt der kommer fra JavaScript (kaldes igen når tekster er hentet)
  HD.tegnDynamisk = function () { tegnKits(); tegnIdeer(); tegnFaq(); };
  HD.tegnDynamisk();

  // ---------- Spillersøgning (eksempel) ----------
  var visProfil = document.getElementById('vis-profil');
  var profil = document.getElementById('profil');
  var input = document.getElementById('spiller');
  function soeg() {
    profil.style.display = 'flex';
    var navn = (input && input.value.trim()) || 'Krainer2';
    var navnFelt = profil.querySelector('span[style*="Pixelify"]');
    if (navnFelt) navnFelt.textContent = navn;
  }
  if (visProfil && profil) {
    visProfil.addEventListener('click', soeg);
    if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') soeg(); });
  }

  // ---------- Top kills fra serveren ----------
  var topKills = document.getElementById('top-kills');
  if (topKills) {
    fetch('/api/stats').then(function (r) { return r.json(); }).then(function (d) {
      var top = (d.spillere || []).filter(function (s) { return s.k > 0; }).sort(function (a, b) { return b.k - a.k; }).slice(0, 5);
      if (!top.length) { topKills.innerHTML = '<li style="color: #A9BFB1">Ingen kills endnu - bliv den første!</li>'; return; }
      var farver = [['#FACC15', '#422006'], ['#D1D5DB', '#1F2937'], ['#FDBA74', '#431407'], ['#12261A', '#86EFAC'], ['#12261A', '#86EFAC']];
      topKills.innerHTML = '';
      top.forEach(function (s, i) {
        var li = document.createElement('li');
        li.innerHTML = '<a style="display: flex; align-items: center; gap: 12px; color: inherit; text-decoration: none">' +
          '<span style="width: 30px; height: 30px; border-radius: 4px; background: ' + farver[i][0] + '; color: ' + farver[i][1] + '; font-weight: 700; display: flex; align-items: center; justify-content: center">' + (i + 1) + '</span>' +
          '<img alt="" loading="lazy" style="width: 30px; height: 30px; border-radius: 4px; image-rendering: pixelated; background: #24402F"><span style="font-weight: 600"></span><span style="margin-left: auto; color: #A9BFB1"></span></a>';
        li.querySelector('a').href = 'spiller.html?navn=' + encodeURIComponent(s.n);
        li.querySelector('img').src = 'https://mc-heads.net/avatar/' + s.u + '/30';
        li.querySelector('span[style*="font-weight: 600"]').textContent = s.n;
        li.querySelector('span[style*="margin-left"]').textContent = s.k + ' kills';
        topKills.appendChild(li);
      });
    }).catch(function () { topKills.innerHTML = '<li style="color: #A9BFB1">Kunne ikke hente top kills.</li>'; });
  }

  // ---------- Scroll-animation til browsere uden scroll-timeline (fx Safari/iPhone) ----------
  var harSDA = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  if (!harSDA && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('no-sda');
    var obs = new IntersectionObserver(function (poster) {
      poster.forEach(function (p) {
        if (p.isIntersecting) { p.target.classList.add('synlig'); obs.unobserve(p.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.hd-ind-v, .hd-ind-h, .hd-ind-op').forEach(function (el) { obs.observe(el); });
  }
})();
