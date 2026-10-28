// HOPDOP - fælles for SuperAwesome-login
import { env } from './miljoe.mjs';
export const SA = 'https://api.superawesome.dk';
export function redirectUrl(req) {
  return env('SA_REDIRECT') || new URL('/api/sa/callback', req.url).toString();
}
