import Link from "next/link";
import { BottomNav } from "../lib/ui";

export const metadata = { title: "Küchen & Wochenplan — Family Ops" };

const TILES = [
  { href: "/recipes",     icon: "📖", title: "Rezepte",    sub: "Verwalten, importieren, bewerten"  },
  { href: "/weekly-plan", icon: "📅", title: "Wochenplan", sub: "Planen · Tauschen · Einkaufsliste" },
];

export default function KuechePage() {
  return (
    <main style={{
      minHeight: "100dvh", background: "var(--bg)", color: "var(--fg)",
      fontFamily: "var(--font)", paddingBottom: "var(--nav-height)",
    }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "28px 22px 40px" }}>

        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, marginTop: 4 }}>
          <span style={{
            width: 104, height: 104, borderRadius: 28,
            background: "#e8673a22",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 64,
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

        {/* Tiles */}
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

      <BottomNav current="/kueche" />
    </main>
  );
}
