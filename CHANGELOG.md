# Changelog

Alle relevanten Änderungen an TerraControl werden in dieser Datei dokumentiert.

## 1.0.4-rc.11

- Eigenen Browser-Charakterisierungstest für Startseite und Smart Dashboard ergänzt; Bestandsabgrenzung, Fälligkeiten, Dokumentzählung, UUID-Routen und Nachkaufliste sind vor der Zusammenführung gemeinsamer Datenlogik abgesichert.
- Store-Migrationen mit versionierten Alt-, Misch- und aktuellen Daten-Fixtures gegen Tierverlust, UUID-Duplikate, Feldalias-Verlust und unbeabsichtigte Bildbereinigung abgesichert.
- Nachzuchtenbereich verhaltensneutral in gemeinsamen Kern, Editor und Ansichts-Controller aufgeteilt.
- Nicht verwendete Nachzuchten-APIs für direktes Editor-Einfügen und separates Löschen entfernt; Speichern und zentrale Profil-Löschung bleiben unverändert.
- Eigenen Browser-Charakterisierungstest für Nachzuchten ergänzt; Filter, UUID-Editor, Futterverknüpfung, Aliasfelder, Historienerhalt und Nummernkreis sind vor der Modularisierung abgesichert.
- Lokale Sicherungen aus Backup- und Kontoseite auf ein gemeinsames Export- und Importformat im Store umgestellt.
- Widersprüchliche Backup-Metadaten (`1.0.4` und `1.0.4-rc4`) auf den unveränderten App-Stand `1.0.4-rc.11` korrigiert und Importvalidierung vereinheitlicht.
- Nachweislich ungenutzte Store-Funktionen `addFood()` und `reduceFood()` entfernt; Futterbestand besitzt keine parallelen, schwächer validierten Schreibpfade mehr.
- Legacy-Fotomigration auf Arbeitskopien umgestellt; ein Tier übernimmt migrierte Metadaten erst nach vollständig erfolgreicher Verarbeitung.
- Einzel- und Gesamtmigration schreiben Fotolisten über eine gemeinsame Store-Operation; redundante zusätzliche Speicheraufrufe entfernt.
- Verkäuferdaten werden über eine zentrale Store-Operation gespeichert; das Einstellungsmodul verändert `settings` nicht mehr direkt.
- Andere Einstellungen bleiben beim Speichern erhalten, während veraltete globale Pflegeintervalle weiterhin gezielt entfernt werden.
- Anlegen, Bearbeiten, Bestandsänderung und Löschen von Futterpositionen auf zentrale ID-basierte Store-Operationen umgestellt.
- Duplikaterkennung und Bestätigungsdialoge bleiben als Bedienlogik im Futtermodul; direkte Änderungen an `foodInventory[]` wurden dort entfernt.
- Standardfutter-Änderungen aus Schnelleingabe und Chat auf einen gemeinsamen Store-Pfad umgestellt.
- Kanonischer Futterschlüssel, Typ, Größe, Zustand und verknüpfte Bestands-ID bleiben bei Standardfutter-Änderungen synchron.
- Hinzufügen, Titelbildwechsel und Löschen von Tierfotos auf stabile, zentrale Store-Operationen umgestellt.
- Fotoaktionen verwenden die Tier-UUID und unterstützen stabile Foto-IDs; nach dem Löschen eines Titelbilds wird ein verbleibendes Foto kontrolliert übernommen.
- Bestandsänderungen aus Schnelleingabe und Chat auf einen gemeinsamen, validierten Store-Pfad umgestellt.
- Neue Futterpositionen aus Spracheingaben werden kanonisch normalisiert; negative Bestände und doppelte Positionen werden verhindert.
- Nachweislich ungenutzte Parallelimplementierungen für Google-Drive-Sync, Schnelleingabe und die frühere Timeline aus `v500/` entfernt.
- Veralteten Firebase-Platzhalter entfernt; Firestore-Synchronisation, aktive Schnelleingabe und Profilchronik behalten jeweils einen eindeutigen produktiven Einstiegspfad.
- Die fünfstufige Überschreibungskette für Tiergruppenbilder in eine einzige verbindliche Icon-Implementierung zusammengeführt.
- Veraltete Spinnen-, Icon-Policy- und Schildkröten-Patchdateien aus App-Einstieg und Service-Worker entfernt; das sichtbare Ergebnis bleibt erhalten.
- Browsertests bilden nun die tatsächlich produktiv geladenen Tierbilder, leere unbekannte Gruppen und die finalen Spinnen- und Schildkrötendarstellungen ab.
- Gewichts-, Häutungs- und Gesundheitseinträge aus Profil, Schnelleingabe und Chat auf zentrale Store-Pfade sowie gemeinsame Ereignismodelle umgestellt.
- Das zuvor ungenutzte `profile-history`-Modul aktiviert und doppelte Verlaufslogik aus `profile-core` entfernt.
- Gesundheitshistorien werden beim Laden defensiv initialisiert, chronologisch sortiert und in der gemeinsamen Tierchronik berücksichtigt.
- Regressionstests für Historieneinträge, Quellzuordnung, Gewichtsaktualisierung und ID-basierte Löschung ergänzt.
- Automatische Taxonomie-Dekoration durch den DOM-Beobachter mit einem eigenen Browser-Regressionstest abgesichert.
- Automatische Firebase-Synchronisation gegen das Überschreiben lokaler Bestände durch fehlende, leere oder zeitlich nicht eindeutig einordenbare Cloud-Daten abgesichert.
- Konfliktentscheidung zwischen lokalem Stand und Firestore in einer reinen `NGTSyncPolicyEngine` zentralisiert; bewusstes manuelles Laden aus der Cloud bleibt nach Bestätigung möglich.
- Änderungen während eines laufenden Firestore-Speichervorgangs lösen zuverlässig einen weiteren Speicherlauf aus, statt unbemerkt verloren zu gehen.
- Fütterungs- und Gewichtsfälligkeiten sowie Gesundheitsstatus in einer gemeinsamen `CareRulesEngine` vereinheitlicht.
- Deaktivierte Intervalle werden in Startseite, Smart Dashboard, Profil und KI einheitlich respektiert; aktive Intervalle ohne bisherigen Eintrag gelten nachvollziehbar als fällig.
- Doppelte Fälligkeits- und Gesundheitslogik aus Dashboard, Smart Dashboard, Profil und Tierkarten entfernt und mit deterministischen Regressionstests abgesichert.
- Futterbestands-Normalisierung und Nachkaufentscheidung in einer reinen `FoodInventoryEngine` vereinheitlicht.
- Lesende Futteransichten verändern Store-Datensätze nicht mehr; fehlende Mindestbestände verwenden verbindlich den Wert `5`, explizite Werte einschließlich `0` bleiben erhalten.
- Startseite, Smart Dashboard und KI verwenden dieselbe Mindestbestandsregel; das Smart Dashboard zeigt nur noch tatsächlich nachzukaufende Positionen.
- Fütterungseinträge aus Tierprofil, Schnelleingabe und Chat auf einen zentralen Store-Pfad sowie ein gemeinsames Datenmodell umgestellt.
- Futtergewicht und Stückzahl getrennt, Legacy-Einträge kompatibel normalisiert und die Anzeige in Profil, Chronik, Timeline, Tierpass und PDF vereinheitlicht.
- Regressionstests für 150-g-Fütterungen, Bestandsabzug und verweigertes Futter ergänzt.
- Tier-, Profil-, Editor- und Smart-Dashboard-Verweise auf stabile UUIDs umgestellt; alte Index-Routen bleiben als kompatibler Fallback lesbar.
- UUID-basierte Store-Operationen zum Auflösen, Aktualisieren und Löschen ergänzt und gegen veränderte Array-Reihenfolgen getestet.
- `animals[]` als führenden Tierbestand abgesichert: Legacy-Listen werden nur noch beim Laden oder Import eingelesen und können gelöschte Tiere beim Speichern nicht wiederherstellen.
- Tierlöschung zentral über `NGTStore.deleteAnimal()` vereinheitlicht und mit Regressionstests für Migration, Persistenz, Nachzuchten und ungültige Indizes abgesichert.
- Löschschaltfläche im Tiereditor robust eingebunden, sodass sie bei allen vorhandenen Tieren unabhängig von kleinen Markup-Abweichungen angezeigt wird.
- Tierbestand verhaltensneutral in `animals-core`, `animals-food`, `animals-stock`, `animals-editor` und den `animals`-Controller aufgeteilt.
- Browser-Charakterisierungstests für Bestandsfilter, Editor, Legacy-Felder und öffentliche `NGTAnimals`-API ergänzt.
- App-Smoke-Test gegen frühes Laden des App-Frames abgesichert und um die Prüfung der Service-Worker-App-Shell erweitert.
- Fehlende Abschlussklammer in `ai-query.js` behoben und die globale AI-Abfrage im Smoke-Test abgesichert.
- Browser-Charakterisierungstest für Taxonomie-Normalisierung, lokalen Cache, Bild-Fallbacks und UI-Dekoration ergänzt.
- Taxonomiedaten verhaltensneutral in Core-, Store- und Cloud-Module mit kompatiblem `NGTTaxonomy`-Controller aufgeteilt.
- Taxonomie-UI verhaltensneutral in Illustrations-, Dekorations- und kompatiblen `NGTTaxonomyUI`-Controller aufgeteilt.
- Aktive App-Bereiche, öffentliche Einstiegsseiten, Dokumentencenter und Legacy-Einstiege auf den gemeinsamen TC2-Standard umgestellt.
- Native Browser-Dialoge durch zugängliche TC2-Dialoge ersetzt und einen Browser-Test für TC2-Markup, Dialoge, Versionen und mobile Überläufe ergänzt.
- Sämtliche internen App-Routen und Unteransichten verwenden nun zentral den kompakten Kopfbereich, Hamburger-Button, Seitenrahmen und die Breite von Startseite und Smart Dashboard.
- `PROJECT_HANDOFF.md` als verbindliche Übergabe für neue Projektchats ergänzt und README, Handbook sowie Agent-Anweisungen auf den aktuellen Stand gebracht.

