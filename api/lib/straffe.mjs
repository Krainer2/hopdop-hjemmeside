// HOPDOP - læser Straf.sk-historik om til pæne poster. Lavet af Krainer2

const FARVER = /[&§][0-9a-fk-or]/gi;
export const ren = (t) => String(t ?? '').replace(FARVER, '').replace(/\s+/g, ' ').trim();

// Dansk tid (Europe/Copenhagen) -> UTC millisekunder.
// Regnes med EU's sommertidsregel (sidste søndag i marts/oktober kl. 01:00 UTC) - meget hurtigere end Intl.
function sidsteSoendag(aar, md) { // md: 0-baseret
  const sidste = new Date(Date.UTC(aar, md + 1, 0));
  return Date.UTC(aar, md, sidste.getUTCDate() - sidste.getUTCDay(), 1, 0, 0);
}
function kbhTilUtc(aar, md, dag, t, m, s) {
  const lokal = Date.UTC(aar, md - 1, dag, t, m, s);
  const somVinter = lokal - 3600000;
  const sommer = somVinter >= sidsteSoendag(aar, 2) && somVinter < sidsteSoendag(aar, 9);
  return lokal - (sommer ? 7200000 : 3600000);
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
// Hurtig hash (cyrb53) - Cloudflare giver kun 10 ms CPU pr. kald, så ingen tung kryptografi her
function hash(t) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < t.length; i++) {
    const c = t.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

// Id ud fra indholdet - samme straf giver altid samme id (også ved import fra den gamle side)
export function postId(p) {
  return hash([p.u, p.type, p.naar, p.grund || '', p.varighed || '', p.strike || '', p.af || ''].join('|'));
}

// "now | BAN | grund | 7 dage | strike 2 | af Krainer2"  /  "now | UNBAN | af Krainer2"
// kendte: (valgfri) objekt med id'er vi allerede har - så springes datolæsningen over
export function laesLinje(uuid, navn, linje, nu, kendte) {
  const dele = String(linje).split(' | ');
  if (dele.length < 2) return null;
  const type = ren(dele[1]).toUpperCase();
  if (!['BAN', 'MUTE', 'KICK', 'UNBAN', 'UNMUTE'].includes(type)) return null;
  const post = { id: '', u: uuid, n: navn, type, naar: ren(dele[0]) };
  if (type === 'UNBAN' || type === 'UNMUTE') {
    post.af = ren(dele[2] || '').replace(/^af\s+/i, '');
  } else {
    post.grund = ren(dele[2] || '');
    post.varighed = ren(dele[3] || '');
    post.strike = ren(dele[4] || '').replace(/^strike\s+/i, '');
    post.af = ren(dele[5] || '').replace(/^af\s+/i, '');
  }
  post.id = postId(post);
  if (kendte && kendte[post.id]) return { id: post.id, kendt: true };
  const tid = laesDato(dele[0]);
  post.tid = tid || nu;
  post.gaettet = !tid;
  return post;
}
