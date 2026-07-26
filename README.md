# GastroPlan 4.3

Mobiler Wochen-Dienstplan für drei Gastronomiebetriebe.

## Enthalten
- Wochenansicht für Ristorante Castello, Kartoffelhaus Dessau und Kartoffelhaus Bitterfeld
- Mitarbeiterverwaltung
- Schichten mit Beginn und Ende
- Freitext/Aufgaben ohne feste Uhrzeit, z. B. Bierwagen, Stadtfest, Putzen, Veranstaltung, Vorbereitung oder Inventur
- Speicherung im Browser (sofort einsatzbereit)
- vorbereitete Supabase-Anbindung und SQL-Schema
- Vercel-kompatibel mit Next.js 16, React 19 und TypeScript

## Vercel
1. Repository in Vercel importieren.
2. Framework Preset: Next.js (wird meist automatisch erkannt).
3. Build Command: `npm run build`.
4. Node.js 20 oder neuer verwenden.

## Optional: Supabase
In Vercel unter Settings → Environment Variables eintragen:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Das SQL-Schema liegt unter `supabase/schema.sql`.


## Neu in Version 4.3
- Mitarbeiter bearbeiten
- Mitarbeiter aktivieren/deaktivieren
- Mitarbeiter löschen, sofern keine Dienstplaneinträge bestehen
- Stammbetrieb, Telefon und E-Mail hinterlegen
- Mitarbeiter werden je Betrieb gefiltert
