// GET /api/duel - duel-kits og duel-stats fra Duel.sk (offentlig). Lavet af Krainer2
import { hent } from '../lib/data.mjs';
import { json } from '../lib/auth.mjs';

export default async () => {
  const d = (await hent('duel')) || { opdateret: 0, kits: [], spillere: [] };
  // Spillere der er online lige nu (fra den almindelige sync)
  const s = await hent('stats');
  return json({ ...d, online: (s && s.online) || [] }, 200, { 'Cache-Control': 'public, max-age=30' });
};

export const config = { path: '/api/duel' };
