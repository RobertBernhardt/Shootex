# Shootex – Redesign & Open-Night-Konzept

Inoffizieller Entwurf für Shootex (Outdoor-Lasertag, Turmstraße 36, 89195 Staig bei Ulm).
Die Website liegt in `index.html` (eine Datei, kein Build nötig, einfach im Browser öffnen).

## Faktenbasis

Übernommen aus öffentlichen Angaben von shootex.eu (Stand der Suchmaschinen-Snapshots, **vor Livegang mit Shootex abgleichen**):

| Punkt | Angabe |
|---|---|
| Spielfeld | „Churchtown“, 1.400 m², 6–24 Spieler; Zone „Shadows“ (Kurzwaffen); mobil buchbar |
| Preise | 17,50 €/Person/Std. (12–16 Spieler), 16,50 €/Person/Std. (18–25 Spieler), Rabatt ab der 3. Stunde, 10 % für Schüler/Studis/Schwerbehindertenausweis |
| Zahlung | Vor Ort, bar oder Karte |
| Öffnungszeiten | Fr + So 11–21 Uhr, sonst nach Absprache |
| Modi | Team Deathmatch, Herrschaft, Suchen & Zerstören (3–6 pro Team), Capture the Flag |
| Cup | 1. Shootex Cup (04.04.2024, Sieger All Gas No Breaks), 2. Shootex Cup (19.06.2024, Sieger The Crabs), Newcomer Cup 2024 |
| Kontakt | 0152 53 65 03 99 · info@shootex.eu |

Unklar bzw. zu prüfen: Preis für 17 Spieler (Lücke zwischen den Staffeln) und für unter 12 Spieler, Höhe des Rabatts ab Stunde 3, Mindestalter (eine Drittquelle nennt 12+), ob es wirklich zwei Felder gibt.

## Das Problem mit dem reinen Slot-Modell

Shootex verkauft ausschließlich ganze Slots an Gruppen. Das ist effizient, solange die Slots voll sind, hat aber zwei strukturelle Schwächen:

1. **Nachfrage unterhalb der Gruppenschwelle wird komplett verworfen.** Wer 3 Leute zusammenbekommt, kann nicht buchen. Diese Leute gehen nicht „später wieder hin“, sie gehen gar nicht hin.
2. **Leerstand ist unsichtbar und unverkäuflich.** Ein freier Freitagabend bringt 0 €, obwohl Personal und Gelände ohnehin da sind.

## Open Night (auf der Seite umgesetzt)

- Fester, wiederkehrender Termin: **freitags 19–21 Uhr, ab 18**
- Einzeltickets **25 €** (2 Std.), **max. 4 pro Buchung**
- **Spielgarantie ab 10 Tickets** bis 48 h vorher, sonst volle Erstattung
- Teams werden vor Ort nach Erfahrung gemischt
- Treffer fließen in eine Rangliste → Top-Spieler bekommen Cup-Einladungen
- **„Lobby öffnen“**: Gruppen unter Vollbesetzung können ihre Runde für Einzelspieler öffnen und zahlen dafür weniger

### Rechnung

| Szenario | Umsatz | pro Stunde |
|---|---|---|
| Gruppe 12 Spieler, 1 Std. | 210 € | 210 € |
| Gruppe 18 Spieler, 1 Std. | 297 € | 297 € |
| Open Night, Minimum (10 × 25 €, 2 Std.) | 250 € | 125 € |
| Open Night, voll (20 × 25 €, 2 Std.) | 500 € | 250 € |

**Konsequenz:** Bei Mindestbesetzung bringt die Open Night pro Stunde weniger als eine Gruppenbuchung. Sie darf deshalb **nur Slots belegen, die sonst leer blieben**, und nie einen buchbaren Gruppenslot verdrängen. Ihr eigentlicher Wert ist Kundenakquise: Wer allein kommt und Spaß hat, bringt beim nächsten Mal seine Crew mit. Deshalb lohnt es sich, die Kontaktdaten jeder Open-Night-Person zu erfassen und nachzufassen.

Die max. 4 Tickets pro Buchung verhindern, dass Gruppen die Open Night als billigere Gruppenbuchung missbrauchen (12 Leute × 25 € für 2 Std. wären 300 € statt 420 €).

### Risiken

- **Henne-Ei:** Ohne Mitspieler kommt keiner allein. Gegenmittel: die ersten Termine mit Cup-Teams und Stammspielern vorfüllen, damit der Füllstand von Anfang an sichtbar über null liegt.
- **Skill-Gefälle:** Cup-Veteranen gegen Ersttäter macht keinem Spaß. Gegenmittel: Teams mischen, Rangliste, ggf. separate Veteranen-Termine.
- **Ab 18:** Mischgruppen aus Fremden und Minderjährigen vermeiden.

## Marketing-Hebel (nach Wirkung sortiert)

1. **Google-Unternehmensprofil** mit echten Fotos und aktiver Bewertungsbitte nach jeder Runde. Aktuell kaum Bewertungen, und das ist der größte Conversion-Killer bei „Lasertag Ulm“.
2. **Nachtbilder.** Die Seite verkauft Atmosphäre. Echte Fotos und Videos bei Dämmerung mit Nebel und Sensorlicht sind das Asset, das fehlt.
3. **JGA- und Firmenevent-Landingpages**, jeweils mit eigenem Paketpreis. Das sind die zahlungskräftigsten Anlässe.
4. **Cup als Content-Maschine:** Livestream-Clips, Rangliste online, Teamporträts.
5. **Instagram/TikTok:** Ego-Perspektive-Clips (Kopfkamera) aus den Runden.

## Nächste Schritte für die Seite

- Echte Fotos und Videos aus der Galerie einsetzen (aktuell rein generierte Canvas-Szene)
- Buchungsformular an ein echtes Backend oder Buchungstool anbinden (aktuell erzeugt es einen Anfragetext für E-Mail/WhatsApp)
- Impressum und Datenschutz ergänzen
- Faktenbasis oben mit Shootex verifizieren
