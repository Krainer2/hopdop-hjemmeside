// HOPDOP - spørgsmål til ansøgningerne. Ret frit her - admin-panelet bruger de samme. Lavet af Krainer2
// type: kort | lang | tal | valg | links | ja
window.HD_ANSOG = {
  staff: {
    navn: 'Staff',
    tekst: 'Hjælp spillere, hold øje med snyd og vær med til at gøre HOPDOP til en fair server.',
    felter: [
      { id: 'mcnavn', label: 'Minecraft-navn', type: 'kort', krav: true },
      { id: 'discord', label: 'Discord-navn', type: 'kort', krav: true },
      { id: 'alder', label: 'Alder', type: 'tal', krav: true, min: 10, max: 99 },
      { id: 'spilletid', label: 'Hvor længe har du spillet på HOPDOP?', type: 'kort', krav: true },
      { id: 'timer', label: 'Hvor mange timer kan du være aktiv om ugen?', type: 'tal', krav: true, min: 1, max: 100 },
      { id: 'erfaring', label: 'Har du været staff før? Hvor og hvor længe?', type: 'lang', krav: false },
      { id: 'hvorfor', label: 'Hvorfor vil du være staff på HOPDOP?', type: 'lang', krav: true, minLaengde: 80 },
      { id: 'hacker', label: 'En spiller hacker lige foran dig. Hvad gør du, trin for trin?', type: 'lang', krav: true, minLaengde: 50 },
      { id: 'skaenderi', label: 'To spillere skændes og sviner hinanden til i chatten. Hvordan håndterer du det?', type: 'lang', krav: true, minLaengde: 50 },
      { id: 'andet', label: 'Er der andet, vi skal vide?', type: 'lang', krav: false }
    ]
  },
  bygger: {
    navn: 'Bygger',
    tekst: 'Byg spawns, KOTH-arenaer og events. Vis os, hvad du kan.',
    felter: [
      { id: 'mcnavn', label: 'Minecraft-navn', type: 'kort', krav: true },
      { id: 'discord', label: 'Discord-navn', type: 'kort', krav: true },
      { id: 'stil', label: 'Hvilken byggestil er du bedst til?', type: 'valg', krav: true, valg: ['Asiatisk', 'Middelalder', 'Moderne', 'Fantasy', 'Terraforming', 'Andet'] },
      { id: 'billeder', label: 'Links til billeder af dine builds (Imgur, Discord e.l.)', type: 'links', krav: true },
      { id: 'worldedit', label: 'Hvor god er du til WorldEdit / FAWE?', type: 'valg', krav: true, valg: ['Ingen erfaring', 'Lidt', 'God', 'Meget erfaren'] },
      { id: 'timer', label: 'Hvor mange timer kan du bygge om ugen?', type: 'tal', krav: true, min: 1, max: 100 },
      { id: 'hvorfor', label: 'Hvorfor vil du bygge for HOPDOP?', type: 'lang', krav: true, minLaengde: 50 }
    ]
  },
  unban: {
    navn: 'Unban',
    tekst: 'Er du bannet eller mutet? Fortæl os, hvad der skete, og hvorfor du fortjener en chance til.',
    felter: [
      { id: 'mcnavn', label: 'Minecraft-navn', type: 'kort', krav: true },
      { id: 'discord', label: 'Discord-navn', type: 'kort', krav: true },
      { id: 'straf', label: 'Hvad blev du straffet for?', type: 'kort', krav: true },
      { id: 'hvornaar', label: 'Hvornår skete det?', type: 'kort', krav: false },
      { id: 'afhvem', label: 'Hvem gav dig straffen?', type: 'kort', krav: false },
      { id: 'forklaring', label: 'Hvorfor skal du unbannes? Vær ærlig.', type: 'lang', krav: true, minLaengde: 80 },
      { id: 'regler', label: 'Jeg lover at følge reglerne fremover', type: 'ja', krav: true }
    ]
  }
};
