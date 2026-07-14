# AGENTS.md

## Geltungsbereich

Diese Anweisungen gelten für das gesamte Repository `SnakeFreak85/Python-Dashboard`, sofern in einem Unterverzeichnis keine spezifischere `AGENTS.md` liegt.

## Projektkontext

- Produktname: **TerraControl**
- Aktive Codebasis: **`v500/`**
- Produktiver Einstieg: **`index.html` → `v500.html`**
- Hauptzweig: **`main`**
- Aktuelle Release-Kennung: **`1.0.4-rc.11`**
- Technische Hauptdokumentation: **`DEVELOPER_HANDBOOK.md`**

Ältere Versionsdateien sind keine Grundlage für neue Funktionen. Änderungen sollen grundsätzlich die aktive `v500`-Architektur weiterentwickeln.

## Vor jeder Änderung

1. `README.md`, `DEVELOPER_HANDBOOK.md` und die betroffenen Dateien lesen.
2. Die Script-Reihenfolge in `v500.html` prüfen.
3. Store-, AnimalEngine-, Firebase-, Foto- und Service-Worker-Abhängigkeiten klären.
4. Bestehende globale APIs und Inline-Handler erfassen.
5. Die kleinste fachlich geschlossene Änderung planen.
6. Refactoring und neue Funktionalität möglichst trennen.

## Architekturregeln

- Der lokale Store ist die führende Quelle für Anwendungsdaten.
- Wiederverwendbare tierbezogene Fachlogik gehört in `v500/animal-engine.js`.
- UI-Module dürfen Darstellung und Orchestrierung enthalten, aber keine widersprüchliche zweite Fachlogik aufbauen.
- Firebase-Zugriffe bleiben in dafür vorgesehenen Adaptern und Services gekapselt.
- Stabile Verknüpfungen verwenden UUIDs oder andere dauerhafte IDs, niemals Array-Indizes als Identität.
- Taxonomiedaten bleiben dynamisch und dürfen nicht als verstreute feste Listen dupliziert werden.
- Fehlende optionale Felder und ältere Datensätze defensiv behandeln.
- Bestehende globale APIs wie `NGT500`, `NGTStore`, `AnimalEngine` und `NGTProfile` nur bewusst und kompatibel verändern.

## Profilarchitektur

Der Tierprofilbereich ist modularisiert und wird in dieser Reihenfolge geladen:

1. `v500/modules/profile-core.js`
2. `v500/modules/profile-food.js`
3. `v500/modules/profile-health.js`
4. `v500/modules/profile-passport.js`
5. `v500/modules/profile-photos.js`
6. `v500/modules/profile.js`

`profile.js` ist der Controller und Renderer. Gemeinsame Hilfen liegen in `profile-core.js`; Futter-, Gesundheits-, Tierpass- und Fotologik bleiben in ihren Fachmodulen.

Bei Änderungen an einem Profilmodul:

- die öffentliche `NGTProfile`-API kompatibel halten,
- die Lade-Reihenfolge nicht verändern, ohne alle Abhängigkeiten zu prüfen,
- neue produktive Dateien in `service-worker.js` ergänzen,
- Profilnavigation, Formulare, Fotos und QR-Funktion manuell testen.

## Taxonomiearchitektur

Die Taxonomie wird in dieser Reihenfolge geladen:

1. `v500/taxonomy-core.js`
2. `v500/taxonomy-store.js`
3. `v500/taxonomy-cloud.js`
4. `v500/taxonomy.js`
5. `v500/taxonomy-ui-illustrations.js`
6. `v500/taxonomy-ui-decoration.js`
7. `v500/taxonomy-ui.js`

`taxonomy.js` stellt die kompatible öffentliche `NGTTaxonomy`-API bereit. Reine Normalisierung und Schlüsselbildung liegen in `taxonomy-core.js`, der lokale Cache in `taxonomy-store.js` und Firestore-Zugriffe in `taxonomy-cloud.js`. Illustrationen und DOM-Dekoration liegen in eigenen UI-Modulen; `taxonomy-ui.js` stellt die kompatible öffentliche `NGTTaxonomyUI`-API bereit. Die internen Teile kommunizieren über `window.NGTTaxonomyInternal` und `window.NGTTaxonomyUIInternal`.

Bei Änderungen an einem Taxonomiemodul:

