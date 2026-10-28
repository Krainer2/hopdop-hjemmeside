// HOPDOP - lager (Netlify Blobs). Lavet af Krainer2
import { getStore } from '@netlify/blobs';

let lager;
function store() {
  if (!lager) lager = getStore({ name: 'hopdop', consistency: 'strong' });
  return lager;
}

export async function hent(noegle) {
  return (await store().get(noegle, { type: 'json' })) ?? null;
}
export async function gem(noegle, vaerdi) {
  await store().setJSON(noegle, vaerdi);
}
export async function slet(noegle) {
  await store().delete(noegle);
}

// Fælles log over hvad staff har gjort på hjemmesiden
export async function logHandling(navn, handling, detaljer = '') {
  const log = (await hent('log')) || [];
  log.unshift({ tid: Date.now(), navn, handling, detaljer: String(detaljer).slice(0, 300) });
  await gem('log', log.slice(0, 300));
}

export function ipHash(req) {
  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'ukendt';
  let h = 0;
  for (const c of ip + 'hopdop') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h.toString(36);
}
