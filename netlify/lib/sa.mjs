// HOPDOP - fælles for SuperAwesome-login
export const SA = 'https://api.superawesome.dk';
export function redirectUrl(req) {
  return process.env.SA_REDIRECT || new URL('/api/sa/callback', req.url).toString();
}
