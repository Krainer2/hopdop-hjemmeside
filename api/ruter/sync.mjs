// POST /api/sync - serveren (WebSync.sk) sender stats hertil. Kræver WEB_NOEGLE.
import { hent, gem } from '../lib/data.mjs';
import { ensNoegle, json } from '../lib/auth.mjs';
import { env } from '../lib/miljoe.mjs';
import { laesLinje, ren } from '../lib/straffe.mjs';
import { hentAendringer, gemAendringer, anvend } from '../lib/aendringer.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAVN = /^[A-Za-z0-9_]{1,16}$/;
const tal = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const MAX_STRAFFE = 3000; // D1 tillader højst ~2 MB pr. række

// "3 timer og 12 minutter" -> sekunder (fra ontime.sk)
function ontimeTekst(t) {
  const m = String(t || '').match(/(\d+)\s*timer?\D+(\d+)\s*minut/i);
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 : 0;
}

// Gemmer de seneste forsøg, så man kan se hvad der går galt på /api/sync
async function forsoeg(req, status, besked, ekstra = {}) {
  const l = (await hent('sync-forsoeg')) || [];
  l.unshift({ tid: Date.now(), status, besked, klient: (req.headers.get('user-agent') || '').slice(0, 80), ...ekstra });
  await gem('sync-forsoeg', l.slice(0, 15));
}

