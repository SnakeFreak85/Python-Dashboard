# TerraControl Developer Handbook

> Living document. This handbook is the single source of truth for TerraControl.

## Repository
https://github.com/SnakeFreak85/Python-Dashboard
# TerraControl – Projektkontext (Executive Summary)

> **Pflicht für jeden neuen Chat:**  
> Vor jeder Entwicklung zuerst dieses Dokument vollständig lesen und anschließend das aktuelle Repository analysieren. Dieses Dokument ist die verbindliche Referenz für Architektur, Design, Arbeitsweise und Projektstatus.

---

# Repository

GitHub

https://github.com/SnakeFreak85/Python-Dashboard

Projektname

TerraControl

Aktueller Hauptzweig

main

---

# Projektziel

TerraControl ist eine professionelle, vollständig dynamische Terraristik-Management-Plattform.

Die Anwendung soll langfristig Hobbyhalter, Züchter und professionelle Tierhaltungen unterstützen.

Die Software wird konsequent modular entwickelt.

Geschäftslogik wird vollständig von der Benutzeroberfläche getrennt.

---

# Aktueller Stand

Das Projekt befindet sich mitten in einer Architekturmodernisierung.

Die meisten Kernfunktionen existieren bereits.

Aktuell werden sämtliche Module vereinheitlicht und auf zentrale Engines umgestellt.

---

# Bereits umgesetzt

✔ Public-ID-System

✔ UUID-System

✔ Profil V4

✔ Dynamische Tiergruppen

✔ Dynamische Taxonomie

✔ Individuelle Fütterungsintervalle

✔ Individuelle Gewichtsintervalle

✔ Dynamischer Futterbestand

✔ Firebase-Grundstruktur

✔ Firestore

✔ Firebase Storage

✔ Mobile First

✔ TC2 Design

✔ Dashboard

✔ Nachzuchten

✔ Taxonomiebilder

---

# Aktuelle Prioritäten

1 AnimalEngine vollständig integrieren

2 ReminderEngine entwickeln

3 HealthEngine entwickeln

4 Dashboard vollständig auf Engines umstellen

5 Dokumentencenter erweitern

6 Terrarienverwaltung

7 Zuchtverwaltung

---

# Architektur

UI

↓

Engines

↓

Store

↓

Firebase

Geschäftslogik gehört ausschließlich in Engines.

UI-Dateien enthalten keine Geschäftslogik.

Store verwaltet lokale Daten.

Firebase verwaltet ausschließlich Cloud-Daten.

---

# Design

Verbindlicher Standard

TC2

Mobile First

Premium-Look

Keine Comicoptik

Keine Kinderbuchoptik

Große Karten

Runde Ecken

Einheitliche Icons

Blaues Farbschema

Grüne Akzente

---

# Dynamik

TerraControl besitzt keine fest programmierten

- Tiergruppen

- Gattungen

- Arten

- Unterarten

- Futterarten

- Dokumenttypen

- Pflegeintervalle

- Gewichtsintervalle

Alle Daten werden dynamisch verwaltet.

---

# Arbeitsweise

Repository zuerst analysieren.

Immer komplette Dateien liefern.

Keine Snippets.

Keine Diffs.

Keine Platzhalter.

Benutzer ersetzt Dateien lokal.

Benutzer committed selbst.

Nach jeder Nachricht

"Commited"

automatisch mit dem nächsten sinnvollen Entwicklungsschritt fortfahren.

---

# Was niemals geändert werden darf

TC2 Design

Public-ID-System

UUID-System

Mobile First

Komplette Dateien liefern

Keine Snippets

Keine Diffs

Repositorystruktur ohne Zustimmung

Bereits getroffene Architekturentscheidungen

---

# Ziel dieses Dokuments

Dieses Dokument soll sicherstellen, dass ein neuer Chat ohne erneute Projekterklärung sofort mit der Entwicklung fortfahren kann.

Nach dem Lesen dieses Dokuments und der Analyse des aktuellen Repositories muss der Entwicklungsstand vollständig nachvollziehbar sein.
# 1. Project Vision
TerraControl is a premium, mobile-first terrarium management platform. The application is fully dynamic. No animal groups, genera, food types or care intervals are hardcoded.

# 2. Core Rules
- Analyze the repository before every task.
- Never change repository files without explicit instruction.
- Always provide complete files.
- No snippets, placeholders or partial code.
- The user commits changes.
- After every 'Commited', immediately continue with the next logical task.
- Existing architectural decisions are binding.

# 3. Architecture
- Frontend: Vanilla JavaScript
- Backend: Firebase
- Database: Firestore
- File Storage: Firebase Storage
- Authentication: Firebase Auth
- Offline-first local store
- Cloud synchronization

# 4. Design (TC2)
- Premium appearance
- Mobile first
- Rounded cards
- Blue cards with green accents
- No comic style
- Consistent spacing and typography

# 5. Current Decisions
- Dynamic animal groups
- Dynamic genera
- Profile V4
- Public-ID system
- Individual feeding intervals per animal
- Individual weight intervals per animal
- AnimalEngine as central business logic

> This handbook will be continuously expanded and remains the single documentation file for the project.
> # 6. Repository Architecture

## Repository

https://github.com/SnakeFreak85/Python-Dashboard

Die aktuelle Struktur des Repositories ist die einzige gültige Referenz für alle zukünftigen Entwicklungen.

Vor jeder Änderung gilt:

1. Repository analysieren.
2. Betroffene Dateien identifizieren.
3. Bestehende Architektur verstehen.
4. Erst danach Änderungen vornehmen.

Es dürfen niemals Funktionen entwickelt werden, die bestehende Architekturentscheidungen umgehen oder doppelt implementieren.

---

# 7. Entwicklungsregeln

Diese Regeln gelten für jede zukünftige Entwicklung.

## Allgemein

- Keine fest hinterlegten Tierarten.
- Keine fest hinterlegten Futterarten.
- Keine fest hinterlegten Pflegeintervalle.
- Keine fest hinterlegten Gewichtsintervalle.
- Keine doppelte Geschäftslogik.
- Mobile First.
- TC2 ist der verbindliche Designstandard.
- Bestehende Architektur wird erweitert, niemals ersetzt.

---

## Workflow zwischen Entwickler und ChatGPT

Verbindlicher Ablauf:

1. Repository analysieren.
2. Betroffene Dateien identifizieren.
3. Komplette Dateien liefern.
4. Keine Code-Snippets.
5. Keine Platzhalter.
6. Benutzer ersetzt Dateien lokal.
7. Benutzer committed.
8. Nach "Commited" automatisch den nächsten sinnvollen Entwicklungsschritt liefern.

---

## Verboten

- Versionsnummern eigenständig ändern.
- Architektur ohne Zustimmung ändern.
- Funktionen doppelt implementieren.
- Logik in mehreren Dateien verteilen.
- Geschäftslogik direkt in UI-Dateien einbauen.

