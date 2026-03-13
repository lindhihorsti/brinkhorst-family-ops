import Link from "next/link";
import { SystemStatus } from "../lib/system-status";
import { BottomNav } from "../lib/ui";

export const metadata = { title: "Einstellungen — Family Ops" };

const SECTIONS = [
  {
    href: "/einstellungen/erscheinungsbild",
    icon: "🌙",
    title: "Erscheinungsbild",
    sub: "Hell, Dunkel oder Systemeinstellung",
  },
  {
    href: "/einstellungen/familie",
    icon: "👥",
    title: "Familie",
    sub: "Mitglieder hinzufügen & verwalten",
  },
  {
    href: "/einstellungen/kueche",
    icon: "🍳",
    title: "Küche",
    sub: "Basisvorrat · Präferenzen",
  },
  {
    href: "/einstellungen/einkauf",
    icon: "🛒",
    title: "Einkaufsliste",
    sub: "Standardansicht · Wochenplan-Snapshot · Shop-Format",
  },
  {
    href: "/einstellungen/finanzen",
    icon: "🏦",
    title: "Finanzen",
    sub: "Fixkosten · Monatseinkommen · Verantwortlichkeit",
  },
  {
    href: "/einstellungen/benachrichtigungen",
    icon: "🔔",
    title: "Benachrichtigungen",
    sub: "Telegram Auto-Send",
  },
  {
    href: "/einstellungen/aktivitaeten",
    icon: "💡",
    title: "Aktivitäten",
    sub: "Ausflüge · Zuhause",
  },
  {
    href: "/einstellungen/geburtstage",
    icon: "🎁",
    title: "Geburtstage & Geschenke",
    sub: "Default-Relation · Vorschaufenster · Geschenkideen-Defaults",
  },
  {
    href: "/einstellungen/pinnwand",
    icon: "📌",
    title: "Pinnwand",
    sub: "Kategorien hinzufügen & entfernen",
  },
  {
    href: "/einstellungen/aufgaben",
    icon: "✅",
    title: "Aufgaben",
    sub: "Punkte pro Aufgabe konfigurieren",
  },
];

export default function EinstellungenPage() {
  return (
    <main className="logo-backed-page" style={{
      minHeight: "100dvh", color: "var(--fg)",
      fontFamily: "var(--font)", paddingBottom: "var(--nav-height)",
    }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
        <span style={{
          width: 104,
          height: 104,
          borderRadius: 28,
          background: "linear-gradient(180deg, #64748b22 0%, #64748b40 100%)",
          border: "1px solid color-mix(in srgb, #64748b 30%, var(--border))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "clamp(56px, 7vw, 64px)",
        }}>
          ⚙️
        </span>
      </div>

      <div style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", padding: "0 var(--page-x-padding) var(--page-bottom-padding)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: "var(--header-title-size)", fontWeight: 700, margin: 0 }}>Einstellungen</h1>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            border: "1px solid var(--border)", borderRadius: 999,
            padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "var(--fg)",
          }}>
            Home
          </Link>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
              <div className="nav-tile" style={{
                border: "1px solid var(--border)", borderRadius: 20, padding: "14px 16px",
                boxShadow: "var(--shadow-sm)", background: "var(--bg)",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <span style={{
                  width: 44, height: 44, borderRadius: 14, background: "var(--bg-subtle)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>
                  {s.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{s.title}</p>
                  <p style={{ fontSize: 12, marginTop: 2, color: "var(--fg-muted)" }}>{s.sub}</p>
                </div>
                <span style={{ fontSize: 14, color: "var(--fg-muted)", flexShrink: 0 }}>›</span>
              </div>
            </Link>
          ))}
        </div>

        <SystemStatus marginTop={24} />
      </div>

      <BottomNav current="/einstellungen" />
    </main>
  );
}
