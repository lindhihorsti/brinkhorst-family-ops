# Fix: Premium-Design — unlesbare Buttons & FAB hinter Pill-Nav

## Before

**Bug-Report (User)**: Im Premium-Design (`data-ux="premium"`) sind Buttons auf
mehreren Seiten in hell UND dunkel unlesbar (komplett weiß bzw. schwarz):
„+ Neues Rezept" (`/recipes`), „+ Neue Einkaufsliste" (`/einkauf`, liegt
zusätzlich hinter der Navigation), „Fixkosten hinzufügen" (`/finanzen/fixkosten`).
Auftrag: generell prüfen und korrigieren.

**Geplante Datei**: nur `frontend/app/premium.css`.

## Root Cause

1. **Kontrast**: Die „Liquid Glass"-Card-Regeln (`.p-page-content
   :not(button)[style*="var(--radius-md/lg)"] { background: var(--bg-card)
   !important }`, Z. ~1098/1110/1119) matchen auch **Link-Buttons** —
   `styles.buttonPrimary`/`styles.fab` werden oft auf `<Link>` (Anker) gelegt,
   die `:not(button)` nicht ausschließt. Ergebnis: Hintergrund wird
   `--bg-card` (weiß/fast-schwarz), Textfarbe bleibt `var(--bg)` →
   weiß-auf-weiß bzw. schwarz-auf-schwarz. Die vorhandene
   Primary-Button-Regel (Z. ~1170) verlor doppelt: (a) niedrigere Spezifität
   als die Card-Regeln, (b) ihr Selektor `[style*="background: var(--fg)"]`
   matcht SSR-Markup nicht — React serialisiert serverseitig **ohne**
   Leerzeichen nach dem Doppelpunkt (`background:var(--fg)`), CSSOM
   client-seitig **mit**. (`[style*="buttonPrimary"]` war toter Code —
   JS-Variablennamen landen nie im style-Attribut.)
2. **FAB hinter Nav**: `styles.fabWrap` sitzt bei `bottom: calc(--nav-height
   + 12px)` mit `z-index: 50`; die Premium-Pill-Nav ist `fixed` bei
   `bottom: 20px`, ~70 px hoch, `z-index: 200`. Mit `--nav-height: 64px`
   (globals) überlappt der FAB die Nav und liegt dahinter.

## After (alle Änderungen in `premium.css`)

1. Card-Glass-Regeln (3 Selektorgruppen: hell, `@media` dark, `data-theme`
   dark): zusätzlich `:not([style*="background: var(--fg)"])`
   `:not([style*="background:var(--fg)"])` — fg-invertierte Elemente sind
   raus, Cards unverändert.
2. Primary-Button-Regel: alle 4 Serialisierungs-Kombinationen
   (bg/color × mit/ohne Leerzeichen), plus explizit `color: #fff !important`.
   Greift generisch für buttonPrimary, fab und chipActive — als `<button>`
   und als `<Link>`.
3. `html[data-ux="premium"] { --nav-height: 96px }` — hebt FABs, Toasts und
   Seiten-Padding überall über die Pill-Nav (generischer Fix, nicht pro
   Seite). Kombi-Selektor `[data-ux="premium"][data-skin="recipely"]`
   verhindert, dass das später geladene `recipely.css` (72 px) das aushebelt.

**Validierung** (Browser-Smoke, `next dev`, Premium aktiv):
- `/recipes` hell + dunkel: „+ Neues Rezept" orange/weiß ✅
- `/einkauf` dunkel: FAB orange/weiß, vollständig **über** der Pill-Nav ✅
- `/finanzen/fixkosten` hell + dunkel: „+ Neue Fixkosten hinzufügen" orange/weiß ✅
- Sekundär-Buttons, Inputs, Cards (Glass), Hub-Heros unverändert ✅
- Classic-/Recipely-Design unberührt (alle Regeln unter `html[data-ux="premium"]`) ✅

**Nebenwirkung (gewollt)**: Aktive Chips (`chipActive`) erscheinen im Premium
jetzt als Accent-Pill mit weißem Text statt fg-invertiert — konsistent mit dem
Accent-System und in beiden Themes lesbar.

## Nachtrag: Bereichsfarbe statt globalem Orange (User-Wunsch)

Die Primary-Button-Regel nutzt jetzt `var(--page-accent, var(--accent))` statt
`var(--accent)` — `Page` setzt `--page-accent` aus dem `iconAccent`-Prop jeder
Seite (dieselbe Quelle wie Hero/Kachel). Buttons sind damit pro Bereich
eingefärbt: Rezepte terracotta, Einkauf teal, Fixkosten gold usw.; Seiten ohne
`iconAccent` fallen aufs globale Accent-Orange zurück. Schatten via
`color-mix` aus derselben Farbe. Verifiziert auf `/recipes`, `/einkauf`,
`/finanzen/fixkosten` (Docker-Stack, hell).

## Nachtrag 2: Einheitliche CTA-Breiten über Display-Modi (User-Wunsch)

Drei konkurrierende Muster vereinheitlicht: fixe FABs waren auf
`--fab-max-width` (420/620/720) gekappt, In-Flow-CTAs mit `width: 100%`
(14 Stellen, v. a. Einstellungen) spannten auf iPad/Web die volle
Spaltenbreite (860/1180 px), Fixkosten hatte `minWidth: 240` bzw.
intrinsische Breite. Jetzt gilt überall: volle Breite, gekappt auf
`--fab-max-width`, zentriert. Umsetzung: generische Regel in `globals.css`
(Attribut-Selektor auf `width:100%` + fg-Hintergrund, beide
Serialisierungsvarianten, design-agnostisch für Classic/Premium/Recipely)
plus Normalisierung der zwei Fixkosten-Buttons auf `width: "100%"`
(`frontend/app/finanzen/fixkosten/page.tsx:53,109`). Verifiziert im
Web-Modus: Fixkosten-CTA und Settings-„Speichern" beide 720 px zentriert;
iPhone-Modus unverändert (fab-max-width = Spaltenbreite).
