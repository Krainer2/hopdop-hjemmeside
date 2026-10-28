// /api/ansog
//  POST  (offentlig)  {type, felter}            -> opretter ansøgning, giver en kode
//  GET   ?kode=XXXX   (offentlig)               -> status på din ansøgning
//  GET   (staff)                                -> alle ansøgninger
//  PATCH (staff)      {id, status, note}        -> godkend/afvis
import { hent, gem, logHandling, ipHash } from '../lib/data.mjs';
import { hvemErDet, json } from '../lib/auth.mjs';
import { tilfaeldigeBytes, uuid } from '../lib/miljoe.mjs';

const TYPER = { staff: 'Staff', bygger: 'Bygger', unban: 'Unban' };
const STATUS = ['ny', 'godkendt', 'afvist'];
const MC = /^[A-Za-z0-9_]{3,16}$/;

function nyKode() {
  const tegn = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(tilfaeldigeBytes(8), (b) => tegn[b % tegn.length]).join('');
}

export default async (req) => {
  const url = new URL(req.url);
  const alle = (await hent('ansogninger')) || [];

  if (req.method === 'POST') {
    let b = {};
    try { b = await req.json(); } catch {}
    if (b.hjemmeside) return json({ ok: true, kode: nyKode() }); // spam-fælde
    if (!TYPER[b.type]) return json({ fejl: 'Ukendt ansøgningstype' }, 400);
    const f = b.felter && typeof b.felter === 'object' ? b.felter : {};
    const felter = {};
    for (const [k, v] of Object.entries(f).slice(0, 25)) {
      if (!/^[a-z0-9_]{1,30}$/.test(k)) continue;
      felter[k] = String(v ?? '').trim().slice(0, 2500);
    }
    if (!MC.test(felter.mcnavn || '')) return json({ fejl: 'Skriv dit rigtige Minecraft-navn (3-16 tegn)' }, 400);
    if (!felter.discord || felter.discord.length < 2) return json({ fejl: 'Skriv dit Discord-navn' }, 400);

    // Højst 3 ansøgninger i timen pr. internetforbindelse
    const rl = (await hent('ansog-rl')) || {};
    const ip = ipHash(req), nu = Date.now();
    rl[ip] = (rl[ip] || []).filter((t) => nu - t < 3600_000);
    if (rl[ip].length >= 3) return json({ fejl: 'Du har sendt for mange ansøgninger. Prøv igen om en time.' }, 429);
    rl[ip].push(nu);
    for (const k of Object.keys(rl)) if (!rl[k].some((t) => nu - t < 3600_000)) delete rl[k];
    await gem('ansog-rl', rl);

    const kode = nyKode();
    alle.unshift({ id: uuid(), kode, type: b.type, felter, status: 'ny', oprettet: nu });
    await gem('ansogninger', alle.slice(0, 2000));
    return json({ ok: true, kode });
  }

  if (req.method === 'GET' && url.searchParams.get('kode')) {
    const kode = url.searchParams.get('kode').trim().toUpperCase();
    const a = alle.find((x) => x.kode === kode);
    if (!a) return json({ fejl: 'Ingen ansøgning med den kode' }, 404);
    return json({ type: TYPER[a.type], mcnavn: a.felter.mcnavn, status: a.status, oprettet: a.oprettet, behandlet: a.behandlet || null, note: a.status !== 'ny' ? (a.note || '') : '' });
  }

  const bruger = await hvemErDet(req);
  if (!bruger) return json({ fejl: 'Ikke logget ind' }, 401);

  if (req.method === 'GET') return json({ ansogninger: alle });

  if (req.method === 'PATCH') {
    let b = {};
    try { b = await req.json(); } catch {}
    const a = alle.find((x) => x.id === b.id);
    if (!a) return json({ fejl: 'Ansøgningen findes ikke' }, 404);
    if (!STATUS.includes(b.status)) return json({ fejl: 'Ugyldig status' }, 400);
    a.status = b.status;
    a.note = String(b.note || '').slice(0, 1000);
    a.behandlet = Date.now();
    a.behandletAf = bruger.navn;
    await gem('ansogninger', alle);
    await logHandling(bruger.navn, 'ansøgning', `${TYPER[a.type]} fra ${a.felter.mcnavn}: ${a.status}`);
    return json({ ok: true, ansogning: a });
  }
  return json({ fejl: 'Metode ikke tilladt' }, 405);
};

export const config = { path: '/api/ansog' };
