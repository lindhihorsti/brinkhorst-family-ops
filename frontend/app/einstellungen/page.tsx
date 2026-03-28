import Link from "next/link";
import { SystemStatus } from "../lib/system-status";
import { BottomNav, PremiumPillNav } from "../lib/ui";

export const metadata = { title: "Einstellungen — Family Ops" };

// ─── iOS-style grouped settings data ─────────────────────────────────────────

const SETTINGS_GROUPS = [
  {
    label: "Darstellung",
    items: [
      { href: "/einstellungen/erscheinungsbild", icon: "🌙", bg: "#5856d6", title: "Erscheinungsbild", sub: "Hell · Dunkel · Premium UX" },
    ],
  },
  {
    label: "Familie & Profil",
    items: [
      { href: "/einstellungen/familie", icon: "👥", bg: "#34c759", title: "Familie", sub: "Mitglieder verwalten" },
    ],
  },
  {
    label: "Haushalt",
    items: [
      { href: "/einstellungen/kueche",    icon: "🍳", bg: "#ff6b35", title: "Küche",         sub: "Basisvorrat · Präferenzen" },
      { href: "/einstellungen/einkauf",   icon: "🛒", bg: "#ff9500", title: "Einkaufsliste", sub: "Standardansicht · Shop-Format" },
      { href: "/einstellungen/aufgaben",  icon: "✅", bg: "#30d158", title: "Aufgaben",       sub: "Punkte pro Aufgabe" },
      { href: "/einstellungen/pinnwand",  icon: "📌", bg: "#ff2d55", title: "Pinnwand",       sub: "Kategorien konfigurieren" },
    ],
  },
  {
    label: "Geld",
    items: [
      { href: "/einstellungen/finanzen", icon: "🏦", bg: "#b88900", title: "Finanzen", sub: "Fixkosten · Einkommen · Verantwortlichkeit" },
    ],
  },
  {
    label: "Aktivitäten & Feste",
    items: [
      { href: "/einstellungen/aktivitaeten", icon: "💡", bg: "#2b7fff",  title: "Aktivitäten",          sub: "Ausflüge · Zuhause" },
      { href: "/einstellungen/geburtstage",   icon: "🎁", bg: "#db2777",  title: "Geburtstage & Geschenke", sub: "Vorschaufenster · Geschenkideen" },
    ],
  },
  {
    label: "Verbindungen",
    items: [
      { href: "/einstellungen/benachrichtigungen", icon: "🔔", bg: "#636366", title: "Benachrichtigungen", sub: "Telegram Auto-Send" },
    ],
  },
];

// Classic flat list (same as before, used in Classic mode)
const SECTIONS = SETTINGS_GROUPS.flatMap((g) => g.items);

export default function EinstellungenPage() {
  return (
    <>
      {/* ─── Classic Layout ──────────────────────────────────────────────── */}
      <div className="p-settings-classic">
        <main className="logo-backed-page" style={{
          minHeight: "100dvh", color: "var(--fg)",
          fontFamily: "var(--font)", paddingBottom: "var(--nav-height)",
        }}>
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
            <span style={{
              width: 104, height: 104, borderRadius: 28,
              background: "linear-gradient(180deg, #64748b22 0%, #64748b40 100%)",
              border: "1px solid color-mix(in srgb, #64748b 30%, var(--border))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "clamp(56px, 7vw, 64px)",
            }}>⚙️</span>
          </div>
          <div style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", padding: "0 var(--page-x-padding) var(--page-bottom-padding)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h1 style={{ fontSize: "var(--header-title-size)", fontWeight: 700, margin: 0 }}>Einstellungen</h1>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 4, border: "1px solid var(--border)", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Home</Link>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {SECTIONS.map((s) => (
                <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
                  <div className="nav-tile" style={{ border: "1px solid var(--border)", borderRadius: 20, padding: "14px 16px", boxShadow: "var(--shadow-sm)", background: "var(--bg)", display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 44, height: 44, borderRadius: 14, background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</span>
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
          <PremiumPillNav current="/einstellungen" />
        </main>
      </div>

      {/* ─── Premium Layout ──────────────────────────────────────────────── */}
      <div className="p-settings-premium">
        <div className="p-settings-wrap">
          {/* Sticky top bar */}
          <div className="p-settings-topbar">
            <h1 className="p-settings-page-title">Einstellungen</h1>
            <Link href="/" className="p-back-btn">‹ Home</Link>
          </div>

          {/* Grouped sections */}
          <div className="p-settings-body">
            {SETTINGS_GROUPS.map((group) => (
              <div key={group.label} className="p-settings-section">
                <p className="p-settings-section-label">{group.label}</p>
                <div className="p-settings-group">
                  {group.items.map((item, i) => (
                    <Link key={item.href} href={item.href} className="p-settings-row">
                      {/* iOS-style colored square icon */}
                      <span
                        className="p-settings-row-icon"
                        style={{ background: item.bg }}
                      >
                        {item.icon}
                      </span>
                      <div className="p-settings-row-text">
                        <p className="p-settings-row-title">{item.title}</p>
                        <p className="p-settings-row-sub">{item.sub}</p>
                      </div>
                      <span className="p-settings-row-chevron">›</span>
                      {i < group.items.length - 1 && <div className="p-settings-row-divider" />}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="p-settings-status">
              <SystemStatus marginTop={0} />
            </div>
          </div>
        </div>
        <PremiumPillNav current="/einstellungen" />
      </div>
    </>
  );
}
