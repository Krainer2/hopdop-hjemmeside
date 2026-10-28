// GET /api/oversigt - tal til admin-panelets forside (kræver login)
import { hent } from '../lib/data.mjs';
import { hvemErDet, json } from '../lib/auth.mjs';
import { env } from '../lib/miljoe.mjs';

export default async (req) => {
  const bruger = await hvemErDet(req);
  if (!bruger) return json({ fejl: 'Ikke logget ind' }, 401);
  const [meta, fejl, ans, staff, straffe, forsoeg] = await Promise.all([hent('sync-meta'), hent('sync-fejl'), hent('ansogninger'), hent('staff'), hent('straffe'), hent('sync-forsoeg')]);
  const stats = (await hent('stats')) || { spillere: [] };
  const nu = Date.now();
  const aktiveBans = stats.spillere.filter((s) => s.ban && (s.ban.til === -1 || s.ban.til > nu)).length;
  return json({
    mig: { navn: bruger.navn, rolle: bruger.rolle },
    sync: meta, syncFejl: fejl,
    sidsteForsoeg: (forsoeg || [])[0] || null,
    nyeAnsogninger: (ans || []).filter((a) => a.status === 'ny').length,
    staff: (staff || []).length,
    straffe: Object.keys((straffe && straffe.poster) || {}).length,
    aktiveBans,
    saKlar: !!(env('SA_CLIENT_ID') && env('SA_CLIENT_SECRET')),
    webNoegleKlar: env('WEB_NOEGLE').length >= 16
  });
};

export const config = { path: '/api/oversigt' };
