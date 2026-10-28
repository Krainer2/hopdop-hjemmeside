// HOPDOP - lager i Cloudflare D1 (en simpel nøgle/værdi-tabel). Lavet af Krainer2
import { binding } from './miljoe.mjs';

let klar = null;
function db() {
  const d = binding('DB');
  if (!d) throw new Error('Databasen mangler: tilføj en D1-binding med navnet DB i Cloudflare');
  return d;
}
// Opretter tabellen første gang - ingen manuel opsætning nødvendig
async function sikr() {
  if (!klar) klar = db().prepare('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL, opdateret INTEGER)').run().catch((e) => { klar = null; throw e; });
  return klar;
}

export async function hent(noegle) {
  await sikr();
  const r = await db().prepare('SELECT v FROM kv WHERE k = ?').bind(noegle).first();
  if (!r) return null;
  try { return JSON.parse(r.v); } catch { return null; }
}
export async function gem(noegle, vaerdi) {
  await sikr();
  await db().prepare('INSERT INTO kv (k, v, opdateret) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, opdateret = excluded.opdateret')
    .bind(noegle, JSON.stringify(vaerdi), Date.now()).run();
}
export async function slet(noegle) {
  await sikr();
  await db().prepare('DELETE FROM kv WHERE k = ?').bind(noegle).run();
}

// Fælles log over hvad staff har gjort på hjemmesiden
export async function logHandling(navn, handling, detaljer = '') {
  const log = (await hent('log')) || [];
  log.unshift({ tid: Date.now(), navn, handling, detaljer: String(detaljer).slice(0, 300) });
  await gem('log', log.slice(0, 300));
}

export function ipHash(req) {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ukendt';
  let h = 0;
  for (const c of ip + 'hopdop') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h.toString(36);
}
