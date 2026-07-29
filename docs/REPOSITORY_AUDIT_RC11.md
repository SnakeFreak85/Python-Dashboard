# TerraControl Repository-Audit

Stand: 29. Juli 2026  
Branch: `main`  
Geprüfte App-Version: `1.0.4-rc.11`  
Aktive Codebasis: `v500/`

## 1. Ziel und Umfang

Dieser Audit wurde vor weiteren Designänderungen und neuen Funktionen
durchgeführt. Geprüft wurden:

- Struktur und Modulgrenzen
- kanonischer Tierbestand und Legacy-Kompatibilität
- lokale Speicherung, Backup und Firebase-Synchronisation
- IDs, Feldnamen und Datenmigration
- Schnelleingabe und App-Chat
- Fütterungen, Gewichte, Häutungen und Gesundheit
- Tierprofil und Chronik
- Startseite und Smart Dashboard
- Futterbestand
- Fotos und HKN-Import
- QR- und Tierpass-Import
- Taxonomie und Gruppenbilder
- Service Worker und Offline-Cache

Nicht Bestandteil dieses Audits waren visuelle Neugestaltungen,
Monetarisierung oder neue Produktfunktionen.

## 2. Zusammenfassung

Die aktive `v500`-Codebasis besitzt nach der Bereinigung einen klaren
kanonischen Datenkern:

1. Tierdaten werden zentral in `data.animals[]` geführt.
2. Schreibvorgänge laufen über `NGTStore`.
3. Fachliche Normalisierung liegt in den Engines.
4. Profil, Chronik, Dashboard und KI lesen dieselben normalisierten Daten.
5. Backup und Firebase verwenden denselben vollständigen Snapshot.
6. Legacy-Listen werden nur noch als Kompatibilitätsansicht neu aufgebaut.

Die ursprünglich beobachteten Abweichungen – beispielsweise `150 g` in der
Fütterungsliste, aber `1 g` in der Chronik – entstanden durch mehrere
unterschiedliche Feldinterpretationen und Schreibwege. Diese Wege sind jetzt
vereinheitlicht.

Für die zweite geschlossene Testphase ist die Anwendung strukturell deutlich
besser abgesichert. Vor Designarbeiten wird nur noch eine kleine,
klar abgegrenzte Stabilitätsrunde empfohlen.

## 3. Aktuelle Architektur

### 3.1 Basis und Navigation

| Verantwortung | Dateien |
| --- | --- |
| Routing, Dialoge und Ereignisse | `v500/core.js` |
| App-Start und dynamische Module | `v500/app.js` |
| App-Shell und Ladeordnung | `v500.html`, `service-worker.js` |

Die Engine-Abhängigkeiten werden vor dem Store geladen. Ein Smoke-Test prüft
diese Reihenfolge dauerhaft.

### 3.2 Fachliche Datenregeln

| Verantwortung | Datei |
| --- | --- |
| Tierstatus, Historien, Fotos und Fütterungsformat | `v500/animal-engine.js` |
| Pflegeintervalle und Fälligkeiten | `v500/care-rules-engine.js` |
| Futterbestand und Mindestbestand | `v500/food-inventory-engine.js` |
| öffentliche Tier-IDs | `v500/id-manager.js` |
| Cloud-Konfliktentscheidungen | `v500/sync-policy-engine.js` |

### 3.3 Persistenz

| Verantwortung | Datei |
| --- | --- |
| kanonischer App-Store | `v500/store.js` |
| Firebase-Synchronisation | `v500/firebase-sync.js` |
| lokale Sicherung und Wiederherstellung | `v500/modules/backup.js` |
| Cloud-Fotos und Migration alter Fotos | `v500/photo-storage.js` |
| Taxonomie-Cache | `v500/taxonomy-store.js` |

### 3.4 Funktionsmodule

Die größeren Bereiche sind in Core-, Editor- und Darstellungsbestandteile
getrennt:

- Bestand: `v500/modules/animals-*.js`
- Nachzuchten: `v500/modules/offspring-*.js`
- Tierprofil: `v500/modules/profile-*.js`
- Dashboard-Daten: `v500/dashboard-data.js`
- Smart Dashboard: `v500/smart-dashboard.js`
- Schnelleingabe und Chat: `v500/ai-*.js`,
  `v500/modules/assistant-v2.js`, `v500/modules/chat.js`

