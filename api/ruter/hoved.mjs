// GET /api/hoved?u=<uuid>&s=<str> - spillerhoved ud fra spillerens skin hos Mojang. Lavet af Krainer2
// mc-heads og Crafatar viste nogle gange Steve for rigtige konti (gamle opslag i deres cache).
// Her slår vi selv skinnet op hos Mojang, gemmer skin-id'et i 6 timer og lader mc-heads tegne
// hovedet ud fra selve skin-filen.
import { hent, gem } from '../lib/data.mjs';

const UUID = /^[0-9a-f]{32}$/;
const TEKSTUR = /^[0-9a-f]{20,80}$/;
const LEVETID = 6 * 60 * 60 * 1000;

function videre(url, sek) {
  return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'public, max-age=' + sek } });
}

export default async (req) => {
  const q = new URL(req.url).searchParams;
  const u = String(q.get('u') || '').replace(/-/g, '').toLowerCase();
  const s = Math.min(512, Math.max(8, parseInt(q.get('s'), 10) || 32));
  if (!UUID.test(u)) return videre('https://mc-heads.net/avatar/MHF_Steve/' + s, 3600);

  const noegle = 'skin:' + u;
  let c = await hent(noegle);
  if (!c || Date.now() - c.tid > LEVETID) {
    try {
      const r = await fetch('https://sessionserver.mojang.com/session/minecraft/profile/' + u);
      if (r.ok) {
        const j = await r.json();
        const p = (j.properties || []).find((x) => x.name === 'textures');
        let h = '';
        if (p) {
          const t = JSON.parse(atob(p.value));
          const url = t && t.textures && t.textures.SKIN && t.textures.SKIN.url;
          if (url) h = String(url).split('/').pop();
        }
        c = { h, tid: Date.now() };
        await gem(noegle, c);
      }
    } catch (e) { /* Mojang svarer ikke - brug det vi har */ }
  }
  if (c && TEKSTUR.test(c.h || '')) return videre('https://mc-heads.net/avatar/' + c.h + '/' + s, 3600);
  // Ingen skin (standard Steve/Alex) eller Mojang svarer ikke
  return videre('https://mc-heads.net/avatar/' + u + '/' + s, 600);
};

export const config = { path: '/api/hoved' };
