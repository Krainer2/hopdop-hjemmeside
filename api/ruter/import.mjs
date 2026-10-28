// POST /api/import  (kun Ejer) - henter data fra den gamle side (fx hopdop.netlify.app)
// Kopierer: staff-listen, redigerede tekster, banneret og straf-historikken.
import { hent, gem, logHandling } from '../lib/data.mjs';
import { hvemErDet, json } from '../lib/auth.mjs';
import { postId } from '../lib/straffe.mjs';

async function hentJson(url) {
  const r = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(url + ' svarede ' + r.status);
  return r.json();
}

export default async (req) => {
  if (req.method !== 'POST') return json({ fejl: 'Kun POST' }, 405);
  const bruger = await hvemErDet(req);
  if (!bruger || bruger.rolle !== 'ejer') return json({ fejl: 'Kun Ejeren kan hente data fra den gamle side' }, 403);

  let b = {};
  try { b = await req.json(); } catch {}
  let fra = String(b.fra || 'https://hopdop.netlify.app').trim().replace(/\/+$/, '');
  if (!/^https:\/\/[a-z0-9.-]+$/i.test(fra)) return json({ fejl: 'Ugyldig adresse - skriv fx https://hopdop.netlify.app' }, 400);
  if (fra === new URL(req.url).origin) return json({ fejl: 'Det er den samme side som denne' }, 400);

  const resultat = {};
  const fejl = [];

  try {
    const { staff } = await hentJson(fra + '/api/staff');
    const nu = (await hent('staff')) || [];
    const navne = new Set(nu.map((s) => s.navn.toLowerCase()));
    const flet = nu.concat((staff || []).filter((s) => s && s.navn && !navne.has(String(s.navn).toLowerCase())));
    await gem('staff', flet);
    resultat.staff = flet.length;
  } catch (e) { fejl.push('Staff: ' + e.message); }

  try {
    const { tekster } = await hentJson(fra + '/api/tekster');
    const nu = (await hent('tekster')) || {};
    await gem('tekster', { ...(tekster || {}), ...nu });
    resultat.tekster = Object.keys(tekster || {}).length;
  } catch (e) { fejl.push('Tekster: ' + e.message); }

  try {
    const { banner } = await hentJson(fra + '/api/banner');
    const nu = await hent('banner');
    if (banner && banner.tekst && !(nu && nu.tekst)) { await gem('banner', banner); resultat.banner = true; }
    else resultat.banner = false;
  } catch (e) { fejl.push('Banner: ' + e.message); }

  try {
    const { poster } = await hentJson(fra + '/api/straffe');
    const gammel = (await hent('straffe')) || { poster: {} };
    const alle = gammel.poster || {};
    let nye = 0;
    for (const p of poster || []) {
      if (!p || !p.id || !p.u || String(p.id).startsWith('aktiv-')) continue;
      const { aktiv, til, ...ren } = p;
      ren.id = postId(ren); // nyt id-format, så serveren ikke laver dubletter
      if (alle[ren.id]) continue;
      alle[ren.id] = ren;
      nye++;
    }
    let liste = Object.values(alle).sort((a, c) => c.tid - a.tid).slice(0, 3000);
    await gem('straffe', { poster: Object.fromEntries(liste.map((p) => [p.id, p])) });
    resultat.straffe = nye;
  } catch (e) { fejl.push('Straffe: ' + e.message); }

  await logHandling(bruger.navn, 'import', 'Hentede data fra ' + fra);
  return json({ ok: fejl.length === 0, resultat, fejl });
};

export const config = { path: '/api/import' };
