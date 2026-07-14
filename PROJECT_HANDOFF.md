# TerraControl Projektübergabe

> **Stand:** 14. Juli 2026  
> **Repository:** `SnakeFreak85/Python-Dashboard`  
> **Branch:** `main`  
> **Release-Kennung:** `1.0.4-rc.11`

Diese Datei ist der operative Einstieg für einen neuen Projektchat. Sie ergänzt `AGENTS.md` und `DEVELOPER_HANDBOOK.md` um den aktuellen Arbeitsstand und die verbindlichen Entscheidungen des Projektinhabers.

## 1. Lesereihenfolge für einen neuen Chat

1. `AGENTS.md` vollständig lesen.
2. `DEVELOPER_HANDBOOK.md` vollständig lesen.
3. Diese `PROJECT_HANDOFF.md` vollständig lesen.
4. Danach erst die konkret betroffenen Dateien untersuchen oder ändern.

## 2. Verbindliches Repository

- GitHub: `https://github.com/SnakeFreak85/Python-Dashboard`
- Hauptbranch: `main`
- Lokaler GitHub-Desktop-Ordner des Projektinhabers: `C:\Users\sasch\Desktop\TerraControl\Python-Dashboard`
- Letzter veröffentlichter Projektstand bei Erstellung dieser Übergabe: `12c9fcd feat: vereinheitliche App auf TC2`

Wichtig: Eine getrennte Codex-Arbeitskopie ist **nicht** die veröffentlichte Quelle. Änderungen müssen in den echten GitHub-Desktop-Ordner übertragen, committed und gepusht werden, bevor die installierte Test-App sie laden kann.

## 3. Feste Projektentscheidungen

- Die Version bleibt bis zur finalen Fertigstellung der App auf **`1.0.4-rc.11`**.
- Keine eigenmächtige Erhöhung von `VERSION`, Manifest-, HTML- oder Service-Worker-Version.
- Startseite und Smart Dashboard sind der visuelle Maßstab für TC2.
- Alle internen Seiten, Unterseiten und Untermenüs sollen denselben kompakten TC2-Rahmen, dieselbe Breite und denselben Hamburger-Menü-Stil verwenden.
- Änderungen sollen direkt im aktuellen Repository erfolgen; kein Draft-PR-Workflow, sofern der Projektinhaber ihn nicht ausdrücklich verlangt.
- Keine Änderungen an Google Play Console oder PWABuilder ohne ausdrücklichen Auftrag.
- Der Offline-Start der PWABuilder-App ist bekannt, wird aber ausdrücklich erst später bearbeitet.
- Ein Push kann die in Google Play getestete Web-App unmittelbar beeinflussen. Vor einem Push den Umfang klar benennen.

## 4. Aktueller Implementierungsstand

### TC2 und Navigation

- `v500.html` startet die App im kompakten `tc2RefMode`.
- Startseite und Smart Dashboard behalten ihre eigenen kompakten TC2-Köpfe.
- `v500/core.js` erzeugt über `appTop()` zentral den entsprechenden Kopf für alle übrigen internen Routen.
- Dadurch verwenden Bestand, Tiergruppen, Tierprofil, Nachzuchten, Futter, QR, Backup, KI, Einstellungen, Konto, Analytics und Release-Test denselben App-Rahmen.
- Der gemeinsame Drawer wird in `v500/app.js` aufgebaut.
- Native Browserdialoge wurden durch gemeinsame, zugängliche TC2-Dialoge ersetzt.
- Öffentliche Einstiegs-, Lösch- und Dokumentseiten verwenden die eigenständige TC2-Seitenbasis.

### Architektur und Refactoring

- Aktive Codebasis ist ausschließlich `v500/`.
- Tierprofil ist in Core-, Futter-, Gesundheits-, Tierpass-, Foto- und Controller-Module aufgeteilt.
- Tierbestand ist in Core-, Futter-, Bestands-, Editor- und Controller-Module aufgeteilt.
- Taxonomie ist in Core-, Store-, Cloud- und Controller-Module aufgeteilt.
- Taxonomie-UI ist in Illustrations-, Dekorations- und Controller-Module aufgeteilt.
- `AnimalEngine` bleibt die zentrale wiederverwendbare tierbezogene Fachlogik.

## 5. Deployment-Zusammenhang

Die Google-Play-Test-App lädt die veröffentlichte Website. Daher gilt:

```text
lokale Änderung
    → Commit
    → Push nach GitHub main
    → Aktualisierung der veröffentlichten Website
    → App vollständig schließen und neu öffnen
```

Nur lokal gespeicherte Dateien sind in der installierten App nicht sichtbar. JavaScript, CSS und `v500.html` werden im Service Worker netzwerkbevorzugt geladen und anschließend im bestehenden `1.0.4-rc.11`-Cache aktualisiert.

## 6. Teststatus

Ein vollständiger Browserlauf vor der letzten zentralen TC2-Kopfänderung war erfolgreich:

- TC2-UI: 45 Prüfungen
- App-Smoke: 69 Prüfungen
- Animals: 33 Prüfungen
- AnimalEngine: 21 Prüfungen
- Taxonomie: 26 Prüfungen
- JavaScript-Syntaxprüfung: 53 Dateien

Die abschließende Vereinheitlichung des App-Kopfes in Commit `12c9fcd` wurde auf ausdrücklichen Wunsch **nicht erneut automatisiert getestet**. Der Projektinhaber prüft diesen Stand direkt in der App und gibt anschließend Rückmeldung. Dies darf nicht als bereits bestandener Test des finalen Kopfbereichs dargestellt werden.

## 7. Aktuell offene Punkte

1. Rückmeldung des Projektinhabers zur TC2-Darstellung in der veröffentlichten App abwarten.
2. Eventuelle sichtbare Abweichungen anhand konkreter Seite oder Screenshot korrigieren.
3. Danach wieder dem technischen Projektplan folgen:
   - Nachzuchtmodul schrittweise verkleinern,
   - Store-Migrationen mit Fixtures absichern,
   - Gesundheits- und weitere Fachregeln aus UI-Modulen lösen.
4. Offline-/PWABuilder-Start erst auf ausdrücklichen Wunsch bearbeiten.

## 8. Wichtige Dateien für die nächste Arbeit

| Datei | Bedeutung |
|---|---|
| `v500.html` | produktive Shell, Script-Reihenfolge und initialer TC2-Modus |
| `v500/core.js` | Routing, History, gemeinsamer Modulkopf, Dialoge und Toasts |
| `v500/app.js` | Drawer, dynamische Navigation und App-Initialisierung |
| `v500/tc2.css` | vollständige TC2-Oberfläche und gemeinsamer Seitenrahmen |
| `v500/modules/dashboard.js` | Startseite und TC2-Referenzkopf |
| `v500/smart-dashboard.js` | Smart Dashboard und zweite TC2-Referenzansicht |
| `service-worker.js` | App-Shell und Netzwerk-/Cache-Verhalten |
| `VERSION` | fest auf `1.0.4-rc.11` |

## 9. Empfohlener Startprompt für einen neuen Chat

```text
Lies AGENTS.md, DEVELOPER_HANDBOOK.md und PROJECT_HANDOFF.md vollständig.
Arbeite ausschließlich im echten Repository SnakeFreak85/Python-Dashboard.
Behalte die Version 1.0.4-rc.11 bei. Prüfe anschließend den aktuellen Git-Status
und fahre mit dem in PROJECT_HANDOFF.md beschriebenen offenen Punkt fort.
```

