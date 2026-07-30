# TerraControl RC11 – Mitteilungen an Tester

## Zweck

Das Administratorkonto `saschad1711@gmail.com` kann eine zentrale Mitteilung
veröffentlichen. Angemeldete Tester sehen die aktive Mitteilung auf der
Startseite und können sie auf ihrem Gerät als gelesen markieren.

## Firebase-Regeln

Die vollständige Regeldatei `firebase/firestore.rules` enthält:

- die bisherigen Regeln für Nutzer- und Taxonomiedaten,
- die Regeln für den privaten Supportchat,
- die Regeln für zentrale Tester-Mitteilungen.

Für den dokumentierten RC11-Stand wird der vollständige Inhalt dieser Datei in
der Firebase-Konsole unter `Firestore Database → Regeln` veröffentlicht.

`firebase/firestore-announcements.rules.snippet` enthält den einzelnen
Mitteilungsblock für eine spätere Zusammenführung.

## Bedienung

1. Mit dem Administratorkonto anmelden.
2. `Support → Mitteilung an Tester` öffnen.
3. Überschrift und Nachricht eingeben.
4. Optional `Als wichtig markieren` aktivieren.
5. `Veröffentlichen` wählen.

Es gibt immer höchstens eine aktive Mitteilung. Erneutes Veröffentlichen ersetzt
die bisherige Nachricht. `Mitteilung beenden` entfernt sie von allen
Startseiten.

## Datenschutz und Verhalten

- Nur angemeldete Nutzer dürfen die aktive Mitteilung lesen.
- Nur das festgelegte Administratorkonto darf sie schreiben.
- Tester können die Mitteilung nicht verändern oder löschen.
- `Gelesen` wird ausschließlich lokal auf dem jeweiligen Gerät gespeichert.
- Eine neue Veröffentlichung wird durch ihren neuen Zeitstempel wieder
  eingeblendet.
- Die Funktion erzeugt keine Push-Benachrichtigung.
