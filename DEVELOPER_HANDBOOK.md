# TerraControl Developer Handbook

> Zentrale Entwicklerdokumentation für `SnakeFreak85/Python-Dashboard`  
> **Aktive Codebasis:** `v500/`  
> **Produktiver Einstieg:** `index.html` → `v500.html`  
> **Hauptzweig:** `main`  
> **Release-Stand:** `1.0.4-rc.11`  
> **Status:** Living Document  
> **Letzte Aktualisierung:** 14. Juli 2026  
> **Operative Übergabe:** `PROJECT_HANDOFF.md`

---

## 1. Zweck

Dieses Handbuch beschreibt den aktuellen technischen Aufbau von TerraControl und ist die verbindliche Grundlage für Entwicklung, Reviews, Refactorings und den Einsatz von Coding Agents.

Es soll:

1. neue Entwickler schnell in die Codebasis einführen,
2. Architektur- und Datenregeln festhalten,
3. Abhängigkeiten und Script-Reihenfolge dokumentieren,
4. sichere Änderungs- und Testabläufe definieren,
5. geplante Arbeiten klar vom bereits implementierten Stand trennen.

Bei einem Widerspruch ist der aktuelle Code die technische Wahrheit; die Dokumentation muss dann im selben Änderungsschritt korrigiert werden.

---

## 2. Produktüberblick

TerraControl ist eine mobile-first Terraristik-Management-Anwendung. Sie verwaltet unter anderem:

- Tierbestand und Tierprofile,
- dynamische Taxonomie,
- Fütterungen, Häutungen und Gewichtsdaten,
- Gesundheitsinformationen,
- Fotos und Titelbilder,
- Nachzuchten,
- QR-Tierpass und Dokumente,
- Futterbestand,
- Backups,
- optionale Firebase-Synchronisation.

Die Anwendung ist eine statische Webanwendung auf Basis von Vanilla JavaScript, HTML und CSS. Sie arbeitet lokal-first und ergänzt diese Basis durch PWA- und Cloud-Funktionen.

---

## 3. Verbindliche Leitprinzipien

- Neue Entwicklung erfolgt ausschließlich in der aktiven `v500/`-Codebasis.
- Der Store ist die führende lokale Datenquelle.
- Wiederverwendbare Fachlogik wird zentralisiert statt in UI-Modulen dupliziert.
- Firebase-Details werden von Darstellung und lokaler Datenhaltung getrennt.
- UUIDs und dauerhafte IDs sind Identitäten; Array-Indizes sind nur Positionen.
- Taxonomie bleibt dynamisch.
- Datenzugriffe sind defensiv gegenüber älteren und unvollständigen Datensätzen.
- Refactoring und neue Funktionalität werden nach Möglichkeit getrennt.
- Änderungen müssen mobile Nutzung, Offlinebetrieb und bestehende Daten berücksichtigen.
- Dokumentation wird zusammen mit der Architektur gepflegt.

---

## 4. Aktive Repository-Struktur

```text
.
├── AGENTS.md
├── CHANGELOG.md
├── DEVELOPER_HANDBOOK.md
├── PROJECT_HANDOFF.md
├── README.md
├── VERSION
├── index.html
├── manifest.json
├── service-worker.js
├── v500.html
└── v500/
    ├── app.js
    ├── core.js
    ├── id-manager.js
    ├── store.js
    ├── ui.js
    ├── animal-engine.js
    ├── care-rules-engine.js
    ├── sync-policy-engine.js
    ├── food-inventory-engine.js
    ├── taxonomy-core.js
    ├── taxonomy-store.js
    ├── taxonomy-cloud.js
    ├── taxonomy.js
    ├── taxonomy-ui-illustrations.js
    ├── taxonomy-ui-decoration.js
    ├── taxonomy-ui.js
    ├── photo-storage.js
    ├── firebase-sync.js
    ├── ai-*.js
    ├── ai-actions.js
    ├── dashboard-data.js
    ├── smart-dashboard.js
    ├── modules/
    │   ├── dashboard.js
    │   ├── animals-core.js
    │   ├── animals-food.js
    │   ├── animals-stock.js
    │   ├── animals-editor.js
    │   ├── animals.js
    │   ├── offspring-core.js
    │   ├── offspring-editor.js
    │   ├── offspring.js
    │   ├── profile-core.js
    │   ├── profile-food.js
    │   ├── profile-health.js
    │   ├── profile-passport.js
    │   ├── profile-photos.js
    │   ├── profile.js
    │   ├── food.js
    │   ├── qr.js
    │   ├── backup.js
    │   ├── assistant-v2.js
    │   └── chat.js
    └── tests/
        ├── ai-entry.test.html
        ├── animal-engine.test.html
        ├── animals.test.html
        ├── dashboard.test.html
        ├── offspring.test.html
        ├── store.test.html
        ├── taxonomy.test.html
        ├── app-smoke.test.html
        └── tc2-ui.test.html
```

Ältere Versionsstände sind keine Grundlage für neue Features. Legacy-Dateien dürfen nur nach belegter Nichtverwendung entfernt werden.

---

## 5. Architektur

Der grundlegende Datenfluss lautet:

```text
Benutzerinteraktion
        │
        ▼
UI-Module / Views
        │
        ▼
Domain- und Engine-Logik
        │
        ▼
Zentraler Store
        │
        ├── lokale Persistenz
        ├── Migration / Normalisierung
        └── Firebase-Adapter / Cloud-Sync
```

