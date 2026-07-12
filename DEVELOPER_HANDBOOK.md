# TerraControl Developer Handbook

> Zentrale Entwicklerdokumentation für `SnakeFreak85/Python-Dashboard`.
>
> **Aktuelle Codebasis:** `v500/`  
> **Hauptzweig:** `main`  
> **Dokumentstatus:** Living Document – bei Architektur-, Datenmodell- oder Workflow-Änderungen mitpflegen.

---

## 1. Zweck dieses Handbuchs

Dieses Handbuch beschreibt den tatsächlichen technischen Aufbau von TerraControl und dient als Einstiegspunkt für Entwicklung, Wartung und Reviews.

Es verfolgt vier Ziele:

1. neue Entwickler schnell in die Codebasis einführen,
2. verbindliche Architekturprinzipien festhalten,
3. Datenflüsse und Modulgrenzen nachvollziehbar machen,
4. veraltete Annahmen und parallele Implementierungen vermeiden.

Die Implementierung im Repository bleibt im Konfliktfall die technische Wahrheit. Widersprüche zwischen Dokumentation und Code sind durch eine Aktualisierung dieses Handbuchs zu beheben.

---

## 2. Projektüberblick

TerraControl ist eine mobile-first Terraristik-Management-Anwendung. Sie verwaltet Tiere, Taxonomie, Profile, Fütterungen, Häutungen, Gewichtsdaten, Gesundheitsinformationen, Fotos, Nachzuchten und weitere haltungsrelevante Daten.

Die Anwendung ist als statische Webanwendung aufgebaut und nutzt Vanilla JavaScript. Lokale Datenhaltung, Offline-Fähigkeit und Cloud-Synchronisation werden klar voneinander getrennt.

### Leitprinzipien

- dynamische statt fest codierter Stammdaten,
- mobile-first Benutzeroberfläche,
- zentrale lokale Datenhaltung,
- gekapselte Cloud-Anbindung,
- eindeutige interne Identitäten,
- Trennung von Darstellung, Geschäftslogik und Persistenz,
- schrittweise Modernisierung ohne unnötige Parallelarchitekturen.

---

## 3. Gültige Codebasis

Die aktuelle Anwendung liegt unter:

```text
v500/
```

Ältere Versionsstände im Repository sind historische Referenzen und keine Grundlage für neue Funktionen. Änderungen sollen grundsätzlich in der aktuellen Codebasis erfolgen.

Historische Dateien dürfen nicht ungeprüft gelöscht werden. Eine spätere Archivierung soll als eigener, nachvollziehbarer Änderungsschritt erfolgen.

---

## 4. Architekturübersicht

TerraControl folgt konzeptionell diesem Datenfluss:

```text
Benutzerinteraktion
        │
        ▼
UI-Module und Views
        │
        ▼
Domain-/Engine-Logik
        │
        ▼
Zentraler Store
        │
        ├── lokale Persistenz / Offlinebetrieb
        │
        └── Firebase-Adapter / Cloud-Synchronisation
```

Die Trennung ist ein Zielbild und in der aktuellen Codebasis weitgehend vorhanden. Größere ältere Module enthalten jedoch teilweise noch Darstellung, Orchestrierung und fachliche Hilfslogik in derselben Datei. Neue Änderungen sollen diese Kopplung nicht weiter verstärken.

### 4.1 UI-Schicht

Die UI-Schicht ist verantwortlich für:

- Darstellung,
- Navigation,
- Formulare,
- Benutzereingaben,
- Dialoge,
- visuelles Feedback,
- Aufruf fachlicher Operationen.

UI-Code soll keine zweite, unabhängige Quelle fachlicher Regeln bilden.

### 4.2 Engines und Domain-Logik

Engines bündeln wiederverwendbare Geschäftslogik. Die zentrale vorhandene Domänenkomponente ist die `AnimalEngine`.

Eine Engine soll:

- Eingaben validieren und normalisieren,
- fachliche Regeln zentral anwenden,
- Berechnungen durchführen,
- konsistente Ergebnisse an UI oder Store liefern,
- keine DOM-Darstellung erzeugen,
- keine Firebase-Details in die Oberfläche leaken.

