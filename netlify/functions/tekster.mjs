// GET  /api/tekster  -> redigerede tekster (offentlig)
// POST /api/tekster  {aendringer:{noegle: tekst}} -> kræver login. Tom tekst = standard igen.
import { hent, gem, logHandling } from '../lib/data.mjs';
import { hvemErDet, json } from '../lib/auth.mjs';

const NOEGLE = /^[a-z0-9._-]{1,80}$/;

export default async (req) => {
  const tekster = (await hent('tekster')) || {};
  if (req.method === 'GET') return json({ tekster });
  if (req.method !== 'POST') return json({ fejl: 'Metode ikke tilladt' }, 405);

  const bruger = await hvemErDet(req);
  if (!bruger) return json({ fejl: 'Ikke logget ind' }, 401);

  let body = {};
  try { body = await req.json(); } catch {}
  const aendringer = body && typeof body.aendringer === 'object' ? body.aendringer : {};
  const gyldige = Object.entries(aendringer).filter(([k, v]) => NOEGLE.test(k) && typeof v === 'string').slice(0, 200);
  if (!gyldige.length) return json({ fejl: 'Ingen gyldige ændringer' }, 400);

  for (const [k, v] of gyldige) {
    const r = v.replace(/\s+/g, ' ').trim().slice(0, 2000);
    if (r) tekster[k] = r; else delete tekster[k];
  }
  await gem('tekster', tekster);
  await logHandling(bruger.navn, 'tekster', `Ændrede ${gyldige.length} ${gyldige.length === 1 ? 'tekst' : 'tekster'}`);
  return json({ tekster });
};

export const config = { path: '/api/tekster' };