---

# 8. Architekturprinzipien

TerraControl basiert auf einer klaren Trennung zwischen Darstellung, Geschäftslogik und Datenhaltung.

## UI

Die UI ist ausschließlich für Darstellung und Benutzerinteraktionen verantwortlich.

UI-Dateien enthalten keine Geschäftslogik.

---

## Engine

Alle Berechnungen gehören langfristig in Engines.

Beispiele:

- AnimalEngine
- ReminderEngine
- HealthEngine
- StatisticsEngine
- SearchEngine
- PhotoEngine
- DocumentEngine

---

## Store

Der Store verwaltet:

- lokale Daten
- Migrationen
- Offlinebetrieb
- Persistenz

Der Store ist die einzige Quelle lokaler Daten.

---

## Cloud

Firebase übernimmt ausschließlich:

- Authentifizierung
- Firestore
- Storage
- Synchronisation

Cloud-Logik darf niemals UI-Logik enthalten.

---

# 9. TC2 Designstandard

TC2 ist verbindlich.

## Designprinzipien

- Premium statt verspielt
- Keine Comicoptik
- Keine Kinderbuchoptik
- Große Karten
- Runde Ecken
- Dunkles Farbschema
- Blaue Karten
- Grüne Akzente
- Einheitliche Icons
- Mobile First

Alle neuen Module müssen sich optisch in TC2 einfügen.

---

# 10. Dynamische Daten

TerraControl ist vollständig dynamisch.

Folgende Bereiche dürfen niemals fest programmiert werden:

- Tiergruppen
- Gattungen
- Arten
- Unterarten
- Futterarten
- Futtergrößen
- Pflegeintervalle
- Gewichtsintervalle
- Erinnerungen
- Dokumenttypen

Der Benutzer entscheidet jederzeit selbst über diese Werte.
# 11. Datenmodell

Alle Datenmodelle müssen langfristig zentral dokumentiert werden.

Ziel ist eine einheitliche Datenstruktur ohne doppelte Informationen.

---

## Tier (Animal)

Jedes Tier besitzt eine unveränderliche UUID.

Diese UUID dient ausschließlich internen Verknüpfungen.

Für den Benutzer wird ausschließlich die Public-ID verwendet.

### Stammdaten

- UUID
- Public-ID
- Tiergruppe
- Gattung
- Art
- Unterart
- Morph
- Geschlecht
- Status
- Geburtsdatum
- Schlupfdatum
- Einzugsdatum
- Herkunft
- Züchter
- Kaufpreis
- aktueller Wert

---

### Haltungsdaten

- aktuelles Terrarium
- Standort
- Aktiv
- Archiviert
- Verstorben
- Verkauft
- Abgegeben

---

### Pflege

Jedes Tier besitzt eigene Pflegeintervalle.

Es existieren keine globalen Pflegeintervalle.

Speicherbare Erinnerungen:

- Fütterung
- Wiegen
- Kotprobe
- Reinigung
- Häutungskontrolle
- Gesundheitscheck
- Tierarzt
- Medikamente
- Benutzerdefinierte Erinnerungen

Jede Erinnerung besitzt:

- Aktiv / Inaktiv
- Intervall
- nächste Fälligkeit
- letzte Durchführung
- Priorität

---

### Fotos

Jedes Tier besitzt beliebig viele Fotos.

Ein Foto kann als Hauptbild markiert werden.

Geplant:

- automatische Optimierung
- Cloudspeicherung
- Offlinecache

---

### Dokumente

Jedes Tier besitzt beliebig viele Dokumente.

Unter anderem:

- Herkunftsnachweis
- CITES
- Rechnung
- Kaufvertrag
- Tierarztbericht
- Laborbericht
- PDF
- Bilder
- beliebige Anhänge

---

### Historie

Langfristig soll jede Änderung nachvollziehbar sein.

Beispiele:

- Fütterung durchgeführt
- Gewicht geändert
- Foto hinzugefügt
- Dokument hinzugefügt
- Verkauf
- Tod
- Medikamentengabe

---

# 12. Nachzuchten

Nachzuchten werden vollständig getrennt vom Bestand gespeichert.

Eigene Collection

Eigene Public-ID

Eigene Fotos

Eigene Dokumente

Eigene Historie

Geplante Verknüpfungen:

- Mutter
- Vater
- Gelege
- Inkubator
- Käufer

---

# 13. Public-ID

UUID wird niemals angezeigt.

Der Benutzer arbeitet ausschließlich mit Public-IDs.

Beispiele

TC-0001

TC-0002

TC-0003

Nachzuchten:

NZ-0001

NZ-0002

NZ-0003

Die Public-ID darf nach der Vergabe niemals geändert werden.

Sie dient zukünftig außerdem für:

- QR-Codes
- Etiketten
- Dokumente
- Suche
- Export
- Ausdrucke
# 14. AnimalEngine

## Ziel

Die AnimalEngine ist langfristig die zentrale Geschäftslogik von TerraControl.

Alle Module greifen zukünftig ausschließlich auf die AnimalEngine zu.

Dadurch wird verhindert, dass dieselben Berechnungen mehrfach implementiert werden.

---

## Verantwortlichkeiten

Die AnimalEngine liefert ausschließlich aufbereitete Tierdaten.

Beispiele:

- Anzeigename
- vollständige Taxonomie
- wissenschaftlicher Name
- Alter
- Geschlecht
- Status
- Hauptfoto
- Public-ID
- Pflegeinformationen
- Gesundheitsinformationen
- Dokumenteninformationen

---

## Berechnungen

Die AnimalEngine übernimmt sämtliche Berechnungen.

Unter anderem:

### Alter

Das Alter wird ausschließlich aus dem Geburtsdatum berechnet.

Es existieren keine Altersklassen.

Keine "Baby"

Keine "Juvenil"

Keine "Adult"

Stattdessen:

- Jahre
- Monate
- Wochen
- Tage

werden dynamisch berechnet.

---

### Wissenschaftlicher Name

Die AnimalEngine erzeugt automatisch

Gattung + Art + Unterart

Beispiel

Poecilotheria metallica

oder

Python regius

ohne dass mehrere Dateien dieselbe Logik besitzen.

---

### Anzeigename

Beispiele

TC-0012

Poecilotheria metallica

Weibchen

2 Jahre 3 Monate

---

### Status

Die AnimalEngine berechnet automatisch

- Aktiv

- Archiviert

- Verkauft

- Verstorben

- Nachzucht

- Reserviert

---

### Hauptfoto

Die AnimalEngine liefert immer das Hauptfoto.

Existiert keines,

wird automatisch

- Taxonomiebild

oder

- Platzhalter

verwendet.

---

### Pflege

Die AnimalEngine kennt alle Pflegeinformationen.

Zum Beispiel

- nächster Fütterungstermin

- nächster Wiegetermin

- letzte Fütterung

