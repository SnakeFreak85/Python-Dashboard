# Futterpreisvergleich

Der Einstieg steht auf der Startseite direkt unter **Verpaarungsplanung**.
Der Stammlieferant, Abholung/Lieferung, Kategorie und letzte Auswahl werden
über `NGTStore.saveFeederPricePreferences()` unter
`settings.feederPriceComparison` gespeichert und sind Bestandteil des normalen
Backups und der bestehenden Synchronisation. Tierbestand und Futterbestand
werden durch Vergleiche nicht verändert.

## Einmalige Bereitstellung

GitHub Pages veröffentlicht nur die Oberfläche. Der serverseitige Shopabruf
benötigt die neue Firebase Callable Function im bestehenden Projekt:

```bash
cd functions
npm ci
cd ..
firebase deploy --only functions:compareFeederPrices
```

Es wird kein neuer API-Schlüssel benötigt. Firebase-Anmeldung und ein
functionsfähiges Firebase-Projekt sind erforderlich. Die App verwendet die
bestehende Firebase-Konfiguration und die Region `europe-west3`.
Ohne Deployment wird kein Preis erfunden; die Oberfläche zeigt einen Fehler.
Diese Änderung führt das Firebase-Deployment nicht automatisch aus.

## Vergleichsregeln

- Ratten und Mäuse: Packungspreis geteilt durch belegte Tierzahl, unabhängig
  von einer gewünschten Bestellmenge. Die Packungsgröße bleibt sichtbar.
- Heimchen und argentinische Waldschaben: identische Größe, Menge und Einheit.
  Gramm und Stück werden nicht ineinander umgerechnet.
- Exakte Gewichtsklassen: `120g+` und `120–150g` sind unterschiedliche Klassen.
  Größenbezeichnungen wie `adult`, `subadult` und `groß` bleiben ebenfalls
  getrennt, weil Händler sie unterschiedlich verwenden können.
- Nur eindeutig verfügbare EUR-Angebote mit belastbarer Mengenangabe.
  Unklare Dosen, Zubehör, ausverkaufte Artikel und bloße „ab“-Preise werden
  ausgeschlossen. Staffelrabatte ohne belegte Mindestabnahme werden nicht
  als Standardpreis verwendet.
- Der günstigste verfügbare Einzelpreis des Stammlieferanten ist die
  Vergleichsbasis; seine erforderliche Packungsgröße wird angezeigt.
- Ergebnisdialog: Stammpreis, günstigere Angebote, Ersparnis, Packungsmenge,
  Angebotslinks, Abrufzeitpunkt und Status aller geprüften Anbieter.
- Abholung benötigt keine zusätzliche Bestellmenge. Der Vergleich umfasst
  Warenpreise; Versand, Frostzuschläge, Entfernungen und Liefergesamtpreise
  werden nicht automatisch berechnet. Versandbedingungen sind verlinkt.

## Shopadapter und Grenzen

Initiale Anbieter: Xclusive Snakes und Frostfutterversand24 (Frostfutter),
Tropic Shop (beide Kategorien), Kreuch & Fleuch und QB Insects (Lebendfutter).
Die Auswahl ist auf eingerichtete Anbieter begrenzt. Ein beliebiger Shopname
oder eine beliebige URL kann nicht zuverlässig automatisch integriert werden;
neue Anbieter benötigen einen getesteten Adapter in `functions/feeder-prices.js`
und einen Eintrag in `v500/feeder-price-service.js`.

Xclusive verwendet konfigurierte Shopware-Varianten. Frostfutterversand24
liefert JSON-LD-Produktmodelle mit Preis und referenzierter Stückzahl.
Kreuch & Fleuch liefert WooCommerce-Varianten. Andere Quellen verwenden
belegte Produktnamen und strukturierte Offer-Daten. Suchergebnisse werden
auf maximal acht passende Produktseiten pro Anbieter begrenzt. Ein
Vergleich ist keine vollständige Marktübersicht. Shops können Abrufe
blockieren oder ihre Auszeichnung verändern. Fehlende Preise verhindern
keine Anzeige anderer Quellen, erlauben aber ohne Stammpreis keinen Vergleich.

Serverzugriffe sind auf HTTPS und registrierte Shophosts begrenzt; externe
Weiterleitungen werden verworfen. Shopantworten sind auf 2,5 MB begrenzt,
Abrufe auf zehn Sekunden, Cache auf zehn Minuten. Der angezeigte Zeitpunkt
ist der tatsächliche Abrufzeitpunkt, auch bei Cachetreffern.
Angemeldete Konten dürfen alle 30 Sekunden vergleichen; die Beschränkung
wird serverseitig per Firestore-Transaktion durchgesetzt. Der ausschließlich
serverseitige Pfad `feederPriceLimits/{uid}` enthält nur die letzte Anfragezeit
und gehört nicht zum Tierdatensnapshot. Es werden keine Clientrechte für
diese Collection benötigt.

## Tests

```bash
node --test functions/tests/feeder-prices.test.js
```

Abdeckung: Einzelpreis, Packungsmenge, Gewichtsklassen, Insekteneinheiten,
Varianten, Verfügbarkeit, fehlender Stammpreis, echte Ersparnis,
Eingabevalidierung und Ausschluss fremder Angebots-Hosts.

### Validierung dieses Änderungsschritts

- Neun Node-Tests für die neue Vergleichslogik bestanden.
- DOM-Bedienprüfung über HTTP mit JSDOM: Position direkt unter
  Verpaarungsplanung, Routing, Abholungsstandard, Kategoriewechsel,
  Anbieterwechsel, Ergebnisdialog, Persistenz und Fehler-Recovery bestanden.
- Bestehende HTML-Tests in JSDOM: AnimalEngine 74/74, Taxonomie 31/31,
  App-Smoke 131/131. Dies sind DOM-Ausführungen, keine echten Browserläufe.
- TC2-UI in JSDOM: 91/95; die gleichen vier Fehler treten im unveränderten
  HEAD auf (Drawer-Sprache, Einstellungsprüfung und zwei Layoutprüfungen).
  JSDOM ersetzt keine mobile Layoutprüfung.
- `tools/test-store.mjs` ist bereits im Ausgangsstand nicht lauffähig
  (`URLSearchParams` fehlt im VM-Kontext). Mit ausschließlich temporär
  ergänzter Browserumgebung scheitern Ausgangsstand und Änderung identisch
  an der vorhandenen Prüfung zum Futterbestand nach Verweigerung.
- Syntax für zwölf geänderte JavaScript-Dateien und exakte Service-Worker-
  URLs für alle acht geänderten Browserassets geprüft.
- Reale Shopantworten von Xclusive Snakes, Frostfutterversand24 und
  Kreuch & Fleuch wurden auf Variantenpreise und Mengen geprüft.
  Ein vollständiger Firebase-Livevergleich ist vor dem Deployment nicht
  verifiziert. QB Insects blockierte den automatisierten Abruf.
- Ein echter Browser-/Service-Worker-/Mobiltest konnte in dieser Umgebung
  nicht ausgeführt werden: Der Chromium-Download lieferte kein gültiges
  Browserarchiv. Die installierte App muss nach Deployment geprüft werden.
