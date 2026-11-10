// /api/samtale - Ticket-udskrifter som link (som en hjemmeside). Lavet af Krainer2
//  POST (Discord-botten, "Bot <BOT_NOEGLE>") {ticket, type, aabnetAf, lukketAf, aabnet, lukket, beskeder:[...]} -> {id}
//  GET  ?id=<id> (alle med linket)  -> udskriften. Linket er et tilfældigt id, så kun dem der får linket kan se den.
import { hent, gem } from '../lib/data.mjs';
import { ensNoegle, json } from '../lib/auth.mjs';
import { env } from '../lib/miljoe.mjs';

const ID = /^[a-z0-9]{20,40}$/;
const t = (v, max) => String(v ?? '').slice(0, max);

function nytId() {
  const b = new Uint8Array(16); crypto.getRandomValues(b);
  return [...b].map((x) => (x % 36).toString(36)).join('') + Date.now().toString(36);
}

export default async (req) => {
  if (req.method === 'GET') {
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!ID.test(id)) return json({ fejl: 'Ugyldigt link' }, 400);
    const d = await hent('samtale:' + id);
    if (!d) return json({ fejl: 'Samtalen findes ikke' }, 404);
    return json(d, 200, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
  }
  if (req.method !== 'POST') return json({ fejl: 'Metode ikke tilladt' }, 405);
  const a = req.headers.get('authorization') || '';
  const bn = env('BOT_NOEGLE');
  if (!a.startsWith('Bot ') || bn.length < 32 || !(await ensNoegle(a.slice(4), bn))) return json({ fejl: 'Forkert nøgle' }, 401);
  let b = {}; try { b = JSON.parse(await req.text()); } catch { return json({ fejl: 'Ugyldig JSON' }, 400); }
  if (!Array.isArray(b.beskeder)) return json({ fejl: 'Mangler beskeder' }, 400);
  const beskeder = b.beskeder.slice(0, 3000).map((m) => ({
    f: t(m.f, 300), a: t(m.a, 300), bot: !!m.bot, t: Number(m.t) || 0, x: t(m.x, 4000),
    e: (Array.isArray(m.e) ? m.e : []).slice(0, 5).map((e) => ({ t: t(e.t, 256), x: t(e.x, 2000) })),
    v: (Array.isArray(m.v) ? m.v : []).slice(0, 10).map((v) => ({ n: t(v.n, 100), u: t(v.u, 500) })),
  }));
  const id = nytId();
  await gem('samtale:' + id, {
    ticket: t(b.ticket, 80), type: t(b.type, 40), aabnetAf: t(b.aabnetAf, 40), lukketAf: t(b.lukketAf, 40),
    aabnet: Number(b.aabnet) || 0, lukket: Number(b.lukket) || Date.now(), beskeder,
  });
  return json({ ok: true, id });
};

export const config = { path: '/api/samtale' };