## 4. Kanonisches Datenmodell

### 4.1 Tier

Die führende Sammlung ist:

```text
data.animals[]
```

Wichtige kanonische Felder:

| Zweck | Kanonisches Feld | Kompatibilitätsfelder |
| --- | --- | --- |
| interne Identität | `uuid` | `uid` |
| sichtbare Tier-ID | `publicId` | `displayId` |
| Tiergruppe | `animalGroup` | `group` beim Import |
| Gattung | `genus` | `gattung`, ältere Artfelder |
| Art | `species` | `spezies`, `subspecies`, `unterart` |
| Herkunft | `origin` | `originType` |
| Vater | `father` | `vater`, `sire` |
| Mutter | `mother` | `mutter`, `dam` |
| Standardfutter | `defaultFeeder` | `futterStandard`, `standardFeed` |
| Fütterungsintervall | `feedIntervalDays` | `feedingInterval`, `feedInterval` |
| Gewichtsintervall | `weightIntervalDays` | `weightInterval` |
| Lebenszyklus | `status` | wird kanonisch normalisiert |

Interne UUID und sichtbare Tier-ID sind getrennt. Dadurch werden Tiere aus
verschiedenen Beständen mit derselben sichtbaren ID nicht fälschlich als
Dublette behandelt.

### 4.2 Historien

| Historie | Sammlung | zentraler Schreibweg |
| --- | --- | --- |
| Fütterung | `animal.feeds[]` | `NGTStore.recordFeed()` |
| Gewicht | `animal.weights[]` | `NGTStore.recordWeight()` |
| Häutung | `animal.sheds[]` | `NGTStore.recordShed()` |
| Gesundheit | `animal.health[]` | `NGTStore.recordHealth()` |

Alle Einträge erhalten stabile IDs. Anzeige, Chronik und Löschung verwenden
dieselben normalisierten Ereignisse.

### 4.3 Fotos

Fotos werden in `animal.photos[]` geführt. Der Store stellt sicher:

- stabile Foto-ID
- genau ein gültiges Titelbild
- gemeinsame Auswahl von URL, Thumbnail oder Legacy-Daten
- atomare Ersetzung nach einer Cloud-Migration

## 5. Geprüfte Datenflüsse

### 5.1 Schnelleingabe und Chat

```text
Benutzereingabe
→ NGTAIEngine
→ NGTAIActions
→ NGTStore.record…()
→ Store-Ereignis und Synchronisation
→ Tierprofil, Chronik, Dashboard und KI-Auswertung
```

Schnelleingabe und Chat verwenden denselben Befehlsdienst. Futtergewicht und
Stückzahl sind getrennt:

- `preyWeightGrams`: Gewicht des Futtertiers
- `quantity`: Anzahl

### 5.2 Fütterung

Manuelle Profileingabe und Schnelleingabe erzeugen dasselbe Ereignismodell.
Chronik, Profil und Dashboard formatieren den Eintrag über `AnimalEngine`.

### 5.3 Gewicht, Häutung und Gesundheit

Die drei Historien verwenden den Store als einzigen Schreibweg. Aktuelle
Profilwerte werden aus der sortierten Historie abgeleitet; die gespeicherte
Reihenfolge wird dabei nicht verändert.

### 5.4 Dashboard und Smart Dashboard

`v500/dashboard-data.js` ist die gemeinsame Leseschicht für:

- aktive Tiere
- Bestand und Nachzuchten
- Fälligkeiten
- kritischen Futterbestand
- letzte Aktivitäten
- echte Dokumentdatensätze

Inaktive Tiere werden überall nach denselben Statusregeln ausgeschlossen.
Das Smart Dashboard zeigt bei Futter ausschließlich Nachkaufpositionen.

### 5.5 QR- und Tierpass-Import

Der Import:

- liest JSON-, TC1- und TC2-Daten
- trennt Quell-ID und interne UUID
- übernimmt Tiergruppe, Gattung und Art
- erzeugt lokale sichtbare IDs
- erkennt Dubletten über die UUID
- ordnet unbekannte Tiere nicht mehr pauschal Königspythons zu