Weitere Engines wie Reminder-, Health-, Statistics-, Search-, Photo- oder Document-Logik sind nur dann als eigenständige Komponenten anzulegen, wenn sie eine klar abgegrenzte fachliche Verantwortung besitzen. Geplante Komponenten dürfen nicht als bereits vollständig implementiert dokumentiert werden.

### 4.3 Zentraler Store

Der Store ist die zentrale Quelle für lokal verfügbare Anwendungsdaten.

Typische Aufgaben:

- Laden und Speichern des Anwendungszustands,
- Zugriff auf Tiere und verwandte Datensätze,
- lokale Persistenz,
- Datenmigration und Normalisierung,
- Benachrichtigung abhängiger UI-Bereiche,
- Vorbereitung oder Übernahme von Synchronisationsdaten.

Module sollen Daten nicht in konkurrierenden lokalen Strukturen dauerhaft duplizieren.

### 4.4 Firebase-Schicht

Firebase ist gekapselt und dient der Cloud-Funktionalität:

- Authentifizierung,
- Firestore-Datenhaltung,
- Firebase Storage,
- Synchronisation.

Cloud-Code darf keine Darstellungslogik enthalten. UI-Module sollen möglichst über definierte Adapter oder Service-Funktionen statt über direkte, verteilte Firebase-Aufrufe arbeiten.

---

## 5. Laufzeit und Initialisierung

TerraControl wird als statische Webanwendung ausgeliefert. Der typische Startablauf ist:

1. HTML, Styles und JavaScript-Dateien werden geladen.
2. Globale Kernobjekte und Hilfsfunktionen werden registriert.
3. Der lokale Store wird initialisiert und normalisiert.
4. Module binden Ereignisse und rendern ihre Startansicht.
5. Falls Cloud-Funktionen aktiv sind, wird Firebase initialisiert.
6. Lokaler und entfernter Zustand werden nach den implementierten Synchronisationsregeln abgeglichen.
7. Die UI reagiert auf Store-Änderungen und Benutzeraktionen.

Bei Änderungen der Lade-Reihenfolge ist besonders auf globale Abhängigkeiten zu achten. Die aktuelle Codebasis verwendet browserweite Namespaces wie `NGT500`, `NGTStore` und modulbezogene globale APIs. Ein Umbau auf ES-Module wäre ein eigenes Architekturprojekt und darf nicht beiläufig innerhalb einer Fachänderung begonnen werden.

---

## 6. Modulstruktur

Die Anwendung ist nach fachlichen und technischen Verantwortlichkeiten gegliedert. Wichtige Bereiche sind unter anderem:

- Tierbestand und Tierverwaltung,
- Tierprofil,
- Taxonomie und Taxonomie-UI,
- Nachzuchten,
- Fütterungs-, Häutungs- und Gewichtsverläufe,
- Gesundheit und Dokumentation,
- Fotos und Mediendaten,
- Store und Persistenz,
- Firebase-Integration,
- Dashboard und Navigation.

### Bekannte große Module

Folgende Dateien sind besonders umfangreich und deshalb bei Änderungen risikoreich:

| Datei | Größenordnung | Schwerpunkt |
|---|---:|---|
| `v500/modules/profile.js` | ca. 1.990 Zeilen | Tierprofil, Tabs, Formulare, Historien, Fotos |
| `v500/taxonomy.js` | ca. 1.700 Zeilen | Taxonomiedaten und -operationen |
| `v500/modules/animals.js` | ca. 1.490 Zeilen | Tierliste und Tierverwaltung |
| `v500/taxonomy-ui.js` | ca. 1.270 Zeilen | Taxonomie-Oberfläche |
| `v500/modules/offspring.js` | ca. 1.150 Zeilen | Nachzuchten und zugehörige Abläufe |

Diese Zahlen sind Richtwerte aus dem Architektur-Audit und können sich durch spätere Commits ändern.

### Regeln für große Module

