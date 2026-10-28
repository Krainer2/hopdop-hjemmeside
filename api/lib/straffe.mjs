// HOPDOP - læser Straf.sk-historik om til pæne poster. Lavet af Krainer2
import { sha1Hex } from './miljoe.mjs';

const FARVER = /[&§][0-9a-fk-or]/gi;
export const ren = (t) => String(t ?? '').replace(FARVER, '').replace(/\s+/g, ' ').trim();

// Dansk tid (Europe/Copenhagen) -> UTC millisekunder
function kbhTilUtc(aar, md, dag, t, m, s) {
  const gaet = Date.UTC(aar, md - 1, dag, t, m, s);
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Copenhagen', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const d = Object.fromEntries(fmt.formatToParts(new Date(gaet)).map((x) => [x.type, x.value]));
  const somKbh = Date.UTC(+d.year, +d.month - 1, +d.day, +d.hour, +d.minute, +d.second);
  return gaet - (somKbh - gaet);
}

// Skript skriver %now% forskelligt alt efter opsætning. Vi prøver de almindelige formater.
export function laesDato(raa) {
  const t = ren(raa);
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return kbhTilUtc(+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] || 0));
  m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4}),? (\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*(AM|PM)?/i);
  if (m) {
    let a = +m[1], b = +m[2], aar = +m[3], t2 = +m[4];
    if (aar < 100) aar += 2000;
    const ampm = m[7] && m[7].toUpperCase();
    let dag, md;
    if (ampm) { md = a; dag = b; } else { dag = a; md = b; }
    if (md > 12) { const x = md; md = dag; dag = x; }
    if (ampm === 'PM' && t2 < 12) t2 += 12;
    if (ampm === 'AM' && t2 === 12) t2 = 0;
    if (md < 1 || md > 12 || dag < 1 || dag > 31) return null;
    return kbhTilUtc(aar, md, dag, t2, +m[5], +(m[6] || 0));
  }
  const p = Date.parse(t);
  return Number.isFinite(p) ? p : null;
}

// "now | BAN | grund | 7 dage | strike 2 | af Krainer2"  /  "now | UNBAN | af Krainer2"
export async function laesLinje(uuid, navn, linje, nu) {
  const dele = String(linje).split(' | ');
  if (dele.length < 2) return null;
  const type = ren(dele[1]).toUpperCase();
  if (!['BAN', 'MUTE', 'KICK', 'UNBAN', 'UNMUTE'].includes(type)) return null;
  const id = (await sha1Hex(uuid + '|' + linje)).slice(0, 16);
  const post = { id, u: uuid, n: navn, type, naar: ren(dele[0]), tid: laesDato(dele[0]) || nu, gaettet: !laesDato(dele[0]) };
  if (type === 'UNBAN' || type === 'UNMUTE') {
    post.af = ren(dele[2] || '').replace(/^af\s+/i, '');
  } else {
    post.grund = ren(dele[2] || '');
    post.varighed = ren(dele[3] || '');
    post.strike = ren(dele[4] || '').replace(/^strike\s+/i, '');
    post.af = ren(dele[5] || '').replace(/^af\s+/i, '');
  }
  return post;
}
