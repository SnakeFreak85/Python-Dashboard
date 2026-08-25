# Automatische Übersetzung von Mitteilungen

TerraControl-Mitteilungen werden weiterhin einmal auf Deutsch verfasst. Eine
geschützte Firebase Function übersetzt Überschrift und Nachricht beim
Veröffentlichen automatisch nach Englisch, Italienisch und Ungarisch. Die App
zeigt anschließend die zur gewählten App-Sprache passende Fassung an.

## Einmalige Einrichtung

Die folgenden Befehle werden im Projektordner ausgeführt. Der OpenAI API-Key
wird dabei als Firebase Secret gespeichert und darf weder in eine JavaScript-
Datei noch in GitHub eingefügt werden.

```text
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy --only functions:translateAndPublishAnnouncement,firestore:rules
```

Firebase fragt den API-Key beim ersten Befehl verdeckt ab. Nach erfolgreicher
Bereitstellung lautet der Ablauf in der App:

1. Mitteilung auf Deutsch eingeben.
2. „Übersetzen und veröffentlichen“ auswählen.
3. TerraControl speichert Deutsch, Englisch, Italienisch und Ungarisch zusammen.
4. Jeder Nutzer sieht automatisch die Version seiner gewählten App-Sprache.

Bereits vorhandene Mitteilungen ohne Übersetzungen bleiben kompatibel und
werden weiterhin auf Deutsch angezeigt.
