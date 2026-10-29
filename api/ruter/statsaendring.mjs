// /api/statsaendring  (kun Admin og Ejer)
//   GET  -> ventende og seneste rettelser
//   POST {navn, felt: k|d|ds, handling: saet|tilfoej, v}  -> ny rettelse (sendes til serveren ved næste sync)
import { hent, gem, logHandling } from '../lib/data.mjs';
import { hvemErDet, harNiveau, json } from '../lib/auth.mjs';
import { FELTER, hentAendringer, gemAendringer, anvend } from '../lib/aendringer.mjs';

export default async (req) => {
  const bruger = await hvemErDet(req);
  if (!harNiveau(bruger, 'admin')) return json({ fejl: 'Kun Admin og Ejer kan rette stats' }, 403);
  const a = await hentAendringer();
  if (req.method === 'GET') return json({ liste: a.liste, felter: FELTER }, 200, { 'Cache-Control': 'no-store' });
  if (req.method !== 'POST') return json({ fejl: 'Metode ikke tilladt' }, 405);

  let b = {};
  try { b = await req.json(); } catch {}
  const felt = String(b.felt || '');
  const handling = b.handling === 'tilfoej' ? 'tilfoej' : 'saet';
  const v = Math.trunc(Number(b.v));
  if (!FELTER[felt]) return json({ fejl: 'Ukendt felt' }, 400);
  if (!Number.isFinite(v) || Math.abs(v) > 1000000) return json({ fejl: 'Ugyldigt tal' }, 400);
  if (handling === 'saet' && v < 0) return json({ fejl: 'Tallet kan ikke være negativt' }, 400);

  const stats = (await hent('stats')) || { spillere: [] };
  const s = (stats.spillere || []).find((x) => x.n.toLowerCase() === String(b.navn || '').trim().toLowerCase());
  if (!s) return json({ fejl: 'Spilleren findes ikke i stats endnu' }, 404);

  const ae = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), u: s.u, n: s.n, felt, handling, v, foer: Number(s[felt]) || 0, af: bruger.navn, tid: Date.now(), status: 'venter' };
  a.liste.unshift(ae);
  await gemAendringer(a);
  anvend(s, ae);
  await gem('stats', stats);
  await logHandling(bruger.navn, 'stats', `${s.n}: ${FELTER[felt]} ${handling === 'tilfoej' ? (v >= 0 ? '+' : '') + v : '= ' + v}`);
  return json({ ok: true, aendring: ae, spiller: s });
};

export const config = { path: '/api/statsaendring' };
