// HOPDOP - login og roller. Lavet af Krainer2
import crypto from 'node:crypto';
import { hent } from './data.mjs';

const TIMER_12 = 12 * 60 * 60 * 1000;

// Adgangsniveau i admin-panelet
export const NIVEAU = { mod: 1, admin: 2, ejer: 3 };
// Staff-roller på hjemmesiden -> adgang til panelet (Helper og Bygger har ingen adgang)
const STAFF_TIL_PANEL = { ejer: 'ejer', admin: 'admin', mod: 'mod' };

function hemmelighed() {
  const h = process.env.TOKEN_HEMMELIGHED;
  if (!h || h.length < 16) throw new Error('TOKEN_HEMMELIGHED mangler eller er for kort (mindst 16 tegn)');
  return h;
}

// ADMIN_BRUGERE = {"Krainer2":{"kode":"...","rolle":"ejer"}}  (login med kode - valgfrit)
export function kodeBrugere() {
  try { return JSON.parse(process.env.ADMIN_BRUGERE || '{}'); } catch { return {}; }
}

// EJERE = "krainer2,andetnavn"  (Minecraft-navne der altid er ejere ved SuperAwesome-login)
function ejere() {
  return String(process.env.EJERE || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

function ens(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}
export function ensNoegle(a, b) { return !!a && !!b && ens(a, b); }

function signer(data) {
  return crypto.createHmac('sha256', hemmelighed()).update(data).digest('base64url');
}

export function lavToken(navn, rolle, kilde, uuid) {
  const udloeb = Date.now() + TIMER_12;
  const data = Buffer.from(JSON.stringify({ navn, rolle, kilde, uuid: uuid || null, udloeb })).toString('base64url');
  return { token: data + '.' + signer(data), navn, rolle, kilde, uuid: uuid || null, udloeb };
}

export function tjekKode(navn, kode) {
  const alle = kodeBrugere();
  const noegle = Object.keys(alle).find((n) => n.toLowerCase() === String(navn || '').toLowerCase());
  if (!noegle || !kode || !alle[noegle].kode) return null;
  return ens(alle[noegle].kode, kode) ? { navn: noegle, rolle: alle[noegle].rolle || 'mod' } : null;
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

// Returnerer den indloggede bruger (med rolle tjekket igen) eller null
export async function hvemErDet(req) {
  const h = req.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  let rigtig;
  try { rigtig = signer(data); } catch { return null; }
  if (sig.length !== rigtig.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(rigtig))) return null;
  let p;
  try { p = JSON.parse(Buffer.from(data, 'base64url').toString()); } catch { return null; }
  if (!p || p.udloeb < Date.now()) return null;
  // Rollen tjekkes igen, så fjernet adgang virker med det samme
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

export function harNiveau(bruger, rolle) {
  return !!bruger && (NIVEAU[bruger.rolle] || 0) >= (NIVEAU[rolle] || 99);
}

export function json(data, status = 200, ekstra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...ekstra }
  });
}
