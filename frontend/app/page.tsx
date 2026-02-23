"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HealthAll = {
  api: boolean | null;
  db: boolean | null;
  bot: boolean | null;
  scheduler: boolean | null;
  ai: boolean | null;
};

function shortSha(value?: string | null) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "local";
  return trimmed.length >= 7 ? trimmed.slice(0, 7) : "local";
}

const styles: Record<string, React.CSSProperties> = {
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

  useCaseStack: { display: "grid", gap: 14 },
  tileBase: {
    border: "1px solid #ddd",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    background: "#fff",
    textDecoration: "none",
    color: "#000",
  },
  tileTitle: { fontSize: 16, fontWeight: 700, margin: 0, color: "#000" },
  tileSub: { fontSize: 13, marginTop: 6, marginBottom: 0, color: "#000" },

  microChecks: {
    marginTop: 10,
    fontSize: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    color: "#000",
  },
  microRow: { display: "flex", alignItems: "center", gap: 8 },

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
  if (ok === null) return "#bbb";
  if (ok === true) return "#22c55e";
  return "#ef4444";
}

function labelFrom(ok: boolean | null) {
  if (ok === null) return "…";
  return ok ? "OK" : "DOWN";
}

function StatusBadge({ all }: { all: HealthAll }) {
  const { dotColor, label } = useMemo(() => {
    const vals = [all.api, all.db, all.bot, all.scheduler, all.ai];

    if (vals.some((v) => v === null)) return { dotColor: "#bbb", label: "prüfe…" };
    if (vals.every((v) => v === true)) return { dotColor: "#22c55e", label: "online" };

    if (all.api === false || all.db === false) return { dotColor: "#ef4444", label: "kritisch" };

    return { dotColor: "#f59e0b", label: "teilweise" };
  }, [all]);

  return (
    <div style={styles.statusBadge}>
      <span style={{ ...styles.dot, background: dotColor }} />
      <span>System {label}</span>
    </div>
  );
}

function UseCaseBox({ title, subtitle, href }: { title: string; subtitle: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div className="nav-tile" style={styles.tileBase}>
        <p style={styles.tileTitle}>{title}</p>
        <p style={styles.tileSub}>{subtitle}</p>
      </div>
    </Link>
  );
}

function PlaceholderBox({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        ...styles.tileBase,
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      <p style={styles.tileTitle}>{title}</p>
      <p style={styles.tileSub}>{subtitle}</p>
    </div>
  );
}

export default function LandingPage() {
  const [all, setAll] = useState<HealthAll>({
    api: null,
    db: null,
    bot: null,
    scheduler: null,
    ai: null,
  });
  const [backendSha, setBackendSha] = useState<string>("local");
  const frontendSha = shortSha(process.env.NEXT_PUBLIC_GIT_SHA);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const apiP = fetch("/api/health", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => ({ ok: j?.status === "ok", sha: shortSha(j?.git_sha) }))
        .catch(() => ({ ok: false, sha: "local" }));

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

      const [apiRes, db, bot, scheduler, ai] = await Promise.all([apiP, dbP, botP, schedP, aiP]);

      if (!cancelled) {
        setAll({ api: apiRes.ok, db, bot, scheduler, ai });
        setBackendSha(apiRes.sha);
      }
    };

    check();
    const t = setInterval(check, 20000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const placeholderTitle = "Küchen- & Wochenplan";
  const placeholderSubtitle = "Rezepte · Wochenplan · Einstellungen";

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
            width: 320,
            height: "auto",
          }}
        />
      </div>
      <div style={styles.container}>
        <div style={styles.useCaseStack}>
          <UseCaseBox title="Küchen- & Wochenplan" subtitle={placeholderSubtitle} href="/kueche" />
          <PlaceholderBox title={placeholderTitle} subtitle={placeholderSubtitle} />
          <PlaceholderBox title={placeholderTitle} subtitle={placeholderSubtitle} />
        </div>

        <div style={styles.section}>
          <p style={styles.sectionTitle}>Health Checks</p>
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-start" }}>
            <StatusBadge all={all} />
          </div>
          <div style={{ marginTop: 10, ...styles.microChecks }}>
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
          <p style={styles.small}>Frontend SHA: {frontendSha}</p>
          <p style={styles.small}>Backend SHA: {backendSha}</p>
        </div>
      </div>
    </main>
  );
}
