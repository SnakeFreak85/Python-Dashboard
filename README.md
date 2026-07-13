# TerraControl

TerraControl ist eine mobile-first Terraristik-Management-Anwendung für Tierbestand, Profile, Taxonomie, Fütterungen, Häutungen, Gewichtsdaten, Gesundheit, Fotos, Nachzuchten, QR-Funktionen, Backups und optionale Cloud-Synchronisation.

> **Aktive Codebasis:** `v500/`  
> **Produktiver Einstieg:** `index.html` → `v500.html`  
> **Release-Stand:** `1.0.4-rc.11`

## Dokumentation

- [`DEVELOPER_HANDBOOK.md`](./DEVELOPER_HANDBOOK.md) – vollständige Architektur, Datenregeln, Tests und Roadmap
- [`AGENTS.md`](./AGENTS.md) – verbindliche Repository-Anweisungen für Codex und andere Coding Agents
- [`CHANGELOG.md`](./CHANGELOG.md) – release-relevante Änderungen

## Projektstatus

Die aktuelle Anwendung basiert auf der v500-Architektur. Ältere Versionsdateien im Repository sind historische Referenzen und keine Grundlage für neue Funktionen.

Die sichtbare Anwendung wird über `index.html` geöffnet. Diese Startseite verweist auf `v500.html`, das die aktive Oberfläche und alle JavaScript-Module in definierter Reihenfolge lädt.

## Architektur

```text
Benutzeroberfläche
        │
        ▼
UI-Module und Views
        │
        ▼
Domain- und Engine-Logik
        │
        ▼
Zentraler Store
        │
        ├── lokale Persistenz / Offlinebetrieb
        └── Firebase-Adapter / Cloud-Synchronisation
```

Wichtige Prinzipien:

- Der Store ist die zentrale Quelle lokal verfügbarer Anwendungsdaten.
- Die `AnimalEngine` bündelt wiederverwendbare tierbezogene Fachlogik.
- Taxonomische Daten werden dynamisch verwaltet.
- Firebase-Logik ist von Darstellung und lokaler Datenhaltung getrennt.
- UUIDs dienen als stabile interne Identitäten; Public-IDs sind für Anzeige und Benutzerabläufe vorgesehen.
- Neue Entwicklung erfolgt mobile-first und nach dem TC2-Designstandard.

## Aktive Einstiegspunkte

| Pfad | Aufgabe |
|---|---|
| `index.html` | öffentliche Startseite und Link zur aktiven Anwendung |
| `v500.html` | produktive HTML-Shell und verbindliche Script-Reihenfolge |
| `v500/app.js` | abschließende Anwendungsinitialisierung |
| `v500/store.js` | zentraler lokaler Zustand, Persistenz und Normalisierung |
| `v500/animal-engine.js` | zentrale tierbezogene Domain-Logik |
| `v500/taxonomy.js` | Taxonomiedaten und Taxonomieoperationen |
| `v500/taxonomy-ui.js` | Taxonomie-Oberfläche |
| `v500/firebase-sync.js` | gekapselte Firebase- und Synchronisationslogik |
| `service-worker.js` | PWA- und Offline-Unterstützung |
| `manifest.json` | PWA-Metadaten |

## Profilmodule

Der Tierprofilbereich ist modularisiert und wird in dieser Reihenfolge geladen:

```text
profile-core.js
profile-food.js
profile-health.js
profile-passport.js
profile-photos.js
profile.js
```

`profile.js` rendert und orchestriert die Seite. Die Fachbereiche Futter, Gesundheit, Tierpass und Fotos liegen in eigenen Modulen. Die öffentliche `NGTProfile`-API bleibt der Integrationspunkt für Inline-Handler und andere Bereiche.

## Weitere Module

Die aktive Anwendung enthält unter anderem:

- Dashboard und Navigation,
- Tierbestand und Tierverwaltung,
- Nachzuchten,
- Futterverwaltung,
- QR-Funktionen,
- Backup und Wiederherstellung,
- Assistenz- und Chatmodule,
- Fotoablage,
- Taxonomie,
- Firebase-Synchronisation.

Die genaue Lade-Reihenfolge steht in `v500.html`. Da die Anwendung globale Browser-Namespaces verwendet, darf diese Reihenfolge nicht beiläufig verändert werden.

## Lokaler Start

TerraControl muss für vollständige PWA-, Service-Worker- und Fetch-Tests über HTTP ausgeliefert werden.

```bash
python -m http.server 8000
```

Danach öffnen:

```text
http://localhost:8000/
http://localhost:8000/v500.html
```

Ein direktes Öffnen über `file://` ist nicht ausreichend.

## Tests

AnimalEngine:

```text
http://localhost:8000/v500/tests/animal-engine.test.html
```

App-Smoke-Test:

```text
http://localhost:8000/v500/tests/app-smoke.test.html
```

Zusätzlich betroffene Funktionen manuell prüfen und die Browserkonsole auf rote Fehler kontrollieren.

## Deployment

Das Repository kann über GitHub Pages oder einen anderen statischen Webserver veröffentlicht werden. Der Server muss die Dateien unverändert mit ihren relativen Pfaden bereitstellen.

Vor einem Deployment mindestens prüfen:

1. `index.html` öffnet die aktuelle Anwendung.
2. `v500.html` lädt ohne Konsolenfehler.
3. Bestehende lokale Daten werden weiterhin gelesen.
4. Änderungen bleiben nach einem Reload erhalten.
5. Mobile Ansichten und Touch-Ziele bleiben nutzbar.
6. Offline- und Firebase-Ausfälle führen nicht zu Datenverlust.
7. Der Service Worker liefert keine veraltete Asset-Version aus.

## Datenhaltung

TerraControl arbeitet lokal-first. Der zentrale Store verwaltet den lokalen Zustand und toleriert ältere oder unvollständige Datensätze über Normalisierung und Migrationen.

Cloud-Funktionen ergänzen diese Basis:

- Firebase Authentication,
- Firestore,
- Firebase Storage,
- Synchronisation.

Konflikte zwischen lokalem und entferntem Zustand dürfen nicht allein durch zufällige Lade-Reihenfolge entschieden werden.

## Entwicklung mit Codex

Codex soll vor Änderungen in dieser Reihenfolge lesen:

1. `AGENTS.md`
2. `DEVELOPER_HANDBOOK.md`
3. die betroffenen Dateien
4. `v500.html` und gegebenenfalls `service-worker.js`

Aufträge sollten klein, überprüfbar und fachlich begrenzt sein. Große Module werden schrittweise und verhaltensneutral refaktoriert. Bei neuen produktiven Dateien müssen Script-Reihenfolge, Service-Worker-App-Shell, Tests und Dokumentation gemeinsam berücksichtigt werden.

## Historische Dateien

Ältere Versionen bleiben nur als Referenz im Repository. Sie dürfen nicht ungeprüft gelöscht oder mit der aktiven `v500`-Codebasis vermischt werden.
