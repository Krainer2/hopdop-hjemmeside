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
Minecraft-server  --(WebSync.sk, hvert 5. min)-->  /api/sync  -->  Netlify Blobs
                                                                    |
Hjemmesiden  <--  /api/stats, /api/straffe, /api/staff, /api/ansog  <--
```

- **Serveren** sender data med `server/WebSync.sk`: kills, døde, spilletid, daily, fiskeri, vagtposter, tyveri, spassermine, teams/KOTH, straffe og hvem der er online.
- **Hjemmesiden** gemmer alt i Netlify Blobs, som er gratis. Der skal ikke bruges MySQL.
- **Banlisten** bygges ud fra Straf.sk-historikken og husker gamle straffe, også dem Straf.sk selv sletter.
- **Staff-login** sker med SuperAwesome (OAuth med PKCE, kun scopet `player:profile`) eller med kode.

## Opsætning

### 1. Netlify
1. Åbn siden i Netlify. Gå til **Site configuration → Build & deploy → Continuous deployment → Link repository**, og vælg dette repo. Netlify læser selv `netlify.toml`.
2. Gå til **Site configuration → Environment variables** og tilføj:

| Navn | Værdi | Påkrævet |
|---|---|---|
| `TOKEN_HEMMELIGHED` | En lang tilfældig tekst (30+ tegn). Den skal aldrig deles. | Ja |
| `WEB_NOEGLE` | En lang tilfældig tekst (24+ tegn, kun bogstaver og tal). Den samme skal stå i `WebSync.sk`. | Ja |
| `EJERE` | `krainer2` - Minecraft-navne, der altid er Ejer (kommasepareret). | Ja |
| `SA_CLIENT_ID` | Fra din app på SuperAwesome. | Til SA-login |
| `SA_CLIENT_SECRET` | Fra din app på SuperAwesome. | Til SA-login |
| `ADMIN_BRUGERE` | `{"Navn":{"kode":"...","rolle":"admin"}}` - login med kode som reserve. | Valgfri |

3. Gå til **Deploys → Trigger deploy**.

### 2. SuperAwesome-app (login for staff)
Opret appen under **SuperAwesome → Apps og integrationer → Opret app**:
- **Appens navn:** HOPDOP Staff
- **Logo-URL:** `https://hopdop.netlify.app/assets/ikon.png`
- **Beskrivelse:** "Login til HOPDOP's admin-panel for staff."
- **Redirect-URL:** `https://hopdop.netlify.app/api/sa/callback` (skal være præcis sådan)
- **Scopes:** kun `player:profile`
- **Begrundelse:** "Vi bruger kun brugernavn og UUID til at se, om spilleren står på HOPDOP's staff-liste, så de kan logge ind i admin-panelet."

Kopiér client ID og secret ind i Netlify (se ovenfor). Mens appen er en testapp, er det kun ejeren, der kan logge ind. Ansøg om produktionsadgang, så resten af staff også kan.

### 3. Minecraft-serveren
1. Åbn `server/WebSync.sk` og skriv din `WEB_NOEGLE` ved `noegle:`.
2. Læg filen i `plugins/Skript/scripts/` og skriv `/sk reload WebSync`.
3. Skriv `/websync`. Admin-panelet viser så "Sidst synkroniseret".

Kræver **Reqn** og **skript-mirror**. Begge er allerede installeret på serveren.

### 4. Staff-listen
Log ind på `admin.html` og gå til **Staff-liste**. Tilføj alle med rolle Ejer, Admin, Mod, Helper eller Bygger.
- Mod, Admin og Ejer kan logge ind i panelet.
- Kun Admin og Ejer kan rette staff-listen.
- Kun Ejeren kan ændre Ejere og Admins.

## Roller i panelet

| | Mod | Admin | Ejer |
|---|:-:|:-:|:-:|
| Behandle ansøgninger | Ja | Ja | Ja |
| Redigere forsidens tekster | Ja | Ja | Ja |
| Se log | Ja | Ja | Ja |
| Rette staff-listen (Mod, Helper, Bygger) | | Ja | Ja |
| Rette Ejere og Admins | | | Ja |

## Lokal test
Den rigtige `@netlify/blobs`-pakke installeres af Netlify. Til lokal test kan du bruge `netlify dev` fra Netlify CLI.
