// GET /api/hoved?u=<uuid>&s=<str> - spillerhoved ud fra spillerens rigtige skin. Lavet af Krainer2
// mc-heads og Crafatar viste nogle gange Steve for rigtige konti (gamle opslag i deres cache),
// og Mojang svarer ofte ikke Cloudflare. Derfor:
//   1. skinnet som Minecraft-serveren sender med WebSync (det man har i spillet)
//   2. gemt opslag hos Mojang (6 timer)
//   3. nyt opslag hos Mojang / reserve-tjeneste
// mc-heads tegner så hovedet ud fra selve skin-filen.
import { hent, gem } from '../lib/data.mjs';

const UUID = /^[0-9a-f]{32}$/;
const TEKSTUR = /^[0-9a-f]{20,80}$/;
const LEVETID = 6 * 60 * 60 * 1000;
const UA = { 'User-Agent': 'HOPDOP-hjemmeside (hopdop.pages.dev)' };

function videre(url, sek) {
  return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'public, max-age=' + sek } });
}
const sidste = (url) => String(url || '').split('/').pop();

async function mojang(u) {
  try {
    const r = await fetch('https://sessionserver.mojang.com/session/minecraft/profile/' + u, { headers: UA });
    if (r.ok) {
      const j = await r.json();
      const p = (j.properties || []).find((x) => x.name === 'textures');
      if (!p) return { h: '' };
      const t = JSON.parse(atob(p.value));
      return { h: sidste(t && t.textures && t.textures.SKIN && t.textures.SKIN.url) };
    }
  } catch (e) { /* prøv reserven */ }
  try {
    const r = await fetch('https://api.ashcon.app/mojang/v2/user/' + u, { headers: UA });
    if (r.ok) {
      const j = await r.json();
      return { h: sidste(j && j.textures && j.textures.skin && j.textures.skin.url) };
    }
  } catch (e) { /* intet svar */ }
  return null;
}

export default async (req) => {
  const q = new URL(req.url).searchParams;
  const u = String(q.get('u') || '').replace(/-/g, '').toLowerCase();
  const s = Math.min(512, Math.max(8, parseInt(q.get('s'), 10) || 32));
  if (!UUID.test(u)) return videre('https://mc-heads.net/avatar/MHF_Steve/' + s, 3600);

  // 1. Skinnet fra serveren
  const skins = (await hent('skins')) || {};
  if (TEKSTUR.test(skins[u] || '')) return videre('https://mc-heads.net/avatar/' + skins[u] + '/' + s, 3600);

  // 2-3. Mojang (gemt i 6 timer)
  const noegle = 'skin:' + u;
  let c = await hent(noegle);
  if (!c || Date.now() - c.tid > LEVETID) {
    const m = await mojang(u);
    if (m) { c = { h: m.h, tid: Date.now() }; await gem(noegle, c); }
  }
  if (c && TEKSTUR.test(c.h || '')) return videre('https://mc-heads.net/avatar/' + c.h + '/' + s, 3600);
  // Ingen skin kendt endnu - kort cache, så den prøver igen snart
  return videre('https://mc-heads.net/avatar/' + u + '/' + s, 120);
};

export const config = { path: '/api/hoved' };
