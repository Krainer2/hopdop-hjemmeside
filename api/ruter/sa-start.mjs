// GET /api/sa/start - send staff videre til "Log ind med SuperAwesome"
import { gem } from '../lib/data.mjs';
import { SA, redirectUrl } from '../lib/sa.mjs';
import { env, tilfaeldig, sha256, b64url } from '../lib/miljoe.mjs';

export default async (req) => {
  const id = env('SA_CLIENT_ID');
  if (!id || !env('SA_CLIENT_SECRET')) {
    return Response.redirect(new URL('/admin.html#fejl=sa-ikke-sat-op', req.url).toString(), 302);
  }
  const state = tilfaeldig(32);
  const verifier = tilfaeldig(48);
  const challenge = b64url(await sha256(verifier));
  // Hvor brugeren skal sendes hen efter login (kun stier på vores egen side)
  let til = new URL(req.url).searchParams.get('til') || '/';
  if (!/^\/(?!\/)[A-Za-z0-9._\-\/?=&%#]{0,200}$/.test(til)) til = '/';
  await gem('oauth-' + state, { verifier, til, tid: Date.now() });

  const url = new URL(SA + '/oauth/authorize');
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: id,
    redirect_uri: redirectUrl(req),
    scope: 'player:profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  }).toString();
  return Response.redirect(url.toString(), 302);
};

export const config = { path: '/api/sa/start' };
