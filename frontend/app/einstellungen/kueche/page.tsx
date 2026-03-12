"use client";

import Link from "next/link";
import { BtnLink, Page, styles } from "../../lib/ui";

const SECTIONS = [
  {
    href: "/einstellungen/kueche/basisvorrat",
    icon: "🧺",
    title: "Basisvorrat",
    sub: "Immer da · Prüfen · Varianten aus Rezepten",
    accent: "#0f766e",
  },
  {
    href: "/einstellungen/kueche/praeferenzen",
    icon: "🥕",
    title: "Präferenzen",
    sub: "Bevorzugte Zutaten für den Wochenplan",
    accent: "#e8673a",
  },
];

export default function KuecheSettingsPage() {
  return (
    <Page
      title="Küche"
      subtitle="Basisvorrat und Präferenzen"
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      <div style={{ display: "grid", gap: 12 }}>
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="nav-tile" style={{ ...styles.card, display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: `color-mix(in srgb, ${section.accent} 18%, var(--bg))`,
                  border: `1px solid color-mix(in srgb, ${section.accent} 30%, var(--border))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {section.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{section.title}</div>
                <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>{section.sub}</div>
              </div>
              <span style={{ fontSize: 14, color: "var(--fg-muted)", flexShrink: 0 }}>›</span>
            </div>
          </Link>
        ))}
      </div>
    </Page>
  );
}
