// HOPDOP - henter redigerede tekster og lader indloggede admins ændre dem. Lavet af Krainer2
(function () {
  var HD = window.HOPDOP = window.HOPDOP || { tekster: {} };
  var API = '/api/tekster';
  var root = document.documentElement;

  // Husk standardteksten fra HTML'en, før noget bliver overskrevet
  document.querySelectorAll('[data-tekst]').forEach(function (el) {
    if (!el.dataset.standard) el.dataset.standard = el.textContent;
  });

  function anvend() {
    document.querySelectorAll('[data-tekst]').forEach(function (el) {
      if (el.isContentEditable || el.classList.contains('aendret')) return;
      var v = HD.tekster[el.dataset.tekst];
      el.textContent = (typeof v === 'string' && v.length) ? v : el.dataset.standard;
    });
  }

  function hentLogin() {
    try {
      var l = JSON.parse(localStorage.getItem('hopdop-login'));
      if (l && l.token && l.udloeb > Date.now()) return l;
    } catch (e) {}
    return null;
  }

  var login = hentLogin();
  var aendringer = {};
  var redigerer = false;

  fetch(API, { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : { tekster: {} }; })
    .then(function (j) {
      HD.tekster = (j && j.tekster) || {};
      if (HD.tegnDynamisk) HD.tegnDynamisk();
      anvend();
      if (redigerer) goerRedigerbar();
    })
    .catch(function () {});

  if (!login || login.rolle === 'spiller') return;

  // ---------- Værktøjslinje ----------
  var stil = document.createElement('style');
  stil.textContent =
    '#hd-rbar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:50;display:flex;flex-wrap:wrap;gap:8px;align-items:center;' +
    'background:#0B120E;border:2px solid #FACC15;border-radius:12px;padding:10px 12px;box-shadow:0 18px 40px rgba(0,0,0,.6);font-family:Inter,sans-serif;color:#F0FDF4;max-width:calc(100% - 32px);box-sizing:border-box}' +
    '#hd-rbar[hidden],#hd-rknap[hidden]{display:none !important}' +
    '#hd-rbar button{min-height:44px;padding:10px 14px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;border:2px solid #24402F;background:#0F1813;color:#DCFCE7}' +
    '#hd-rbar button.gem{background:#4ADE80;border-color:#4ADE80;color:#052E16}' +
    '#hd-rbar .info{font-size:14px;padding:0 6px}' +
    '#hd-rknap{position:fixed;left:16px;bottom:16px;z-index:50;min-height:48px;padding:12px 18px;border-radius:10px;border:2px solid #FACC15;background:#0B120E;color:#FACC15;font-weight:700;font-family:Inter,sans-serif;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.5)}' +
    '#hd-popup{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '#hd-popup form{background:#0F1813;border:2px solid #24402F;border-radius:12px;padding:20px;width:100%;max-width:480px;display:flex;flex-direction:column;gap:10px;font-family:Inter,sans-serif;color:#F0FDF4}' +
    '#hd-popup textarea{min-height:90px;padding:10px;border-radius:8px;border:2px solid #24402F;background:#070B09;color:#F0FDF4;font:inherit;resize:vertical}' +
    '#hd-popup .knapper{display:flex;gap:8px;justify-content:flex-end}' +
    '#hd-popup button{min-height:44px;padding:10px 14px;border-radius:8px;font-weight:700;cursor:pointer;border:2px solid #24402F;background:#0F1813;color:#DCFCE7}' +
    '#hd-popup button.gem{background:#4ADE80;border-color:#4ADE80;color:#052E16}';
  document.head.appendChild(stil);

  var startKnap = document.createElement('button');
  startKnap.id = 'hd-rknap';
  startKnap.type = 'button';
  startKnap.textContent = 'Rediger tekster';
  startKnap.addEventListener('click', start);
  document.body.appendChild(startKnap);

  var bar = document.createElement('div');
  bar.id = 'hd-rbar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Redigering');
  bar.innerHTML =
    '<span class="info"><b>Redigerer</b> - klik på en gul tekst. <span id="hd-rantal">0 ændringer</span></span>' +
    '<button type="button" class="gem" id="hd-rgem">Gem</button>' +
    '<button type="button" id="hd-rnul">Nulstil valgt tekst</button>' +
    '<button type="button" id="hd-rslut">Afslut</button>';
  bar.hidden = true;
  document.body.appendChild(bar);
  var antalEl = bar.querySelector('#hd-rantal');
  var sidstValgt = null;

  function opdaterAntal(tekst) {
    var n = Object.keys(aendringer).length;
    antalEl.textContent = tekst || (n === 1 ? '1 ændring' : n + ' ændringer');
  }
  function marker(el, vaerdi) {
    var noegle = el.dataset.tekst;
    aendringer[noegle] = vaerdi;
    document.querySelectorAll('[data-tekst="' + noegle + '"]').forEach(function (andet) {
      andet.classList.add('aendret');
      if (andet !== el) andet.textContent = vaerdi || andet.dataset.standard;
    });
    HD.tekster[noegle] = vaerdi;
    opdaterAntal();
  }
  function iKnapEllerLink(el) { return !!el.closest('a, button'); }

  function goerRedigerbar() {
    document.querySelectorAll('[data-tekst]').forEach(function (el) {
      if (iKnapEllerLink(el) || el.isContentEditable) return;
      el.contentEditable = 'plaintext-only';
      if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
      el.spellcheck = true;
    });
  }
  function start() {
    redigerer = true;
    root.setAttribute('data-redigerer', '');
    startKnap.hidden = true;
    bar.hidden = false;
    goerRedigerbar();
  }
  function stop() {
    var rens = function () {
      if (/[?&]rediger=1/.test(location.search)) {
        history.replaceState(null, '', location.pathname + location.search.replace(/[?&]rediger=1/, '').replace(/^&/, '?') + location.hash);
      }
    };
    if (Object.keys(aendringer).length) {
      if (!window.confirm('Du har ændringer, der ikke er gemt. Vil du afslutte alligevel?')) return;
      rens();
      location.reload();
      return;
    }
    // Slå redigering fra uden at genindlæse siden
    redigerer = false;
    root.removeAttribute('data-redigerer');
    document.querySelectorAll('[contenteditable]').forEach(function (el) { el.removeAttribute('contenteditable'); });
    document.querySelectorAll('.aendret').forEach(function (el) { el.classList.remove('aendret'); });
    aendringer = {};
    opdaterAntal();
    anvend();
    bar.hidden = true;
    startKnap.hidden = false;
    rens();
  }

  // Skriv direkte i teksten
  document.addEventListener('input', function (e) {
    if (!redigerer) return;
    var el = e.target.closest && e.target.closest('[data-tekst]');
    if (el) marker(el, el.innerText.replace(/\s+/g, ' ').trim());
  });
  document.addEventListener('keydown', function (e) {
    if (redigerer && e.key === 'Enter' && e.target.isContentEditable) { e.preventDefault(); e.target.blur(); }
  });
  document.addEventListener('paste', function (e) {
    if (!redigerer || !e.target.isContentEditable || e.target.contentEditable === 'plaintext-only') return;
    e.preventDefault();
    var tekst = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, tekst);
  });
  document.addEventListener('focusin', function (e) {
    if (redigerer && e.target.closest && e.target.closest('[data-tekst]')) sidstValgt = e.target.closest('[data-tekst]');
  });

  // Tekster inde i knapper/links redigeres i et lille vindue, og links åbnes ikke mens man redigerer
  document.addEventListener('click', function (e) {
    if (!redigerer || bar.contains(e.target)) return;
    var el = e.target.closest('[data-tekst]');
    if (el && iKnapEllerLink(el)) {
      e.preventDefault();
      e.stopPropagation();
      popup(el);
      return;
    }
    if (e.target.closest('a[href]')) e.preventDefault();
    setTimeout(goerRedigerbar, 0);
  }, true);

  function popup(el) {
    sidstValgt = el;
    var lag = document.createElement('div');
    lag.id = 'hd-popup';
    lag.innerHTML = '<form><label for="hd-ptekst" style="font-weight:700">Ret tekst</label><textarea id="hd-ptekst"></textarea>' +
      '<div class="knapper"><button type="button" class="annuller">Annuller</button><button type="submit" class="gem">OK</button></div></form>';
    var felt = lag.querySelector('textarea');
    felt.value = el.textContent;
    lag.querySelector('.annuller').addEventListener('click', function () { lag.remove(); });
    lag.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = felt.value.replace(/\s+/g, ' ').trim();
      el.textContent = v || el.dataset.standard;
      marker(el, v);
      lag.remove();
    });
    document.body.appendChild(lag);
    felt.focus();
  }

  bar.querySelector('#hd-rnul').addEventListener('click', function () {
    if (!sidstValgt) { opdaterAntal('Klik først på en tekst'); return; }
    sidstValgt.textContent = sidstValgt.dataset.standard;
    marker(sidstValgt, '');
  });
  bar.querySelector('#hd-rslut').addEventListener('click', stop);
  bar.querySelector('#hd-rgem').addEventListener('click', function () {
    if (!Object.keys(aendringer).length) { opdaterAntal('Ingen ændringer endnu'); return; }
    opdaterAntal('Gemmer...');
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + login.token },
      body: JSON.stringify({ aendringer: aendringer })
    })
      .then(function (r) {
        if (r.status === 401) throw new Error('login');
        if (!r.ok) throw new Error('fejl');
        return r.json();
      })
      .then(function (j) {
        HD.tekster = j.tekster || HD.tekster;
        aendringer = {};
        document.querySelectorAll('.aendret').forEach(function (el) { el.classList.remove('aendret'); });
        opdaterAntal('Gemt! Alle kan se det nu.');
      })
      .catch(function (err) {
        opdaterAntal(err.message === 'login' ? 'Dit login er udløbet - log ind igen på admin-siden' : 'Kunne ikke gemme. Prøv igen.');
      });
  });

  if (/[?&]rediger=1/.test(location.search)) start();
})();
