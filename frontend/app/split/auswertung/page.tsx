"use client";

import { useEffect, useState } from "react";
import { api, type ExpenseReport } from "../../lib/api";
import { BtnLink, Page, Skeleton, styles } from "../../lib/ui";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Haushalt:  "#059669",
  Essen:     "#3b82f6",
  Freizeit:  "#f59e0b",
  Transport: "#8b5cf6",
  Sonstiges: "#6b7280",
};

const PERSON_COLORS = ["#059669", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function shortMonth(yyyymm: string) {
  const [y, m] = yyyymm.split("-");
  const names = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

// ─── Pure-SVG Donut chart ─────────────────────────────────────────────────────

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const r = 38;
  const C = 2 * Math.PI * r;
  let cumulative = 0;
  return (
    <svg viewBox="0 0 120 120" width={120} height={120} style={{ display: "block" }}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="16" />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashLen = pct * C;
        const dashOffset = C * (1 - cumulative);
        cumulative += pct;
        return (
          <circle
            key={i}
            cx="60" cy="60" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeDasharray={`${dashLen} ${C}`}
            strokeDashoffset={dashOffset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
          />
        );
      })}
      <text x="60" y="64" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--fg)">
        {fmt(total)}
      </text>
    </svg>
  );
}

// ─── Horizontal bar chart (CSS) ───────────────────────────────────────────────