### 5.1 UI-Schicht

Die UI-Schicht übernimmt Darstellung, Navigation, Formulare, Benutzerfeedback und Orchestrierung. Sie soll keine widersprüchliche zweite Quelle fachlicher Regeln bilden.

### 5.2 Domain- und Engine-Schicht

Die zentrale vorhandene Domänenkomponente ist `v500/animal-engine.js`. Sie bündelt wiederverwendbare tierbezogene Logik, unter anderem:

- Anzeigenamen und wissenschaftliche Namen,
- Geburtsdatum- und Altersberechnungen,
- Historiennormalisierung,
- neuesten Historieneintrag,
- Datumsabstände,
- Fütterungs- und Gewichtsintervalle.

Engines erzeugen keine DOM-Ausgabe und enthalten keine UI-spezifischen Dialogabläufe.

`v500/food-inventory-engine.js` enthält die verbindliche reine Logik für:

- Normalisierung von Futterpositionen,
- Label, Schlüssel und sortierte View-Modelle,
- Menge und Mindestbestand,
- Status und Nachkaufentscheidung.

Der Standard-Mindestbestand beträgt `5`, wenn weder `minimum` noch
`minQty` vorhanden ist. Ein ausdrücklich gespeicherter Wert `0` bleibt
erhalten. Leere Positionen gelten unabhängig davon immer als
nachzukaufen. Lesende Aufrufe liefern neue Objekte und dürfen den Store
nicht verändern.

`v500/care-rules-engine.js` ist die einzige Quelle für:

- Aktivierung und Werte von Fütterungs- und Gewichtsintervallen,
- fällige und bevorstehende Pflegeaufgaben,
- den gemeinsamen Gesundheitsstatus.

Ein ausdrücklich deaktiviertes Intervall erzeugt weder Dashboard-Aufgaben
noch KI-Hinweise oder Gesundheitsabzüge. Ist ein gültiges Intervall aktiv,
aber noch kein entsprechender Historieneintrag vorhanden, gilt die Aufgabe
als fällig. Startseite, Smart Dashboard, Profil, Tierkarten und KI müssen
diese Selektoren verwenden.

### 5.3 Store

`v500/store.js` ist die zentrale Quelle lokal verfügbarer Anwendungsdaten. Typische Aufgaben:

- Laden und Speichern,
- Zugriff auf Tiere und verwandte Daten,
- Normalisierung und Migration,
- lokale Persistenz,
- Bereitstellung für UI und Sync.

Module dürfen keine konkurrierende dauerhafte Datenhaltung aufbauen.

Produktive Module lesen Futterbestand, Dokumente und Einstellungen über
`NGTStore.foodInventory()`, `NGTStore.documents()` und
`NGTStore.settings()`. Diese Leser liefern getrennte Kopien und dürfen daher
nicht zum Schreiben verwendet werden. Änderungen laufen ausschließlich über
die fachlichen Store-Operationen. `NGTStore.data()` bleibt nur als
Legacy-Kompatibilität bestehen und darf in produktiven Modulen nicht neu
verwendet werden.

### 5.4 Firebase

`v500/firebase-sync.js` ist der aktive Adapter für Authentifizierung und
Firestore-Synchronisation. `v500/photo-storage.js` kapselt Firebase Storage.
`v500/support-service.js` kapselt die getrennten Firestore-Unterhaltungen des
Supportchats. UI-Code soll nicht verteilt direkt auf Firebase zugreifen.

Supportnachrichten gehören nicht in den zentralen Tierdaten-Snapshot. Sie
werden unter `supportThreads/{uid}/messages` gespeichert und ausschließlich
über `support-service.js` gelesen oder geschrieben. Die zugehörigen
Sicherheitsregeln liegen als einzufügender Block unter
`firebase/firestore-support.rules.snippet`.

`v500/sync-policy-engine.js` entscheidet vor jedem automatischen Cloud-Laden,
welcher Datenstand verwendet werden darf:

- ein leerer oder fehlender Cloud-Stand darf lokale Daten niemals löschen,
- ein leerer lokaler Stand darf vorhandene Cloud-Daten übernehmen,
- bei zwei unterschiedlichen Ständen entscheidet nur eine verlässliche
  zeitliche Reihenfolge automatisch,
- ohne eindeutige Reihenfolge wird ein Konflikt angezeigt,
- bewusstes manuelles Laden bleibt nach einer Bestätigung möglich.

Änderungen, die während eines laufenden Firestore-Speichervorgangs eintreffen,
müssen anschließend einen weiteren Speicherlauf auslösen.

Vor jedem Firestore-Schreibvorgang misst `sync-policy-engine.js` die
UTF-8-Größe des vollständigen Cloud-Dokuments. Ab 700 KiB wird nach
erfolgreichem Speichern gewarnt. Ab 900 KiB wird der Schreibvorgang mit einer
verständlichen Meldung gestoppt, damit die Firestore-Dokumentgrenze nicht erst
als unklarer Cloud-Fehler sichtbar wird. Die Sicherheitsgrenze lässt bewusst
Abstand für Firestore-Feldmetadaten.

Frühere Google-Drive-Implementierungen wurden aus der aktiven Codebasis
entfernt. Neue Sync-Funktionen dürfen keinen zweiten, konkurrierenden
Speicherpfad neben `firebase-sync.js` und `photo-storage.js` einführen.

### 5.5 PWA

