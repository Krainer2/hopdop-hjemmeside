// GET /api/log - hvad staff har gjort på hjemmesiden (kræver login)
import { hent } from '../lib/data.mjs';
import { hvemErDet, json } from '../lib/auth.mjs';

export default async (req) => {
  if (!(await hvemErDet(req))) return json({ fejl: 'Ikke logget ind' }, 401);
  const log = (await hent('log')) || [];
  return json({ log: log.slice(0, 100) });
};

export const config = { path: '/api/log' };