function HBarChart({ data, color }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{d.label}</span>
            <span style={{ color: "var(--fg-muted)" }}>{fmt(d.value)}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "var(--bg-subtle)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(d.value / max) * 100}%`,
              background: color ?? "var(--split-accent)",
              borderRadius: 999,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Line chart (SVG) ─────────────────────────────────────────────────────────

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return null;
  const W = 320, H = 120, PX = 24, PY = 16;
  const iW = W - PX * 2;
  const iH = H - PY * 2;
  const max = Math.max(...data.map((d) => d.value), 1);
  const pts = data.map((d, i) => ({
    x: PX + (i / Math.max(data.length - 1, 1)) * iW,
    y: PY + iH - (d.value / max) * iH,
    label: d.label,
    value: d.value,
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = [
    `${pts[0].x},${PY + iH}`,
    ...pts.map((p) => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${PY + iH}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="linefill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--split-accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--split-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#linefill)" />
      <polyline points={polyline} fill="none" stroke="var(--split-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="var(--split-accent)" />
          <text x={p.x} y={H - 2} textAnchor="middle" fontSize="9" fill="var(--fg-muted)">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Grouped bar chart per person/month ───────────────────────────────────────

function GroupedBarChart({ data, persons }: {
  data: { month: string; person: string; total: number }[];
  persons: string[];
}) {
  const months = [...new Set(data.map((d) => d.month))].sort();
  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 12, minWidth: months.length * 80 }}>
        {months.map((month) => {
          const monthData = persons.map((person) => ({
            person,
            total: data.find((d) => d.month === month && d.person === person)?.total ?? 0,
          }));
          return (
            <div key={month} style={{ flex: 1, minWidth: 60 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, marginBottom: 4 }}>
                {monthData.map((pd, i) => (
                  <div
                    key={pd.person}
                    title={`${pd.person}: ${fmt(pd.total)}`}
                    style={{
                      flex: 1,
                      height: `${(pd.total / maxVal) * 100}%`,
                      minHeight: pd.total > 0 ? 4 : 0,
                      background: PERSON_COLORS[i % PERSON_COLORS.length],
                      borderRadius: "4px 4px 0 0",
                      opacity: 0.85,
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 10, color: "var(--fg-muted)", textAlign: "center" }}>
                {shortMonth(month)}
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
        {persons.map((p, i) => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: PERSON_COLORS[i % PERSON_COLORS.length] }} />
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuswertungPage() {
  const [report, setReport] = useState<ExpenseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.getExpenseReport()
      .then((r) => setReport(r))
      .catch(() => setErr("Bericht konnte nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  const summary = report?.summary;
  const byCategory = report?.by_category ?? [];
  const monthlyTotals = report?.monthly_totals ?? [];
  const byPersonMonthly = report?.by_person_monthly ?? [];
  const persons = [...new Set(byPersonMonthly.map((d) => d.person))].sort();

  // Totals per person (all time, from by_person_monthly might be incomplete — better from expenses, but approximation is fine here)
  const totalsByPerson = persons.map((p) => ({
    label: p,
    value: byPersonMonthly.filter((d) => d.person === p).reduce((s, d) => s + d.total, 0),
  }));

  const donutSegments = byCategory.map((c) => ({
    label: c.category,
    color: CATEGORY_COLORS[c.category] ?? "#6b7280",
    value: c.total,
  }));

  return (
    <Page
      title="Auswertung"
      subtitle="Ausgaben-Analyse & Charts"
      icon="📊"
      iconAccent="#059669"
      right={<BtnLink href="/split">Zurück</BtnLink>}
      navCurrent="/split"
    >
      {loading && (
        <div style={{ display: "grid", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={120} />)}
        </div>
      )}

      {err && <div style={styles.errorBox}>{err}</div>}

      {!loading && report && (
        <div style={{ display: "grid", gap: 20, paddingBottom: 32 }}>

          {/* ── Summary KPIs ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Diesen Monat", value: `${fmt(summary?.total_month ?? 0)}`, sub: "Gesamt ausgegeben" },
              { label: "Alle Zeit",    value: `${fmt(summary?.total_all ?? 0)}`,   sub: `${summary?.expense_count ?? 0} Ausgaben` },
              { label: "Offener Saldo", value: `${fmt(summary?.open_balance ?? 0)}`, sub: "Zu begleichen" },
              { label: "Top-Kategorie", value: byCategory[0]?.category ?? "—", sub: byCategory[0] ? `${fmt(byCategory[0].total)}` : "" },
            ].map((kpi) => (
              <div key={kpi.label} style={styles.card}>
                <div style={{ fontSize: 11, color: "var(--fg-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--fg)" }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Ausgaben nach Kategorie ── */}
          {byCategory.length > 0 && (
            <div style={styles.card}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Ausgaben nach Kategorie</div>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <DonutChart segments={donutSegments} />
                <div style={{ flex: 1, display: "grid", gap: 8 }}>
                  {byCategory.map((c) => (
                    <div key={c.category} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: 3,
                        background: CATEGORY_COLORS[c.category] ?? "#6b7280",
                        flexShrink: 0,
                      }} />
                      <span style={{ flex: 1 }}>{c.category}</span>
                      <span style={{ fontWeight: 700 }}>{fmt(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Monatlicher Trend ── */}
          {monthlyTotals.length > 0 && (
            <div style={styles.card}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Ausgaben pro Monat</div>
              <LineChart
                data={monthlyTotals.map((m) => ({ label: shortMonth(m.month), value: m.total }))}
              />
            </div>
          )}

          {/* ── Wer hat wie viel gezahlt ── */}
          {totalsByPerson.length > 0 && (
            <div style={styles.card}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Gezahlt pro Person (letzte 6 Monate)</div>
              <div style={{ display: "grid", gap: 10 }}>
                {totalsByPerson.map((p, i) => (
                  <div key={p.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{p.label}</span>
                      <span style={{ color: "var(--fg-muted)" }}>{fmt(p.value)}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: "var(--bg-subtle)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${(p.value / Math.max(...totalsByPerson.map((x) => x.value), 1)) * 100}%`,
                        background: PERSON_COLORS[i % PERSON_COLORS.length],
                        borderRadius: 999,
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Vergleich pro Monat ── */}
          {byPersonMonthly.length > 0 && persons.length > 0 && (
            <div style={styles.card}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Vergleich pro Monat</div>
              <GroupedBarChart data={byPersonMonthly} persons={persons} />
            </div>
          )}

          {byCategory.length === 0 && (
            <div style={{ ...styles.card, textAlign: "center", padding: 40, color: "var(--fg-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div style={{ fontWeight: 700 }}>Noch keine Daten</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Erfasse Ausgaben, um die Auswertung zu sehen.</div>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
