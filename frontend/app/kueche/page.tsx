import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Küchen & Wochenplan",
};

type Styles = Record<string, CSSProperties>;

const styles: Styles = {
  page: {
    minHeight: "100dvh",
    background: "#fff",
    color: "#000",
    fontFamily:
      'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  container: {
    maxWidth: 420,
    margin: "0 auto",
    padding: "16px 22px 44px 22px",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 22,
  },
  title: { fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.2, color: "#000" },

  tileStack: { display: "grid", gap: 14 },
  tileBase: {
    border: "1px solid #ddd",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    background: "#fff",
    textDecoration: "none",
    color: "#000",
  },
  tileRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  tileTitle: { fontSize: 16, fontWeight: 700, margin: 0, color: "#000" },
  tileSub: { fontSize: 13, marginTop: 6, marginBottom: 0, color: "#000" },

  badge: {
    fontSize: 12,
    borderRadius: 999,
    border: "1px solid #ddd",
    padding: "3px 10px",
    whiteSpace: "nowrap",
    color: "#000",
  },
  badgeMvp: { background: "#e9f9ef", borderColor: "#bfe9cd" },
  badgeSoon: { background: "#f6f6f6", borderColor: "#e2e2e2" },
};

function Tile({
  title,
  subtitle,
  href,
  state,
}: {
  title: string;
  subtitle: string;
  href: string;
  state: "MVP" | "SOON";
}) {
  const badgeStyle =
    state === "MVP"
      ? { ...styles.badge, ...styles.badgeMvp }
      : { ...styles.badge, ...styles.badgeSoon };

  const card = (
    <div
      className={state === "MVP" ? "nav-tile" : undefined}
      style={{
        ...styles.tileBase,
        opacity: state === "SOON" ? 0.6 : 1,
        cursor: state === "SOON" ? "not-allowed" : "pointer",
      }}
    >
      <div style={styles.tileRow}>
        <div>
          <p style={styles.tileTitle}>{title}</p>
          <p style={styles.tileSub}>{subtitle}</p>
        </div>
        <span style={badgeStyle}>{state === "MVP" ? "MVP" : "Soon"}</span>
      </div>
    </div>
  );

  if (state === "SOON") return card;

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      {card}
    </Link>
  );
}

export default function KuechePage() {
  return (
    <main style={styles.page}>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 12, marginBottom: 10 }}>
        <Image
          src="/logo.PNG"
          alt="Family Ops"
          width={600}
          height={380}
          priority
          style={{
            width: 240,
            height: "auto",
          }}
        />
      </div>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Küchen- & Wochenplan</h1>
          </div>
        </div>

        <div style={styles.tileStack}>
          <Tile title="Rezepte" subtitle="Rezepte verwalten, Zutaten pflegen" href="/recipes" state="MVP" />
          <Tile
            title="Wochenplan"
            subtitle="Woche planen · Rezepte austauschen · Einkaufsliste erstellen"
            href="/weekly-plan"
            state="MVP"
          />
          <Tile title="Einstellungen" subtitle="Basisvorrat, Präferenzen, Telegram" href="/settings" state="MVP" />
        </div>
      </div>
    </main>
  );
}
