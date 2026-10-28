// GET /api/sa/start - send staff videre til "Log ind med SuperAwesome"
import crypto from 'node:crypto';
import { gem } from '../lib/data.mjs';
import { SA, redirectUrl } from '../lib/sa.mjs';

export default async (req) => {
  const id = process.env.SA_CLIENT_ID;
  if (!id || !process.env.SA_CLIENT_SECRET) {
    return Response.redirect(new URL('/admin.html#fejl=sa-ikke-sat-op', req.url).toString(), 302);
  }
  const state = crypto.randomBytes(32).toString('base64url');
  const verifier = crypto.randomBytes(48).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
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
