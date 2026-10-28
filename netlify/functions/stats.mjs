// GET /api/stats - alle spillere, teams og hvem der er online (offentlig)
import { hent } from '../lib/data.mjs';
import { json } from '../lib/auth.mjs';

export default async () => {
  const s = (await hent('stats')) || { opdateret: 0, online: [], spillere: [], teams: [] };
  // Aktive straffe vises på banlisten, ikke her
  const spillere = s.spillere.map(({ ban, mute, ...rest }) => ({ ...rest, b: ban ? 1 : 0 }));
  return json({ ...s, spillere }, 200, { 'Cache-Control': 'public, max-age=30' });
};

export const config = { path: '/api/stats' };
