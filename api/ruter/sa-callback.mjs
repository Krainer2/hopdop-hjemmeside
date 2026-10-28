// GET /api/sa/callback - SuperAwesome sender brugeren tilbage hertil
import { hent, slet, logHandling } from '../lib/data.mjs';
import { lavToken, rolleFor } from '../lib/auth.mjs';
import { SA, redirectUrl } from '../lib/sa.mjs';
import { env, b64 } from '../lib/miljoe.mjs';

function tilbage(req, fejl) {
  return Response.redirect(new URL('/admin.html#fejl=' + encodeURIComponent(fejl), req.url).toString(), 302);
}

export default async (req) => {
  const p = new URL(req.url).searchParams;
  const state = p.get('state') || '';
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(state)) return tilbage(req, 'ugyldig-state');
  const gemt = await hent('oauth-' + state);
  await slet('oauth-' + state).catch(() => {});
  if (!gemt || Date.now() - gemt.tid > 10 * 60 * 1000) return tilbage(req, 'login-udloebet');
  if (p.get('error')) return tilbage(req, p.get('error') === 'access_denied' ? 'afvist' : 'sa-fejl');
  const code = p.get('code');
  if (!code) return tilbage(req, 'sa-fejl');

  const basic = b64(encodeURIComponent(env('SA_CLIENT_ID')) + ':' + encodeURIComponent(env('SA_CLIENT_SECRET')));
  let tok;
  try {
    const r = await fetch(SA + '/oauth/token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + basic },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUrl(req), code_verifier: gemt.verifier })
    });
    tok = await r.json();
    if (!r.ok || !tok.access_token) return tilbage(req, 'sa-token-fejl');
  } catch { return tilbage(req, 'sa-utilgaengelig'); }

  let profil;
  try {
    const r = await fetch(SA + '/oauth/v1/player/profile', { headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + tok.access_token } });
    const j = await r.json();
    profil = j && (j.data || j.player || j);
    if (!r.ok || !profil || !profil.username) return tilbage(req, 'sa-profil-fejl');
  } catch { return tilbage(req, 'sa-utilgaengelig'); }

  // Vi skal kun bruge navnet - SuperAwesome-adgangen lukkes igen med det samme
  fetch(SA + '/oauth/revoke', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + basic },
    body: new URLSearchParams({ token: tok.refresh_token || tok.access_token })
  }).catch(() => {});

  const navn = String(profil.username);
  // Staff får deres panel-rolle, alle andre logger ind som spiller
  const rolle = (await rolleFor(navn)) || 'spiller';

  const t = await lavToken(navn, rolle, 'sa', profil.uuid);
  if (rolle !== 'spiller') await logHandling(navn, 'login', 'med SuperAwesome');
  const data = JSON.stringify(t).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="da"><head><meta charset="utf-8"><title>Logger ind...</title></head><body style="background:#070B09;color:#E6F2EA;font-family:sans-serif">Logger ind...<script>try{localStorage.setItem('hopdop-login',JSON.stringify(${data}))}catch(e){}location.replace(${JSON.stringify(gemt.til || '/').replace(/</g, '\\u003c')})</script></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
};

export const config = { path: '/api/sa/callback' };