`manifest.json` beschreibt die installierbare Anwendung. `service-worker.js` verwaltet die Offline-App-Shell und Cache-Aktualisierung. Neue produktive Assets müssen sowohl in `v500.html` eingebunden als auch in der App-Shell berücksichtigt werden.

Die QR-Erzeugung verwendet die lokal versionierte Bibliothek
`v500/vendor/qrcode.min.js`. Aktive Seiten dürfen dafür keine externe
CDN-Abhängigkeit einführen. Lizenz und Herkunft der Bibliothek liegen im
gleichen Vendor-Verzeichnis.

### 5.6 Internationalisierung

`v500/i18n.js` verwaltet die benutzerbezogene Oberflächensprache. Die Auswahl
wird ausschließlich lokal unter `terracontrol_language_v1` gespeichert und
gehört nicht zum Tierbestand oder zu einem gemeinsamen Haushalt. Sprachpakete
liegen unter `v500/locales/`; Deutsch ist die Ausgangssprache, Englisch der
verbindliche Rückfall für nicht unterstützte Gerätesprachen.

Beim ersten Start wird die Gerätesprache vorausgewählt und über einen einmaligen
TC2-Dialog bestätigt. Danach kann die Sprache jederzeit im Systembereich
geändert werden. Benutzereingaben und fachliche Tierdaten werden nicht
automatisch übersetzt. Neue feste UI-Texte müssen in den Locale-Katalog
aufgenommen werden; weitere Sprachen dürfen ohne parallele UI-Implementierung
als zusätzliche Locale-Dateien ergänzt werden.

---

## 6. Start- und Lade-Reihenfolge

`index.html` verweist auf die aktive Anwendung in `v500.html`. Dort werden die Scripts in definierter Reihenfolge geladen:

1. Kernsystem und Store-Abhängigkeiten: `core.js`, `id-manager.js`,
   `food-inventory-engine.js`, `animal-engine.js`, danach `store.js` und
   `ui.js`
2. Taxonomie und weitere Regeln: `taxonomy-core.js`, `taxonomy-store.js`,
   `taxonomy-cloud.js`, `taxonomy.js`, die Taxonomie-UI, danach
   `care-rules-engine.js` und `sync-policy-engine.js`
3. AI-, Dashboard- und Foto-Services
4. Fachmodule
5. Firebase-Synchronisation
6. `app.js` als Abschluss der Initialisierung

Eigenständige aktive Seiten wie `abgabe.html` müssen dieselbe
Abhängigkeitsreihenfolge einhalten: `animal-engine.js` wird vor `store.js`
geladen.

Die Anwendung verwendet globale Browser-Namespaces wie:

- `NGT500`
- `NGTStore`
- `AnimalEngine`
- `CareRulesEngine`
- `NGTSyncPolicyEngine`
- `FoodInventoryEngine`
- `NGTProfile`
- weitere modulbezogene APIs

Die Script-Reihenfolge ist deshalb Teil des Laufzeitvertrags. Ein Umbau auf ES Modules ist ein eigenes Architekturprojekt und darf nicht beiläufig erfolgen.

---

## 7. Tierprofil-Architektur

Der frühere Profil-Monolith wurde in fachliche Module aufgeteilt.

### 7.1 Lade-Reihenfolge

```text
profile-core.js
profile-history.js
profile-food.js
profile-health.js
profile-passport.js
profile-photos.js
profile.js
```

### 7.2 Verantwortlichkeiten

| Datei | Verantwortung |
|---|---|
| `profile-core.js` | gemeinsamer Zustand und Profil-Hilfen |
| `profile-history.js` | Gewichts- und Häutungsformulare, Listen, Diagramme und gemeinsames Löschen von Historieneinträgen |
| `profile-food.js` | Futterbestand im Profil, Fütterungsformular, Bestandsprüfung und Speichern |
| `profile-health.js` | Gesundheitsstatus, Gesundheitsformular, Historie und Speichern |
| `profile-passport.js` | QR-Payload, Tierpass, Dokumentencenter und QR-Rendering |
| `profile-photos.js` | Fotoquellen, Upload, Migration, Cover, Löschung und Viewer |
| `profile.js` | Seitenrendering, Tabs, Übersicht, Analyse und öffentliche `NGTProfile`-API |

### 7.3 Vertrag

Die öffentliche `NGTProfile`-API bleibt der Integrationspunkt für Inline-Handler und andere Module. Interne Fachmodule kommunizieren über `window.NGTProfileInternal`.

Bei Profiländerungen müssen mindestens getestet werden:

- Profil öffnen,
- Tabwechsel,
- Fütterung,
- Gewicht,
- Häutung,
- Gesundheit,
- Fotos und Viewer,
- QR-Tierpass,
- Dokumentencenter,
- Speichern und Reload.

### 7.4 Tierbestands-Architektur

Der Tierbestandsbereich wird in dieser Reihenfolge geladen:

```text
animals-core.js
animals-food.js
animals-stock.js
animals-editor.js
animals.js
```

| Datei | Verantwortung |
|---|---|
| `animals-core.js` | interner Namespace, gemeinsame Hilfen, Bestandsfilter und Gruppierung |
| `animals-food.js` | Futterbestands-Kompatibilität, Normalisierung und Auswahloptionen |
| `animals-stock.js` | Bestands-, Gruppen-, Gattungs- und Tierkarten-Rendering |
| `animals-editor.js` | Editor, Intervalle, HKN-Übernahme sowie Speichern und Löschen |
| `animals.js` | Controller, öffentliche `NGTAnimals`-API und Modulregistrierung |

