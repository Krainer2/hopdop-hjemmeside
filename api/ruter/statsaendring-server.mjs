// GET /api/statsaendring/server  (kun serveren, Bearer WEB_NOEGLE)
// Svarer med ventende rettelser som tekst, så Skript nemt kan læse dem:
//   id|uuid|felt|handling|tal~id|uuid|felt|handling|tal ...
import { ensNoegle, json } from '../lib/auth.mjs';
import { env } from '../lib/miljoe.mjs';
import { hentAendringer } from '../lib/aendringer.mjs';

export default async (req) => {
  const noegle = env('WEB_NOEGLE');
  const sendt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (noegle.length < 16 || !(await ensNoegle(sendt, noegle))) return json({ fejl: 'Forkert nøgle' }, 401);
  const a = await hentAendringer();
  const linjer = a.liste.filter((x) => x.status === 'venter').reverse()
    .map((x) => [x.id, x.u, x.felt, x.handling, x.v].join('|'));
  return new Response(linjer.join('~'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
};

export const config = { path: '/api/statsaendring/server' };