### 5.6 Backup und Cloud

Lokales Backup und Firebase basieren auf `NGTStore.snapshot()`. Eine leere
Cloud darf vorhandene lokale Daten nicht überschreiben. Während eines
laufenden Speichervorgangs eintreffende Änderungen lösen einen Folgespeicher-
vorgang aus.

## 6. Im Audit behobene Hauptprobleme

### P0 – Datenverlust oder falsche Daten

- gelöschte Tiere kehrten aus Legacy-Listen zurück
- Tier- und Nachzuchtbearbeitung nutzten instabile Array-Indizes
- Fütterungsgewicht und Stückzahl wurden vermischt
- Schnelleingabe und Profil verwendeten unterschiedliche Schreibwege
- Historienfunktionen für Gewicht und Häutung fehlten
- leere Cloud konnte lokale Daten gefährden
- QR-Import verwechselte öffentliche ID und UUID

### P1 – Inkonsistente Datenmodelle

- mehrere Futterbestands-Schreibwege
- unterschiedliche Ereignisformate
- doppelte Status- und Nachzuchtregeln
- uneinheitliche Fotoquellen und fehlende Foto-IDs
- unterschiedliche Verkäuferprofile für PDF und Einstellungen
- Verkäufe und Gelege wurden als Dokumente gezählt

### P2 – Struktur und Wartbarkeit

- monolithische Nachzucht- und Profilbereiche
- parallele oder nicht mehr aktive Module
- mehrfach implementierte Dashboard-Leselogik
- falsche Engine-Ladeordnung
- Service Worker speicherte auch Fehlerantworten

## 7. Verbleibende Risiken und Prioritäten

### P1 – Vor der nächsten langfristigen Testversion bewerten

#### A. Größe des Firebase-Hauptdokuments

`v500/firebase-sync.js` speichert den gesamten App-Snapshot in einem
Firestore-Dokument. Mit vielen Tieren und langen Historien kann dieses
Dokument an die Firestore-Dokumentgrenze stoßen.

Betroffene Dateien:

- `v500/firebase-sync.js`
- `v500/store.js`
- `v500/sync-policy-engine.js`

Empfehlung:

1. Snapshot-Größe vor Cloud-Speicherung messen.
2. Frühzeitig warnen und den Speichervorgang nicht still scheitern lassen.
3. Nach der Testphase eine Aufteilung nach Benutzer und Sammlung planen.

Status nach dem Audit:

- Größenmessung, Frühwarnung und kontrollierter Abbruch sind umgesetzt.
- Die spätere Aufteilung des Hauptdokuments bleibt als strukturelles
  Refactoring bestehen.

#### B. Eingebettete Legacy- und HKN-Bilder

Ein HKN-Bild wird zunächst als Base64-Daten im Tier gespeichert. Große
Kamerabilder können Local Storage und den Cloud-Snapshot stark vergrößern.

Betroffene Dateien:

- `v500/hkn-import.js`
- `v500/modules/animals-editor.js`
- `v500/photo-storage.js`
- `v500/store.js`

Empfehlung:

1. HKN-Bilder vor dem Speichern verkleinern.
2. Bei angemeldeten Nutzern denselben Cloud-Fotopfad verwenden.
3. Eine klare lokale Größenobergrenze einführen.

Status nach dem Audit:

- Verkleinerung und lokale Größenobergrenze sind umgesetzt.
- Die Übernahme in Firebase Storage bleibt über die vorhandene
  Legacy-Fotomigration möglich; eine vollständig automatische Migration wird
  erst nach der stabilen Testphase bewertet.

### P2 – Nach der stabilen Testphase

#### C. Legacy-Bestandslisten entfernen

Die Listen `koenig`, `boas`, `geckos` und `spinnen` werden noch für
Kompatibilität erzeugt. Führend ist bereits ausschließlich `animals[]`.

Betroffene Datei:

- `v500/store.js`

Empfehlung:

- erst mit einer geplanten Schema-Migration entfernen
- vorher Backup-Import alter Dateien weiterhin testen
- nicht während der laufenden geschlossenen Testphase durchführen