Die öffentliche `NGTAnimals`-API bleibt der Integrationspunkt für Inline-Handler und andere Module. Die internen Teilmodule kommunizieren über `window.NGTAnimalsInternal`.

### 7.5 Dashboard-Datenarchitektur

`dashboard-data.js` ist die gemeinsame, rein lesende Datenebene für
`modules/dashboard.js` und `smart-dashboard.js`.

| Bereich | Gemeinsame Verantwortung |
|---|---|
| Tiere | aktive Tiere, Bestand und Nachzuchten einheitlich abgrenzen |
| Pflege | Fütterungs- und Gewichtsfälligkeiten über `CareRulesEngine` ableiten |
| Futter | Bestand sortieren und Nachkaufpositionen über `FoodInventoryEngine` bestimmen |
| Übersicht | Gruppen, Dokumentzahlen und letzte Aktivitäten bereitstellen |

Die beiden Dashboard-Controller enthalten weiterhin nur ihre jeweilige
Darstellung und Bedienaktionen. Sie dürfen keine parallelen Filter- oder
Fälligkeitsregeln neu einführen.

### 7.6 Nachzuchten-Architektur

Der Nachzuchtenbereich wird in dieser Reihenfolge geladen:

```text
offspring-core.js
offspring-editor.js
offspring.js
```

| Datei | Verantwortung |
|---|---|
| `offspring-core.js` | interner Namespace, Nachzuchtenfilter, Foto- und Futterauswahl sowie Gruppierung |
| `offspring-editor.js` | Editor und UUID-kompatibler Speicherpfad |
| `offspring.js` | Ansichts-Controller, öffentliche `NGTOffspring.save()`-API und Modulregistrierung |

Die internen Teilmodule kommunizieren über `window.NGTOffspringInternal`. Nicht verwendete frühere APIs für direktes Editor-Einfügen und separates Löschen werden nicht mehr veröffentlicht; die Profil-Löschung bleibt beim zentralen Tierbestand.

### 7.7 Gemeinsame Befehlsausführung

`ai-actions.js` ist der einzige ausführende Datenpfad für erkannte Befehle aus
`modules/assistant-v2.js` und `modules/chat.js`.

| Befehl | Zentral verwendete Store-Operation |
|---|---|
| Fütterung oder Verweigerung | `recordFeed()` |
| Gewicht | `recordWeight()` |
| Häutung | `recordShed()` |
| Standardfutter | `setAnimalDefaultFeeder()` |
| Futterbestand | `updateFoodStock()` |

Die UI-Module übergeben nur ihre Herkunft (`assistant` oder `chat`) und
formatieren die Rückmeldung. Fachfelder und Bestandswirkung dürfen dort nicht
erneut zusammengesetzt werden.

### 7.8 Taxonomie-Architektur

Die Taxonomie wird in dieser Reihenfolge geladen:

```text
taxonomy-core.js
taxonomy-store.js
taxonomy-cloud.js
taxonomy.js
taxonomy-ui-illustrations.js
taxonomy-ui-animal-icons.js
taxonomy-ui-decoration.js
taxonomy-ui.js
```

| Datei | Verantwortung |
|---|---|
| `taxonomy-core.js` | reine Normalisierung, Schlüsselbildung, Datensätze und Zusammenführung |
| `taxonomy-store.js` | lokaler Cache, Aliase, Suche, Bild-Fallbacks sowie Import und Export |
| `taxonomy-cloud.js` | Firestore-Zugriff, Cloud-Synchronisation und Bildstatus-Operationen |
| `taxonomy.js` | Controller, Auth-Ereignis und kompatible öffentliche `NGTTaxonomy`-API |
| `taxonomy-ui-illustrations.js` | Textnormalisierung, Klassifikation und generische SVG-Fallbacks |
| `taxonomy-ui-animal-icons.js` | verbindliche Auswahl der finalen Referenzbilder, Schildkrötendarstellung und leere Darstellung unbekannter Gruppen |
| `taxonomy-ui-decoration.js` | Stile, Karten-Dekoration, MutationObserver und UI-Ereignisse |
| `taxonomy-ui.js` | Controller, Initialisierung und kompatible öffentliche `NGTTaxonomyUI`-API |

Die internen Datenmodule kommunizieren über `window.NGTTaxonomyInternal`, die UI-Module über `window.NGTTaxonomyUIInternal`. Der lokale Schlüssel `terracontrol_taxonomy_cache_v1`, die Firestore-Collection `taxonomy`, das Ereignis `taxonomy:changed` sowie die öffentlichen APIs `NGTTaxonomy` und `NGTTaxonomyUI` sind Kompatibilitätsverträge.

---

## 8. Datenmodell

TerraControl arbeitet mit dynamischen, verschachtelten Datensätzen. Optional fehlende Felder müssen toleriert werden.

### 8.1 Tierdatensatz

Ein Tier kann unter anderem enthalten:

- `uuid` oder ältere ID-Felder,
- `publicId` / `displayId`,
- Name,
- Tiergruppe, Gattung, Art und Unterart,
- Morph und Geschlecht,
- Status,
- Geburts- oder Schlupfdatum,
- Herkunft, Elterntiere und Notizen,
- Fütterungs- und Gewichtsintervalle,
- aktuelle und historische Messwerte,
- Fotos und Dokumentinformationen.

