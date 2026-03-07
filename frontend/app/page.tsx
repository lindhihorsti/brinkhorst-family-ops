import Link from "next/link";
import { BottomNav } from "./lib/ui";

type UseCase = {
  href: string;
  icon: string;
  title: string;
  accent: string;
};

const USE_CASES: UseCase[] = [
  {
    href: "/kueche",
    icon: "🍳",
    title: "Küchen- & Wochenplan",
    accent: "var(--kueche-accent)",
  },
  {
    href: "/einkauf",
    icon: "🛒",
    title: "Einkaufsliste",
    accent: "var(--einkauf-accent)",
  },
  {
    href: "/ideen",
    icon: "💡",
    title: "Was unternehmen wir?",
    accent: "var(--aktivitaet-accent)",
  },
  {
    href: "/aufgaben",
    icon: "✅",
    title: "Haushaltsaufgaben",
    accent: "var(--aufgaben-accent)",
  },
  {
    href: "/pinnwand",
    icon: "📌",
    title: "Familienpinnwand",
    accent: "var(--pinnwand-accent)",
  },
  {
    href: "/geburtstage",
    icon: "🎂",
    title: "Geburtstage & Geschenke",
    accent: "var(--geburtstage-accent)",
  },
  {
    href: "/split",
    icon: "💸",
    title: "Ausgaben & Split",
    accent: "var(--split-accent)",
  },
];

function StandardUseCases() {
  const tile = (accent: string) => ({
    border: "1px solid var(--border)", borderRadius: 20, padding: "14px 16px",
    boxShadow: "var(--shadow-sm)", background: "var(--bg)",
    display: "flex", alignItems: "center", gap: 14,
  });

  const iconBox = (accent: string) => ({
    width: 44, height: 44, borderRadius: 14,
    background: accent + "22",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 22, flexShrink: 0,
  });

  return (
    <div className="home-layout-standard">
      <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
        {USE_CASES.map((uc) => (
          <Link key={uc.href} href={uc.href} style={{ textDecoration: "none" }}>
            <div className="nav-tile" style={tile(uc.accent)}>
              <span style={iconBox(uc.accent)}>{uc.icon}</span>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{uc.title}</p>
                <p style={{ fontSize: 12, marginTop: 2, color: "var(--fg-muted)" }}>Unterbereiche öffnen</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TileUseCases() {
  return (
    <div className="home-layout-tiles">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
        {USE_CASES.map((uc) => (
          <Link key={uc.href} href={uc.href} style={{ textDecoration: "none" }}>
            <article
              className="nav-tile"
              style={{
                position: "relative",
                overflow: "hidden",
                minHeight: 188,
                borderRadius: 26,
                padding: 18,
                border: `1px solid color-mix(in srgb, ${uc.accent} 30%, var(--border))`,
                background: `linear-gradient(180deg, color-mix(in srgb, ${uc.accent} 12%, var(--bg)) 0%, color-mix(in srgb, ${uc.accent} 22%, var(--bg-subtle)) 100%)`,
                boxShadow: "var(--shadow-md)",
                color: "var(--fg)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{
                position: "absolute",
                right: -12,
                top: -10,
                width: 92,
                height: 92,
                borderRadius: 999,
                background: `color-mix(in srgb, ${uc.accent} 18%, transparent)`,
              }} />
              <div style={{ position: "relative", display: "flex", justifyContent: "center", paddingTop: 10 }}>
                <div style={{
                  width: 92,
                  height: 92,
                  borderRadius: 28,
                  background: `color-mix(in srgb, ${uc.accent} 18%, var(--bg))`,
                  border: `1px solid color-mix(in srgb, ${uc.accent} 34%, transparent)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 54,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
                }}>
                  {uc.icon}
                </div>
              </div>

              <div style={{ position: "relative", textAlign: "center" }}>
                <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.12, fontWeight: 800 }}>
                  {uc.title}
                </h2>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: `color-mix(in srgb, ${uc.accent} 18%, var(--bg))`,
                    color: uc.accent,
                    fontSize: 20,
                    fontWeight: 800,
                  }}>
                    →
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SettingsTile() {
  return (
    <Link href="/einstellungen" style={{ textDecoration: "none", display: "block", marginBottom: 24 }}>
      <div className="nav-tile" style={{
        border: "1px solid var(--border)",
        borderRadius: 22,
        padding: "16px 18px",
        boxShadow: "var(--shadow-sm)",
        background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-subtle) 100%)",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}>
        <span style={{
          width: 50,
          height: 50,
          borderRadius: 16,
          background: "var(--bg)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          flexShrink: 0,
        }}>
          ⚙️
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Einstellungen</p>
          <p style={{ fontSize: 12, marginTop: 3, color: "var(--fg-muted)" }}>
            Familie, Küche, Aktivitäten und Erscheinungsbild anpassen
          </p>
        </div>
        <span style={{ fontSize: 22, color: "var(--fg-muted)" }}>→</span>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <main style={{
      minHeight: "100dvh",
      background: "radial-gradient(circle at top, color-mix(in srgb, var(--bg-subtle) 65%, transparent) 0%, var(--bg) 55%)",
      color: "var(--fg)",
      fontFamily: "var(--font)",
      paddingBottom: "var(--nav-height)",
    }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 6 }}>
        <div className="logo-stage">
          <img
            src="/logo.PNG"
            alt="Family Ops"
            className="logo-img logo-img-light"
            style={{ width: 292, maxWidth: "82vw", height: "auto" }}
          />
          <img
            src="/logo-dark.png"
            alt="Family Ops Dark"
            className="logo-img logo-img-dark"
            style={{ width: 392, maxWidth: "92vw", height: "auto" }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 18px 40px" }}>
        <div style={{ marginBottom: 18, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--fg-muted)" }}>
            Dashboard
          </p>
        </div>

        <StandardUseCases />
        <TileUseCases />
        <SettingsTile />
      </div>
      <BottomNav current="/" />
    </main>
  );
}
