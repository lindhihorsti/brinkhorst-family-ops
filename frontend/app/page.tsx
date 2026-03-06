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

function shortSha(value?: string | null) {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "local") return "local";
  return trimmed.length >= 7 ? trimmed.slice(0, 7) : trimmed;
}

function buildDateLabel(value?: string | null) {
  const trimmed = (value ?? "").trim();
  return trimmed || "local";
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
  const [all, setAll] = useState<HealthAll>({ api: null, db: null, bot: null, scheduler: null, ai: null });
  const [backendSha, setBackendSha] = useState("local");
  const [backendBuildDate, setBackendBuildDate] = useState("local");
  const [metrics, setMetrics] = useState<Metrics>({});
  const frontendSha = shortSha(process.env.NEXT_PUBLIC_GIT_SHA);
  const frontendBuildDate = buildDateLabel(process.env.NEXT_PUBLIC_BUILD_DATE);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const [apiRes, db, bot, scheduler, ai, metricsRes] = await Promise.all([
        fetch("/api/health", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((j) => ({
            ok: j?.status === "ok",
            sha: shortSha(j?.git_sha),
            buildDate: buildDateLabel(j?.build_date),
          }))
          .catch(() => ({ ok: false, sha: "local", buildDate: "local" })),
        fetch("/api/db/ping", { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => j?.ok === true).catch(() => false),
        fetch("/api/bot/status", { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => j?.ok === true).catch(() => false),
        fetch("/api/jobs/status", { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => j?.ok === true).catch(() => false),
        fetch("/api/ai/status", { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => j?.ok === true).catch(() => false),
        fetch("/api/system/metrics", { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => j?.metrics ?? {}).catch(() => ({})),
      ]);
      if (!cancelled) {
        setAll({ api: apiRes.ok, db, bot, scheduler, ai });
        setBackendSha(apiRes.sha);
        setBackendBuildDate(apiRes.buildDate);
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
      background: "radial-gradient(circle at top, color-mix(in srgb, var(--bg-subtle) 65%, transparent) 0%, var(--bg) 55%)",
      color: "var(--fg)",
      fontFamily: "var(--font)",
      paddingBottom: "var(--nav-height)",
    }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 6 }}>
        <div className="logo-stage">
          <Image
            src="/logo.PNG"
            alt="Family Ops"
            width={600}
            height={380}
            priority
            className="logo-img logo-img-light"
            style={{ width: 292, maxWidth: "82vw", height: "auto" }}
          />
          <Image
            src="/logo-dark.png"
            alt="Family Ops Dark"
            width={1152}
            height={768}
            priority
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

        <div style={{ border: "1px solid var(--border)", borderRadius: 20, padding: 16, background: "var(--bg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>System</p>
            <OverallBadge all={all} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
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
                  <span style={{ fontWeight: 600, color: val === null ? "var(--fg-muted)" : val ? "#16a34a" : "#ef4444" }}>{labelFrom(val)}</span>
                </div>
              );
            })}
          </div>
          {Object.keys(metrics).length > 0 && (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, paddingTop: 10, borderTop: "1px solid var(--border)", color: "var(--fg-muted)" }}>
              {metrics.recipes_total !== undefined && <span><strong style={{ color: "var(--fg)" }}>{metrics.recipes_total}</strong> Rezepte</span>}
              {metrics.weeks_planned !== undefined && <span><strong style={{ color: "var(--fg)" }}>{metrics.weeks_planned}</strong> Wochen geplant</span>}
              {metrics.family_members !== undefined && metrics.family_members > 0 && <span><strong style={{ color: "var(--fg)" }}>{metrics.family_members}</strong> Familienmitglieder</span>}
              {metrics.open_chores !== undefined && metrics.open_chores > 0 && <span><strong style={{ color: "var(--fg)" }}>{metrics.open_chores}</strong> offene Aufgaben</span>}
              {metrics.pinboard_notes !== undefined && metrics.pinboard_notes > 0 && <span><strong style={{ color: "var(--fg)" }}>{metrics.pinboard_notes}</strong> Pinnwand-Notizen</span>}
              {metrics.birthdays !== undefined && metrics.birthdays > 0 && <span><strong style={{ color: "var(--fg)" }}>{metrics.birthdays}</strong> Geburtstage</span>}
            </div>
          )}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--fg-muted)", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>Frontend: {frontendSha} · {frontendBuildDate}</span>
            <span>Backend: {backendSha} · {backendBuildDate}</span>
          </div>
        </div>
      </div>
      <BottomNav current="/" />
    </main>
  );
}