### 8.2 Historien

Typische eingebettete Listen:

```text
feeds[]
sheds[]
weights[]
health[]
photos[]
```

`AnimalEngine.ensureHistories()` initialisiert diese defensiv.

Neue Gewichts-, Häutungs- und Gesundheitseinträge werden ausschließlich
über `NGTStore.recordWeight()`, `NGTStore.recordShed()` und
`NGTStore.recordHealth()` gespeichert. Die zugehörigen
`AnimalEngine.create*Event()`-Funktionen erzeugen einheitliche Ereignisse
mit stabiler `id`, Datum, Quelle und den fachlichen Feldern. Profil,
Schnelleingabe und Chat dürfen diese Listen nicht direkt verändern.

Historieneinträge werden über `NGTStore.deleteHistoryEntry()` entfernt.
Bei Gewichtseinträgen berechnet der Store danach das kompatible Feld
`animal.weight` aus dem zeitlich neuesten verbleibenden Eintrag neu.

### 8.3 Identitäten

- **UUID:** stabile technische Identität.
- **Public-ID:** sichtbare Kennung für Suche, Anzeige und QR-Abläufe.
- **Array-Index:** nur aktuelle Position; niemals dauerhafte Identität.

Neue Tier-, Profil-, Editor- und Dashboard-Routen transportieren
`animalId` mit der UUID. `NGTStore.resolveAnimal()` akzeptiert während der
Migration weiterhin ältere `{t, i}`-Referenzen, löst sie aber auf den
aktuellen kanonischen Datensatz auf. Schreib- und Löschvorgänge verwenden
`updateAnimalById()` beziehungsweise `deleteAnimalById()`.

### 8.4 Kanonischer Tierbestand und Legacy-Kompatibilität

`animals[]` ist die einzige führende Tierliste während des normalen
Speicherns. Die älteren Listen `koenig[]`, `boas[]`, `geckos[]` und
`spinnen[]` werden nur beim Laden oder Import als Migrationsquelle gelesen.
Danach werden sie ausschließlich aus `animals[]` als
Kompatibilitätsdarstellung neu aufgebaut.

Schreib- und Löschoperationen müssen deshalb über `NGTStore` auf
`animals[]` erfolgen. UI-Module dürfen die Legacy-Listen nicht parallel
manipulieren.

### 8.5 Fütterungseinträge

Neue Fütterungen werden ausschließlich über
`NGTStore.recordFeed()` gespeichert. `AnimalEngine.createFeedEvent()`
erzeugt daraus einen kanonischen Eintrag; alle Anzeigen verwenden
`AnimalEngine.formatFeedEvent()`.

Die wichtigsten Felder sind:

```text
id
date
accepted
foodInventoryId
condition
prey
variantLabel
preyWeightGrams
quantity
unit
displayLabel
source
note
```

`preyWeightGrams` bezeichnet das Gewicht eines Futtertiers,
`quantity` dessen Stückzahl. Das ältere Feld `amount` bleibt lesbar,
wird bei neuen Einträgen aber ausschließlich als kompatible Kopie von
`preyWeightGrams` geschrieben. Es darf nicht mehr als Stückzahl
interpretiert werden.

Der zentrale Store-Pfad speichert Tierhistorie und optionalen
Futterbestandsabzug in einem Vorgang. Verweigertes Futter reduziert den
Bestand nicht. Ältere Feldvarianten werden beim Lesen durch
`AnimalEngine.normalizeFeedEvent()` normalisiert, ohne bestehende
Nutzerdaten umzuschreiben.

Bestandskorrekturen aus Schnelleingabe und Chat werden ausschließlich
über `NGTStore.updateFoodStock()` gespeichert. Der Store validiert den
Modus (`set` oder `add`), gleicht bestehende Positionen über ihren
kanonischen Futterschlüssel ab, normalisiert neue Positionen und verhindert
negative Bestände. Die Eingabemodule dürfen `foodInventory[]` dafür nicht
direkt verändern.

Änderungen des Standardfutters aus diesen Eingabemodulen verwenden
`NGTStore.setAnimalDefaultFeeder()`. Dabei werden die kanonischen Felder,
die beiden Legacy-Aliasse, der Futterschlüssel und eine passende
Futterbestands-ID gemeinsam aktualisiert. Dadurch dürfen Schnelleingabe und
Chat den Tierdatensatz nicht mehr direkt verändern.

Die Futterverwaltung speichert Positionen über
`NGTStore.saveFoodInventoryItem()`, ändert Mengen über
`NGTStore.adjustFoodInventoryItem()` und löscht ausschließlich über
`NGTStore.deleteFoodInventoryItem()`. Das Futtermodul verantwortet weiterhin
Formularvalidierung, Duplikaterkennung und Benutzerbestätigung, verändert
`foodInventory[]` aber nicht direkt.

Die früheren Store-Funktionen `addFood()` und `reduceFood()` sind entfernt.
Neue Aufrufer verwenden abhängig vom Anwendungsfall
`updateFoodStock()` für erkannte Spracheingaben oder die ID-basierten
Operationen der Futterverwaltung.

Verkäuferdaten aus den Einstellungen werden mit
`NGTStore.saveSellerProfile()` gespeichert. Die Operation ersetzt nur das
Verkäuferprofil, erhält andere Einstellungen und entfernt die veralteten
globalen Pflegeintervalle. Das Einstellungsmodul spiegelt die Daten aus
Kompatibilitätsgründen zusätzlich in die bisherigen Local-Storage-Schlüssel,
verändert `NGTStore.data().settings` aber nicht direkt.

