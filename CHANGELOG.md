# Changelog

Alle relevanten Änderungen an TerraControl werden in dieser Datei dokumentiert.

## 1.0.4-rc.11

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
