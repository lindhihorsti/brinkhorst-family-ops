"use client";

import { useEffect, useMemo, useState } from "react";

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

export function SystemStatus({ marginTop = 0 }: { marginTop?: number }) {
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
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 20, padding: 16, background: "var(--bg)", marginTop }}>
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
  );
}
