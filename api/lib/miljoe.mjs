// HOPDOP - miljø (hemmelige koder + database) og kryptografi uden Node.js. Lavet af Krainer2
// Virker på Cloudflare Pages Functions (og i Node 20+ til test).

let MILJOE = {};
export function saetMiljoe(env) { MILJOE = env || {}; }
// Læs en indstilling fra Cloudflare (Settings -> Variables and Secrets)
export function env(navn) {
  const v = MILJOE[navn];
  return typeof v === 'string' ? v : '';
}
export function binding(navn) { return MILJOE[navn]; }

const tekst = new TextEncoder();

export function b64url(bytes) {
  let s = '';
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function b64urlTekst(str) { return b64url(tekst.encode(str)); }
export function fraB64urlTekst(s) {
  const p = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(p);
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(b);
}
export function b64(str) { return btoa(String.fromCharCode(...tekst.encode(str))); }

export function tilfaeldigeBytes(n) { return crypto.getRandomValues(new Uint8Array(n)); }
export function tilfaeldig(n) { return b64url(tilfaeldigeBytes(n)); }
export function uuid() { return crypto.randomUUID(); }

export async function sha256(str) { return new Uint8Array(await crypto.subtle.digest('SHA-256', tekst.encode(str))); }
export async function sha1Hex(str) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-1', tekst.encode(str)));
  return Array.from(d, (x) => x.toString(16).padStart(2, '0')).join('');
}
export async function hmac(noegle, data) {
  const k = await crypto.subtle.importKey('raw', tekst.encode(noegle), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', k, tekst.encode(data)));
}
// Sammenlign to tekster uden at afsløre noget via tiden det tager
export async function ens(a, b) {
  const x = await sha256(String(a)), y = await sha256(String(b));
  let forskel = 0;
  for (let i = 0; i < x.length; i++) forskel |= x[i] ^ y[i];
  return forskel === 0;
}
