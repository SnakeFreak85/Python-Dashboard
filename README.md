# TerraControl

TerraControl ist eine mobile-first Terraristik-Management-Anwendung für Tierbestand, Profile, Taxonomie, Fütterungen, Häutungen, Gewichtsdaten, Gesundheit, Fotos, Nachzuchten, QR-Funktionen, Backups und optionale Cloud-Synchronisation.

> **Aktive Codebasis:** `v500/`  
> **Produktiver Einstieg:** `index.html` → `v500.html`  
> **Zentrale Entwicklerdokumentation:** [`DEVELOPER_HANDBOOK.md`](./DEVELOPER_HANDBOOK.md)

## Projektstatus

Die aktuelle Anwendung basiert auf der v500-Architektur. Ältere Versionsdateien im Repository sind historische Referenzen und sollen nicht als Grundlage für neue Funktionen verwendet werden.

Die sichtbare Anwendung wird über `index.html` geöffnet. Diese Startseite verweist auf `v500.html`, das die aktive Oberfläche und die JavaScript-Module in definierter Reihenfolge lädt.

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

Wichtige Architekturprinzipien:

- Der Store ist die zentrale Quelle lokal verfügbarer Anwendungsdaten.
- Die `AnimalEngine` bündelt wiederverwendbare tierbezogene Geschäftslogik.
- Taxonomische Daten werden dynamisch verwaltet.
- Firebase-Logik ist von Darstellung und lokaler Datenhaltung getrennt.
- UUIDs dienen als stabile interne Identitäten; Public-IDs sind für Anzeige und Benutzerabläufe vorgesehen.
- Neue Entwicklung erfolgt mobile-first und nach dem TC2-Designstandard.

## Aktive Einstiegspunkte

| Pfad | Aufgabe |
|---|---|
| `index.html` | Öffentliche Startseite und Link zur aktiven Anwendung |
| `v500.html` | Produktive HTML-Shell und verbindliche Script-Reihenfolge |
| `v500/app.js` | Abschließende Anwendungsinitialisierung |
| `v500/store.js` | Zentraler lokaler Zustand, Persistenz und Normalisierung |
| `v500/animal-engine.js` | Zentrale tierbezogene Domain-Logik |
| `v500/taxonomy.js` | Taxonomiedaten und Taxonomieoperationen |
| `v500/taxonomy-ui.js` | Taxonomie-Oberfläche |
| `v500/firebase-sync.js` | Gekapselte Firebase- und Synchronisationslogik |
| `service-worker.js` | PWA- und Offline-Unterstützung |
| `manifest.json` | PWA-Metadaten |

## Modulübersicht

Die aktive Anwendung lädt unter anderem folgende Bereiche:

- Dashboard und Navigation
- Tierbestand und Tierverwaltung
- Nachzuchten
- Tierprofile
- Futterverwaltung
- QR-Funktionen
- Backup und Wiederherstellung
- Assistenz- und Chatmodule
- Fotoablage
- Taxonomie
- Firebase-Synchronisation

Die genaue Lade-Reihenfolge steht in `v500.html`. Da die Anwendung globale Browser-Namespaces verwendet, darf diese Reihenfolge nicht beiläufig verändert werden.

## Lokaler Start

TerraControl ist eine statische Webanwendung. Für lokale Entwicklung sollte das Repository über einen statischen HTTP-Server ausgeliefert werden, damit Service Worker, Manifest und relative Modulpfade korrekt funktionieren.

Beispiel mit Python:

```bash
python -m http.server 8000
```

Anschließend im Browser öffnen:

```text
http://localhost:8000/
```

Ein direktes Öffnen der HTML-Dateien über `file://` ist für vollständige PWA-, Offline- und Cloud-Tests nicht ausreichend.

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

Cloud-Funktionen ergänzen diese lokale Basis:

- Firebase Authentication
- Firestore
- Firebase Storage
- Synchronisation

Konflikte zwischen lokalem und entferntem Zustand dürfen nicht allein durch zufällige Lade-Reihenfolge entschieden werden.

## Entwicklung

Vor jeder Änderung:

1. betroffene Dateien vollständig lesen,
2. Store-, Engine- und Firebase-Abhängigkeiten prüfen,
3. Legacy-Daten berücksichtigen,
4. die kleinste fachlich geschlossene Änderung planen,
5. Refactoring und neue Funktion nach Möglichkeit trennen.

Umfangreiche Dateien wie `v500/modules/profile.js`, `v500/modules/animals.js`, `v500/taxonomy.js`, `v500/taxonomy-ui.js` und `v500/modules/offspring.js` sind bekannte Refactoring-Kandidaten. Änderungen an diesen Dateien benötigen besonders gezielte Tests.

## Dokumentation

Das [`DEVELOPER_HANDBOOK.md`](./DEVELOPER_HANDBOOK.md) ist die zentrale technische Dokumentation. Es beschreibt:

- Architektur und Datenfluss,
- Store, Engines und Firebase,
- Datenmodell und Identitäten,
- Entwicklungs- und Testworkflow,
- bekannte Risiken,
- Refactoring-Roadmap,
- Definition of Done.

Bei Änderungen an Architektur, Datenmodell, Store-, Engine- oder Synchronisationsverträgen muss das Handbook im selben Änderungsschritt aktualisiert werden.

## Historische Dateien

Ältere Versionen bleiben vorerst als Referenz im Repository. Sie dürfen nicht ungeprüft gelöscht oder mit der aktiven `v500`-Codebasis vermischt werden. Eine spätere Archivierung soll als eigener, nachvollziehbarer Änderungsschritt erfolgen.
