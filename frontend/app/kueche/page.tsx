import Image from "next/image";
import Link from "next/link";
import { BottomNav } from "../lib/ui";

export const metadata = { title: "Küchen & Wochenplan — Family Ops" };

const TILES = [
  { href: "/recipes",     icon: "📖", title: "Rezepte",    sub: "Verwalten, importieren, bewerten",           state: "MVP" as const },
  { href: "/weekly-plan", icon: "📅", title: "Wochenplan", sub: "Planen · Tauschen · Einkaufsliste",          state: "MVP" as const },
  { href: "/settings",    icon: "⚙️",  title: "Einstellungen", sub: "Basisvorrat, Präferenzen, Telegram",     state: "MVP" as const },
];

export default function KuechePage() {
  return (
    <main style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      color: "var(--fg)",
      fontFamily: "var(--font)",
      paddingBottom: "var(--nav-height)",
    }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
        <Image src="/logo.PNG" alt="Family Ops" width={600} height={380} priority
          style={{ width: 200, height: "auto" }} />
      </div>

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 22px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, margin: 0 }}>
            Küchen- & Wochenplan
          </h1>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            border: "1px solid var(--border)", borderRadius: 999,
            padding: "6px 12px", fontSize: 13, fontWeight: 600, color: "var(--fg)",
          }}>
            Home
          </Link>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {TILES.map((tile) => (
            <Link key={tile.href} href={tile.href} style={{ textDecoration: "none" }}>
              <div className="nav-tile" style={{
                border: "1px solid var(--border)",
                borderRadius: 20, padding: "14px 16px",
                boxShadow: "var(--shadow-sm)",
                background: "var(--bg)",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <span style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "var(--kueche-accent)22",
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
