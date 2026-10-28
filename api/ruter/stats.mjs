// GET /api/stats - alle spillere, teams og hvem der er online (offentlig)
import { hent } from '../lib/data.mjs';
import { json } from '../lib/auth.mjs';

export default async () => {
  const s = (await hent('stats')) || { opdateret: 0, online: [], spillere: [], teams: [] };
  // Straffe er private (kun Admin+ via /api/straffe). Spilletid er privat (se /api/spilletid).
  const spillere = s.spillere.map(({ ban, mute, ot, ...rest }) => rest);
  return json({ ...s, spillere }, 200, { 'Cache-Control': 'public, max-age=30' });
};

export const config = { path: '/api/stats' };