- Vor Änderungen vollständigen Kontrollfluss und globale Abhängigkeiten prüfen.
- Fachliche Hilfslogik bevorzugt in klar benannte Funktionen oder Engines extrahieren.
- Keine rein kosmetische Aufteilung ohne bessere Verantwortungsgrenzen.
- Refactorings von Funktionsänderungen möglichst trennen.
- Bestehendes Verhalten durch gezielte manuelle Tests absichern.

---

## 7. AnimalEngine

Die `AnimalEngine` ist die zentrale fachliche Abstraktion für tierbezogene Operationen.

Sie soll langfristig die Regeln bündeln, die in mehreren UI-Bereichen benötigt werden, beispielsweise:

- Erzeugen und Normalisieren von Tierdatensätzen,
- Ableitung von Anzeigenamen und wissenschaftlichen Namen,
- Status- und Aktivitätslogik,
- Auswertung letzter Fütterungen, Häutungen oder Wiegungen,
- Berechnung fälliger Aktivitäten,
- Validierung tierbezogener Eingaben,
- konsistente Behandlung von UUID und Public-ID.

UI-Module dürfen Darstellungshelfer besitzen, sollen aber keine widersprüchlichen fachlichen Berechnungen parallel zur Engine aufbauen.

---

## 8. Datenmodell

TerraControl verwaltet dynamische, verschachtelte Datensätze. Das konkrete Schema kann durch Migrationen erweitert werden. Code muss deshalb mit fehlenden optionalen Feldern umgehen können.

### 8.1 Tier

Ein Tierdatensatz enthält typischerweise:

- interne UUID,
- benutzerorientierte Public-ID,
- Name,
- Tiergruppe,
- Gattung,
- Art,
- Unterart,
- Morph,
- Geschlecht,
- Status,
- Geburts- oder Schlupfdatum,
- Einzugsdatum,
- Herkunft und Züchter,
- optionale Preis- und Wertangaben,
- Profil- und Haltungsdaten,
- Historien und Medien.

### 8.2 Eingebettete Historien

Tierdatensätze können Listen wie diese enthalten:

```text
feeds[]
sheds[]
weights[]
health[]
photos[]
```

Module müssen diese Felder defensiv initialisieren, wenn ältere Datensätze sie noch nicht besitzen.

### 8.3 Identitäten

#### UUID

Die UUID ist die stabile technische Identität eines Datensatzes. Sie wird für interne Verknüpfungen genutzt und darf nachträglich nicht anhand sichtbarer Attribute neu berechnet werden.

#### Public-ID

Die Public-ID ist für Anzeige, Suche, QR-Code und Arbeitsabläufe des Benutzers gedacht. Sie ist nicht mit einem Array-Index gleichzusetzen.

### 8.4 Taxonomie

Taxonomische Werte sind dynamische Daten. Tiergruppen, Gattungen, Arten und Unterarten dürfen nicht über verstreute feste Listen in UI-Modulen definiert werden.

Die Abhängigkeit folgt grundsätzlich:

```text
Tiergruppe
  └── Gattung
       └── Art
            └── Unterart
```

Auswahlfelder müssen nach Änderungen übergeordneter Ebenen abhängige Werte neu validieren.

### 8.5 Fotos

Ein Tier kann mehrere Fotos besitzen. Ein Bild kann als Haupt- bzw. Coverbild markiert werden. Die Codebasis berücksichtigt unterschiedliche Quellen und ältere Bildformate, darunter URL-, Thumbnail- und lokale Datenrepräsentationen.

Änderungen an Fotos müssen deshalb beachten:

- Cover-Fallback,
- Thumbnail-Fallback,
- Legacy-Daten,
- lokale und entfernte Quellen,
- Löschung verknüpfter Storage-Daten,
- Offline-Verhalten.

### 8.6 Nachzuchten

Nachzuchten sind eigenständige fachliche Datensätze und können mit Elterntieren, Gelegen, Schlupfdaten, Identitäten und späteren Tierdatensätzen verknüpft sein.

Verknüpfungen sollen über stabile IDs und nicht über Listenpositionen erfolgen.

