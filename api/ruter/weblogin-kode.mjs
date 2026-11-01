// POST /api/weblogin/kode  (kun serveren, Bearer WEB_NOEGLE)
// Serveren sender koden, som spilleren fik med /weblogin i Minecraft: {kode, uuid, navn}
// Lavet af Krainer2
import { ensNoegle, json } from '../lib/auth.mjs';
import { gem, hent, slet } from '../lib/data.mjs';
import { env } from '../lib/miljoe.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ fejl: 'Kun POST' }, 405);
  const noegle = env('WEB_NOEGLE');
  const sendt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (noegle.length < 16 || !(await ensNoegle(sendt, noegle))) return json({ fejl: 'Forkert nøgle' }, 401);
  let b = {};
  try { b = await req.json(); } catch {}
  const kode = String(b.kode || '').trim();
  const uuid = String(b.uuid || '').trim().toLowerCase();
  const navn = String(b.navn || '').trim();
  if (!/^\d{6}$/.test(kode)) return json({ fejl: 'Ugyldig kode' }, 400);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)) return json({ fejl: 'Ugyldigt uuid' }, 400);
  if (!/^[A-Za-z0-9_]{1,16}$/.test(navn)) return json({ fejl: 'Ugyldigt navn' }, 400);
  // Kun én gyldig kode pr. spiller ad gangen
  const gammel = await hent('wl-sidste-' + uuid);
  if (gammel && gammel !== kode) await slet('wl-kode-' + gammel).catch(() => {});
  await gem('wl-kode-' + kode, { uuid, navn, tid: Date.now() });
  await gem('wl-sidste-' + uuid, kode);
  return json({ ok: true });
};

export const config = { path: '/api/weblogin/kode' };
