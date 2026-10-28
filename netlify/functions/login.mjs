// POST /api/login {brugernavn, kode} - login med kode (fra ADMIN_BRUGERE)
import { tjekKode, lavToken, json } from '../lib/auth.mjs';
import { logHandling } from '../lib/data.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ fejl: 'Kun POST' }, 405);
  let body = {};
  try { body = await req.json(); } catch {}
  const bruger = tjekKode(body.brugernavn, body.kode);
  if (!bruger) {
    await new Promise((r) => setTimeout(r, 800));
    return json({ fejl: 'Forkert brugernavn eller kode' }, 401);
  }
  try {
    const t = lavToken(bruger.navn, bruger.rolle, 'kode');
    await logHandling(bruger.navn, 'login', 'med kode');
    return json(t);
  } catch (e) {
    return json({ fejl: 'Login er ikke sat op: ' + e.message }, 500);
  }
};

export const config = { path: '/api/login' };