---

## 9. Datenfluss und Zustandsänderungen

Für eine typische Änderung gilt:

```text
Formular / Aktion
      │
      ▼
Eingabe lesen
      │
      ▼
validieren und normalisieren
      │
      ▼
fachliche Operation ausführen
      │
      ▼
Store aktualisieren
      │
      ├── lokal persistieren
      ├── betroffene UI neu rendern
      └── gegebenenfalls Cloud-Sync auslösen
```

### Verbindliche Regeln

- Nicht zuerst DOM und später Daten korrigieren; der Store ist führend.
- Abgeleitete Werte nach Möglichkeit berechnen statt redundant speichern.
- Datumswerte in einem konsistenten, sortierbaren Format halten.
- Optionale Listen vor Zugriff normalisieren.
- Fehler nicht still verschlucken, wenn dadurch Datenverlust droht.

---

## 10. Lokale Persistenz und Migrationen

Da ältere Datenstände weiter nutzbar bleiben sollen, muss neuer Code tolerant gegenüber unvollständigen Datensätzen sein.

Eine Migration oder Normalisierung soll:

1. bestehende Nutzerdaten erhalten,
2. fehlende Felder mit sicheren Defaults ergänzen,
3. keine stabilen IDs verändern,
4. wiederholbar sein,
5. unbekannte Felder nicht unnötig entfernen,
6. vor persistierenden Änderungen getestet werden.

Migrationslogik gehört zentral in den Store- oder Persistenzbereich und nicht verteilt in mehrere Views.

---

## 11. Offline- und Cloud-Verhalten

TerraControl soll lokal funktionsfähig bleiben. Cloud-Synchronisation erweitert die lokale Anwendung, ersetzt aber nicht ihre stabile Datenbasis.

Bei synchronisierten Änderungen sind mindestens diese Fälle zu bedenken:

- Benutzer ist nicht angemeldet,
- Netzwerk ist nicht verfügbar,
- lokaler Stand ist neuer,
- Cloud-Stand ist neuer,
- Datensatz wurde lokal oder remote gelöscht,
- Upload einer Datei ist nur teilweise abgeschlossen,
- ältere Datenschemata treffen auf aktuelle Module.

Konfliktregeln müssen explizit sein. Ein stilles Überschreiben aufgrund einer zufälligen Lade-Reihenfolge ist zu vermeiden.

---

## 12. UI- und Designstandard

Der aktuelle Designstandard wird projektintern als **TC2** bezeichnet.

Kennzeichen:

- mobile-first,
- hochwertige, ruhige Darstellung,
- dunkles Grundthema,
- blaue Flächen und grüne Akzente,
- große Karten,
- abgerundete Ecken,
- konsistente Icons,
- klare Typografie,
- keine Comic- oder Kinderbuchoptik.

### UI-Regeln

- Kleine Viewports zuerst prüfen.
- Touch-Ziele ausreichend groß halten.
- Formulare klar beschriften.
- Leere Zustände und Fehlerzustände sichtbar behandeln.
- Modale Dialoge müssen schließbar und fokussierbar bleiben.
- Neue Komponenten an vorhandenen Abständen, Radien und Typografie ausrichten.
- Keine neue parallele Design-Sprache innerhalb einzelner Module einführen.

---

## 13. Coding Guidelines

### JavaScript

- Bestehenden Stil der betroffenen Datei respektieren.
- Funktionen klein und nach Verantwortung benennen.
- Seiteneffekte erkennbar halten.
- Eingaben an Modulgrenzen normalisieren.
- Benutzerinhalte vor HTML-Ausgabe escapen.
- Globale APIs nur bewusst erweitern.
- Keine neue implizite Abhängigkeit von der Script-Reihenfolge einführen.
- Keine Geschäftsregel ausschließlich in Event-Handlern verstecken.

### Datenzugriff

- Store-API statt direkter Parallelpersistenz verwenden.
- Tiere über stabile IDs adressieren, sobald Daten die aktuelle View verlassen.
- Array-Indizes nur als kurzlebigen UI-Kontext behandeln.
- Listen vor Mutation initialisieren.
- Datumssortierung nicht mit lokalisierten Anzeigestrings durchführen.