export default async (req) => {
  if (req.method === 'GET') {
    // Fejlfinding: viser de seneste forsøg fra serveren (ingen hemmeligheder)
    const [l, meta] = await Promise.all([hent('sync-forsoeg'), hent('sync-meta')]);
    const noegle = env('WEB_NOEGLE');
    return json({
      webNoegleSatOp: noegle.length >= 16,
      webNoegleLaengde: noegle.length,
      sidstLykkedes: meta ? new Date(meta.sidst).toISOString() : null,
      seneste: (l || []).map((x) => ({ ...x, tid: new Date(x.tid).toISOString() }))
    });
  }
  if (req.method !== 'POST') return json({ fejl: 'Kun POST' }, 405);
  const noegle = env('WEB_NOEGLE');
  const h = req.headers.get('authorization') || '';
  if (noegle.length < 16) { await forsoeg(req, 500, 'WEB_NOEGLE er ikke sat op i Cloudflare'); return json({ fejl: 'WEB_NOEGLE er ikke sat op (mindst 16 tegn)' }, 500); }
  const sendt = h.replace(/^Bearer\s+/i, '').trim();
  if (!(await ensNoegle(sendt, noegle))) {
    await forsoeg(req, 401, h ? 'Forkert nøgle' : 'Ingen nøgle sendt', { sendtLaengde: sendt.length, forventetLaengde: noegle.length, sendtStart: sendt.slice(0, 2) });
    return json({ fejl: 'Forkert nøgle' }, 401);
  }

  const raa = await req.text();
  // Gem at vi har modtaget noget, før det tunge arbejde - så kan man se det på /api/sync, selv hvis resten fejler
  await forsoeg(req, 102, 'Modtaget - behandler...', { bytes: raa.length });
  if (raa.length > 5_000_000) { await forsoeg(req, 413, 'For meget data', { bytes: raa.length }); return json({ fejl: 'For meget data' }, 413); }
  let d;
  try { d = JSON.parse(raa); } catch (e) {
    const pos = Number((e.message.match(/position (\d+)/) || [])[1]) || 0;
    await forsoeg(req, 400, 'Ugyldig JSON: ' + e.message, { bytes: raa.length, omkring: raa.slice(Math.max(0, pos - 120), pos + 120) });
    await gem('sync-fejl', { tid: Date.now(), fejl: 'Ugyldig JSON: ' + e.message, start: raa.slice(0, 300) });
    return json({ fejl: 'Ugyldig JSON' }, 400);
  }

  const nu = Date.now();
  const gammel = (await hent('straffe')) || { poster: {} };
  const poster = gammel.poster || {};
  let nyeStraffe = 0;

  const spillere = [];
  for (const s of Array.isArray(d.spillere) ? d.spillere : []) {
    if (!s || !UUID.test(s.u) || !NAVN.test(s.n)) continue;
    const ot = tal(s.ot) >= 0 ? tal(s.ot) : ontimeTekst(s.ott);
    const p = {
      u: s.u, n: s.n,
      k: s.bk == 1 ? 0 : tal(s.k), d: s.bd == 1 ? 0 : tal(s.d), bk: s.bk == 1 ? 1 : 0,
      ot, ds: tal(s.ds),
      fl: tal(s.fl) || 1, fx: tal(s.fx), ff: tal(s.ff), fr: tal(s.fr), fm: tal(s.fm), fp: tal(s.fp),
      vp: tal(s.vp), vr: tal(s.vr), vs: tal(s.vs),
      tr: tal(s.tr), tp: tal(s.tp), tf: tal(s.tf),
      st: tal(s.st), sm: tal(s.sm)
    };
    for (const typ of ['ban', 'mute']) {
      const a = s[typ];
      if (a && a.til !== undefined) {
        const til = tal(a.til);
        if (til === -1 || til > nu) p[typ] = { til, g: ren(a.g), af: ren(a.af), t: tal(a.t) };
      }
    }
    spillere.push(p);
    for (const linje of Array.isArray(s.h) ? s.h : []) {
      const post = laesLinje(s.u, s.n, linje, nu, poster);
      if (!post) continue;
      if (post.kendt) { if (poster[post.id].n !== s.n) poster[post.id].n = s.n; }
      else { poster[post.id] = post; nyeStraffe++; }
    }
  }

  const teams = [];
  for (const t of Array.isArray(d.teams) ? d.teams : []) {
    if (!t || !t.id) continue;
    teams.push({
      id: ren(t.id).slice(0, 40), n: ren(t.n || t.id).slice(0, 40), leder: UUID.test(t.leder) ? t.leder : null,
      lvl: tal(t.lvl) || 1, k: tal(t.k), d: tal(t.d), koth: tal(t.koth), bank: tal(t.bank), opr: tal(t.opr),
      m: (Array.isArray(t.m) ? t.m : []).filter((x) => x && UUID.test(x.u)).map((x) => ({ u: x.u, n: ren(x.n).slice(0, 16), r: ren(x.r).toUpperCase().slice(0, 12) }))
    });
  }
  const online = (Array.isArray(d.online) ? d.online : []).filter((n) => NAVN.test(n));

  // Rettelser fra hjemmesiden: serveren fortæller hvilke den har gemt ("anvendt").
  // Dem der stadig venter, lægges oven på tallene, så siden viser dem indtil serveren har dem.
  const ae = await hentAendringer();
  if (ae.liste.some((x) => x.status === 'venter')) {
    const anvendt = new Set(String(d.anvendt || '').split(',').map((x) => x.trim()).filter(Boolean));
    let aendret = false;
    for (const x of ae.liste) {
      if (x.status !== 'venter') continue;
      if (anvendt.has(x.id)) { x.status = 'anvendt'; x.anvendt = nu; aendret = true; continue; }
      const sp = spillere.find((p) => p.u === x.u);
      if (sp) anvend(sp, x);
    }
    if (aendret) await gemAendringer(ae);
  }

  // Behold kun de nyeste straffe
  let alle = Object.values(poster);
  if (alle.length > MAX_STRAFFE) {
    alle.sort((a, b) => b.tid - a.tid);
    alle = alle.slice(0, MAX_STRAFFE);
  }
  await gem('straffe', { poster: Object.fromEntries(alle.map((p) => [p.id, p])) });
  await gem('stats', { opdateret: nu, online, spillere, teams });
  await gem('sync-meta', { sidst: nu, spillere: spillere.length, teams: teams.length, online: online.length, nyeStraffe, bytes: raa.length });
  await forsoeg(req, 200, 'OK', { spillere: spillere.length, teams: teams.length, bytes: raa.length });
  return json({ ok: true, spillere: spillere.length, teams: teams.length, nyeStraffe });
};

export const config = { path: '/api/sync' };