- letzte Häutung

- Gesundheitsstatus

---

## Datenquellen

Die AnimalEngine liest Daten ausschließlich aus

- Store

- Firestore

- lokalen Caches

Sie verändert keine UI.

---

## Verbotene Aufgaben

Die AnimalEngine

NICHT

- HTML erzeugen

- Dialoge öffnen

- CSS verändern

- DOM manipulieren

Sie liefert ausschließlich Daten.

---

## Vorteile

Eine einzige Berechnung

↓

Alle Module erhalten identische Ergebnisse

↓

Keine doppelte Logik

↓

Einfachere Wartung

↓

Einfachere Tests

↓

Weniger Fehler

---

# 15. ReminderEngine

## Ziel

Die ReminderEngine verwaltet langfristig sämtliche Erinnerungen.

Dadurch existiert keine Erinnerungslogik mehr innerhalb einzelner Module.

Alle Erinnerungen laufen über dieselbe Engine.

---

## Unterstützte Erinnerungen

- Fütterung

- Wiegen

- Reinigung

- Kotprobe

- Tierarzt

- Medikamente

- Häutung

- Paarung

- Eiablage

- Inkubation

- Benutzerdefinierte Erinnerungen

---

## Eigenschaften jeder Erinnerung

Jede Erinnerung besitzt:

- UUID

- Tier-UUID

- Typ

- Titel

- Beschreibung

- Aktiv

- Intervall

- Intervall-Einheit

- Letzte Durchführung

- Nächste Durchführung

- Priorität

- Farbe

- Icon

---

## Intervall-Einheiten

Unterstützt werden

- Stunden

- Tage

- Wochen

- Monate

- Jahre

Dadurch können Erinnerungen vollkommen frei definiert werden.

---

## Benutzerdefinierte Erinnerungen

Der Benutzer kann beliebig viele Erinnerungen anlegen.

Beispiele

"Vitaminpräparat"

"UV-Lampe wechseln"

"Kotprobe"

"Tierarzt"

"Substrat wechseln"

Es existiert keine Begrenzung.

---

## Dashboard

Die ReminderEngine liefert

- Heute fällig

- Morgen fällig

- Überfällig

- Kommende Erinnerungen

für

- Dashboard

- Smart Dashboard

- Profil

- Kalender

ohne dass diese Module selbst Berechnungen durchführen.
# 16. HealthEngine

## Ziel

Die HealthEngine wird langfristig das zentrale Gesundheitsmodul von TerraControl.

Alle Informationen zur Gesundheit eines Tieres werden ausschließlich hier verwaltet.

Dadurch befinden sich Gesundheitsdaten nicht mehr verteilt in mehreren Modulen.

---

## Aufgaben

Die HealthEngine verwaltet

- Gesundheitsstatus
- Krankheitsverlauf
- Medikamente
- Tierarztbesuche
- Laborberichte
- Kotproben
- Häutungen
- Verletzungen
- Operationen
- Gewichtsentwicklung
- Fütterungsverlauf
- Benutzerdefinierte Gesundheitsereignisse

---

## Gesundheitsakte

Jedes Tier besitzt eine vollständige Gesundheitsakte.

Diese enthält chronologisch alle medizinischen Ereignisse.

Beispiele

2025-04-11

Gewicht

425 g

---

2025-05-01

Kotprobe

Negativ

---

2025-05-14

Tierarzt

Routinekontrolle

---

2025-07-09

Medikament

Baytril

10 Tage

---

Alle Einträge bleiben dauerhaft erhalten.

Sie werden niemals automatisch gelöscht.

---

## Gesundheitsstatus

Die HealthEngine berechnet automatisch den Gesundheitsstatus.

Mögliche Zustände

- Gesund

- Beobachtung

- Behandlung

- Quarantäne

- Kritisch

- Verstorben

Der Status dient ausschließlich der Übersicht.

Die eigentlichen Informationen bleiben in der Historie gespeichert.

---

## Gewicht

Gewichte werden vollständig historisiert.

Jeder Eintrag besitzt

- Datum

- Gewicht

- Einheit

- Bemerkung

- Benutzer

Dadurch können langfristig Diagramme erzeugt werden.

---

## Fütterungsverlauf

Alle Fütterungen werden gespeichert.

Beispiel

Datum

↓

Futtertier

↓

Größe

↓

Menge

↓

Bemerkung

↓

Benutzer

Dadurch entsteht eine vollständige Fütterungshistorie.

---

## Häutungen

Für Spinnen und Reptilien können Häutungen gespeichert werden.

Ein Eintrag besitzt

- Datum

- erfolgreich

- problematisch

- Bemerkung

- Fotos

---

## Medikamente

Ein Medikament besitzt

- Name

- Dosierung

- Beginn

- Ende

- Grund

- Tierarzt

- Bemerkung

Mehrere Medikamente können gleichzeitig aktiv sein.

---

## Tierarzt

Tierarztbesuche werden vollständig dokumentiert.

Ein Besuch besitzt

- Datum

- Tierarzt

- Diagnose

- Behandlung

- Medikamente

- Kosten

- Dokumente

- Fotos

---

## Dokumente

Jeder Gesundheitseintrag kann beliebige Dokumente besitzen.

Beispiele

- PDF

- Laborbericht

- Rechnung

- Bild

- Röntgenaufnahme

- Ultraschall

- Blutbild

---

## Erinnerungen

Die ReminderEngine greift auf die HealthEngine zu.

Beispiele

- Medikament endet morgen

- Kontrolle in 14 Tagen

- Nachuntersuchung

- Neue Kotprobe

---

## Dashboard

Die HealthEngine liefert

- kranke Tiere

- Tiere in Behandlung

- anstehende Nachkontrollen

- offene Medikamente

- überfällige Untersuchungen

für

- Dashboard

- Smart Dashboard

- Profil

- Gesundheitsübersicht

---

## Langfristige Ziele

- Gewichtsdiagramme

- Gesundheitsdiagramme

- Medikamentenstatistik

- Tierarztkosten

- Export der Gesundheitsakte

- PDF-Berichte

- Cloud-Synchronisation

- KI-Analyse von Gesundheitsverläufen

---

## Grundprinzip

Die HealthEngine enthält ausschließlich Geschäftslogik.

Sie erzeugt

keine HTML-Ausgabe,

keine Dialoge,

keine CSS-Elemente,

keine DOM-Manipulation.

Sie liefert ausschließlich strukturierte Daten an die UI.
# 17. SearchEngine

## Ziel

Die SearchEngine wird die zentrale Suchfunktion von TerraControl.

Sie durchsucht zukünftig sämtliche Daten der Anwendung.

Es existiert nur noch eine Suchlogik.

Alle Module greifen auf dieselbe Engine zu.

---

## Suchbereiche

Die SearchEngine durchsucht

