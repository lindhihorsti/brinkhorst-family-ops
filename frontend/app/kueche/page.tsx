import Link from "next/link";
import { BottomNav } from "../lib/ui";

export const metadata = { title: "Küchen & Wochenplan — Family Ops" };

const TILES = [
  { href: "/recipes",     icon: "📖", title: "Rezepte",    sub: "Verwalten, importieren, bewerten"  },
  { href: "/weekly-plan", icon: "📅", title: "Wochenplan", sub: "Planen · Tauschen" },
  { href: "/einkauf", icon: "🛒", title: "Einkaufsliste", sub: "Mehrere Listen · Snapshot · AI Schätzung" },
];

export default function KuechePage() {
  return (
    <main style={{
      minHeight: "100dvh", background: "var(--bg)", color: "var(--fg)",
      fontFamily: "var(--font)", paddingBottom: "var(--nav-height)",
    }}>
      <div style={{ maxWidth: "var(--page-max-width)", margin: "0 auto", padding: "var(--page-top-padding) var(--page-x-padding) var(--page-bottom-padding)" }}>

        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, marginTop: 4 }}>
          <span style={{
            width: 104, height: 104, borderRadius: 28,
            background: "#e8673a22",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "clamp(56px, 7vw, 64px)",
          }}>🍳</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, margin: 0 }}>
            Küchen- & Wochenplan
          </h1>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center",
            border: "1px solid var(--border)", borderRadius: 999,
            padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "var(--fg)",
          }}>
            Home
          </Link>
        </div>

        <div className="home-layout-standard">
          <div style={{ display: "grid", gap: 12 }}>
            {TILES.map((tile) => (
              <Link key={tile.href} href={tile.href} style={{ textDecoration: "none" }}>
                <div className="nav-tile" style={{
                  border: "1px solid var(--border)", borderRadius: 20, padding: "14px 16px",
                  boxShadow: "var(--shadow-sm)", background: "var(--bg)",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <span style={{
                    width: 44, height: 44, borderRadius: 14, background: "#e8673a22",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, flexShrink: 0,
                  }}>
                    {tile.icon}
                  </span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{tile.title}</p>
                    <p style={{ fontSize: 12, marginTop: 2, color: "var(--fg-muted)" }}>{tile.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="home-layout-tiles">
          <div style={{ display: "grid", gap: 14 }}>
            {TILES.map((tile) => (
              <Link key={tile.href} href={tile.href} style={{ textDecoration: "none", color: "inherit" }}>
                <article className="nav-tile" style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 26,
                  border: "1px solid color-mix(in srgb, #e8673a 28%, var(--border))",
                  background: "linear-gradient(180deg, color-mix(in srgb, #e8673a 12%, var(--bg)) 0%, color-mix(in srgb, #e8673a 18%, var(--bg-subtle)) 100%)",
                  boxShadow: "var(--shadow-md)",
                  padding: 20,
                  minHeight: "var(--hub-tile-min-height)",
                  display: "grid",
                  alignItems: "space-between",
                }}>
                  <div style={{ position: "absolute", right: -24, top: -22, width: 118, height: 118, borderRadius: 999, background: "color-mix(in srgb, #e8673a 18%, transparent)" }} />
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, position: "relative" }}>
                    <div style={{ width: 72, height: 72, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, background: "color-mix(in srgb, #e8673a 18%, var(--bg))", border: "1px solid color-mix(in srgb, #e8673a 38%, transparent)" }}>
                      {tile.icon}
                    </div>
                    <div style={{ width: 38, height: 38, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "color-mix(in srgb, #e8673a 14%, var(--bg))", color: "#e8673a", fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
                      →
                    </div>
                  </div>
                  <div style={{ position: "relative", marginTop: 18 }}>
                    <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.1 }}>{tile.title}</h2>
                    <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--fg-muted)" }}>{tile.sub}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <BottomNav current="/kueche" />
    </main>
  );
}
