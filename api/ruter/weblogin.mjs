// POST /api/weblogin {kode} - log ind med koden fra /weblogin i Minecraft
// Højst WEBLOGIN_MAKS (standard 3) forskellige konti pr. internetforbindelse inden for 30 dage.
// IP'en gemmes aldrig - kun et hash af den. Staff tæller ikke med.
// Lavet af Krainer2
import { lavToken, rolleFor, json } from '../lib/auth.mjs';
import { gem, hent, slet, logHandling } from '../lib/data.mjs';
import { env, hmac } from '../lib/miljoe.mjs';

const KODE_MIN = 5;
const DAGE_30 = 30 * 24 * 60 * 60 * 1000;

async function ipNoegle(req) {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ukendt';
  return (await hmac(env('TOKEN_HEMMELIGHED') || 'hopdop', 'ip:' + ip)).slice(0, 24);
}

export default async (req) => {
  if (req.method !== 'POST') return json({ fejl: 'Kun POST' }, 405);
  let b = {};
  try { b = await req.json(); } catch {}
  const kode = String(b.kode || '').replace(/\s+/g, '');
  const ip = await ipNoegle(req);
  const nu = Date.now();

  // Mod gætteri: højst 8 forkerte koder pr. 10 min pr. forbindelse
  const fk = (await hent('wl-forsoeg-' + ip)) || { n: 0, tid: nu };
  if (nu - fk.tid > 10 * 60 * 1000) { fk.n = 0; fk.tid = nu; }
  if (fk.n >= 8) return json({ fejl: 'For mange forkerte koder. Vent 10 minutter og prøv igen.' }, 429);

  const fundet = /^\d{6}$/.test(kode) ? await hent('wl-kode-' + kode) : null;
  if (!fundet || nu - fundet.tid > KODE_MIN * 60 * 1000) {
    fk.n += 1;
    await gem('wl-forsoeg-' + ip, fk);
    if (fundet) await slet('wl-kode-' + kode).catch(() => {});
    return json({ fejl: 'Koden er forkert eller udløbet. Skriv /weblogin i Minecraft for at få en ny.' }, 401);
  }

  const rolle = (await rolleFor(fundet.navn)) || 'spiller';

  // Højst X konti pr. forbindelse (staff er undtaget)
  const maks = Math.max(1, parseInt(env('WEBLOGIN_MAKS') || '3', 10) || 3);
  const reg = (await hent('wl-ip-' + ip)) || { konti: [] };
  reg.konti = reg.konti.filter((k) => nu - k.t < DAGE_30);
  const har = reg.konti.find((k) => k.u === fundet.uuid);
  if (!har && rolle === 'spiller') {
    const andre = reg.konti.filter((k) => k.r === 'spiller');
    if (andre.length >= maks) {
      return json({ fejl: 'Der er allerede logget ind med ' + maks + ' forskellige konti fra din internetforbindelse. Skriv til staff på Discord, hvis det er en fejl.' }, 403);
    }
  }
  if (har) { har.t = nu; har.n = fundet.navn; har.r = rolle; }
  else reg.konti.push({ u: fundet.uuid, n: fundet.navn, r: rolle, t: nu });

  // Koden kan kun bruges én gang
  await slet('wl-kode-' + kode).catch(() => {});
  await slet('wl-sidste-' + fundet.uuid).catch(() => {});
  await gem('wl-ip-' + ip, reg);
  await slet('wl-forsoeg-' + ip).catch(() => {});

  const t = await lavToken(fundet.navn, rolle, 'mc', fundet.uuid);
  if (rolle !== 'spiller') await logHandling(fundet.navn, 'login', 'med /weblogin');
  return json(t, 200, { 'Cache-Control': 'no-store' });
};

export const config = { path: '/api/weblogin' };