- Bestand
- Nachzuchten
- Terrarien
- Dokumente
- Fotos
- Erinnerungen
- Gesundheitsdaten
- Futterbestand
- Taxonomie
- Public-IDs

---

## Suchbegriffe

Gesucht werden kann nach

- Public-ID
- Tiername
- wissenschaftlicher Name
- Gattung
- Art
- Unterart
- Morph
- Geschlecht
- Herkunft
- Züchter
- Dokumentname
- QR-Code
- Terrarium
- Status

---

## Filter

Die Suche unterstützt

- Tiergruppe
- Aktiv
- Archiviert
- Verkauft
- Verstorben
- Nachzuchten
- Geschlecht
- Morph
- Alter
- Standort

---

## Ziel

Eine einzige Suchfunktion.

Keine mehrfach implementierten Suchalgorithmen.

---

# 18. StatisticsEngine

## Ziel

Alle Statistiken werden ausschließlich durch die StatisticsEngine erzeugt.

Keine Berechnungen innerhalb des Dashboards.

---

## Kennzahlen

Die Engine liefert

Gesamtbestand

↓

aktive Tiere

↓

Nachzuchten

↓

Männchen

↓

Weibchen

↓

Unbestimmt

↓

Archivierte Tiere

↓

Verkäufe

↓

Todesfälle

↓

Anzahl Terrarien

↓

Dokumente

↓

Fotos

↓

Fütterungen

↓

Gewichte

↓

Erinnerungen

---

## Diagramme

Langfristig

Gewichtsentwicklung

↓

Fütterungsverlauf

↓

Bestandsentwicklung

↓

Verkäufe

↓

Nachzuchten

↓

Ausgaben

↓

Einnahmen

↓

Tierarztkosten

↓

Sterblichkeit

↓

Häutungen

---

## Dashboard

Die StatisticsEngine liefert

Dashboard

↓

Smart Dashboard

↓

Profil

↓

Statistikseite

↓

Export

---

# 19. PhotoEngine

## Ziel

Die PhotoEngine verwaltet sämtliche Bilder.

---

## Unterstützt

Tierbilder

↓

Nachzuchtbilder

↓

Terrarienbilder

↓

Dokumentbilder

↓

Taxonomiebilder

↓

Benutzerbilder

---

## Funktionen

Hauptbild

↓

Sortierung

↓

Cloudspeicherung

↓

Offlinecache

↓

Optimierung

↓

Thumbnail

↓

Original

↓

Metadaten

↓

EXIF

---

## Taxonomiebilder

Taxonomiebilder dienen ausschließlich als Platzhalter.

Existiert ein Tierfoto,

hat dieses immer Vorrang.

Existiert kein Tierfoto,

wird automatisch

das Taxonomiebild verwendet.

---

## Zukunft

Mehrere Hauptbilder

↓

Galerien

↓

Zoom

↓

Vollbild

↓

Offlinecache

↓

Cloudoptimierung

↓

Automatische Größenanpassung

---

# 20. DocumentEngine

## Ziel

Alle Dokumente werden zentral verwaltet.

---

## Dokumenttypen

Herkunftsnachweis

↓

CITES

↓

Rechnung

↓

Kaufvertrag

↓

Verkaufsvertrag

↓

Tierarztbericht

↓

Laborbericht

↓

PDF

↓

Bild

↓

Beliebige Dateien

---

## Eigenschaften

UUID

↓

Tier

↓

Typ

↓

Titel

↓

Beschreibung

↓

Erstellt

↓

Geändert

↓

Cloudstatus

↓

Dateigröße

↓

Dateiformat

---

## Funktionen

Upload

↓

Download

↓

Vorschau

↓

Cloudsync

↓

Offlinecache

↓

Suche

↓

Filter

↓

QR-Verknüpfung

---

# 21. QR-System

## Ziel

Jedes Tier besitzt langfristig einen QR-Tierpass.

Der QR-Code verweist auf die Public-ID.

Nicht auf die UUID.

---

## Einsatz

Terrarium

↓

Rack

↓

Transportbox

↓

Verkaufsunterlagen

↓

Dokumente

↓

Tierprofil

---

## Zukunft

Offline QR

↓

Cloud QR

↓

Öffentliche Kurzansicht

↓

Interne Vollansicht

↓

Export

↓

Etikettendruck

---

# 22. Firestore

## Collections

users

animals

offspring

foodInventory

documents

photos

settings

terrariums

health

reminders

statistics

taxonomy

syncMeta

---

## Grundsatz

Alle Daten gehören ausschließlich dem angemeldeten Benutzer.

Es existiert keine gemeinsame Datenhaltung.

---

## Offline

Firestore dient ausschließlich der Synchronisation.

Lokale Daten besitzen Vorrang.

Cloud synchronisiert Änderungen.

Nicht umgekehrt.

---

# 23. Firebase Storage

Speichert

Fotos

↓

Dokumente

↓

Anhänge

↓

Exporte

↓

PDF

↓

QR-Bilder

↓

Backups

---

Ordnerstruktur

animals/

offspring/

documents/

photos/

exports/

imports/

taxonomy/

temp/

---

## Ziel

Klare Trennung

↓

schnelle Synchronisation

↓

einfache Wartung

↓

beliebige Erweiterbarkeit
# 24. Synchronisation

## Grundprinzip

TerraControl arbeitet grundsätzlich nach dem Prinzip:

LOCAL FIRST

Alle Eingaben erfolgen zunächst lokal.

Erst anschließend werden Änderungen mit Firebase synchronisiert.

Dadurch bleibt die App jederzeit benutzbar.

Auch ohne Internet.

---

## Reihenfolge

Benutzer

↓

Lokaler Store

↓

AnimalEngine

↓

Cloud Queue

↓

Firestore

↓

Firebase Storage

---

## Konflikte

Falls ein Datensatz mehrfach geändert wurde

entscheidet zukünftig

die Synchronisationslogik

nicht die UI.

Konflikte werden protokolliert.

Keine Daten dürfen verloren gehen.

---

## Synchronisationsstatus

Jeder Datensatz besitzt

- Lokal

- Synchronisiert

- Warteschlange

- Konflikt

- Fehler

---

## Offlinebetrieb

Offline muss vollständig möglich sein.

Unter anderem

- Tiere

- Nachzuchten

- Dokumente

- Fotos

- Erinnerungen

- Dashboard

- Suche

Erst bei bestehender Internetverbindung erfolgt die Synchronisation.

---

# 25. Terrarienverwaltung

## Ziel

Terrarien werden vollständig unabhängig vom Tier verwaltet.

Ein Tier kann

ein Terrarium besitzen.

Ein Terrarium kann

mehrere Tiere besitzen.

(abhängig von Tierart)

---

## Stammdaten

UUID

↓

Name

↓

Standort

↓

Raum

↓

Rack

↓

Ebene

↓

Terrarientyp

↓

Material

↓

Breite

↓

Tiefe

↓

Höhe

