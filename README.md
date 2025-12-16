# Erfassung von Koordinaten für vordefinierte Orte

## Ziel

Wir wollen für eine Liste von **vordefinierten Orten** die exakten GPS-Koordinaten vor Ort erfassen.

Die Orte liegen zunächst mit ungenauen Koordinaten in einer **CSV-Datei** vor. Diese wird in die App geladen. Der Anwender begibt sich zum jeweiligen Ort, übernimmt seine aktuelle GPS-Position und ersetzt damit die ungenaue Koordinate.

Die korrigierten Daten werden im **LocalStorage** gespeichert und können als **CSV** (im Originalformat) oder **KML** exportiert werden.

---

## Datenmodell

### Standardfelder (müssen als Spalten vorhanden sein)

- **ID** (`id`): Eindeutige Kennung des Ortes
- **Name** (`name`): Bezeichnung des Ortes
- **Koordinate** (`lat`/`lon`): Wird bei Korrektur mit GPS-Position überschrieben
- **Zeitstempel** (`korrigiert_am`): Datum/Uhrzeit der Korrektur (leer = noch nicht korrigiert)
- **Kommentar** (`kommentar`): Freitextfeld für Anmerkungen vor Ort

→ Die Spalten müssen existieren, können aber leer sein.

### Optionale Zusatzfelder

Beliebige weitere Spalten in der CSV werden:

- Beim **Import** übernommen
- Im **Popup** auf der Karte angezeigt
- Im **LocalStorage** mitgespeichert
- Beim **Export** wieder ausgegeben

→ So kann jeder Anwender eigene Felder ergänzen (z. B. `kategorie`, `priorität`, `zuständig`).

**Regel:** Ein Ort gilt als **korrigiert**, wenn ein Zeitstempel vorhanden ist.  
*(Die Original-CSV mit den ursprünglichen Koordinaten bleibt als Backup erhalten.)*

---

## Vorgehensweise

### 1. Technische Basis

- **Web-App** auf GitHub Pages (kein App-Store nötig).
- **Leaflet.js** für die Anzeige von OpenStreetMap-Karten.
- **Geolocation API** des Browsers für die aktuelle GPS-Position.
- **LocalStorage** zur persistenten Speicherung der Arbeitsdaten.
- **Export** als CSV (Originalformat) und KML.

### 2. Workflow für Anwender

1. Anwender öffnet die Web-App im Browser (z. B. Android-Gerät).
2. Lädt eine **CSV-Datei** mit den vordefinierten Orten (ungenaue Koordinaten).
3. Sieht die OSM-Karte mit allen Orten als Marker.
4. Fährt zu einem Ort, klickt den Marker an → Button „Aktuelle Position übernehmen".
5. Die GPS-Koordinate ersetzt die alte, ein **Zeitstempel** wird gesetzt.
6. Fortschritt wird automatisch im **LocalStorage** gespeichert.
7. Kann jederzeit unterbrechen und später weitermachen.
8. Am Ende: **Export** als CSV oder KML.

### 3. Kartenansicht & Filter

- **Zwei Marker-Typen** auf der Karte:
  - 🔴 **Unkorrigiert**: Orte ohne Zeitstempel (ursprüngliche Koordinate)
  - 🟢 **Korrigiert**: Orte mit Zeitstempel (neue Koordinate)
- **Filter-Optionen**: Beide Marker-Typen können einzeln ein-/ausgeblendet werden.
- So behält man den Überblick, welche Orte noch ausstehen.

### 4. Vorteile

- Keine Installation notwendig.
- Daten bleiben lokal, kein Server erforderlich.
- **Unterbrechbar**: Fortschritt wird im LocalStorage gespeichert.
- **Übersichtlich**: Korrigierte und offene Orte visuell unterscheidbar.
- Einfacher Export für Weiterverarbeitung in Excel oder GIS-Systemen.
- **Universell einsetzbar** für beliebige Orte.

### 5. Aufwand

- **1–2 Tage Entwicklungszeit** für einen funktionsfähigen Prototyp.
- Nutzung von Standardbibliotheken (Leaflet, Geolocation API, PapaParse für CSV).
- Erweiterungen (Offline-Karten, KML-Export) optional.

---

## Beispiel: CSV-Format

```csv
id;name;lat;lon;korrigiert_am;kommentar
1;Marktplatz;51.34127;12.37453;2025-01-15T10:23:45;Schild verdeckt
2;Hauptbahnhof;51.3456;12.3801;;
3;Rathaus;51.33982;12.37118;2025-01-15T11:05:12;
```

→ Zeile 2 hat keinen Zeitstempel = noch nicht korrigiert.  
→ Import- und Export-Format sind identisch.

---

## Beispiel-Funktionalität (Pseudocode)

```js
// CSV laden (mit PapaParse)
function loadCSV(file) {
  Papa.parse(file, {
    header: true,
    complete: function(results) {
      orte = results.data;
      orte.forEach(ort => {
        ort.korrigiert_am = ort.korrigiert_am || null;
      });
      saveToLocalStorage();
      showOnMap();
    }
  });
}

// Aktuelle Position übernehmen
function korrigiereOrt(ortId) {
  navigator.geolocation.getCurrentPosition(function(pos) {
    let ort = orte.find(o => o.id === ortId);
    ort.lat = pos.coords.latitude;
    ort.lon = pos.coords.longitude;
    ort.korrigiert_am = new Date().toISOString();
    saveToLocalStorage();
    updateMarker(ort);
  });
}

// Export als CSV
function exportCSV() {
  let csv = Papa.unparse(orte, { delimiter: ";" });
  downloadFile(csv, "orte_korrigiert.csv", "text/csv");
}

// Export als KML
function exportKML() {
  let kml = generateKML(orte);
  downloadFile(kml, "orte.kml", "application/vnd.google-earth.kml+xml");
}
```

---

## Fazit

Eine kleine Web-App auf GitHub Pages erfüllt den Anwendungsfall effizient:  
**CSV laden → Orte auf Karte sehen → vor Ort GPS übernehmen → Fortschritt automatisch speichern → CSV/KML exportieren.**