- Speicher-Schlüssel und Firestore-Collection kompatibel halten,
- die Lade-Reihenfolge und öffentliche `NGTTaxonomy`-API nicht unbeabsichtigt ändern,
- neue produktive Dateien in `service-worker.js` ergänzen,
- Taxonomie-Test, App-Smoke-Test und Cloud-Verhalten prüfen.

## Script- und PWA-Regeln

- Neue Browserdateien müssen in `v500.html` an der korrekten Stelle eingebunden werden.
- Produktive lokale Assets müssen in der App-Shell von `service-worker.js` enthalten sein.
- Cache-Busting, `VERSION`, Manifest, HTML-Anzeige und Service-Worker-Cache müssen dieselbe Release-Kennung verwenden.
- Die Anwendung über HTTP testen, nicht über `file://`.
- Externe CDN-Ressourcen nicht ungeprüft in den Same-Origin-Cache aufnehmen.

## Coding Style

- Vanilla JavaScript und bestehende IIFE-Struktur beibehalten, solange kein eigenes ES-Module-Projekt beschlossen wurde.
- Kleine, klar benannte Funktionen bevorzugen.
- Guards und defensive Initialisierung für optionale Daten verwenden.
- Keine stillen Datenverluste, destruktiven Migrationen oder unbemerkten Schemaänderungen.
- Keine kosmetischen Großformatierungen zusammen mit Fachänderungen.
- Bestehende deutsche UI-Texte und TC2-Klassen konsistent halten.
- Fehler verständlich behandeln; technische Details zusätzlich in der Konsole protokollieren.

## Tests

Vor Abschluss mindestens:

```bash
python -m http.server 8000
```

Dann prüfen:

- `http://localhost:8000/v500/tests/animal-engine.test.html`
- `http://localhost:8000/v500/tests/taxonomy.test.html`
- `http://localhost:8000/v500/tests/app-smoke.test.html`
- `http://localhost:8000/v500/tests/tc2-ui.test.html`
- `http://localhost:8000/v500.html`

Manuelle Mindestprüfung bei UI-Änderungen:

- Anwendung startet ohne rote Konsolenfehler,
- Navigation und Drawer funktionieren,
- Tierbestand und Tierprofil öffnen,
- Speichern und Reload erhalten Daten,
- betroffene Formulare funktionieren,
- mobile Darstellung bleibt nutzbar,
- Offline-/Service-Worker-Verhalten wird bei Assetänderungen geprüft.

## Dokumentationspflicht

Im selben Änderungsschritt aktualisieren, wenn betroffen:

- `README.md` bei Einstieg, Struktur oder Bedienung,
- `DEVELOPER_HANDBOOK.md` bei Architektur, Datenmodell, Modulgrenzen oder Workflow,
- `CHANGELOG.md` bei sichtbaren oder release-relevanten Änderungen,
- `VERSION`, `manifest.json`, `v500.html` und `service-worker.js` bei einer Versionsänderung.

## Git- und PR-Regeln

- Kleine, nachvollziehbare Commits erstellen.
- Commit-Nachrichten nach Möglichkeit im Muster `type(scope): summary` schreiben.
- Keine generierten, temporären oder lokalen Dateien committen.
- Vor dem Commit den vollständigen Diff prüfen.
- Bei riskanten Refactorings einen separaten Branch oder Pull Request verwenden.
- Keine fremden Änderungen verwerfen oder überschreiben.

## Verbotene Abkürzungen

- Keine produktive Datei aus unvollständigen Ausschnitten rekonstruieren.
- Keine große Datei blind komplett ersetzen, wenn der aktuelle Stand nicht vollständig vorliegt.
- Keine Legacy-Dateien löschen, nur weil sie alt wirken; zuerst Nutzung und Einstiegspunkte belegen.
- Keine neue Architektur parallel zur bestehenden einführen, ohne Migration und klare Abschaltstrategie.
- Keine Tests als erfolgreich bezeichnen, wenn sie nicht tatsächlich ausgeführt wurden.

## Definition of Done

Eine Änderung ist erst abgeschlossen, wenn:

- die fachliche Anforderung erfüllt ist,
- bestehende Daten kompatibel bleiben,
- der Diff verständlich und begrenzt ist,
- relevante Tests ausgeführt oder ausdrücklich als nicht ausgeführt dokumentiert wurden,
- `v500.html` und `service-worker.js` bei neuen Assets konsistent sind,
- Dokumentation und Changelog bei Bedarf aktualisiert sind,
- keine bekannten roten Konsolenfehler oder offensichtlichen Regressionen verbleiben.
