# Recipely Full Skin — Figma-Design als wählbares Theme

## Before

**Scope**: Das Figma-Kit "[FREE] Recipely — Food Recipe Mobile App UI Kit"
(File `aPoUc8hO80quXvylgEPgF7`, DhuhaCreative) als vollständiges, umschaltbares
Design umsetzen. Bestehendes Design darf nicht brechen; Auswahl in
Einstellungen → Erscheinungsbild. Beschluss (User): den bestehenden Farb-Skin
aus `fe3a517` **in place upgraden** (kein zweiter Switcher-Eintrag).

**Geplante Dateien**:
- `frontend/app/recipely.css` (neu — kompletter Skin)
- `frontend/app/globals.css` (alten Token-Block entfernen)
- `frontend/app/layout.tsx` (CSS-Import)
- `frontend/app/lib/ui.tsx` (Klassen-Hook für Chip)
- `frontend/app/einstellungen/erscheinungsbild/page.tsx` (Beschreibungstext)

**Testplan**: `tsc --noEmit`, ESLint (geänderte Dateien), `next build`,
Browser-Smoke auf `next dev`: Settings + Home mit `data-skin=recipely`,
Regression mit Standard-Skin (hell + dunkel).

## Figma-Analyse & Mapping

Das Kit hat 5 Screens (Page "💻 Design", Node `1:2`): Login, Home, Search,
Recipe Details, Account. Designsprache: Teal `#70b9be` (Brand), Navy `#0a2533`
(Text + primäre CTAs), Koralle `#ed7d5e`, Plus Jakarta Sans, weiße Karten ohne
harte Borders mit weichen Navy-Schatten, Radius 16/24, Buttons 54 px,
Pill-Tabs (aktiv = Teal gefüllt), Segmented Control (aktiv = Navy),
Bottom-Sheet mit 50×5-Drag-Handle, weiße schwebende Bottom-Bar.

**Mapping Figma-Screen ↔ App-Funktion** (autonome Entscheidungen):

| Figma-Screen | App-Funktion | Umsetzung |
|---|---|---|
| Home (Greeting, Featured, Category-Tabs, Popular Cards) | `/` Startseite | Karten-/Tile-Optik, Teal-Akzente, Bubble-Tabs via `Chip` |
| Search (Search Bar 54px, Bubble-Tabs, Recipe Rows) | `/kueche`, `/recipes` | Input-Tokens (Radius 16), Teal-Fokusring, Chip-Tabs |
| Recipe Details (Sheet, Segmented Tabs, Nutrition-Tiles) | `/recipes/[id]`, Modals | `modal-sheet` als Sheet mit Drag-Handle, Navy-Primärbuttons |
| Account (Profile-Card, Favorites-Grid) | `/einstellungen` | Karten-Styling, Arrow-Chips erben Token-Optik |
| Login | — nicht gemappt | App hat kein Auth-UI (Caddy Basic Auth); Button-Stil wiederverwendet |

Funktionen ohne Figma-Vorbild (Finanzen, Aufgaben, Pinnwand, Geburtstage,
Split) bekommen konsistente Akzentfarben aus der Kit-Palette
(Teal-Varianten + Koralle) über die bestehenden `--*-accent`-Tokens.

**Bewusste Abweichungen** (Funktion vor Form):
- Bottom-Nav behält alle 10 Einträge + Labels (Kit hat 4 Icons + Center-FAB);
  gestylt als weiße schwebende Bar mit Teal-Aktiv-Zustand.
- Kit-Assets (Food-Fotos, Iconly-Icons, Illustrationen) nicht exportiert:
  Figma-MCP-Quota (Starter: 6 Calls/Monat) war erschöpft; die App nutzt
  ohnehin eigene Rezeptfotos und Emoji-Icons. Follow-up unten.

## After

**Implementiert**:
- `frontend/app/recipely.css` — kompletter Skin unter `html[data-skin="recipely"]`:
  Tokens (Farben, Radius 12/16/24, Navy-Schatten, `--nav-height: 72px`),
  Jakarta-Font (auf `body`, s. Bugfix), Bottom-Nav (weiß, schwebend, Teal-aktiv),
  Chip → Bubble-Tab, Teal-Fokusring + `accent-color`, Modal → Sheet mit
  Drag-Handle, Badges in Teal/Koralle-Tints, Progress/Skeleton, Karten-Hover,
  helle Logo-Bühne auch bei System-Dark.
- `globals.css`: alter Token-Block (Z. 523–559) entfernt — ersatzlos nach
  `recipely.css` gewandert (lädt als letztes Stylesheet, gewinnt die Kaskade).
- `lib/ui.tsx`: `Chip` bekommt `className="chip"/"chip-active"` (kein Rule-Match
  außerhalb des Skins → Standard/Premium unverändert).
- Settings-Beschreibung aktualisiert.

**Bugfixes nebenbei** (beide seit `fe3a517` latent):
1. `--font: var(--font-jakarta)` lag auf `<html>`, aber next/font definiert
   `--font-jakarta` auf `<body>` → ungültige Deklaration, Serif-Fallback.
   Fix: Font-Override auf `html[data-skin="recipely"] body`.
2. Logo-Bühne/Startseiten-Hintergrund blieb bei System-Dark dunkel, obwohl der
   Skin `color-scheme: light` erzwingt. Fix: `--logo-page-*`-Overrides im Skin.

**Validierung**:
- `npx tsc --noEmit` ✅
- ESLint auf geänderten Dateien ✅ (1 vorbestehender `no-unescaped-entities`
  auf der editierten Zeile mitgefixt; 5 weitere Alt-Fehler in unberührten
  Dateien unverändert)
- `npm run build` ✅ (alle Routen generiert)
- Browser-Smoke (`next dev`, 390×844): Settings + Home in Recipely (Jakarta,
  Teal, schwebende Nav) ✅; Standard-Skin dunkel = unverändert ✅

**Follow-ups**:
- Figma-Quota resettet monatlich: dann optional Kit-Illustrationen/Iconly-Icons
  als SVG exportieren und Emoji-Icons im Recipely-Modus ersetzen.
- Optional: Greeting-Header ("Guten Morgen") für die Recipely-Startseite,
  analog Kit-Home — braucht Komponentenänderung, nicht nur CSS.