Lokale Sicherungen werden in Konto- und Backup-Ansicht ausschließlich mit
`NGTStore.exportBackup()` erzeugt und mit `NGTStore.importBackup()`
eingelesen. Das gemeinsame Format enthält App, Typ, den unveränderten
Versionsstand `1.0.4-rc.11`, Erstellungszeitpunkt und eine vom Live-Store
getrennte Datenkopie. Der Import akzeptiert weiterhin ältere rohe
TerraControl-Datensätze, validiert aber umhüllte und rohe Formate an einer
zentralen Stelle.

### 8.6 Taxonomie

Die Abhängigkeit lautet:

```text
Tiergruppe
  └── Gattung
       └── Art
            └── Unterart
```

Auswahlfelder müssen abhängige Werte nach Änderungen einer übergeordneten Ebene neu validieren.

### 8.7 Fotos

Fotos können URL-, Thumbnail-, Storage- oder Legacy-Base64-Daten enthalten. Änderungen müssen beachten:

- Cover-Fallback,
- Thumbnail-Fallback,
- Legacy-Migration,
- Löschen aus Firebase Storage,
- Offline- und Fehlerverhalten.

Herkunftsnachweis-Bilder werden vor der lokalen Einbettung über
`NGTPhotoStorage.prepareEmbeddedFile()` als JPEG verkleinert. Die Quelldatei
darf höchstens 20 MiB groß sein; das eingebettete Ergebnis höchstens 450 KiB.
Damit dürfen HKN-Importe keine unkomprimierten Kamerabilder mehr in
Local Storage und den Firestore-Hauptsnapshot übernehmen.

Normale Profilaktionen speichern Fotometadaten ausschließlich über
`NGTStore.addAnimalPhoto()`, `NGTStore.setAnimalCoverPhoto()` und
`NGTStore.deleteAnimalPhoto()`. Die Store-Operationen lösen das Tier über
seine stabile UUID auf, akzeptieren für bestehende Oberflächen vorübergehend
auch einen Foto-Index und bevorzugen eine vorhandene Foto-ID. Das eigentliche
Entfernen einer Cloud-Datei bleibt vor dem Löschen ihrer Metadaten Aufgabe
von `NGTPhotoStorage`.

Die Legacy-Migration arbeitet pro Tier auf einer Kopie der Fotoliste.
Erst wenn alle vorgesehenen Uploads dieses Tiers erfolgreich waren, ersetzt
`NGTStore.replaceAnimalPhotos()` die gesamte Liste in einem Speichervorgang.
Dadurch hinterlässt ein abgebrochener Upload keine teilweise migrierten
Fotometadaten im aktiven Tierdatensatz. Die globale Migration speichert jedes
erfolgreich abgeschlossene Tier einzeln über denselben Store-Pfad.

---

## 9. Zustandsänderungen

Der bevorzugte Ablauf lautet:

```text
Benutzereingabe
      │
      ▼
validieren / normalisieren
      │
      ▼
fachliche Operation
      │
      ▼
Store aktualisieren
      │
      ├── speichern
      ├── UI neu rendern
      └── gegebenenfalls synchronisieren
```

Verbindliche Regeln:

- Store vor DOM-Kosmetik aktualisieren.
- Abgeleitete Werte möglichst berechnen statt redundant speichern.
- Datumswerte konsistent und sortierbar halten.
- Listen vor Zugriff defensiv initialisieren.
- Destruktive Migrationen niemals still ausführen.

---

## 10. UI- und TC2-Regeln

TerraControl ist mobile-first. Neue UI muss:

- auf kleinen Displays vollständig nutzbar sein,
- ausreichende Touch-Ziele besitzen,
- bestehende TC2-Klassen und visuelle Sprache fortführen,
- klare Zustände für Laden, Erfolg, Warnung und Fehler anzeigen,
- Inline-Handler nur über stabile öffentliche APIs aufrufen,
- bestehende deutsche Begriffe konsistent verwenden.

Barrierearme Beschriftungen, sinnvolle `aria-label`-Werte und Tastaturverhalten sind insbesondere bei Modalen und Viewern zu berücksichtigen.

### 10.1 Verbindlicher TC2-App-Rahmen

Startseite und Smart Dashboard sind die visuellen Referenzen. Ihr kompakter, zentrierter Mobile-First-Rahmen ist auch auf großen Bildschirmen beabsichtigt.

- `v500.html` initialisiert den `tc2RefMode`.
- Startseite und Smart Dashboard rendern ihre Referenzköpfe selbst.
- `v500/core.js` fügt über `appTop()` allen übrigen internen Routen zentral denselben kompakten Kopf hinzu.
- Der Hamburger-Button, die Inhaltsbreite, der TC-Avatar, der dunkle Hintergrund und die Kartenradien müssen visuell konsistent bleiben.
- Einzelne Module dürfen keinen weiteren konkurrierenden App-Kopf oder eigenen Drawer einführen.
- Unteransichten und dynamisch geladene Module müssen ebenfalls über das zentrale Routing gerendert werden.
- Eigenständige öffentliche Seiten verwenden die TC2-Standalone-Klassen, weil dort kein App-Drawer verfügbar ist.