### HTML und CSS

- Semantische Elemente bevorzugen.
- Bestehende Klassen und Tokens wiederverwenden.
- Inline-Styles nur dort verwenden, wo das vorhandene Modul dies zwingend erfordert.
- Responsive Verhalten bei jeder UI-Änderung mitprüfen.

### Sicherheit

Im bisherigen Audit wurden keine kritischen offensichtlichen Sicherheitsprobleme, kein `eval()`, keine verbliebenen `debugger`-Anweisungen und keine auffälligen TODO-/FIXME-Reste festgestellt. Dieser Befund ist kein Ersatz für zukünftige Reviews.

Besonders beachten:

- keine Secrets in das Repository committen,
- Firebase-Regeln separat prüfen,
- Benutzerinhalte escapen,
- Datei- und Bildtypen validieren,
- destruktive Aktionen bestätigen,
- Authentifizierungszustand nicht allein über UI-Sichtbarkeit absichern.

---

## 14. Entwicklungsworkflow

### 14.1 Vor einer Änderung

1. Aktuellen Branch und Repository-Stand prüfen.
2. Betroffene Module vollständig lesen.
3. Store-, Engine- und Cloud-Abhängigkeiten identifizieren.
4. Datenmodell und Legacy-Fälle prüfen.
5. Änderung möglichst klein und fachlich geschlossen planen.

### 14.2 Während der Änderung

- bestehende Architektur erweitern statt umgehen,
- doppelte Logik vermeiden,
- keine unbeteiligten Dateien formatieren,
- Refactoring und Feature-Änderung trennen, wenn dies das Review vereinfacht,
- Dokumentation bei geänderten Verträgen aktualisieren.

### 14.3 Validierung

Da die Anwendung stark browser- und UI-getrieben ist, gehören gezielte manuelle Tests zum Pflichtumfang.

Mindestens prüfen:

- Anwendung startet ohne Konsolenfehler,
- bestehende Daten werden geladen,
- geänderte Funktion funktioniert mit neuen Daten,
- geänderte Funktion funktioniert mit älteren oder unvollständigen Daten,
- Persistenz bleibt nach Reload erhalten,
- Mobile-Layout bleibt nutzbar,
- Offline-Fall verursacht keinen Datenverlust,
- Cloud-Funktionen degradieren kontrolliert, wenn Firebase nicht verfügbar ist.

### 14.4 Commit- und PR-Regeln

- Ein Commit soll eine nachvollziehbare Änderung enthalten.
- Commit-Nachrichten sollen Zweck und Bereich knapp beschreiben.
- Große Architekturänderungen über einen eigenen Branch und Pull Request durchführen.
- Datenmigrationen und destruktive Änderungen im PR ausdrücklich dokumentieren.

---

## 15. Erweiterung eines Moduls

Bei einer neuen Funktion ist diese Reihenfolge zu bevorzugen:

1. Datenmodell und notwendige Felder definieren.
2. Bestehende Engine oder Store-API auf Wiederverwendbarkeit prüfen.
3. Fachlogik zentral implementieren.
4. Persistenz und Migration ergänzen.
5. UI anbinden.
6. Offline- und Cloud-Fälle prüfen.
7. Dokumentation aktualisieren.

Eine neue Engine ist nicht automatisch die richtige Lösung. Sie ist sinnvoll, wenn Logik fachlich zusammengehört, von mehreren Modulen genutzt wird oder aus einer großen UI-Datei herausgelöst werden muss.

---

## 16. Refactoring-Roadmap

### Priorität 1: Dokumentation aktuell halten

- Handbook bei Architekturänderungen aktualisieren.
- README auf die aktuelle `v500`-Codebasis ausrichten.
- geplante und implementierte Funktionen klar unterscheiden.

### Priorität 2: Große Module entlasten

Schrittweise Verantwortlichkeiten aus `profile.js`, `animals.js`, `taxonomy.js`, `taxonomy-ui.js` und `offspring.js` extrahieren.

