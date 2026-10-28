// HOPDOP - login og roller. Lavet af Krainer2
import { hent } from './data.mjs';
import { env, hmac, ens, b64urlTekst, fraB64urlTekst } from './miljoe.mjs';

const TIMER_12 = 12 * 60 * 60 * 1000;

// Adgangsniveau i admin-panelet
export const NIVEAU = { mod: 1, admin: 2, ejer: 3 };
// Staff-roller på hjemmesiden -> adgang til panelet (Helper og Bygger har ingen adgang)
const STAFF_TIL_PANEL = { ejer: 'ejer', admin: 'admin', mod: 'mod' };

function hemmelighed() {
  const h = env('TOKEN_HEMMELIGHED');
  if (h.length < 16) throw new Error('TOKEN_HEMMELIGHED mangler eller er for kort (mindst 16 tegn)');
  return h;
}

// ADMIN_BRUGERE = {"Krainer2":{"kode":"...","rolle":"ejer"}}  (login med kode - valgfrit)
export function kodeBrugere() {
  try { return JSON.parse(env('ADMIN_BRUGERE') || '{}'); } catch { return {}; }
}

// EJERE = "krainer2,andetnavn"  (Minecraft-navne der altid er ejere ved SuperAwesome-login)
function ejere() {
  return env('EJERE').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export async function ensNoegle(a, b) { return !!a && !!b && ens(a, b); }

export async function lavToken(navn, rolle, kilde, uuid) {
  // Spillere forbliver logget ind i 30 dage, staff i 12 timer
  const udloeb = Date.now() + (rolle === 'spiller' ? 30 * 24 * 60 * 60 * 1000 : TIMER_12);
  const data = b64urlTekst(JSON.stringify({ navn, rolle, kilde, uuid: uuid || null, udloeb }));
  return { token: data + '.' + (await hmac(hemmelighed(), data)), navn, rolle, kilde, uuid: uuid || null, udloeb };
}

export async function tjekKode(navn, kode) {
  const alle = kodeBrugere();
  const noegle = Object.keys(alle).find((n) => n.toLowerCase() === String(navn || '').toLowerCase());
  if (!noegle || !kode || !alle[noegle].kode) return null;
  return (await ens(alle[noegle].kode, kode)) ? { navn: noegle, rolle: alle[noegle].rolle || 'mod' } : null;
}

// Hvilken panel-rolle har et Minecraft-navn ved SuperAwesome-login?
export async function rolleFor(navn) {
  const lav = String(navn || '').toLowerCase();
  if (!lav) return null;
  if (ejere().includes(lav)) return 'ejer';
  const staff = (await hent('staff')) || [];
  const s = staff.find((x) => String(x.navn).toLowerCase() === lav);
  if (!s) return null;
  return STAFF_TIL_PANEL[String(s.rolle).toLowerCase()] || null;
}

// Tjekker at tokenet er ægte og ikke udløbet
async function laesToken(req) {
  const h = req.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  let rigtig;
  try { rigtig = await hmac(hemmelighed(), data); } catch { return null; }
  if (!(await ens(sig, rigtig))) return null;
  let p;
  try { p = JSON.parse(fraB64urlTekst(data)); } catch { return null; }
  if (!p || p.udloeb < Date.now()) return null;
  return p;
}

// Staff med adgang til panelet (rollen tjekkes igen, så fjernet adgang virker med det samme)
export async function hvemErDet(req) {
  const p = await laesToken(req);
  if (!p) return null;
  if (p.kilde === 'sa') {
    const r = await rolleFor(p.navn);
    if (!r) return null;
    p.rolle = r;
  } else {
    const b = kodeBrugere()[p.navn];
    if (!b) return null;
    p.rolle = b.rolle || 'mod';
  }
  return p;
}

// Alle der er logget ind - spillere og staff
export async function hvemErLoggetInd(req) {
  const p = await laesToken(req);
  if (!p) return null;
  const staff = await hvemErDet(req);
  if (staff) return staff;
  return p.kilde === 'sa' ? { ...p, rolle: 'spiller' } : null;
}

export function harNiveau(bruger, rolle) {
  return !!bruger && (NIVEAU[bruger.rolle] || 0) >= (NIVEAU[rolle] || 99);
}

export function json(data, status = 200, ekstra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...ekstra }
  });
}
