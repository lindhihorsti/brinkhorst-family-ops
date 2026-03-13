import Link from "next/link";
import { BottomNav } from "../lib/ui";

const options = [
  {
    href: "/geburtstage/liste",
    icon: "🎂",
    title: "Geburtstage",
    subtitle: "Kontakte pflegen, kommende Tage im Blick behalten und manuelle Geschenkideen sammeln",
    accent: "#db2777",
  },
  {
    href: "/geburtstage/geschenkideen",
    icon: "🎁",
    title: "Geschenkideen",
    subtitle: "AI-gestützt durch Anlass, Budget, Interessen und No-Gos zu drei passenden Ideen",
    accent: "#f97316",
  },
];

export default function GeburtstageHubPage() {
  return (
    <main style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      color: "var(--fg)",
      fontFamily: "var(--font)",
      paddingBottom: "var(--nav-height)",
    }}>
      <div style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", padding: "20px var(--page-x-padding) var(--page-bottom-padding)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, marginTop: 4 }}>
          <span style={{
            width: 104,
            height: 104,
            borderRadius: 28,
            background: "color-mix(in srgb, var(--geburtstage-accent) 14%, var(--bg))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "clamp(56px, 7vw, 64px)",
          }}>
            🎂
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--geburtstage-accent)" }}>
              Geburtstage & Geschenke
            </p>
            <h1 style={{ margin: "6px 0 0", fontSize: "var(--hero-title-size)", lineHeight: 1.08 }}>Was braucht ihr gerade?</h1>
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--fg-muted)", maxWidth: 320 }}>
              Geburtstage pflegen oder in einem kurzen Flow passende Geschenkideen finden.
            </p>
          </div>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 999, border: "1px solid var(--border)", padding: "8px 12px",
            fontSize: 13, fontWeight: 700, color: "var(--fg)", textDecoration: "none",
          }}>
            Home
          </Link>
        </div>

        <div className="home-layout-standard">
          <div style={{ display: "grid", gap: 12 }}>
            {options.map((option) => (
              <Link key={option.href} href={option.href} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="nav-tile" style={{
                  border: "1px solid var(--border)", borderRadius: 20, padding: "14px 16px",
                  boxShadow: "var(--shadow-sm)", background: "var(--bg)",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <span style={{ width: 44, height: 44, borderRadius: 14, background: `${option.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                    {option.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{option.title}</p>
                    <p style={{ fontSize: 12, marginTop: 2, color: "var(--fg-muted)" }}>{option.subtitle}</p>
                  </div>
                  <span style={{ fontSize: 14, color: "var(--fg-muted)", flexShrink: 0 }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="home-layout-tiles">
          <div style={{ display: "grid", gap: 14 }}>
            {options.map((option) => (
              <Link key={option.href} href={option.href} style={{ textDecoration: "none", color: "inherit" }}>
                <article className="nav-tile" style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 26,
                  border: `1px solid color-mix(in srgb, ${option.accent} 28%, var(--border))`,
                  background: `linear-gradient(180deg, color-mix(in srgb, ${option.accent} 12%, var(--bg)) 0%, color-mix(in srgb, ${option.accent} 18%, var(--bg-subtle)) 100%)`,
                  boxShadow: "var(--shadow-md)",
                  padding: 20,
                  minHeight: "var(--hub-tile-min-height)",
                  display: "grid",
                  alignItems: "space-between",
                }}>
                  <div style={{ position: "absolute", right: -24, top: -22, width: 118, height: 118, borderRadius: 999, background: `color-mix(in srgb, ${option.accent} 18%, transparent)` }} />
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, position: "relative" }}>
                    <div style={{ width: 72, height: 72, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, background: `color-mix(in srgb, ${option.accent} 18%, var(--bg))`, border: `1px solid color-mix(in srgb, ${option.accent} 38%, transparent)` }}>
                      {option.icon}
                    </div>
                    <div style={{ width: 38, height: 38, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: `color-mix(in srgb, ${option.accent} 14%, var(--bg))`, color: option.accent, fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                      →
                    </div>
                  </div>
                  <div style={{ position: "relative", marginTop: 18 }}>
                    <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.1 }}>{option.title}</h2>
                    <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--fg-muted)" }}>
                      {option.subtitle}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <BottomNav current="/geburtstage" />
    </main>
  );
}
