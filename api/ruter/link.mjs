// /api/link - Discord-link og ranks. Lavet af Krainer2
//  POST (Minecraft-serveren, WEB_NOEGLE)  {type:"kode", kode, u, n, r:[ranks]}  -> spilleren skrev /discord <kode> ingame
//  POST (Minecraft-serveren, WEB_NOEGLE)  {type:"ranks", liste:[{u, n, r:[ranks]}]} -> ranks for forbundne spillere online
//  GET  (Discord-botten, BOT_NOEGLE)      -> {koder, ranks}
import { hent, gem } from '../lib/data.mjs';
import { ensNoegle, hvemErDet, json } from '../lib/auth.mjs';
import { env } from '../lib/miljoe.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAVN = /^[A-Za-z0-9_]{1,16}$/;
const KODE = /^[A-Z0-9]{6}$/;
const RANK = /^[a-zæøå0-9_-]{1,24}$/;
const KODE_LEVETID = 30 * 60 * 1000;

const ranksAf = (r) => (Array.isArray(r) ? r : []).map((x) => String(x).toLowerCase().trim()).filter((x) => RANK.test(x)).slice(0, 20);

export default async (req) => {
  if (req.method === 'GET') {
    const bruger = await hvemErDet(req);
    if (!bruger || bruger.kilde !== 'bot') return json({ fejl: 'Kun for Discord-botten' }, 401);
    const d = (await hent('discord-link')) || { koder: {}, ranks: {} };
    return json(d, 200, { 'Cache-Control': 'no-store' });
  }
  if (req.method !== 'POST') return json({ fejl: 'Metode ikke tilladt' }, 405);

  const noegle = env('WEB_NOEGLE');
  const sendt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (noegle.length < 16 || !(await ensNoegle(sendt, noegle))) return json({ fejl: 'Forkert nøgle' }, 401);

  let b = {};
  try { b = JSON.parse(await req.text()); } catch { return json({ fejl: 'Ugyldig JSON' }, 400); }
  const d = (await hent('discord-link')) || { koder: {}, ranks: {} };
  const nu = Date.now();
  for (const [k, v] of Object.entries(d.koder)) if (nu - v.t > KODE_LEVETID) delete d.koder[k];

  if (b.type === 'kode') {
    const kode = String(b.kode || '').toUpperCase().trim();
    if (!KODE.test(kode) || !UUID.test(b.u) || !NAVN.test(b.n)) return json({ fejl: 'Ugyldig kode eller spiller' }, 400);
    d.koder[kode] = { u: b.u.toLowerCase(), n: b.n, t: nu };
    d.ranks[b.u.toLowerCase()] = { n: b.n, r: ranksAf(b.r), t: nu };
  } else if (b.type === 'ranks') {
    for (const x of (Array.isArray(b.liste) ? b.liste : []).slice(0, 500)) {
      if (!x || !UUID.test(x.u) || !NAVN.test(x.n)) continue;
      d.ranks[x.u.toLowerCase()] = { n: x.n, r: ranksAf(x.r), t: nu };
    }
  } else return json({ fejl: 'Ukendt type' }, 400);

  await gem('discord-link', d);
  return json({ ok: true });
};

export const config = { path: '/api/link' };