- `v500/` als aktive Codebasis konsolidiert.
- TerraControl-Branding, TC2-Oberfläche und mobile PWA-Nutzung vereinheitlicht.
- Tierverwaltung, Tierprofil, Taxonomie, Nachzuchten, Futterverwaltung, QR-Tierpass, Backup und Firebase-Synchronisation weiterentwickelt.
- AnimalEngine als zentrale tierbezogene Fachlogik erweitert.
- Browser-Checks für zentrale AnimalEngine-Funktionen ergänzt.
- App-Smoke-Test für Einstiegspunkt, lokale Assets, globale APIs, Store und Modulregistrierung ergänzt.
- Nicht mehr verwendete v1-Root-Assets entfernt.
- Versionsangaben, Cache-Busting-Parameter, Manifest und Service-Worker-Cache auf `1.0.4-rc.11` vereinheitlicht.
- Service-Worker-App-Shell auf alle lokal geladenen produktiven Module erweitert.
- Bestätigte Profil-Hilfslogik auf AnimalEngine umgestellt.
- Tierprofil in `profile-core`, `profile-food`, `profile-health`, `profile-passport`, `profile-photos` und den Profil-Controller aufgeteilt.
- README und Developer Handbook auf die modulare Profilarchitektur und den aktuellen Projektstand aktualisiert.
- `AGENTS.md` mit verbindlichen Repository-Regeln für Codex und andere Coding Agents ergänzt.

## 1.0.0

- Version 1.0 im Branch `release/v1` vorbereitet.
- PWA-Manifest auf den damaligen Release-Stand angepasst.
- Service-Worker-Cache auf Version 1.0 benannt.
- Erstes README mit Projektstruktur, Funktionsumfang und Betriebshinweisen ergänzt.
