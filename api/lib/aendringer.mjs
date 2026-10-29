// HOPDOP - rettelser af spiller-stats fra hjemmesiden. Lavet af Krainer2
// En rettelse venter, indtil serveren (WebSync.sk) har hentet og gemt den i Skript-variablerne.
import { hent, gem } from './data.mjs';

// Felter man kan rette, og hvad de hedder på siden
export const FELTER = { k: 'Kills', d: 'Døde', ds: 'Daily-streak' };

export async function hentAendringer() {
  return (await hent('aendringer')) || { liste: [] };
}
export async function gemAendringer(a) {
  // behold alle ventende + de seneste 60 færdige
  const venter = a.liste.filter((x) => x.status === 'venter');
  const faerdige = a.liste.filter((x) => x.status !== 'venter').sort((x, y) => (y.anvendt || 0) - (x.anvendt || 0)).slice(0, 60);
  await gem('aendringer', { liste: venter.concat(faerdige) });
}

// Læg en rettelse oven på en spiller i stats (så siden viser den med det samme)
export function anvend(spiller, ae) {
  const nu = Number(spiller[ae.felt]) || 0;
  spiller[ae.felt] = Math.max(0, ae.handling === 'tilfoej' ? nu + ae.v : ae.v);
}
