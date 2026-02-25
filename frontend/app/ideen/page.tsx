import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Was unternehmen wir heute?",
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
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    border: "1px solid #ddd",
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 700,
    color: "#000",
    background: "#fff",
    textDecoration: "none",
    cursor: "pointer",
  },
  actions: { display: "grid", gap: 12 },
  actionCard: {
    border: "1px solid #ddd",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    background: "#fff",
    color: "#000",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionTitle: { fontSize: 16, fontWeight: 700, margin: 0, color: "#000" },
  actionHint: { fontSize: 12, marginTop: 6, marginBottom: 0, color: "#000" },
  actionBadge: {
    fontSize: 12,
    borderRadius: 999,
    border: "1px solid #ddd",
    padding: "3px 10px",
    whiteSpace: "nowrap",
    color: "#000",
    background: "#f6f6f6",
  },
};

export default function IdeenPage() {
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
            <h1 style={styles.title}>Was unternehmen wir heute?</h1>
          </div>
          <Link href="/" style={styles.button}>
            Home
          </Link>
        </div>

        <div style={styles.actions}>
          <Link href="/ideen/generator" className="nav-tile" style={styles.actionCard}>
            <div>
              <p style={styles.actionTitle}>Ideen generieren</p>
              <p style={styles.actionHint}>Geführte Abfrage mit Tagesform & Laune</p>
            </div>
            <span style={styles.actionBadge}>Start</span>
          </Link>
          <Link href="/ideen/einstellungen" className="nav-tile" style={styles.actionCard}>
            <div>
              <p style={styles.actionTitle}>Einstellungen</p>
              <p style={styles.actionHint}>Standard-Ort, Budget, Berge</p>
            </div>
            <span style={styles.actionBadge}>Setup</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
