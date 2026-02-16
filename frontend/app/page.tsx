"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HealthAll = {
  api: boolean | null;
  db: boolean | null;
  bot: boolean | null;
  scheduler: boolean | null;
  ai: boolean | null;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: "#fff",
    color: "#000", // alles schwarz
    fontFamily:
      'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  container: {
    maxWidth: 420,
    margin: "0 auto",
    padding: "28px 22px 44px 22px",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 22,
  },
  title: { fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.2, color: "#000" },
  subtitle: { fontSize: 14, marginTop: 6, marginBottom: 0, color: "#000" },

  microChecks: {
    marginTop: 10,
    fontSize: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    color: "#000",
  },
  microRow: { display: "flex", alignItems: "center", gap: 8 },

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

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #ddd",
    borderRadius: 999,
    padding: "6px 12px",
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    fontSize: 12,
    color: "#000",
  },
  dot: { width: 10, height: 10, borderRadius: 999 },

  section: {
    marginTop: 22,
    border: "1px solid #ddd",
    borderRadius: 18,
    padding: 16,
    color: "#000",
  },
  sectionTitle: { fontSize: 14, fontWeight: 700, margin: 0, color: "#000" },
  small: { marginTop: 10, fontSize: 12, color: "#000" },
};

function dotColorFrom(ok: boolean | null) {
  if (ok === null) return "#bbb"; // grau (unknown)
  if (ok === true) return "#22c55e"; // grün
  return "#ef4444"; // rot
}

function labelFrom(ok: boolean | null) {
  if (ok === null) return "…";
  return ok ? "OK" : "DOWN";
}

function StatusBadge({ all }: { all: HealthAll }) {
  // Gesamt-Ampel: grün nur wenn alles true, rot wenn api down oder db down, sonst gelb wenn irgendeins false?
  const { dotColor, label } = useMemo(() => {
    const vals = [all.api, all.db, all.bot, all.scheduler, all.ai];

    if (vals.some((v) => v === null)) return { dotColor: "#bbb", label: "prüfe…" };
    if (vals.every((v) => v === true)) return { dotColor: "#22c55e", label: "online" };

    // wenn Kernsystem (api/db) down => rot
    if (all.api === false || all.db === false) return { dotColor: "#ef4444", label: "kritisch" };

    // sonst: nicht-kritische Checks down => gelb
    return { dotColor: "#f59e0b", label: "teilweise" };
  }, [all]);

  return (
    <div style={styles.statusBadge}>
      <span style={{ ...styles.dot, background: dotColor }} />
      <span>System {label}</span>
    </div>
  );
}

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

export default function HomePage() {
  const [all, setAll] = useState<HealthAll>({
    api: null,
    db: null,
    bot: null,
    scheduler: null,
    ai: null,
  });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const apiP = fetch("/api/health", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => j?.status === "ok")
        .catch(() => false);

      const dbP = fetch("/api/db/ping", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => j?.ok === true)
        .catch(() => false);

      const botP = fetch("/api/bot/status", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => j?.ok === true)
        .catch(() => false);

      const schedP = fetch("/api/jobs/status", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => j?.ok === true)
        .catch(() => false);

      const aiP = fetch("/api/ai/status", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => j?.ok === true)
        .catch(() => false);

      const [api, db, bot, scheduler, ai] = await Promise.all([apiP, dbP, botP, schedP, aiP]);

      if (!cancelled) setAll({ api, db, bot, scheduler, ai });
    };

    check();
    const t = setInterval(check, 20000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Family Ops</h1>
            <p style={styles.subtitle}>Küchen- & Wochenplan MVP (mobile-first)</p>

            <div style={styles.microChecks}>
              <div style={styles.microRow}>
                <span style={{ ...styles.dot, background: dotColorFrom(all.api) }} />
                <span>API {labelFrom(all.api)}</span>
              </div>
              <div style={styles.microRow}>
                <span style={{ ...styles.dot, background: dotColorFrom(all.db) }} />
                <span>DB {labelFrom(all.db)}</span>
              </div>
              <div style={styles.microRow}>
                <span style={{ ...styles.dot, background: dotColorFrom(all.bot) }} />
                <span>BOT {labelFrom(all.bot)}</span>
              </div>
              <div style={styles.microRow}>
                <span style={{ ...styles.dot, background: dotColorFrom(all.scheduler) }} />
                <span>SCHED {labelFrom(all.scheduler)}</span>
              </div>
              <div style={styles.microRow}>
                <span style={{ ...styles.dot, background: dotColorFrom(all.ai) }} />
                <span>AI {labelFrom(all.ai)}</span>
              </div>
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <StatusBadge all={all} />
          </div>
        </div>

        <div style={styles.tileStack}>
          <Tile title="Rezepte" subtitle="Rezepte verwalten, Zutaten pflegen" href="/recipes" state="MVP" />
          <Tile title="Wochenplan" subtitle="Plan, Swap, Shop (kommt als nächstes)" href="/" state="SOON" />
          <Tile title="Settings" subtitle="Basisvorrat, Präferenzen, Telegram" href="/" state="SOON" />
        </div>

        <div style={styles.section}>
          <p style={styles.sectionTitle}>Health Checks</p>
          <p style={styles.small}>
            API/DB/BOT/SCHED/AI werden automatisch alle 20s geprüft und als Ampel angezeigt.
          </p>
        </div>
      </div>
    </main>
  );
}
