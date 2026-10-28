// /api/banner   GET (offentlig) -> bjælken øverst på siden.   PUT (Admin/Ejer) -> ret den
import { hent, gem, logHandling } from '../lib/data.mjs';
import { hvemErDet, harNiveau, json } from '../lib/auth.mjs';

const FARVER = ['groen', 'gul', 'roed', 'blaa'];

export default async (req) => {
  const banner = (await hent('banner')) || { aktiv: false };
  if (req.method === 'GET') return json({ banner }, 200, { 'Cache-Control': 'public, max-age=30' });
  if (req.method !== 'PUT') return json({ fejl: 'Metode ikke tilladt' }, 405);

  const bruger = await hvemErDet(req);
  if (!harNiveau(bruger, 'admin')) return json({ fejl: 'Kun Admin og Ejer kan ændre banneret' }, 403);
  let b = {};
  try { b = await req.json(); } catch {}
  const tekst = String(b.tekst || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  const linkTekst = String(b.linkTekst || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  let link = String(b.link || '').trim().slice(0, 300);
  // Kun links til vores egen side eller https
  if (link && !/^(https:\/\/|\/(?!\/)|[a-z0-9-]+\.html)/i.test(link)) link = '';
  const ny = {
    aktiv: !!b.aktiv && !!tekst,
    tekst, linkTekst, link,
    farve: FARVER.includes(b.farve) ? b.farve : 'groen',
    // Nyt id hver gang teksten ændres, så folk der lukkede den gamle ser den nye
    id: tekst + '|' + linkTekst === (banner.tekst + '|' + banner.linkTekst) && banner.id ? banner.id : Date.now().toString(36)
  };
  await gem('banner', ny);
  await logHandling(bruger.navn, 'banner', ny.aktiv ? 'Banner: ' + tekst : 'Banner slået fra');
  return json({ ok: true, banner: ny });
};

export const config = { path: '/api/banner' };