↓

Volumen

↓

Notizen

---

## Technik

Beleuchtung

↓

UV

↓

Heizung

↓

Beregnung

↓

Lüfter

↓

Nebelanlage

↓

Thermostat

↓

Hygrostat

↓

Sensoren

---

## Wartung

Scheiben reinigen

↓

Substrat wechseln

↓

Technik prüfen

↓

Leuchtmittel wechseln

↓

Filter reinigen

↓

Benutzerdefinierte Aufgaben

Alle Wartungen werden später über die ReminderEngine gesteuert.

---

# 26. Futterbestand

## Ziel

Der Futterbestand ist vollständig dynamisch.

Es existieren keine fest hinterlegten Futtertiere.

---

## Beispiele

Heimchen

Schaben

Heuschrecken

Zophobas

Mehlwürmer

Mäuse

Ratten

Küken

Fische

Würmer

oder

beliebige eigene Einträge.

---

## Größen

Ebenfalls vollständig frei.

Beispiele

XS

S

M

L

XL

Adult

Subadult

oder

beliebige Größen.

---

## Eigenschaften

Name

↓

Größe

↓

Anzahl

↓

Mindestbestand

↓

Standort

↓

Bemerkung

↓

Preis

↓

Lieferant

↓

Herkunft

↓

Chargennummer

↓

Kaufdatum

---

## Dashboard

Niedriger Bestand

↓

Heute verfüttert

↓

Wöchentlicher Verbrauch

↓

Monatlicher Verbrauch

↓

Kosten

↓

Bestellvorschläge

---

# 27. Dokumentencenter

## Ziel

Alle Dokumente werden zentral verwaltet.

Nicht verteilt.

---

## Dokumenttypen

HKN

↓

CITES

↓

EU-Bescheinigung

↓

Rechnung

↓

Kaufvertrag

↓

Verkaufsvertrag

↓

Tierarzt

↓

Laborbericht

↓

Blutbild

↓

Kotprobe

↓

Röntgen

↓

Fotos

↓

PDF

↓

Sonstige

---

## Funktionen

Upload

↓

Cloud

↓

Offline

↓

Vorschau

↓

Suche

↓

Filter

↓

Export

↓

PDF

↓

Verknüpfung mit Tier

↓

Verknüpfung mit Nachzucht

---

# 28. Dashboard

Das Dashboard ist ausschließlich eine Übersicht.

Es enthält keine Geschäftslogik.

Alle Daten stammen aus Engines.

---

## Bestand

Aktive Tiere

↓

Nachzuchten

↓

Terrarien

↓

Dokumente

↓

Fotos

↓

Futterbestand

---

## Heute

Heute füttern

↓

Heute wiegen

↓

Heute reinigen

↓

Heute Medikamente

↓

Heute Tierarzt

↓

Benutzerdefinierte Aufgaben

---

## Warnungen

Überfällige Erinnerungen

↓

Gesundheitsprobleme

↓

Niedriger Futterbestand

↓

Synchronisationsfehler

↓

Cloudkonflikte

---

# 29. Smart Dashboard

Das Smart Dashboard ist die Premium-Übersicht.

Es fasst Informationen aus sämtlichen Engines zusammen.

AnimalEngine

↓

ReminderEngine

↓

HealthEngine

↓

StatisticsEngine

↓

DocumentEngine

↓

PhotoEngine

↓

SearchEngine

---

## Ziel

Der Benutzer soll morgens die App öffnen

und sofort sehen

- Was heute wichtig ist
- Welche Tiere Aufmerksamkeit benötigen
- Welche Arbeiten fällig sind
- Welche Warnungen existieren

ohne weitere Navigation.

---

# 30. Profil V4

Das Profil ist die zentrale Detailansicht eines Tieres.

Es besitzt ausschließlich Darstellungslogik.

Alle Informationen stammen aus Engines.

---

## Tabs

Übersicht

↓

Pflege

↓

Gesundheit

↓

Gewicht

↓

Fütterung

↓

Dokumente

↓

Fotos

↓

Historie

↓

Nachkommen

↓

Statistik

---

## Ziel

Das Profil soll langfristig sämtliche Informationen zu einem Tier an einer Stelle bündeln.

Keine Informationen werden mehrfach gespeichert.

Alle Daten stammen aus den jeweiligen Engines.
# 31. Navigation

## Ziel

Die Navigation soll jederzeit intuitiv und mit maximal drei Interaktionen erreichbar sein.

Der Benutzer darf niemals überlegen müssen, wo sich eine Funktion befindet.

---

## Startseite

Die Startseite ist der zentrale Einstiegspunkt.

Sie enthält ausschließlich die wichtigsten Bereiche.

- Bestand
- Nachzuchten
- Smart Dashboard
- Futterbestand
- Terrarien
- Dokumente
- Kalender
- Einstellungen

---

## Hamburger-Menü

Das Hamburger-Menü enthält ausschließlich sekundäre Funktionen.

Beispiele

- Export
- Backup
- Cloud
- Einstellungen
- Entwickleroptionen
- Hilfe
- Impressum

---

## Navigationsebenen

Ziel:

Maximal drei Ebenen

Dashboard

↓

Bestand

↓

Tierprofil

Nicht

Dashboard

↓

Bestand

↓

Kategorie

↓

Unterkategorie

↓

Tier

---

# 32. TC2-Komponentenbibliothek

TC2 ist verbindlich.

Alle zukünftigen Module verwenden dieselben Komponenten.

---

## Karten

Große Karten

↓

runde Ecken

↓

leichte Schatten

↓

einheitliche Innenabstände

↓

gleiche Farben

↓

gleiche Hovereffekte

---

## Buttons

Buttons besitzen

- Icon
- Titel
- Untertitel (optional)

Keine Browser-Buttons.

---

## Dialoge

Keine Browserdialoge.

Stattdessen

TC2-Dialoge.

---

## Listen

Listen werden nur verwendet,

wenn Karten keinen Mehrwert bieten.

---

## Formulare

Formulare

- große Eingabefelder
- mobile Optimierung
- klare Beschriftungen
- sinnvolle Gruppierung

---

# 33. Farben

## Primärfarben

Dunkles Grunddesign

↓

Blaue Karten

↓

Grüne Hervorhebungen

↓

Weiße Schrift

↓

Dezente Grautöne

---

## Statusfarben

Grün

Erledigt

↓

Gelb

Bald fällig

↓

Orange

Wichtig

↓

Rot

Überfällig

↓

Blau

Information

---

Farben besitzen überall dieselbe Bedeutung.

---

# 34. Icons

Icons werden projektweit einheitlich verwendet.

Beispiele

Tier

↓

Futter

↓

Terrarium

↓

Dokument

↓

Gewicht

↓

Gesundheit

↓

Cloud

↓

Erinnerung

↓

QR-Code

↓

Suche

---

Keine unterschiedlichen Icons für dieselbe Funktion.

