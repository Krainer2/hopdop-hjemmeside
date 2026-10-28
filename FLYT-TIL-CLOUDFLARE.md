# Flyt HOPDOP-hjemmesiden til Cloudflare (gratis)

Det tager cirka 15-20 minutter. Netlify-siden kører videre imens, så der er ingen nedetid.

Du skal bruge:
- **Kode A** (`TOKEN_HEMMELIGHED`)
- **Kode B** (`WEB_NOEGLE`)
- **Client ID** og **Secret** fra SuperAwesome-appen

---

## Del 1: Opret siden på Cloudflare
1. Gå til **dash.cloudflare.com** og opret en gratis konto. Det kræver ikke kreditkort.
2. Klik på **Workers & Pages** i menuen til venstre.
3. Klik på **Create** og vælg fanen **Pages** (kan også hedde *"Looking to deploy Pages? Get started"*).
4. Vælg **Connect to Git** / **Import an existing Git repository**.
5. Forbind din **GitHub**, og vælg repoet **hopdop-hjemmeside**.
6. Udfyld indstillingerne sådan her:

| Felt | Skriv |
|---|---|
| Project name | `hopdop` (er det optaget, så vælg fx `hopdop-dk`) |
| Production branch | `main` |
| Framework preset | **None** |
| Build command | *(lad det stå tomt)* |
| Build output directory | `public` |

7. Tryk **Save and Deploy**. Vent til der står **Success**.
8. Din side har nu en adresse som **https://hopdop.pages.dev**. Skriv den adresse ned. Den bruges i resten af guiden som **DIN-ADRESSE**.

## Del 2: Opret databasen
1. Gå til **Storage & Databases** → **D1 SQL Database** i menuen til venstre.
2. Tryk **Create** (kan også hedde **Create database**).
3. Database name: `hopdop`, og tryk **Create**. Du skal ikke lave tabeller, det klarer siden selv.
4. Gå tilbage til **Workers & Pages** og klik på dit **hopdop**-projekt.
5. Gå til **Settings** → **Bindings** og tryk **Add**.
6. Vælg **D1 database**:
   - **Variable name:** `DB` (præcis sådan, med store bogstaver)
   - **D1 database:** `hopdop`
7. Tryk **Save**.

## Del 3: Sæt koderne ind
1. I dit **hopdop**-projekt: **Settings** → **Variables and Secrets** → **Add**.
2. Tilføj de her fem, én ad gangen. Vælg **Production**, hvis den spørger om miljø:

| Variable name | Type | Value |
|---|---|---|
| `TOKEN_HEMMELIGHED` | **Secret** | Kode A |
| `WEB_NOEGLE` | **Secret** | Kode B |
| `EJERE` | Text | `krainer2` |
| `SA_CLIENT_ID` | Text | dit Client ID fra SuperAwesome |
| `SA_CLIENT_SECRET` | **Secret** | din Secret fra SuperAwesome |

3. Tryk **Save**.
4. Gå til **Deployments**, og tryk på de **tre prikker** ved den øverste deploy. Vælg **Retry deployment**, så siden læser koderne og databasen. Vent til der står **Success**.

## Del 4: SuperAwesome-login
1. Gå til **superawesome.dk/dashboard/apps** og åbn din app **HOPDOP Staff**.
2. Find **Tilladte redirect-URL'er**. Tilføj en ny linje, og lad den gamle stå:
   `https://DIN-ADRESSE/api/sa/callback`
   Fx `https://hopdop.pages.dev/api/sa/callback`
3. Gem.

## Del 5: Serveren
1. Åbn **WebSync.sk** på serveren (Filer → plugins → Skript → scripts).
2. Ret linjen `url:`, så der står:
   `	url: https://DIN-ADRESSE/api/sync`
3. Gem. Skriv `sk reload WebSync` i Console og `/websync` i spillet.
4. Åbn **https://DIN-ADRESSE/api/sync**. Den øverste linje skal sige `"status":200`.

## Del 6: Hent dine data fra den gamle side
1. Åbn **https://DIN-ADRESSE/admin.html** og log ind med SuperAwesome.
2. Under **Oversigt** står boksen **"Flyt data fra den gamle side"**. Adressen står allerede som `https://hopdop.netlify.app`.
3. Tryk **Hent data fra den gamle side**.
   - Staff-listen, dine rettede tekster, banneret og straf-historikken bliver kopieret over.
   - Leaderboards fylder serveren selv op.

## Færdig!
- Tjek at forsiden, leaderboards, banlisten og admin virker på den nye adresse.
- Del den nye adresse med spillerne.
- Netlify-projektet kan du slette, når du er tryg ved den nye side. Du kan også bare lade det stå, da builds er stoppet.

**Opdateringer fremover:** Hver gang der kommer noget nyt på GitHub, opdaterer Cloudflare selv siden. Det er gratis op til 500 gange om måneden.

### Hvis noget driller
- **"Databasen mangler"** i en fejl: Bindingen hedder ikke præcis `DB`, eller du har ikke lavet **Retry deployment** efter Del 2.
- **Login virker ikke:** Tjek at redirect-URL'en i SuperAwesome er præcis `https://DIN-ADRESSE/api/sa/callback`.
- **/api/sync siger "Forkert nøgle":** `noegle:` i WebSync.sk og `WEB_NOEGLE` i Cloudflare er ikke ens.
