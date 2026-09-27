# Web-Präsentation

## Live (ohne GitHub)

**Aktuelle URL:** https://hovering-nano-3hhm726.shipstatic.com  

Details und Claim-Link (Site dauerhaft behalten): [`deploy-shipstatic.json`](./deploy-shipstatic.json)

Neu deployen:

```bash
cd steam-age && npm run publish:web
../scripts/deploy-steam-age-web.sh
```

Hosting: [ShipStatic](https://shipstatic.com) via `npx @shipstatic/ship` — kein GitHub, kein Konto für den ersten Upload. Anonyme Deploys laufen **3 Tage**; danach **Claim-URL** einmal öffnen (kostenloser Account/API-Key optional).

## Lokal / Cursor Agent

| App | Pfad | Beschreibung |
|-----|------|--------------|
| Dampfzeitalter | [`steam-age/`](./steam-age/) | Historische Dampfkonstruktionen (Three.js) |

Build aktualisieren:

```bash
cd steam-age && npm run publish:web
```

**Cursor Cloud Agent:** Port **5174** (Forwarded Ports → Browser).

## GitHub Pages

**URL:** https://manager-4708.github.io/fragen/

Workflow `.github/workflows/pages-steam-age.yml` — läuft auf dem GitHub-Spiegel
[`manager-4708/fragen`](https://github.com/manager-4708/fragen) (ohne `.cursor/`, wegen
Push Protection). Nach Änderungen an `web/` oder `steam-age/`:

```bash
cd steam-age && npm run publish:web
export GH_TOKEN='…'   # Skill github-manager-4708
../scripts/push-github-pages-mirror.sh
```

Startseite: `web/templates/index.html` → `web/index.html` via `publish:web`.