---

# 35. Responsive Design

TerraControl wird Mobile First entwickelt.

Desktop ist eine Erweiterung.

Nicht umgekehrt.

---

## Unterstützte Geräte

Smartphones

↓

Tablets

↓

Desktop

---

Keine horizontalen Scrollbalken.

Keine überbreiten Tabellen.

Keine winzigen Touchflächen.

---

# 36. Performance

Die Anwendung muss auch mit sehr großen Beständen flüssig arbeiten.

Ziel

1000+

Tiere

ohne wahrnehmbare Verzögerungen.

---

## Maßnahmen

Lazy Loading

↓

Caching

↓

virtuelle Listen

↓

Bildkomprimierung

↓

lokale Datenhaltung

↓

selektive Cloudabfragen

↓

asynchrone Berechnungen

---

# 37. Backup

Langfristig unterstützt TerraControl

Vollbackup

↓

Teilbackup

↓

Cloudbackup

↓

lokales Backup

↓

automatische Sicherung

↓

Import

↓

Export

---

Exportformate

JSON

↓

CSV

↓

PDF

↓

ZIP

---

# 38. Sicherheit

## Grundprinzip

Benutzerdaten gehören ausschließlich dem Benutzer.

---

## Datenschutz

Keine Weitergabe.

Keine Analyse.

Keine Werbung.

Keine Trackingdienste.

---

## UUID

UUID

niemals anzeigen.

niemals bearbeiten.

niemals exportieren.

---

## Public-ID

Public-ID

darf angezeigt werden.

darf gesucht werden.

darf exportiert werden.

darf auf QR-Codes erscheinen.

---

## Firestore

Jeder Benutzer besitzt ausschließlich Zugriff auf seine eigenen Daten.

---

## Storage

Fotos

Dokumente

Backups

gehören ausschließlich dem jeweiligen Benutzer.

---

## Langfristige Ziele

Verschlüsselte Backups

↓

Mehrbenutzerbetrieb

↓

Freigaben

↓

Rollen

↓

Berechtigungen

↓

Audit-Log

↓

Änderungsverlauf

↓

Papierkorb

↓

Wiederherstellung gelöschter Daten
# 39. KI-System

## Langfristiges Ziel

TerraControl soll einen vollständig integrierten KI-Assistenten besitzen.

Die KI dient ausschließlich als Unterstützung.

Sie ersetzt niemals die Kontrolle des Benutzers.

---

## Einsatzgebiete

### Dokumentenerkennung

Automatisches Auslesen von

- Herkunftsnachweisen
- CITES
- Rechnungen
- Kaufverträgen
- Laborberichten

---

### OCR

Texterkennung aus

PDF

↓

Fotos

↓

Scans

↓

Screenshots

---

## KI-Import

Der Benutzer fotografiert beispielsweise

einen Herkunftsnachweis.

↓

Die KI erkennt

Tier

↓

Art

↓

Geschlecht

↓

Geburtsdatum

↓

Herkunft

↓

Dokumentnummer

↓

Züchter

↓

Kaufdatum

↓

Bemerkungen

↓

TerraControl füllt automatisch sämtliche Felder vor.

Der Benutzer bestätigt lediglich.

---

## Sprachassistent

Langfristig soll Folgendes möglich sein.

"Poecilotheria metallica heute gefüttert."

↓

Fütterung wird gespeichert.

---

"Python regius gewogen."

↓

Gewicht wird gespeichert.

---

"Neue Nachzucht anlegen."

↓

Dialog öffnet sich.

---

"Zeige überfällige Tiere."

↓

Smart Dashboard öffnet sich.

---

## KI-Auswertungen

Langfristig

Gewichtsentwicklung

↓

Fütterungsverhalten

↓

Gesundheitsentwicklung

↓

Zuchtstatistiken

↓

Sterblichkeit

↓

Kostenanalyse

↓

Empfehlungen

---

# 40. Coding Standards

## Grundprinzip

Code muss jederzeit

verständlich

erweiterbar

wartbar

sein.

---

## Regeln

Keine doppelte Geschäftslogik.

↓

Keine Magic Numbers.

↓

Keine unnötigen Globals.

↓

Keine fest codierten Werte.

↓

Keine toten Funktionen.

↓

Keine ungenutzten Variablen.

↓

Keine riesigen UI-Dateien.

---

## Funktionen

Kurze Funktionen.

Eine Funktion

↓

eine Aufgabe.

---

## Kommentare

Kommentare erklären

WARUM

nicht

WAS.

---

## Dateigröße

Langfristig

UI-Dateien

klein halten.

Geschäftslogik

in Engines verschieben.

---

# 41. Dateistandards

## Dateinamen

Englisch.

Kleinbuchstaben.

Bindestriche.

Beispiele

animal-engine.js

food-store.js

profile.js

smart-dashboard.js

---

## Ordner

modules/

↓

engines/

↓

utils/

↓

services/

↓

styles/

↓

assets/

---

## Imports

Immer sauber sortieren.

Keine Kreisabhängigkeiten.

---

# 42. Git Workflow

Repository analysieren.

↓

Änderung planen.

↓

Komplette Datei liefern.

↓

Benutzer ersetzt Datei.

↓

Commit.

↓

"Commited"

↓

Nächster Schritt.

---

Keine Zwischenlösungen.

Keine halbfertigen Features.

---

# 43. Teststrategie

Vor jedem Commit

prüfen

Tier anlegen

↓

Tier bearbeiten

↓

Nachzucht

↓

Dashboard

↓

Smart Dashboard

↓

Suche

↓

Cloud

↓

Offline

↓

Profil

↓

Dokumente

↓

Futter

↓

Fotos

---

Regressionen vermeiden.

---

# 44. Releaseprozess

Entwicklung

↓

Lokaler Test

↓

Cloudtest

↓

Regressionstest

↓

RC

↓

Release

---

Keine Releases

mit bekannten kritischen Fehlern.

---

# 45. Technische Schulden

Langfristig entfernen

- doppelte Altersberechnungen

- doppelte Pflegeberechnungen

- Legacy-Code

- veraltete Dialoge

- verteilte Suchlogik

- verteilte Statistiklogik

- alte Tierkarten

- alte Dashboard-Komponenten

---

# 46. Roadmap Version 1.x

AnimalEngine fertigstellen

↓

ReminderEngine

↓

HealthEngine

↓

Dokumentencenter

↓

Suche

↓

Terrarienverwaltung

↓

Cloud optimieren

↓

Smart Dashboard fertigstellen

---

# 47. Roadmap Version 2.x

Mehrbenutzerbetrieb

↓

Freigaben

↓

Zuchtverwaltung

↓

Inkubation

↓

KI

↓

OCR

↓

Sprachsteuerung

↓

Etikettendruck

↓

PDF-Center

↓

Statistikcenter

↓

Cloudfreigaben

↓