Status nach dem Audit:

- Alle produktiven Schreibpfade verwenden bereits ausschließlich
  `animals[]`.
- Die vier Listen bleiben bewusst als Import- und
  Backup-Kompatibilitätsschicht bestehen.
- Eine Entfernung während RC11 wäre ein unnötiges Migrationsrisiko.

#### D. Lesenden Store-Zugriff härten

`NGTStore.data()` liefert weiterhin das lebende Store-Objekt. Die aktuellen
Produktionsmodule verwenden es nur lesend, die API könnte aber zukünftige
direkte Änderungen ermöglichen.

Empfehlung:

- gezielte Leser wie `foodInventory()`, `documents()` und `settings()`
  ergänzen
- später `data()` durch einen Snapshot oder eine schreibgeschützte Sicht
  ersetzen

Status nach dem Audit:

- Die gezielten, vom Live-Store getrennten Leser sind umgesetzt.
- Produktive Module verwenden `data()` nicht mehr.
- Die öffentliche Legacy-Funktion bleibt bis zu einer späteren
  Kompatibilitätsbereinigung erhalten.

#### E. Alte Root-Dateien archivieren

Im Repository liegen weiterhin ältere `v1-*`, `v2-*` und `v400-*`-Dateien.
Sie gehören nicht zur aktiven `v500.html`-App-Shell, erschweren aber die
Orientierung.

Das bisherige Handbuch und der Changelog erwecken teilweise den Eindruck,
diese Dateien seien bereits vollständig entfernt. Tatsächlich wurden sie nur
aus der aktiven App-Shell gelöst. Dieser Unterschied wird im Handbuch
klargestellt; historische Changelog-Einträge bleiben unverändert.

Empfehlung:

- nach dem Test öffentliche Verweise prüfen
- danach in einen klar bezeichneten Legacy-Ordner verschieben oder entfernen
- aktive öffentliche Seiten wie `abgabe.html` und `install.html` beibehalten

Status nach dem Audit:

- Es wurden 24 Root-Dateien mit den Präfixen `v1-`, `v2-` und `v400-`
  gefunden.
- Keine aktive HTML-Seite, kein Manifest und kein Service Worker verweist
  darauf.
- Eine interne Verwendung ist ausgeschlossen; mögliche externe Direktlinks
  oder Lesezeichen können lokal jedoch nicht sicher ausgeschlossen werden.
- Deshalb werden die Dateien während RC11 weder verschoben noch gelöscht.

#### F. QR-Bibliothek offline verfügbar machen

Zum Prüfzeitpunkt lud `v500.html` QRCode über ein externes CDN. Ohne vorherige
Netzverbindung konnte die App selbst offline starten, während die
QR-Erzeugung fehlte.

Betroffene Datei:

- `v500.html`

Empfehlung:

- Bibliothek später lokal versioniert ausliefern und in die App-Shell aufnehmen

Status nach dem Audit:

- QRCode.js 1.0.0 ist lokal versioniert eingebunden.
- App und Abgabeseite verwenden keine externe QR-Abhängigkeit mehr.
- Die lokale Datei ist Bestandteil der Offline-App-Shell.

### P3 – Bewusst spätere Funktionen

- echtes Dokumentencenter mit PDFs und CITES-Unterlagen
- Begrenzung auf ein Profilfoto pro Tier nach Produktentscheidung
- Community, Support und Marktplatz
- neue Designrunde für Startseite, Smart Dashboard und Bestandsicons

Diese Punkte sind keine Voraussetzung für den strukturell stabilen Datenkern.

## 8. Empfohlener weiterer Plan

### Phase A – RC11 abschließen

1. ✅ Firebase-Snapshot-Größe sichtbar prüfen.
2. ✅ HKN-/Base64-Größenrisiko begrenzen.
3. ✅ einen vollständigen manuellen Durchlauf mit realistischen Testdaten machen.
4. Backup erstellen, App-Daten löschen und Backup wiederherstellen.
5. ✅ Cloud-Speichern und Cloud-Laden mit demselben Bestand prüfen.

### Phase B – Zweite geschlossene Testphase

