// /api/bro - Bro mellem Discord-botten og Minecraft-serveren. Lavet af Krainer2
//  Discord-botten ("Bot <BOT_NOEGLE>"):
//    POST {type:"kommando", kommando, af}  -> lægger en kommando i kø til serveren, svarer {id}
//    GET  ?efter=<nr>                      -> {chat:[...], svar:[...], nr}  nye chatlinjer og svar
//  Minecraft-serveren ("Bearer <WEB_NOEGLE>"):
//    GET                                   -> tekst: "id~~kommando|||id~~kommando" (tom = ingenting)
//    POST {chat:["tekst",...], svar:[{id, tekst}]} -> tekst med ventende kommandoer (eller "INGEN")
import { hent, gem } from '../lib/data.mjs';
import { ensNoegle, json } from '../lib/auth.mjs';
import { env } from '../lib/miljoe.mjs';

const tom = () => ({ ko: [], chat: [], svar: [], nr: 0 });
const ren = (t, max) => String(t ?? '').replace(/[\r\n]+/g, ' ').slice(0, max);

async function hvem(req) {
  const a = req.headers.get('authorization') || '';
  if (a.startsWith('Bot ')) {
    const bn = env('BOT_NOEGLE');
    return bn.length >= 32 && (await ensNoegle(a.slice(4), bn)) ? 'bot' : null;
  }
  const wn = env('WEB_NOEGLE');
  const s = a.replace(/^Bearer\s+/i, '').trim();
  return wn.length >= 16 && (await ensNoegle(s, wn)) ? 'server' : null;
}

export default async (req) => {
  const kilde = await hvem(req);
  if (!kilde) return json({ fejl: 'Forkert nøgle' }, 401);
  const d = (await hent('bro')) || tom();
  const nu = Date.now();

  if (kilde === 'bot' && req.method === 'POST') {
    let b = {}; try { b = JSON.parse(await req.text()); } catch { return json({ fejl: 'Ugyldig JSON' }, 400); }
    if (b.type !== 'kommando' || !b.kommando) return json({ fejl: 'Ukendt type' }, 400);
    const id = nu.toString(36) + Math.random().toString(36).slice(2, 6);
    // "~~" og "|||" bruges som skilletegn til serveren, så de må ikke stå i kommandoen
    const k = ren(b.kommando, 300).replace(/~~|\|\|\|/g, ' ');
    d.ko.push({ id, k, af: ren(b.af, 40), t: nu });
    d.ko = d.ko.filter((x) => nu - x.t < 10 * 60000).slice(-50); // gamle kommandoer droppes efter 10 min
    await gem('bro', d);
    return json({ ok: true, id });
  }
  if (kilde === 'bot' && req.method === 'GET') {
    const efter = Number(new URL(req.url).searchParams.get('efter')) || 0;
    return json({ chat: d.chat.filter((c) => c.nr > efter), svar: d.svar.filter((s) => s.nr > efter), nr: d.nr }, 200, { 'Cache-Control': 'no-store' });
  }
  if (kilde === 'server' && req.method === 'GET') {
    if (!d.ko.length) return new Response('', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
    const ud = d.ko.map((x) => `${x.id}~~${x.k}`).join('|||');
    d.ko = [];
    await gem('bro', d);
    return new Response(ud, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  if (kilde === 'server' && req.method === 'POST') {
    let b = {}; try { b = JSON.parse(await req.text()); } catch { return json({ fejl: 'Ugyldig JSON' }, 400); }
    for (const c of (Array.isArray(b.chat) ? b.chat : []).slice(0, 200)) d.chat.push({ nr: ++d.nr, tekst: ren(c, 400), t: nu });
    for (const s of (Array.isArray(b.svar) ? b.svar : []).slice(0, 50)) if (s && s.id) d.svar.push({ nr: ++d.nr, id: ren(s.id, 20), tekst: ren(s.tekst, 1500), t: nu });
    d.chat = d.chat.slice(-300); d.svar = d.svar.slice(-100);
    // Svaret er de ventende kommandoer som tekst (samme format som GET), så serveren kun behøver én forespørgsel
    const ud = d.ko.map((x) => `${x.id}~~${x.k}`).join('|||');
    d.ko = [];
    await gem('bro', d);
    return new Response(ud || 'INGEN', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  return json({ fejl: 'Metode ikke tilladt' }, 405);
};

export const config = { path: '/api/bro' };
