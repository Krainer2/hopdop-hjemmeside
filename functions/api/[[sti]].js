// HOPDOP - Cloudflare Pages Functions: sender alle /api/...-kald videre til den rigtige rute.
// Lavet af Krainer2
import { saetMiljoe } from '../../api/lib/miljoe.mjs';
import r0, { config as c0 } from '../../api/ruter/ansog.mjs';
import r1, { config as c1 } from '../../api/ruter/banner.mjs';
import r2, { config as c2 } from '../../api/ruter/import.mjs';
import r3, { config as c3 } from '../../api/ruter/log.mjs';
import r4, { config as c4 } from '../../api/ruter/login.mjs';
import r5, { config as c5 } from '../../api/ruter/oversigt.mjs';
import r6, { config as c6 } from '../../api/ruter/sa-callback.mjs';
import r7, { config as c7 } from '../../api/ruter/sa-start.mjs';
import r8, { config as c8 } from '../../api/ruter/spilletid.mjs';
import r9, { config as c9 } from '../../api/ruter/staff.mjs';
import r10, { config as c10 } from '../../api/ruter/stats.mjs';
import r11, { config as c11 } from '../../api/ruter/straffe.mjs';
import r12, { config as c12 } from '../../api/ruter/sync.mjs';
import r13, { config as c13 } from '../../api/ruter/tekster.mjs';

const RUTER = {
  [c0.path]: r0,
  [c1.path]: r1,
  [c2.path]: r2,
  [c3.path]: r3,
  [c4.path]: r4,
  [c5.path]: r5,
  [c6.path]: r6,
  [c7.path]: r7,
  [c8.path]: r8,
  [c9.path]: r9,
  [c10.path]: r10,
  [c11.path]: r11,
  [c12.path]: r12,
  [c13.path]: r13
};

export async function onRequest(context) {
  const sti = new URL(context.request.url).pathname.replace(/\/+$/, '');
  const rute = RUTER[sti];
  if (!rute) return new Response(JSON.stringify({ fejl: 'Findes ikke' }), { status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  saetMiljoe(context.env);
  try {
    return await rute(context.request);
  } catch (e) {
    return new Response(JSON.stringify({ fejl: 'Serverfejl: ' + (e && e.message ? e.message : e) }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}
