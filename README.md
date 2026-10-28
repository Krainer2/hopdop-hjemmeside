# HOPDOP - hjemmeside

Hjemmeside til HOPDOP (dansk HCF Kits på 1.8.9 · `hopdop.superawesome.dk`).

Lavet af Krainer2.

## Indhold

| Side | Hvad den gør |
|---|---|
| `index.html` | Forsiden: animeret natbaggrund, kits, features, live top kills, FAQ og tekster, som staff kan redigere. |
| `leaderboards.html` | Live leaderboards i 5 kategorier: PvP, Teams/KOTH, Fiskeri, Vagt og tyveri, Aktivitet. Har søgning og sider. |
| `banliste.html` | Alle bans, mutes, kicks og ophævelser. Både aktive og tidligere, med filtre, søgning og 25 pr. side. |
| `spiller.html?navn=X` | Spillerprofil: stats, placeringer, team og straffe. |
| `staff.html` | Staff-holdet, delt op efter rolle, med online-status. |
| `ansog.html` | Ansøgninger (Staff, Bygger, Unban). Ansøgeren får en kode, så de kan følge med i status. |
| `admin.html` | Admin-panel: oversigt, behandling af ansøgninger, staff-liste, redigering af tekster og log. |

Spørgsmålene til ansøgningerne står i `public/ansog-skema.js` og kan rettes frit.

## Sådan hænger det sammen

```
Minecraft-server  --(WebSync.sk, hvert 5. min)-->  /api/sync  -->  Cloudflare D1
                                                                    |
Hjemmesiden  <--  /api/stats, /api/straffe, /api/staff, /api/ansog  <--
```

- **Serveren** sender data med `server/WebSync.sk`: kills, døde, spilletid, daily, fiskeri, vagtposter, tyveri, spassermine, teams/KOTH, straffe og hvem der er online.
- **Hjemmesiden** kører på Cloudflare Pages (gratis) og gemmer alt i en Cloudflare D1-database. Der skal ikke bruges MySQL.
- **Banlisten** bygges ud fra Straf.sk-historikken og husker gamle straffe, også dem Straf.sk selv sletter.
- **Staff-login** sker med SuperAwesome (OAuth med PKCE, kun scopet `player:profile`) eller med kode.

## Opsætning

Hele opsætningen står trin for trin i **[FLYT-TIL-CLOUDFLARE.md](FLYT-TIL-CLOUDFLARE.md)**.

**Mapper:**
- `public/`: selve hjemmesiden (HTML, JS og billeder).
- `functions/api/[[sti]].js`: Cloudflare Pages Functions, som sender `/api/...` videre til ruterne.
- `api/ruter/`: én fil pr. endpoint (login, sync, straffe, ansog, staff, banner, tekster, import ...).
- `api/lib/`: login og roller, D1-lager, kryptografi og læsning af Straf.sk-historik.
- `server/WebSync.sk`: scriptet på Minecraft-serveren.

**Indstillinger i Cloudflare** (Settings → Variables and Secrets):
- `TOKEN_HEMMELIGHED`, `WEB_NOEGLE` og `SA_CLIENT_SECRET` (som Secret)
- `EJERE` og `SA_CLIENT_ID`
- `ADMIN_BRUGERE` (valgfri, login med kode)

**Binding:** D1-database med navnet `DB`.

## Roller i panelet

| | Mod | Admin | Ejer |
|---|:-:|:-:|:-:|
| Behandle ansøgninger | Ja | Ja | Ja |
| Redigere forsidens tekster | Ja | Ja | Ja |
| Se log | Ja | Ja | Ja |
| Rette staff-listen (Mod, Helper, Bygger) | | Ja | Ja |
| Rette Ejere og Admins | | | Ja |

## Lokal test
Kør `npx wrangler pages dev public --d1 DB` fra Cloudflares wrangler, eller test ruterne med Node 22 (`node:sqlite` som D1).