Premiumfunktionen

---

# 48. Entwicklerregeln

Diese Regeln gelten dauerhaft.

Repository zuerst lesen.

↓

Handbuch zuerst lesen.

↓

Bestehende Architektur respektieren.

↓

Keine Architektur neu erfinden.

↓

TC2 bleibt unverändert.

↓

Keine Versionsnummern ändern.

↓

Immer komplette Dateien.

↓

Keine Snippets.

↓

Keine Platzhalter.

↓

Keine Diffs.

↓

Keine halbfertigen Lösungen.

↓

Nach jedem Commit

automatisch

nächsten sinnvollen Schritt liefern.

---

# 49. Regeln für zukünftige Chats

Jeder neue Chat soll

ohne Projekterklärung

weiterarbeiten können.

Vorgehen

1 Repository analysieren.

2 Developer Handbook lesen.

3 Aktuellen Stand verstehen.

4 Änderungen planen.

5 Komplette Dateien liefern.

6 Nach Commit direkt weitermachen.

Es sollen keine bereits entschiedenen Themen erneut diskutiert werden.

---

# 50. Langfristige Vision

TerraControl soll die professionellste Terraristik-Management-Software im deutschsprachigen Raum werden.

Die Software soll

beliebig viele Tiere

beliebig viele Terrarien

beliebig viele Dokumente

beliebig viele Fotos

beliebig viele Benutzer

unterstützen.

Alle Module arbeiten langfristig ausschließlich über zentrale Engines.

Die Architektur bleibt modular.

Neue Funktionen werden ergänzt,

nicht angeflanscht.

Die Software soll auch in vielen Jahren noch wartbar sein.

---

# Änderungsprotokoll

Jede Architekturentscheidung wird hier dokumentiert.

Jede größere Änderung am Datenmodell wird hier festgehalten.

Jede neue Engine wird dokumentiert.

Jedes neue Modul wird dokumentiert.

Dieses Dokument ist die verbindliche technische Dokumentation des gesamten Projekts.
---

# AKTUELLER PROJEKTSTATUS

> Dieser Abschnitt beschreibt ausschließlich den aktuellen Entwicklungsstand. Er wird nach größeren Änderungen aktualisiert und dient neuen Chats als Einstiegspunkt.

---

# Repository

GitHub Repository

https://github.com/SnakeFreak85/Python-Dashboard

Hauptversion

v500

TC2 ist der verbindliche Designstandard.

---

# Aktueller Entwicklungsstand

TerraControl befindet sich in einer umfangreichen Architekturmodernisierung.

Das Ziel ist eine vollständig dynamische Terraristikverwaltung ohne fest programmierte Inhalte.

Die Anwendung wird langfristig vollständig modular aufgebaut.

Geschäftslogik wird aus UI-Dateien entfernt und in zentrale Engines verschoben.

---

# Bereits umgesetzt

## Architektur

✔ Public-ID-System

✔ UUID-System

✔ Profil V4

✔ Dynamische Tiergruppen

✔ Dynamische Gattungen

✔ Dynamische Taxonomie

✔ Abschaffung globaler Pflegeintervalle

✔ Individuelle Fütterungsintervalle pro Tier

✔ Individuelle Gewichtsintervalle pro Tier

✔ Dynamischer Futterbestand

✔ Taxonomiebilder

✔ Firebase Grundstruktur

✔ Firestore

✔ Firebase Storage

✔ Cloud-Grundlagen

✔ Mobile First

✔ TC2 Design

---

## Benutzeroberfläche

✔ Dashboard

✔ Profil V4

✔ Tierkarten

✔ Nachzuchten

✔ Futterbestand

✔ Einstellungen

✔ Navigation

✔ Hamburger Menü

✔ Smart Dashboard (Grundstruktur)

---

## Datenhaltung

✔ Lokaler Store

✔ Public-ID

✔ UUID

✔ Cloudstruktur

✔ Dokumentenstruktur

✔ Bildstruktur

✔ Tierstruktur

---

# Teilweise umgesetzt

AnimalEngine

Status

Teilweise integriert.

Ziel

Alle Tierinformationen ausschließlich über AnimalEngine bereitstellen.

---

Smart Dashboard

Grundfunktion vorhanden.

Langfristig sollen sämtliche Daten ausschließlich über Engines geliefert werden.

---

Dokumentencenter

Grundstruktur vorhanden.

Upload und Verwaltung sollen weiter ausgebaut werden.

---

Cloud

Grundfunktion vorhanden.

Synchronisation soll langfristig robuster werden.

---

# Noch nicht umgesetzt

ReminderEngine

HealthEngine

SearchEngine

StatisticsEngine

PhotoEngine

DocumentEngine

Terrarienverwaltung

Zuchtverwaltung

Inkubationsverwaltung

Kalender

Backupsystem

Exportcenter

Mehrbenutzerbetrieb

KI-Assistent

OCR

Sprachsteuerung

Etikettendruck

PDF-Center

---

# Bekannte Baustellen

ReminderEngine existiert noch nicht vollständig.

HealthEngine existiert noch nicht vollständig.

Dashboard enthält teilweise noch eigene Berechnungen.

Mehrere Module besitzen noch Legacy-Code.

Suche ist noch verteilt.

Dokumentenverwaltung ist noch unvollständig.

Cloud-Synchronisation besitzt noch Optimierungspotenzial.

---

# Technische Schulden

Alte Berechnungen schrittweise entfernen.

Doppelte Geschäftslogik beseitigen.

Alte Dashboard-Komponenten ersetzen.

Legacy-Code abbauen.

Berechnungen in Engines verschieben.

Historische Datenmodelle vereinheitlichen.

---

# Verbindliche Architekturentscheidungen

Diese Entscheidungen gelten als abgeschlossen.

Sie werden nicht erneut diskutiert.

AnimalEngine wird zentrale Geschäftslogik.

ReminderEngine verwaltet sämtliche Erinnerungen.

HealthEngine verwaltet sämtliche Gesundheitsdaten.

StatisticsEngine liefert sämtliche Statistiken.

SearchEngine übernimmt sämtliche Suchvorgänge.

PhotoEngine verwaltet sämtliche Bilder.

DocumentEngine verwaltet sämtliche Dokumente.

Store verwaltet lokale Daten.

Firebase verwaltet ausschließlich Cloud-Daten.

UI-Dateien enthalten keine Geschäftslogik.

Keine fest programmierten Tierarten.

Keine fest programmierten Futterarten.

Keine globalen Pflegeintervalle.

Keine globalen Gewichtsintervalle.

Alle Intervalle gehören ausschließlich zum jeweiligen Tier.

UUID bleibt intern.

Public-ID wird dem Benutzer angezeigt.

TC2 bleibt der verbindliche Designstandard.

---

# Was niemals geändert werden darf

Ohne ausdrückliche Entscheidung dürfen folgende Punkte nicht geändert werden.

