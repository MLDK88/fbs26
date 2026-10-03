# Årshjulet – fbs26.dk

Klassens årshjul for Frederik Barfods Skole, årgang 2026 (Bh. klasse 2026/27 → 9. klasse 2035/36).
Lavet af forældre, til forældre. Ikke en officiel side fra skolen.

Siden ligger på **https://fbs26.dk** og kræver en fælles adgangskode.

## Sådan virker det

- Det er en helt almindelig statisk hjemmeside (HTML, CSS og JavaScript). Der er ingen server og intet byggetrin.
- GitHub Pages viser siden gratis, med HTTPS-certifikat. Domænet fbs26.dk ligger hos Simply.com og peger på GitHub.
- **Børnenes navne, grupper og fødselsdage er krypteret** med sidens adgangskode (`data/class.enc.json`).
  Selv om koden ligger offentligt på GitHub, kan ingen læse dataene uden adgangskoden.
- **SkoleIntra-kalenderen** hentes automatisk fire gange i døgnet af en GitHub Action
  (`.github/workflows/calendar.yml`). Den gemmes også krypteret (`data/calendar.enc.json`).
  Beskrivelser fra SkoleIntra (med voksnes navne) bliver smidt væk.

## Hemmeligheder (GitHub → Settings → Secrets and variables → Actions)

| Navn | Indhold |
|---|---|
| `SITE_PASSWORD` | Sidens adgangskode |
| `CLASS_CALENDAR_ICS` | SkoleIntra-kalenderens iCal-link (indeholder en personlig nøgle – del det aldrig) |

Hvis SkoleIntra-linket slipper ud: lav et nyt link i SkoleIntra og opdater hemmeligheden.

## Almindelige ændringer

### Tilføje en dato som gruppen har aftalt (fx Halloween)
Ret `data/overrides.json` direkte på GitHub (blyant-ikonet) og tilføj en linje:
```json
"2026-27.halloween": "2026-10-30T16:00"
```
Nøglen er `skoleår.opgave`. Opgaverne hedder: `referent1`, `foraeldredag`, `halloween`, `jul`,
`kontakt`, `foraeldrefest`, `referent2`, `koloni`, `sommerfest`.

### Rette grupper, børn, opgaver eller fordelingen
Dataene er krypteret, så det kræver en computer med Python:
```bash
pip install cryptography
python scripts/encrypt_class.py --decrypt   # laver private/class.json
# ret private/class.json
python scripts/encrypt_class.py             # krypterer igen til data/class.enc.json
```
`private/` bliver aldrig lagt på GitHub. Commit og push `data/class.enc.json`.

### Skifte adgangskode
1. Dekrypter med den gamle kode (`--decrypt` ovenfor), krypter igen med den nye.
2. Opdater hemmeligheden `SITE_PASSWORD` på GitHub.
3. Kør "Hent SkoleIntra-kalender" under fanen Actions (knappen *Run workflow*), så kalenderen også bliver krypteret med den nye kode.

### Hente kalenderen med det samme
GitHub → fanen **Actions** → *Hent SkoleIntra-kalender* → *Run workflow*.

## Se siden lokalt
```bash
python -m http.server 8000
```
og åbn http://localhost:8000. Tilføj `?dato=2026-12-10` for at se siden, som den ser ud en anden dag.

## Filer

- `index.html`, `css/style.css`, `js/` – selve siden
- `js/i18n.js` – alle tekster på dansk og engelsk
- `js/model.js` – reglerne (skoleår, status, match mellem opgaver og SkoleIntra)
- `js/wheel.js` – årshjulet
- `scripts/` – kryptering og hentning af SkoleIntra
- `CNAME` – fortæller GitHub at siden hedder fbs26.dk
