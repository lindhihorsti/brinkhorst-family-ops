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
    href: "/einstellungen/benachrichtigungen",
    icon: "🔔",
    title: "Benachrichtigungen",
    sub: "Telegram Auto-Send",
  },
  {
    href: "/einstellungen/aktivitaeten",
    icon: "💡",
    title: "Aktivitäten",
    sub: "Standard-Ort · Budget · Transport",
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
    <main style={{
      minHeight: "100dvh", background: "var(--bg)", color: "var(--fg)",
      fontFamily: "var(--font)", paddingBottom: "var(--nav-height)",
    }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
        <div className="logo-stage">
          <img src="/logo.PNG" alt="Family Ops"
            className="logo-img logo-img-light" style={{ width: 200, height: "auto" }} />
          <img src="/logo-dark.png" alt="Family Ops Dark"
            className="logo-img logo-img-dark" style={{ width: 268, height: "auto" }} />
        </div>
      </div>

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 22px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, margin: 0 }}>Einstellungen</h1>
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

      <BottomNav current="/" />
    </main>
  );
}
