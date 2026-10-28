// /api/staff   GET (offentlig) -> staff-listen (Vagt-holdet kun for staff).   PUT (Admin/Ejer) {staff:[{navn, rolle}]}
import { hent, gem, logHandling } from '../lib/data.mjs';
import { hvemErDet, harNiveau, json } from '../lib/auth.mjs';

const ROLLER = ['Ejer', 'Admin', 'Mod', 'Helper', 'Bygger', 'Vagtchef', 'Vagt'];
// Vagt-holdet vises kun for staff, der er logget ind
const VAGT = ['Vagtchef', 'Vagt'];
const MC = /^[A-Za-z0-9_]{3,16}$/;

export default async (req) => {
  const staff = (await hent('staff')) || [];
  if (req.method === 'GET') {
    const mig = await hvemErDet(req);
    if (mig) return json({ staff, vagtAdgang: true }, 200, { 'Cache-Control': 'private, no-store', 'Vary': 'Authorization' });
    return json({ staff: staff.filter((s) => !VAGT.includes(s.rolle)), vagtAdgang: false }, 200, { 'Cache-Control': 'public, max-age=30', 'Vary': 'Authorization' });
  }
  if (req.method !== 'PUT') return json({ fejl: 'Metode ikke tilladt' }, 405);

  const bruger = await hvemErDet(req);
  if (!harNiveau(bruger, 'admin')) return json({ fejl: 'Kun Admin og Ejer kan ændre staff-listen' }, 403);
  let b = {};
  try { b = await req.json(); } catch {}
  const ny = [];
  const set = new Set();
  for (const s of Array.isArray(b.staff) ? b.staff.slice(0, 100) : []) {
    const navn = String(s.navn || '').trim();
    const rolle = ROLLER.find((r) => r.toLowerCase() === String(s.rolle || '').toLowerCase());
    if (!MC.test(navn) || !rolle || set.has(navn.toLowerCase())) continue;
    set.add(navn.toLowerCase());
    ny.push({ navn, rolle, titel: String(s.titel || '').trim().slice(0, 40) });
  }
  // En Admin må ikke ændre på Ejere eller andre Admins
  if (bruger.rolle !== 'ejer') {
    const beskyttet = (l) => JSON.stringify(l.filter((s) => s.rolle === 'Ejer' || s.rolle === 'Admin').map((s) => s.navn.toLowerCase() + ':' + s.rolle).sort());
    if (beskyttet(ny) !== beskyttet(staff)) return json({ fejl: 'Kun Ejeren kan tilføje, fjerne eller ændre Ejere og Admins' }, 403);
  }
  await gem('staff', ny);
  await logHandling(bruger.navn, 'staff', `Staff-listen har nu ${ny.length} personer`);
  return json({ ok: true, staff: ny });
};

export const config = { path: '/api/staff' };