1. bestehenden Testtrack weiterverwenden
2. 20–25 Tester mit Puffer einladen
3. mindestens 12 Tester 14 Tage ohne Unterbrechung angemeldet lassen
4. nur kritische Fehler korrigieren
5. Feedback und Nutzung nachvollziehbar dokumentieren

### Phase C – Design

Erst nach stabiler Testphase:

1. Startseite entschlacken
2. Smart Dashboard inhaltlich priorisieren
3. Bestandsicons vereinheitlichen
4. mobile Abstände und Hierarchie prüfen

### Phase D – Neue kostenlose Funktionen

Erst nach dem Design- und Stabilitätsabschluss:

- Dokumentencenter
- Supportfunktion
- Community
- Marktplatz
- weitere kostenlose Roadmap-Funktionen

## 9. Testabdeckung

Aktueller automatisierter Umfang:

| Testsuite | Prüfungen |
| --- | ---: |
| AnimalEngine | 71 |
| Store | 38 |
| Bestand und Editor | 52 |
| Nachzuchten | 26 |
| Dashboard | 33 |
| Schnelleingabe und Chat | 34 |
| QR-Import | 26 |
| Historien | 17 |
| Taxonomie | 31 |
| TC2-Oberfläche | 49 |
| App-Smoke-Test | 100 |
| **Summe Browserprüfungen** | **477** |

Zusätzlich besteht der eigenständige Node-Store-Test.

Die Tests prüfen unter anderem:

- stabile UUID-Auflösung
- Löschen ohne Wiederkehr aus Legacy-Daten
- Ereignisformate und Lösch-IDs
- Futterabzug
- Profil- und Chronikanzeige
- Dashboard-Fälligkeiten
- Cloud-Konfliktentscheidungen
- Cloud-Snapshot-Größenlimits
- Backup-Validierung
- Modulregistrierung und Ladeordnung
- Offline-App-Shell

### Manueller Live-Durchlauf

Der veröffentlichte RC11-Stand wurde mit dem angemeldeten realen Testbestand
geprüft:

- Cloud-Laden stellte denselben Bestand mit 21 Tieren, 13 Futterpositionen
  und 3 Nachkaufpositionen wieder her.
- Firebase meldete anschließend wieder einen vollständig synchronisierten
  lokalen und entfernten Datenstand.
- Smart Dashboard und Futterverwaltung zeigten dieselben drei knappen
  Futterpositionen.
- Bestand, Tierkarten und Tierprofil wurden ohne Fehler geöffnet.
- Fütterung, Gewicht und Chronik zeigten für dasselbe Tier übereinstimmende
  Werte.
- Die Bereiche für Fütterung, Gewicht, Häutung und Gesundheit wurden ohne
  schreibende Testaktion geöffnet.
- Die Schnelleingabe wurde bis zur Eingabemaske geprüft, ohne einen neuen
  Datensatz anzulegen.
- Ein lokales JSON-Backup wurde erfolgreich erzeugt.

Nicht im produktiven Bestand durchgeführt wurde das Löschen aller App-Daten
mit anschließendem Backup-Import. Dieser Test bleibt für ein Zweitgerät oder
einen getrennten Testbestand vorgesehen, damit der reale Bestand keinem
unnötigen Wiederherstellungsrisiko ausgesetzt wird.

## 10. Freigabekriterien vor Designänderungen

Der technische Repository-Audit und die automatisierte Stabilisierung sind
abgeschlossen. Vor Designänderungen bleibt die manuelle Freigabe mit
realistischen Nutzerdaten:

- ✅ alle automatisierten Tests bleiben grün
- ✅ Firebase-Snapshot und HKN-Bildgröße sind kontrolliert
- ✅ Cloud und zentrale Datenflüsse wurden mit realistischen Daten manuell
  geprüft
- Backup-Erstellung ist geprüft; ein vollständiger Restore bleibt auf einem
  getrennten Testbestand offen
- ✅ keine neue Versionsnummer wurde ohne ausdrückliche Freigabe gesetzt

Nach diesen manuellen Prüfungen können Designänderungen isoliert erfolgen,
ohne gleichzeitig Speicherlogik, Datenmodelle oder Synchronisation umzubauen.