Der frühere breite, über die gesamte Desktopfläche laufende Kopf der Modul-Seiten ist nicht mehr der gewünschte Standard.

---

## 11. Lokale Entwicklung

Repository im Root-Verzeichnis über HTTP starten:

```bash
python -m http.server 8000
```

Danach:

```text
http://localhost:8000/
http://localhost:8000/v500.html
```

Ein Start über `file://` reicht für Service Worker, Manifest, Fetch und vollständige PWA-Tests nicht aus.

---

## 12. Tests

### 12.1 AnimalEngine

```text
http://localhost:8000/v500/tests/animal-engine.test.html
```

Prüft zentrale deterministische AnimalEngine-Funktionen.

### 12.2 App-Smoke-Test

```text
http://localhost:8000/v500/tests/app-smoke.test.html
```

Prüft:

- Erreichbarkeit von `v500.html`,
- lokale Start-Assets,
- globale Kern-APIs,
- Store-Zugriff,
- Modulregistrierung,
- grundlegende AnimalEngine-Ausführung.

### 12.3 Startseite und Smart Dashboard

```text
http://localhost:8000/v500/tests/dashboard.test.html
```

Charakterisiert die Abgrenzung von aktivem Bestand und Nachzuchten,
Futter- und Dokumentzahlen, gemeinsame Fälligkeiten, Gruppenauswahl,
UUID-basierte Aufgabenrouten, Aktivitäten und die gefilterte Nachkaufliste.

### 12.4 Schnelleingabe und App-Chat

```text
http://localhost:8000/v500/tests/ai-entry.test.html
```

Prüft beide Texteingaben vom erkannten Befehl über den zentralen Store-Pfad
bis zur Anzeige im Tierprofil. Abgesichert sind angenommene und verweigerte
Fütterungen einschließlich Futterbestandswirkung, Gewicht, Häutung,
Herkunftskennzeichnung und stabile Tier-UUID.

### 12.5 Nachzuchten

```text
http://localhost:8000/v500/tests/offspring.test.html
```

Prüft aktive Nachzuchtenfilter, UUID-basiertes Bearbeiten, dynamische
Futterverknüpfung, kompatible Aliasfelder, Historienerhalt und den eigenen
Nachzuchten-Nummernkreis.

### 12.6 Taxonomie

```text
http://localhost:8000/v500/tests/taxonomy.test.html
```

Charakterisiert Normalisierung, Schlüssel, lokalen Cache, Import/Export,
Bild-Fallbacks sowie Klassifikation, Illustrationen, öffentliche
`NGTTaxonomyUI`-Dekoration und die automatische Dekoration neu eingefügter
Elemente durch den DOM-Beobachter.

### 12.7 TC2-Oberfläche

```text
http://localhost:8000/v500/tests/tc2-ui.test.html
```

Prüft die TC2-Seitenrahmen der aktiven Routen, die öffentlichen HTML-Seiten, die gemeinsame Dialogsemantik, zentrale TC2-CSS-Regeln und das mobile Überlaufverhalten.

### 12.8 Store und Migration

```text
http://localhost:8000/v500/tests/store.test.html
```

Prüft den Legacy-Import, den Vorrang von `animals[]`, persistente
Löschungen, Nachzuchten, UUID-Auflösung unabhängig von Array-Positionen
und den Schutz vor ungültigen Löschindizes. Der Node-Kerntest lädt zusätzlich
versionierte Fixtures aus `v500/tests/fixtures/store/` und prüft reine
Legacy-Listen, gemischte Schema-2-Daten sowie einen aktuellen
Schema-3-Bestand auf vollständige und verlustfreie Normalisierung.

Der gleiche Kernpfad kann ohne Browser ausgeführt werden:

```bash
node tools/test-store.mjs
```

### 12.9 Manuelle Mindestprüfung

- App startet ohne rote Konsolenfehler.
- Drawer und Navigation funktionieren.
- Tierbestand und Profil öffnen.
- Änderungen bleiben nach Reload erhalten.
- Betroffene Formulare funktionieren.
- Mobile Darstellung ist nutzbar.
- Bei Assetänderungen Service Worker und Offline-Fallback prüfen.

Tests dürfen nur als erfolgreich dokumentiert werden, wenn sie tatsächlich ausgeführt wurden.

---

## 13. Coding Standards

- Bestehende IIFE- und Namespace-Struktur beibehalten.
- Kleine, klar benannte Funktionen bevorzugen.
- Eingaben validieren und optionale Werte defensiv behandeln.
- Wiederverwendbare Fachlogik zentralisieren.
- Keine kosmetischen Komplettformatierungen zusammen mit Funktionsänderungen.
- Keine unvollständigen Dateirekonstruktionen.
- Keine stillen Fehler oder Datenverluste.
- Fehlermeldungen für Benutzer verständlich formulieren; technische Details zusätzlich loggen.
- Neue produktive Assets in HTML und Service Worker konsistent eintragen.

---

## 14. Git- und Review-Workflow

Empfohlenes Commit-Format:

```text
type(scope): summary
```

Beispiele:

```text
refactor(profile): split photo operations
fix(store): preserve legacy history data
docs: update architecture handbook
test(animal-engine): cover date fallbacks
```

Vor einem Commit:

1. vollständigen Diff prüfen,
2. keine temporären oder lokalen Dateien aufnehmen,
3. relevante Tests ausführen,
4. Dokumentation bei Bedarf aktualisieren,
5. bei großen oder riskanten Änderungen einen Branch oder PR verwenden.