TC2 Design

Public-ID-System

UUID-System

Repositorystruktur

AnimalEngine-Konzept

ReminderEngine-Konzept

HealthEngine-Konzept

Cloudarchitektur

Mobile First

Komplette Dateien liefern

Keine Snippets

Benutzer committed selbst

---

# Aktuelle Prioritäten

Priorität 1

ReminderEngine

Priorität 2

HealthEngine

Priorität 3

AnimalEngine vollständig integrieren

Priorität 4

Dashboard vollständig auf Engines umstellen

Priorität 5

Dokumentencenter

Priorität 6

Terrarienverwaltung

Priorität 7

Zuchtverwaltung

Priorität 8

KI-System

---

# Zuletzt getroffene Entscheidungen

Globale Pflegeintervalle wurden entfernt.

Pflegeintervalle werden ausschließlich pro Tier gespeichert.

Gewichtsintervalle werden ausschließlich pro Tier gespeichert.

Taxonomiebilder dienen als Platzhalter.

Eigene Tierbilder besitzen immer Vorrang.

Comic-/Kinderbuchstil wird nicht verwendet.

Premium-Optik besitzt höchste Priorität.

Repository wird niemals automatisch verändert.

ChatGPT liefert vollständige Dateien.

Der Benutzer übernimmt sämtliche Commits.

---

# Nächster geplanter Entwicklungsschritt

Der nächste Entwicklungsschritt wird nach jedem Commit aktualisiert.

Dadurch kann ein neuer Chat jederzeit unmittelbar an der richtigen Stelle weiterarbeiten.
---

# ARBEITSKONTEXT FÜR ZUKÜNFTIGE CHATS

> Dieser Abschnitt richtet sich ausschließlich an ChatGPT. Er beschreibt die verbindliche Arbeitsweise für dieses Projekt.

---

# Ziel

Dieses Dokument dient dazu, dass ein neuer Chat ohne erneute Projekterklärung unmittelbar weiterarbeiten kann.

Vor jeder Antwort sind zunächst

1. dieses Dokument

und anschließend

2. das aktuelle Repository

zu analysieren.

Erst danach dürfen Änderungen vorgeschlagen werden.

---

# Verbindlicher Workflow

Der folgende Ablauf gilt dauerhaft.

Repository analysieren

↓

Aktuelle Architektur verstehen

↓

Bereits vorhandene Funktionen prüfen

↓

Betroffene Dateien identifizieren

↓

Lösung planen

↓

Komplette Dateien liefern

↓

Benutzer ersetzt Dateien lokal

↓

Benutzer committed

↓

Nach "Commited"

automatisch

den nächsten sinnvollen Entwicklungsschritt liefern.

---

# Code-Regeln

Immer komplette Dateien liefern.

Niemals Snippets.

Niemals Diffs.

Niemals Platzhalter.

Niemals Pseudocode.

Keine halbfertigen Lösungen.

Alle gelieferten Dateien müssen unmittelbar lauffähig sein.

---

# Repository-Regeln

Das Repository besitzt immer Vorrang.

Vor jeder Änderung muss geprüft werden

welche Dateien bereits existieren

welche Funktionen bereits existieren

welche Architektur bereits vorhanden ist

welche Logik bereits umgesetzt wurde.

Keine Funktion darf doppelt implementiert werden.

---

# Architektur-Regeln

Geschäftslogik gehört ausschließlich in Engines.

UI-Dateien dienen ausschließlich

- Darstellung

- Navigation

- Benutzerinteraktion.

Store

verwaltet lokale Daten.

Firebase

verwaltet Cloud-Daten.

Keine Berechnungen mehrfach implementieren.

---

# Design-Regeln

TC2 ist verbindlich.

Nicht verändern.

Neue Module müssen aussehen,

als wären sie bereits Bestandteil von TC2.

Premium statt verspielt.

Keine Comicoptik.

Keine Kinderbuchoptik.

Keine zufälligen Farben.

Keine unterschiedlichen Komponenten für dieselbe Aufgabe.

---

# Datenmodell-Regeln

Keine fest programmierten

Tierarten

Gattungen

Arten

Unterarten

Futterarten

Pflegeintervalle

Gewichtsintervalle

Dokumenttypen

Erinnerungen

Alles bleibt vollständig dynamisch.

---

# Änderungen am Projekt

Vor jeder größeren Änderung prüfen

ob die Änderung

bestehende Architektur verletzt.

Falls ja

muss zuerst eine bessere Architektur vorgeschlagen werden.

Nicht einfach erweitern.

---

# Kommunikation

Keine langen Erklärungen.

Keine Grundsatzdiskussionen.

Kurz.

Technisch.

Lösungsorientiert.

Wenn der Benutzer

"Go"

schreibt

beginnt unmittelbar die Bearbeitung.

Wenn der Benutzer

"Commited"

schreibt

beginnt automatisch der nächste Entwicklungsschritt.

Es wird nicht erneut gefragt,

wie weitergearbeitet werden soll.

---

# Entscheidungen

Bereits getroffene Entscheidungen gelten dauerhaft.

Sie werden nicht erneut diskutiert.

Falls eine bessere Lösung gefunden wird,

muss diese begründet werden,

bevor bestehende Architektur geändert wird.

---

# Versionsregeln

Versionsnummern niemals selbst ändern.

Keine neuen Hauptversionen erzeugen.

Keine Dateinamen ändern,

wenn dies nicht ausdrücklich gewünscht wurde.

---

# Priorisierung

Bei neuen Aufgaben gilt folgende Reihenfolge.

1.

Fehler beheben

↓

2.

Architektur verbessern

↓

3.

Code vereinfachen

↓

4.

Performance verbessern

↓

5.

Neue Funktionen

↓

6.

Optische Verbesserungen

---

# Dokumentationsregeln

Dieses Dokument ist die zentrale Wissensquelle.

Neue Architekturentscheidungen

werden hier ergänzt.

Neue Module

werden hier ergänzt.

Neue Engines

werden hier ergänzt.

Neue Regeln

werden hier ergänzt.

Neue Datenmodelle

werden hier ergänzt.

Neue Projektentscheidungen

werden hier ergänzt.

Es werden keine weiteren Entwicklerhandbücher erstellt.

Dieses Dokument bleibt die einzige technische Referenz.

---

# Ziel für neue Chats

Ein neuer Chat soll

ohne weitere Projekterklärung

innerhalb weniger Sekunden

den vollständigen Projektkontext verstehen.

Danach soll unmittelbar mit der Entwicklung fortgefahren werden können.

Es sollen keine bereits geklärten Themen erneut besprochen werden.

Dieses Dokument ist dafür die verbindliche Grundlage.

---

# Ende des Handbuchs

Dieses Dokument wird fortlaufend erweitert.

Es ersetzt sämtliche separaten Projekterklärungen.

Es dient als dauerhafte technische Referenz für TerraControl.
