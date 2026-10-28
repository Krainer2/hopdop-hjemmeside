// GET /api/straffe - bans, mutes og kicks (offentlig banliste)
import { hent } from '../lib/data.mjs';
import { json } from '../lib/auth.mjs';

export default async () => {
  const nu = Date.now();
  const { poster = {} } = (await hent('straffe')) || {};
  const stats = (await hent('stats')) || { spillere: [], opdateret: 0 };
  const liste = Object.values(poster).sort((a, b) => b.tid - a.tid);

  // Marker den aktuelle ban/mute som aktiv
  for (const s of stats.spillere) {
    for (const [typ, TYPE] of [['ban', 'BAN'], ['mute', 'MUTE']]) {
      const a = s[typ];
      if (!a || !(a.til === -1 || a.til > nu)) continue;
      const post = liste.find((p) => p.u === s.u && p.type === TYPE && (!a.g || p.grund === a.g));
      if (post) { post.aktiv = true; post.til = a.til; }
      else {
        liste.push({ id: 'aktiv-' + typ + '-' + s.u, u: s.u, n: s.n, type: TYPE, grund: a.g, af: a.af, tid: a.t || stats.opdateret, til: a.til, varighed: a.til === -1 ? 'Permanent' : '', aktiv: true });
      }
    }
  }
  liste.sort((a, b) => b.tid - a.tid);
  return json({ opdateret: stats.opdateret, poster: liste }, 200, { 'Cache-Control': 'public, max-age=30' });
};

export const config = { path: '/api/straffe' };