Fremde lokale Änderungen dürfen nicht verworfen oder überschrieben werden.

---

## 15. Dokumentationslandschaft

| Datei | Zweck |
|---|---|
| `README.md` | schneller Einstieg, Start, Architekturüberblick |
| `DEVELOPER_HANDBOOK.md` | vollständige technische Regeln und aktueller Architekturstand |
| `PROJECT_HANDOFF.md` | operativer Projektstand, feste Nutzerentscheidungen, Deployment- und Teststatus |
| `AGENTS.md` | verbindliche Arbeitsanweisungen für Codex und andere Coding Agents |
| `CHANGELOG.md` | release-relevante Änderungen |
| `VERSION` | maschinenlesbare Release-Kennung |

Architektur-, Datenmodell-, Script- oder Workflow-Änderungen müssen in der passenden Dokumentation mitgeführt werden.

---

## 16. Aktueller Refactoring-Status

### Abgeschlossen

- `v500/` als aktive Codebasis dokumentiert.
- README und Handbook konsolidiert.
- ungenutzte v1-Root-Assets aus der aktiven App-Shell entfernt; die
  physischen Legacy-Dateien bleiben bis zur Prüfung öffentlicher Verweise
  separat zu bereinigen.
- Versionierung und Cache-Busting vereinheitlicht.
- Service-Worker-App-Shell vervollständigt.
- AnimalEngine erweitert und getestet.
- Browser-Smoke-Test ergänzt.
- bestätigte Profil-Duplikate auf AnimalEngine umgestellt.
- Tierprofil in fachliche Module aufgeteilt.
- Tierbestand in Core-, Futter-, Bestands- und Editor-Teilmodule aufgeteilt.
- Taxonomiedaten in Core-, Store- und Cloud-Teilmodule mit kompatiblem Controller aufgeteilt.
- Taxonomie-UI in Illustrations-, Dekorations- und Controller-Teilmodule aufgeteilt.
- aktive und öffentliche Oberflächen auf TC2 vereinheitlicht.
- zentralen kompakten Modulkopf für alle internen Routen ergänzt; Startseite und Smart Dashboard sind die Referenz.
- zugängliche gemeinsame TC2-Dialoge anstelle nativer Browserdialoge eingeführt.
- Repository-Anweisungen für Coding Agents ergänzt.

### Nächste Prioritäten

1. Rückmeldung zur zuletzt veröffentlichten TC2-Vereinheitlichung aus der App abwarten und sichtbare Abweichungen korrigieren.
2. Nachzuchtmodul schrittweise verkleinern.
3. Store-Migrationen mit zusätzlichen Fixtures absichern.
4. Gesundheitsstatus und weitere Fachregeln aus UI-Modulen in testbare Domain-Logik verschieben.
5. Service-Worker- und Offline-Tests automatisieren; der PWABuilder-Offline-Start bleibt bis zum ausdrücklichen Auftrag zurückgestellt.

---

## 17. Bekannte technische Schulden

- globale Namespaces und feste Script-Reihenfolge,
- mehrere noch große Fachmodule,
- Inline-Handler in HTML-Strings,
- begrenzte automatisierte Browserabdeckung,
- teilweise gekoppelte UI-, Store- und Fachlogik,
- Legacy-Datenvarianten und mehrere Feldnamen,
- externer QR-Code-CDN als Laufzeitabhängigkeit.

Diese Punkte sind keine Einladung zu einem Big-Bang-Rewrite. Sie werden in kleinen, verhaltensneutralen Schritten bearbeitet.

---

## 18. Definition of Done

Eine Änderung ist abgeschlossen, wenn:

- die Anforderung erfüllt ist,
- bestehende Daten kompatibel bleiben,
- öffentliche APIs bewusst behandelt wurden,
- der Diff fachlich begrenzt und verständlich ist,
- relevante Tests ausgeführt oder als nicht ausgeführt dokumentiert wurden,
- neue Assets in `v500.html` und `service-worker.js` konsistent sind,
- Dokumentation und Changelog bei Bedarf aktualisiert sind,
- keine bekannten roten Konsolenfehler oder offensichtlichen Regressionen verbleiben.

---

## 19. Arbeitsweise mit Codex

Codex soll zuerst `AGENTS.md`, anschließend dieses Handbook, danach `PROJECT_HANDOFF.md` und erst dann die betroffenen Dateien lesen.

Die operative Übergabe ist verbindlich für Entscheidungen, die nicht allein aus dem Code hervorgehen, insbesondere Repository-Pfad, festgehaltene Version, aktueller Teststatus, TC2-Designmaßstab und bewusst vertagte Arbeiten.

Geeignete Aufträge sind klein und überprüfbar, zum Beispiel:

- „Analysiere `animals.js` und erstelle nur einen Refactoring-Plan mit Abhängigkeiten.“
- „Extrahiere eine klar abgegrenzte, reine Hilfslogik und ergänze Tests.“
- „Prüfe alle in `v500.html` geladenen lokalen Assets gegen die Service-Worker-App-Shell.“
- „Aktualisiere Dokumentation und Changelog für diese konkrete Änderung.“

Für große Umbauten soll Codex zuerst einen Plan, Risiken, betroffene Dateien und Tests nennen. Produktive Dateien dürfen nicht aus abgeschnittenen oder unvollständigen Quellen rekonstruiert werden.
