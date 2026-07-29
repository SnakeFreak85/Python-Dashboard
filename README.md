# TerraControl

TerraControl ist eine mobile-first Terraristik-Management-Anwendung für Tierbestand, Profile, Taxonomie, Fütterungen, Häutungen, Gewichtsdaten, Gesundheit, Fotos, Nachzuchten, QR-Funktionen, Backups und optionale Cloud-Synchronisation.

> **Aktive Codebasis:** `v500/`  
> **Produktiver Einstieg:** `index.html` → `v500.html`  
> **Release-Stand:** `1.0.4-rc.11`

## Dokumentation

- [`DEVELOPER_HANDBOOK.md`](./DEVELOPER_HANDBOOK.md) – vollständige Architektur, Datenregeln, Tests und Roadmap
- [`PROJECT_HANDOFF.md`](./PROJECT_HANDOFF.md) – aktueller Arbeitsstand, feste Entscheidungen und Einstieg für einen neuen Projektchat
- [`AGENTS.md`](./AGENTS.md) – verbindliche Repository-Anweisungen für Codex und andere Coding Agents
- [`CHANGELOG.md`](./CHANGELOG.md) – release-relevante Änderungen

## Projektstatus

Die aktuelle Anwendung basiert auf der v500-Architektur. Ältere Versionsdateien im Repository sind historische Referenzen und keine Grundlage für neue Funktionen.

Die sichtbare Anwendung wird über `index.html` geöffnet. Diese Startseite verweist auf `v500.html`, das die aktive Oberfläche und alle JavaScript-Module in definierter Reihenfolge lädt.

Der aktuelle operative Stand und die nächsten Schritte stehen in `PROJECT_HANDOFF.md`. Startseite und Smart Dashboard sind der verbindliche visuelle Maßstab für den kompakten TC2-App-Rahmen aller internen Seiten.

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
| `v500/taxonomy-core.js` | Normalisierung, Schlüssel und Datensatz-Zusammenführung der Taxonomie |
| `v500/taxonomy-store.js` | lokaler Taxonomie-Cache, Suche und Import/Export |
| `v500/taxonomy-cloud.js` | Firestore-Adapter und Taxonomie-Synchronisation |
| `v500/taxonomy.js` | kompatibler Controller und öffentliche `NGTTaxonomy`-API |
| `v500/taxonomy-ui-illustrations.js` | Taxonomie-Klassifikation und SVG-Illustrationen |
| `v500/taxonomy-ui-decoration.js` | Stile, DOM-Dekoration und UI-Lifecycle |
| `v500/taxonomy-ui.js` | kompatibler Controller und öffentliche `NGTTaxonomyUI`-API |
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

## Tierbestandsmodule

Der Tierbestand wird in dieser Reihenfolge geladen:

```text
animals-core.js
animals-food.js
animals-stock.js
animals-editor.js
animals.js
```

`animals.js` bleibt der Controller und stellt die kompatible öffentliche `NGTAnimals`-API bereit. Gemeinsame Hilfen, Futteranbindung, Bestandsansicht und Editor liegen in getrennten internen Modulen.

## Dashboard-Daten

`dashboard-data.js` ist die gemeinsame lesende Datenebene für Startseite und
Smart Dashboard. Aktive Tiere, Bestand, Nachzuchten, Fälligkeiten,
Dokumentzahlen, Gruppen, Aktivitäten und kritische Futterpositionen werden dort
einheitlich ermittelt. Die beiden Dashboard-Dateien bleiben für Darstellung und
Bedienaktionen verantwortlich.

## Nachzuchtenmodule

Der Nachzuchtenbereich wird in dieser Reihenfolge geladen:

```text
offspring-core.js
offspring-editor.js
offspring.js
```

`offspring.js` rendert und orchestriert die Ansichten. Gemeinsame Fach- und Auswahllogik liegt in `offspring-core.js`, der Editor mit seinem Speicherpfad in `offspring-editor.js`. Die öffentliche `NGTOffspring.save()`-Funktion bleibt für den Formular-Handler kompatibel.

## Taxonomiemodule

Die Taxonomie wird in dieser Reihenfolge geladen:

```text
taxonomy-core.js
taxonomy-store.js
taxonomy-cloud.js
taxonomy.js
taxonomy-ui-illustrations.js
taxonomy-ui-decoration.js
taxonomy-ui.js
```

`taxonomy.js` bleibt der Daten-Controller und stellt die kompatible öffentliche `NGTTaxonomy`-API bereit. `taxonomy-ui.js` bleibt der UI-Controller und stellt `NGTTaxonomyUI` bereit. Normalisierung, lokaler Cache, Cloud-Synchronisation, Illustrationen und DOM-Dekoration liegen in getrennten internen Modulen.

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

Startseite und Smart Dashboard:

```text
http://localhost:8000/v500/tests/dashboard.test.html
```

Schnelleingabe und App-Chat:

```text
http://localhost:8000/v500/tests/ai-entry.test.html
```

Tierbestandsmodule:

```text
http://localhost:8000/v500/tests/animals.test.html
```

Nachzuchten:

```text
http://localhost:8000/v500/tests/offspring.test.html
```

Store, Migration und persistente Löschung:

```text
http://localhost:8000/v500/tests/store.test.html
```

Der Store-Kerntest kann zusätzlich direkt ausgeführt werden:

```bash
node tools/test-store.mjs
```

Der Kerntest lädt außerdem realistische Datenstände aus
`v500/tests/fixtures/store/`: reine Legacy-Listen ohne Schemaangabe,
gemischte Schema-2-Daten und einen aktuellen Schema-3-Bestand.

Taxonomie und Taxonomie-UI:

```text
http://localhost:8000/v500/tests/taxonomy.test.html
```

TC2-Oberfläche und öffentliche Seiten:

```text
http://localhost:8000/v500/tests/tc2-ui.test.html
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
3. `PROJECT_HANDOFF.md`
4. die betroffenen Dateien
5. `v500.html` und gegebenenfalls `service-worker.js`

Aufträge sollten klein, überprüfbar und fachlich begrenzt sein. Große Module werden schrittweise und verhaltensneutral refaktoriert. Bei neuen produktiven Dateien müssen Script-Reihenfolge, Service-Worker-App-Shell, Tests und Dokumentation gemeinsam berücksichtigt werden.

## Historische Dateien

Ältere Versionen bleiben nur als Referenz im Repository. Sie dürfen nicht ungeprüft gelöscht oder mit der aktiven `v500`-Codebasis vermischt werden.
