"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "./lib/ui";

type HealthAll = {
  api: boolean | null;
  db: boolean | null;
  bot: boolean | null;
  scheduler: boolean | null;
  ai: boolean | null;
};

type Metrics = {
  recipes_total?: number;
  weeks_planned?: number;
  family_members?: number;
  pinboard_notes?: number;
  birthdays?: number;
  open_chores?: number;
};

function shortSha(value?: string | null) {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "local") return "local";
  return trimmed.length >= 7 ? trimmed.slice(0, 7) : trimmed;
}

function dotColor(ok: boolean | null) {
  if (ok === null) return "#bbb";
  return ok ? "#22c55e" : "#ef4444";
}

function labelFrom(ok: boolean | null) {
  if (ok === null) return "…";
  return ok ? "OK" : "DOWN";
}

function OverallBadge({ all }: { all: HealthAll }) {
  const { color, label } = useMemo(() => {
    const vals = [all.api, all.db, all.bot, all.scheduler, all.ai];
    if (vals.some((v) => v === null)) return { color: "#bbb", label: "prüfe…" };
    if (vals.every((v) => v === true)) return { color: "#22c55e", label: "online" };
    if (all.api === false || all.db === false) return { color: "#ef4444", label: "kritisch" };
    return { color: "#f59e0b", label: "teilweise" };
  }, [all]);

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      border: "1px solid var(--border)", borderRadius: 999, padding: "6px 12px",
      background: "var(--bg)", fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: color, display: "block" }} />
      System {label}
    </div>
  );
}

const USE_CASES = [
  { href: "/kueche",     icon: "🍳", title: "Küchen- & Wochenplan",    sub: "Rezepte · Wochenplan · Einkauf",          accent: "var(--kueche-accent)" },
  { href: "/ideen",      icon: "💡", title: "Was unternehmen wir?",     sub: "Ausflüge & Aktivitäten generieren",        accent: "var(--aktivitaet-accent)" },
  { href: "/aufgaben",   icon: "✅", title: "Haushaltsaufgaben",        sub: "Checklisten · Zuweisung · Punkte",         accent: "var(--aufgaben-accent)" },
  { href: "/pinnwand",   icon: "📌", title: "Familienpinnwand",         sub: "Notizen · Erinnerungen · Nachrichten",     accent: "var(--pinnwand-accent)" },
  { href: "/geburtstage",icon: "🎂", title: "Geburtstage & Geschenke", sub: "Erinnerungen · Wunschlisten",              accent: "var(--geburtstage-accent)" },
];

export default function LandingPage() {
  const [all, setAll] = useState<HealthAll>({ api: null, db: null, bot: null, scheduler: null, ai: null });
  const [backendSha, setBackendSha] = useState("local");
  const [metrics, setMetrics] = useState<Metrics>({});
  const frontendSha = shortSha(process.env.NEXT_PUBLIC_GIT_SHA);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const [apiRes, db, bot, scheduler, ai, metricsRes] = await Promise.all([
        fetch("/api/health", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((j) => ({ ok: j?.status === "ok", sha: shortSha(j?.git_sha) }))
          .catch(() => ({ ok: false, sha: "local" })),
        fetch("/api/db/ping", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((j) => j?.ok === true).catch(() => false),
        fetch("/api/bot/status", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((j) => j?.ok === true).catch(() => false),
        fetch("/api/jobs/status", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((j) => j?.ok === true).catch(() => false),
        fetch("/api/ai/status", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((j) => j?.ok === true).catch(() => false),
        fetch("/api/system/metrics", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((j) => j?.metrics ?? {}).catch(() => ({})),
      ]);

      if (!cancelled) {
        setAll({ api: apiRes.ok, db, bot, scheduler, ai });
        setBackendSha(apiRes.sha);
        setMetrics(metricsRes);
      }
    };

    check();
    const t = setInterval(check, 20000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <main style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      color: "var(--fg)",
      fontFamily: "var(--font)",
      paddingBottom: "var(--nav-height)",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
        <Image src="/logo.PNG" alt="Family Ops" width={600} height={380} priority
          style={{ width: 280, height: "auto" }} />
      </div>

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 22px 40px" }}>

        {/* Use Case Grid */}
        <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
          {USE_CASES.map((uc) => (
            <Link key={uc.href} href={uc.href} style={{ textDecoration: "none" }}>
              <div className="nav-tile" style={{
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "14px 16px",
                boxShadow: "var(--shadow-sm)",
                background: "var(--bg)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}>
                <span style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: uc.accent + "22",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>
                  {uc.icon}
                </span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{uc.title}</p>
                  <p style={{ fontSize: 12, marginTop: 2, color: "var(--fg-muted)" }}>{uc.sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Health + Metrics */}
        <div style={{
          border: "1px solid var(--border)", borderRadius: 20,
          padding: 16, background: "var(--bg)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>System</p>
            <OverallBadge all={all} />
          </div>

          {/* Service dots */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12,
          }}>
            {[
              { key: "api", label: "API" },
              { key: "db", label: "Datenbank" },
              { key: "bot", label: "Telegram Bot" },
              { key: "scheduler", label: "Scheduler" },
              { key: "ai", label: "AI" },
            ].map(({ key, label }) => {
              const val = all[key as keyof HealthAll];
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor(val), display: "block" }} />
                  <span style={{ color: "var(--fg-muted)" }}>{label}</span>
                  <span style={{ fontWeight: 600, color: val === null ? "var(--fg-muted)" : val ? "#16a34a" : "#ef4444" }}>
                    {labelFrom(val)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Metrics row */}
          {Object.keys(metrics).length > 0 && (
            <div style={{
              display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12,
              paddingTop: 10, borderTop: "1px solid var(--border)", color: "var(--fg-muted)",
            }}>
              {metrics.recipes_total !== undefined && (
                <span><strong style={{ color: "var(--fg)" }}>{metrics.recipes_total}</strong> Rezepte</span>
              )}
              {metrics.weeks_planned !== undefined && (
                <span><strong style={{ color: "var(--fg)" }}>{metrics.weeks_planned}</strong> Wochen geplant</span>
              )}
              {metrics.family_members !== undefined && metrics.family_members > 0 && (
                <span><strong style={{ color: "var(--fg)" }}>{metrics.family_members}</strong> Familienmitglieder</span>
              )}
              {metrics.open_chores !== undefined && metrics.open_chores > 0 && (
                <span><strong style={{ color: "var(--fg)" }}>{metrics.open_chores}</strong> offene Aufgaben</span>
              )}
              {metrics.pinboard_notes !== undefined && metrics.pinboard_notes > 0 && (
                <span><strong style={{ color: "var(--fg)" }}>{metrics.pinboard_notes}</strong> Pinnwand-Notizen</span>
              )}
              {metrics.birthdays !== undefined && metrics.birthdays > 0 && (
                <span><strong style={{ color: "var(--fg)" }}>{metrics.birthdays}</strong> Geburtstage</span>
              )}
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 11, color: "var(--fg-muted)", display: "flex", gap: 12 }}>
            <span>FE: {frontendSha}</span>
            <span>BE: {backendSha}</span>
          </div>
        </div>
      </div>

      <BottomNav current="/" />
    </main>
  );
}
