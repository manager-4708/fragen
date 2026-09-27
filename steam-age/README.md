# Dampfzeitalter (Web)

Physikalische Browser-Simulation historischer Dampfkonstruktionen (JavaScript, Vite, Three.js).

## Start

```bash
cd steam-age
npm install
npm run dev
```

Öffnen: `http://localhost:5174`

## Im Web präsentieren

**Öffentlich (ohne GitHub):** https://hovering-nano-3hhm726.shipstatic.com  

Deploy erneuern:

```bash
npm run publish:web
../scripts/deploy-steam-age-web.sh
```

**Cursor Cloud Agent:** Port **5174** → Forwarded Ports → Browser.

Statischer Build im Repo: `web/steam-age/` (siehe `web/README.md`).

## Tests

```bash
npm test
```

Prüft u. a., dass Watt bei gleicher Pumpaufgabe mehr Fortschritt pro Kohle liefert als Newcomen.

## Konstruktionen

Sieben Epochenmodelle in `src/data/constructions.js` — jeweils mit Museum/Realtyp-Verweis.

## Bedienung

1. Epoche in der Timeline wählen (Konstruktion laden).
2. **Kohle nachlegen**, dann **Dampf an**.
3. Kohlehaufen und Energiefluss beobachten; optional Ghost-Vergleich mit Newcomen.
