# Sascha's Python Dashboard

Version 1.0 ist eine statische Terraristik-Dashboard-App zur lokalen Verwaltung von Bestand, Nachzuchten, Fütterungen, Häutungen, Gewichten, QR-Codes, Backups und Google-Drive-Synchronisation.

## Projektstruktur

- `index.html`: Haupt-App mit Oberfläche, Styles und JavaScript-Logik
- `manifest.json`: PWA-Metadaten
- `service-worker.js`: Offline-Cache für die PWA
- `icon-192.png`: PWA Icon 192x192
- `icon-512.png`: PWA Icon 512x512

## Version 1.0 Umfang

- Bestandsverwaltung für Königspythons, Boas, Leopardgeckos und Vogelspinnen
- Lokale Datenspeicherung im Browser
- Nachzucht- und Gelegeverwaltung
- QR-Code-Erzeugung und QR-Suche
- Fütterungs-, Häutungs- und Gewichtshistorien
- PDF-Export für Tier- und Gelegeberichte
- JSON-Backup und Import
- PWA-Unterstützung mit Manifest und Service Worker
- Vorbereiteter Google-Drive-Sync

## Betrieb

Die App ist eine statische Web-App. Zum Starten genügt es, `index.html` über GitHub Pages oder einen statischen Webserver bereitzustellen.

## Datenhaltung

Die Nutzdaten liegen lokal im Browser. Backups sollten regelmäßig über die Backup-Funktion exportiert werden.