Sinnvolle Schnittkandidaten:

- reine Formatierungsfunktionen,
- Validierung und Normalisierung,
- wiederverwendbare Dialogsteuerung,
- fachliche Berechnungen,
- Foto- und Dokumentoperationen,
- Taxonomie-Abfragen,
- Historienoperationen.

### Priorität 3: Engine-Grenzen schärfen

- AnimalEngine als zentrale Tierlogik konsequent nutzen.
- neue Engines nur mit klaren Verträgen einführen.
- UI-spezifische und fachliche Funktionen systematisch trennen.

### Priorität 4: Historische Versionen archivieren

- weiterhin benötigte Referenzen identifizieren,
- alte Versionen in einen klar gekennzeichneten Archivbereich verschieben,
- produktive Einstiegspunkte eindeutig dokumentieren,
- keine Historie ohne vorherige Sicherung löschen.

### Priorität 5: Testbarkeit erhöhen

- reine Fachfunktionen extrahieren,
- deterministische Datumslogik ermöglichen,
- Migrationen mit repräsentativen Fixtures testen,
- kritische Store- und Engine-Funktionen automatisiert absichern.

---

## 17. Bekannte Risiken

### Große Dateien

Umfangreiche Module erhöhen das Risiko unbeabsichtigter Seiteneffekte und erschweren Reviews.

### Globale Namespaces

Die Anwendung verwendet globale Browserobjekte. Namenskollisionen und falsche Script-Reihenfolge können Laufzeitfehler verursachen.

### Legacy-Daten

Ältere Datensätze können Felder oder Strukturen vermissen. Defensive Normalisierung bleibt notwendig.

### Gemischte Verantwortlichkeiten

Einige UI-Module enthalten noch fachliche Hilfslogik. Neue Änderungen dürfen diese Kopplung nicht weiter ausbauen.

### Dokumentationsdrift

Historische Dokumente und README-Inhalte können ältere Versionen beschreiben. Für technische Entscheidungen sind aktuelle Dateien unter `v500/` maßgeblich.

---

## 18. Definition of Done

Eine Änderung ist abgeschlossen, wenn:

- die Anforderung fachlich erfüllt ist,
- bestehende Daten weiterhin funktionieren,
- keine konkurrierende Geschäftslogik entstanden ist,
- Store- und Persistenzpfade korrekt genutzt werden,
- relevante Mobile-Ansichten geprüft wurden,
- Fehler- und Leerzustände behandelt sind,
- keine Secrets oder Debug-Reste enthalten sind,
- Dokumentation bei geänderten Verträgen aktualisiert ist,
- Commit oder PR Zweck und Risiken verständlich beschreibt.

---

## 19. Wartung dieses Dokuments

Dieses Handbuch muss aktualisiert werden, wenn sich mindestens einer dieser Punkte ändert:

- produktive Codebasis oder Einstiegspunkt,
- zentrale Architektur oder Datenfluss,
- Store- oder Engine-API,
- Datenmodell oder Migrationen,
- Firebase- und Synchronisationsverhalten,
- Designstandard,
- Entwicklungs- oder Releaseworkflow,
- bekannte technische Hauptrisiken.

Veraltete Abschnitte sollen ersetzt statt durch widersprüchliche Ergänzungen erweitert werden.

---

## 20. Kurzreferenz

```text
Aktive Codebasis:      v500/
Frontend:              Vanilla JavaScript
Anwendungsform:        statische Web-App / PWA-orientiert
Lokaler Zustand:       zentraler Store
Cloud:                 Firebase Auth, Firestore, Storage
Zentrale Domänenlogik: AnimalEngine
Designstandard:        TC2, mobile-first
Interne Identität:     UUID
Sichtbare Identität:   Public-ID
Hauptbaustellen:       große Module, Legacy-Dateien, Dokumentationsdrift
```

---

**Grundsatz:** Erst den aktuellen Code verstehen, dann die kleinste konsistente Änderung an der richtigen Architekturschicht vornehmen.