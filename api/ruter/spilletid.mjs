// GET /api/spilletid?navn=X - kun spilleren selv eller staff kan se spilletid
import { hent } from '../lib/data.mjs';
import { hvemErLoggetInd, json } from '../lib/auth.mjs';

export default async (req) => {
  const bruger = await hvemErLoggetInd(req);
  if (!bruger) return json({ fejl: 'Log ind for at se din spilletid' }, 401);
  const navn = String(new URL(req.url).searchParams.get('navn') || '').toLowerCase();
  const staff = bruger.rolle !== 'spiller';
  if (!staff && navn !== String(bruger.navn).toLowerCase()) return json({ fejl: 'Du kan kun se din egen spilletid' }, 403);
  const s = (await hent('stats')) || { spillere: [] };
  const sp = s.spillere.find((x) => x.n.toLowerCase() === navn);
  if (!sp) return json({ fejl: 'Spilleren findes ikke' }, 404);
  return json({ navn: sp.n, ot: sp.ot || 0 });
};

export const config = { path: '/api/spilletid' };
