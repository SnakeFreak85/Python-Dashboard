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

- Stammlieferant, Kategorie und Futterart wählen. Keine manuelle Größen- oder
  Packungsmengeneingabe: „Alle Größen vergleichen“ ruft die angebotenen
  Varianten der erfassten Shopseiten ab.
- Ergebnisse erscheinen auf der eigenen Route `feederPriceResults`, mit einem
  Abschnitt je Größe (Frostfutter) beziehungsweise Größe/Einheit/Packung (Insekten).
- Frostfutter wird pro Tier verglichen, Insekten pro Tier oder Gramm.
  Stück- und Grammangebote werden niemals ineinander umgerechnet.
- Identische Größen werden als identisch markiert. Überlappende geschlossene
  Gewichtsbereiche gelten als ähnlich, wenn mindestens die Hälfte des kleineren
  Bereichs überlappt. Bei offenen Plus-Klassen müssen die Untergrenzen höchstens
  20 Prozent (mindestens ein Gramm) auseinanderliegen. Es wird keine unbekannte
  Obergrenze erfunden. `120g+` und `120–150g` sind somit ähnliche Alternativen.
- Bei Insekten werden „adult“ und „groß“ als ähnliche Händlerbezeichnungen
  angezeigt; alle anderen Entwicklungsstufen bleiben getrennt.
- Händlerangaben und abweichende Packungsgrößen stehen direkt beim Angebot.
  Der Preisvorteil ist ein Warenpreisvergleich pro Einheit, keine Aussage über
  Futtereignung oder Liefergesamtpreis.
- Der günstigste belegte Stammpreis je Gruppe ist die Basis. Seine notwendige
  Packungsmenge bleibt sichtbar. Auch Gruppen ohne günstigere Alternativen
  bleiben auf der Ergebnisseite erhalten.
- Nur verfügbare EUR-Angebote mit eindeutiger Mengenangabe werden berücksichtigt.
  Versandkosten und Frostzuschläge sind nicht enthalten.
- Ergebnisse sind kurzlebiger Ansichtsstatus. Nach einem vollständigen Reload
  fordert die Ergebnisseite zu einem neuen Vergleich auf. Die Lieferantenauswahl
  bleibt im normalen Store gespeichert.

## Shopadapter und Grenzen

Anbieter: Xclusive Snakes, Frostfutterversand24, Frostfuttertiere.de und
Frostfutter-Online (Frostfutter), Tropic Shop (beide Kategorien), Kreuch & Fleuch,
QB Insects und Terraristikladen (Lebendfutter).
Die Auswahl ist auf eingerichtete Anbieter begrenzt. Ein beliebiger Shopname
oder eine beliebige URL kann nicht zuverlässig automatisch integriert werden;
neue Anbieter benötigen einen getesteten Adapter in `functions/feeder-prices.js`
und einen Eintrag in `v500/feeder-price-service.js`.

Xclusive verwendet konfigurierte Shopware-Varianten. Frostfutterversand24
liefert JSON-LD-Produktmodelle mit Preis und referenzierter Stückzahl.
Kreuch & Fleuch liefert WooCommerce-Varianten. Andere Quellen verwenden
belegte Produktnamen und strukturierte Offer-Daten. Suchergebnisse werden
auf maximal 32 passende Produktseiten pro Anbieter begrenzt (acht bei älteren Einzelabfragen). Bei begrenzten oder teilweise fehlgeschlagenen Abrufen wird der Anbieterstatus als teilweise angezeigt. Ein
Vergleich ist keine vollständige Marktübersicht. Shops können Abrufe
blockieren oder ihre Auszeichnung verändern. Fehlende Preise verhindern
keine Anzeige anderer Quellen, erlauben aber ohne Stammpreis keinen Vergleich.

Serverzugriffe sind auf HTTPS und registrierte Shophosts begrenzt; externe
Weiterleitungen werden verworfen. Shopantworten sind auf 2,5 MB begrenzt,
Abrufe auf zwanzig Sekunden, Cache auf zehn Minuten. Der angezeigte Zeitpunkt
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

### Umstellung auf alle Größen

Zwölf Node-Tests bestanden. DOM-Prüfung für fehlende Größen-/Mengenfelder,
`allSizes:true`, eigene Ergebnisseite, Ähnlichkeits- und Packungsmarkierungen
sowie Rücknavigation bestanden. Erneutes Firebase-Deployment erforderlich.

### Tropic und zusätzliche Anbieter

Tropic wird über direkte Kategorie-/Produktseiten und die im öffentlichen
Shop-JavaScript vorhandene JSON-Variantentabelle abgerufen. Der Shopcode wird
nicht ausgeführt. Der Adapter ruft maximal 16 Produktseiten und 64 zugehörige
Preisantworten ab. Öffentliche Sessioncookies werden nur serverseitig für den
Shopabruf wiederverwendet. Preisantworten verwenden denselben begrenzten Cache;
öffentliche Ajax-Abrufe benötigen maximal 20 Sekunden. Ausschließlich der
reguläre Einmal-Kaufpreis wird verwendet, nicht Abo- oder „ab“-Preise.
Ausverkaufte oder zeitlich nicht bestätigte Lieferungen bleiben ausgeschlossen.
Der Status „Preisdaten konnten nicht eindeutig gelesen werden“ unterscheidet
Parserprobleme von fehlenden passenden Angeboten. Kategorie-fremde Anbieter
werden im Ergebnisstatus nicht mehr angezeigt.
Frostfuttertiere.de nutzt WooCommerce-Offer-Preisfelder;
Frostfutter-Online JSON-LD; Terraristikladen strukturierte Offer-Metadaten.
Erneutes Deployment von `compareFeederPrices` ist erforderlich.

Validierung: 16 Node-Tests und DOM-Bedienprüfung bestanden. Reale
Tropic-Preisantworten für Ratten und Heimchen wurden geprüft; ein vollständiger
Heimchenabruf lieferte 14 Angebote, Frostfuttertiere.de 19 Rattenangebote.
Die ersten parallelen Abrufe zeigten teilweise Timeouts; reguläre Abrufe
haben deshalb jetzt 20 Sekunden Zeit und die Callable Function 90 Sekunden.
Temporäre Ausfälle bleiben möglich und werden im Anbieterstatus dargestellt.

Abschließende Liveprüfungen: Tropic lieferte neun Rattenangebote mit
Teilergebnisstatus, Frostfutter-Online 30 mit Teilergebnisstatus,
Frostfuttertiere.de 19 mit vollständigem Abrufstatus. Terraristikladen
liefert über seinen öffentlichen Shopware-Variantenwechsel acht verfügbare
Heimchenvarianten (klein/mittel/groß, 500/1000/2000 Stück; neun Datensätze
vor URL-Deduplizierung einschließlich der Ausgangsvariante).
