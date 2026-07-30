# TerraControl Supportchat – Firebase-Einrichtung

## Zweck

Der Supportchat speichert für jeden angemeldeten Tester eine eigene private
Unterhaltung:

```text
supportThreads/{firebaseUid}
└── messages/{messageId}
```

Tester können ausschließlich ihre eigene Unterhaltung lesen und beschreiben.
Das Administratorkonto `saschad1711@gmail.com` kann alle Unterhaltungen öffnen
und beantworten.

## Firestore-Regeln aktivieren

1. Firebase-Konsole öffnen.
2. Das Projekt `terracontrol-4c211` auswählen.
3. `Firestore Database` und anschließend `Regeln` öffnen.
4. Für den dokumentierten RC11-Stand den vollständigen Inhalt aus
   `firebase/firestore.rules` verwenden.
5. Regeln veröffentlichen.

`firebase/firestore-support.rules.snippet` bleibt zusätzlich als einzelner
Supportblock erhalten, falls die Regeln später mit weiteren Firebase-Bereichen
zusammengeführt werden müssen.

## Abnahmetest

1. Mit einem Tester-Google-Konto anmelden.
2. `Support` öffnen und eine Nachricht senden.
3. Prüfen, dass nur der eigene Chat sichtbar ist.
4. Mit `saschad1711@gmail.com` anmelden.
5. Prüfen, dass die neue Unterhaltung im Support-Posteingang erscheint.
6. Antworten und anschließend im Testerkonto den Echtzeitempfang prüfen.
7. Mit einem zweiten Tester-Konto sicherstellen, dass die Unterhaltung des
   ersten Testers nicht sichtbar oder direkt aufrufbar ist.

## Datenschutz und Umfang

- Der Chat akzeptiert nur Text bis 2.000 Zeichen.
- Bilder und Dateien sind in RC11 bewusst nicht vorgesehen.
- Gespeichert werden Firebase-UID, Name, E-Mail-Adresse, Nachrichtentext und
  Zeitstempel.
- Supportnachrichten sind nicht Bestandteil des Tierdaten-Backups.
- Die Play-Store-Datenschutzerklärung wurde um Firebase und Supportnachrichten
  ergänzt und muss vor der öffentlichen Veröffentlichung final geprüft werden.
