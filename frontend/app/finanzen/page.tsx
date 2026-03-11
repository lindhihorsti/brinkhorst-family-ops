"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type FinanceDashboard } from "../lib/api";
import { BtnLink, Page, styles } from "../lib/ui";
import { currentMonthValue, FINANCE_ACCENT, FINANCE_PERSON_COLORS, formatMonthLabel } from "./format.mjs";

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${accent} 36%, var(--border))` }}>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>{value}</div>
    </div>
  );
}

function HBarChart({
  rows,
  color,
}: {
  rows: { label: string; value: number; text: string; color?: string }[];
  color: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((row) => (
        <div key={row.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, gap: 8 }}>
            <span style={{ fontWeight: 700, color: row.color ?? "var(--fg)" }}>{row.label}</span>
            <span style={{ color: "var(--fg-muted)" }}>{row.text}</span>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: "var(--bg-subtle)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(row.value / max) * 100}%`, background: row.color ?? color, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StackedCategoryChart({
  rows,
}: {
  rows: FinanceDashboard["by_category"];
}) {
  const max = Math.max(...rows.map((row) => row.monthly_total), 1);
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {rows.filter((row) => row.monthly_total > 0).map((row) => (
        <div key={row.category}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, marginBottom: 4 }}>
            <span style={{ fontWeight: 700 }}>{row.label}</span>
            <span style={{ color: "var(--fg-muted)" }}>{row.monthly_total_text} · {row.percentage}%</span>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: "var(--bg-subtle)", overflow: "hidden", display: "flex" }}>
            {row.carried_by.map((slice) => (
              <div
                key={`${row.category}-${slice.responsible_party}`}
                style={{
                  height: "100%",
                  width: `${(slice.monthly_total / max) * 100}%`,
                  background: slice.color || FINANCE_ACCENT,
                }}
                title={`${slice.label}: ${slice.monthly_total_text}`}
              />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {row.carried_by.map((slice) => (
              <span
                key={`${row.category}-${slice.responsible_party}-label`}
                style={{
                  ...styles.chip,
                  borderColor: `color-mix(in srgb, ${slice.color || FINANCE_ACCENT} 45%, var(--border))`,
                  background: `color-mix(in srgb, ${slice.color || FINANCE_ACCENT} 12%, var(--bg))`,
                  color: slice.color || FINANCE_ACCENT,
                  fontWeight: 800,
                }}
              >
                {slice.label}: {slice.monthly_total_text}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResponsibleBadge({ person, label }: { person: "dennis" | "julia" | "gemeinsam"; label: string }) {
  const color = FINANCE_PERSON_COLORS[person];
  return (
    <span
      style={{
        ...styles.chip,
        borderColor: `color-mix(in srgb, ${color} 45%, var(--border))`,
        background: `color-mix(in srgb, ${color} 14%, var(--bg))`,
        color,
        fontWeight: 800,
      }}
    >
      {label}
    </span>
  );
}

export default function FinanzenPage() {
  const [month, setMonth] = useState(currentMonthValue());
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getFinanceDashboard(month)
      .then(setDashboard)
      .catch((e) => setError(e instanceof Error ? e.message : "Dashboard konnte nicht geladen werden"))
      .finally(() => setLoading(false));
  }, [month]);

  const responsibilityRows = useMemo(
    () => (dashboard?.by_responsible_party ?? []).filter((row) => row.monthly_total > 0).map((row) => ({ label: row.label, value: row.monthly_total, text: `${row.monthly_total_text} · ${row.percentage}%`, color: row.color })),
    [dashboard]
  );
  const selectedYear = Number(String(month).slice(0, 4)) || new Date().getFullYear();
  const selectedMonthIndex = Math.max(1, Math.min(12, Number(String(month).slice(5, 7)) || 1));
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const monthValue = `${selectedYear}-${String(index + 1).padStart(2, "0")}`;
      return { value: monthValue, label: formatMonthLabel(monthValue) };
    });
  }, [selectedYear]);

  function shiftYear(delta: number) {
    const nextYear = selectedYear + delta;
    setMonth(`${nextYear}-${String(selectedMonthIndex).padStart(2, "0")}`);
  }

  return (
    <Page
      title="Was kostet unser Leben?"
      subtitle=""
      icon="🏦"
      iconAccent={FINANCE_ACCENT}
      right={<BtnLink href="/">Home</BtnLink>}
      navCurrent="/finanzen"
    >
      <div style={{ ...styles.card, marginBottom: 14, display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Link
            href="/finanzen/einkommen"
            style={{
              ...styles.button,
              padding: "12px 14px",
              fontWeight: 900,
              borderColor: `color-mix(in srgb, ${FINANCE_ACCENT} 45%, var(--border))`,
              background: `color-mix(in srgb, ${FINANCE_ACCENT} 10%, var(--bg))`,
              color: FINANCE_ACCENT,
            }}
          >
            Einkommen
          </Link>
          <Link
            href="/finanzen/fixkosten"
            style={{
              ...styles.button,
              padding: "12px 14px",
              fontWeight: 900,
              borderColor: FINANCE_ACCENT,
              background: FINANCE_ACCENT,
              color: "white",
            }}
          >
            Fixkosten
          </Link>
          <Link href="/finanzen/jaehrlich" style={{ ...styles.button, padding: "12px 14px", fontWeight: 800, justifyContent: "center" }}>
            Jährliche Sicht
          </Link>
        </div>
      </div>

      <div
        style={{
          ...styles.card,
          marginBottom: 14,
          borderColor: `color-mix(in srgb, ${FINANCE_ACCENT} 34%, var(--border))`,
          background: `linear-gradient(180deg, color-mix(in srgb, ${FINANCE_ACCENT} 10%, var(--bg)) 0%, color-mix(in srgb, ${FINANCE_ACCENT} 18%, var(--bg-subtle)) 100%)`,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: FINANCE_ACCENT, marginBottom: 6 }}>
          Finanzen
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>
          {dashboard?.month_label ? `Finanzen für ${dashboard.month_label}` : "Finanzen im aktuellen Monat"}
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: 14 }}>
        <div style={{ ...styles.rowBetween, gap: 10, marginBottom: 10 }}>
          <button type="button" onClick={() => shiftYear(-1)} style={styles.button}>
            ← {selectedYear - 1}
          </button>
          <div style={{ fontWeight: 900, color: FINANCE_ACCENT, fontSize: 18 }}>{selectedYear}</div>
          <button type="button" onClick={() => shiftYear(1)} style={styles.button}>
            {selectedYear + 1} →
          </button>
        </div>
        <label style={styles.label}>Monat im Jahr {selectedYear}</label>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={styles.select}>
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {loading ? <div style={{ color: "var(--fg-muted)" }}>Lade…</div> : null}
      {error ? <div style={{ ...styles.errorBox, marginBottom: 14 }}>{error}</div> : null}

      {!loading && !error && dashboard && (
        <div style={{ display: "grid", gap: 14, paddingBottom: 20 }}>
          {(dashboard.top_cost_drivers ?? []).length === 0 ? (
            <div style={{ ...styles.card, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏦</div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Noch keine Fixkosten erfasst</div>
              <div style={{ color: "var(--fg-muted)", fontSize: 14, marginBottom: 14 }}>
                Erfasse wiederkehrende Ausgaben wie Wohnen, Versicherungen oder Abos, um zu sehen, was euer Leben pro Monat kostet.
              </div>
              <Link href="/finanzen/fixkosten/new" style={styles.buttonPrimary}>Fixkosten hinzufügen</Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
                Allgemeine Sicht
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <StatCard label="Monatliche Fixkosten" value={dashboard.summary.monthly_fixed_total_text} accent={FINANCE_ACCENT} />
                <StatCard label="Im Monat fällig" value={dashboard.summary.due_in_month_total_text} accent="#7c3aed" />
                <StatCard label="Nächste 30 Tage" value={dashboard.summary.next_30_days_total_text} accent="#d97706" />
                <StatCard label="Verfügbar gesamt" value={dashboard.summary.available_after_fixed_total_text} accent="#059669" />
              </div>

              <div style={styles.card}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Einkommen im Haushalt</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${FINANCE_PERSON_COLORS.dennis} 35%, var(--border))` }}><div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Dennis</div><div style={{ fontWeight: 800, color: FINANCE_PERSON_COLORS.dennis }}>{dashboard.incomes.dennis_text}</div></div>
                  <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${FINANCE_PERSON_COLORS.julia} 35%, var(--border))` }}><div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Julia</div><div style={{ fontWeight: 800, color: FINANCE_PERSON_COLORS.julia }}>{dashboard.incomes.julia_text}</div></div>
                </div>
                <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${FINANCE_ACCENT} 35%, var(--border))`, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 4 }}>Gesamt verfügbar im Haushalt</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: FINANCE_ACCENT }}>{dashboard.incomes.gesamt_text}</div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Fixkosten nach Kategorie</div>
                <StackedCategoryChart rows={dashboard.by_category ?? []} />
              </div>

              <div style={styles.card}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Top-Kostentreiber</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {dashboard.top_cost_drivers.map((item, index) => (
                    <div key={item.id} style={styles.cardSubtle}>
                      <div style={{ ...styles.rowBetween, marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 999, background: `${FINANCE_ACCENT}22`, color: FINANCE_ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                            {index + 1}
                          </div>
                          <div style={{ fontWeight: 800 }}>{item.name}</div>
                        </div>
                        <div style={{ fontWeight: 800, color: FINANCE_ACCENT }}>{item.monthly_amount_text}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{item.category_label} · {item.amount_text} · {item.interval_label} · {item.responsible_label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.card}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Nächste Fälligkeiten</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {(dashboard.upcoming_due_items ?? []).slice(0, 6).map((item) => (
                    <div key={item.id} style={styles.cardSubtle}>
                      <div style={{ ...styles.rowBetween }}>
                        <div>
                          <div style={{ fontWeight: 800 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{item.next_due_date} · {item.interval_label} · {item.responsible_label}</div>
                        </div>
                        <div style={{ fontWeight: 800 }}>{item.amount_text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(dashboard.periodic_costs ?? []).length > 0 ? (
                <div style={styles.card}>
                  <div style={{ fontWeight: 800, marginBottom: 10 }}>Nicht-monatliche Kosten</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {dashboard.periodic_costs.map((item) => (
                      <div key={item.id} style={styles.cardSubtle}>
                        <div style={{ ...styles.rowBetween }}>
                          <div>
                            <div style={{ fontWeight: 800 }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{item.interval_label} · {item.responsible_label}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800 }}>{item.amount_text}</div>
                            <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>≈ {item.monthly_amount_text} / Monat</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
                Persönliche Sicht
              </div>
              <div style={styles.card}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Persönliche Sicht</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {(["dennis", "julia"] as const).map((person) => {
                    const info = dashboard.people[person];
                    const color = info.color || FINANCE_PERSON_COLORS[person];
                    return (
                      <div
                        key={person}
                        style={{
                          ...styles.cardSubtle,
                          borderColor: `color-mix(in srgb, ${color} 38%, var(--border))`,
                          background: `linear-gradient(180deg, color-mix(in srgb, ${color} 10%, var(--bg)) 0%, color-mix(in srgb, ${color} 6%, var(--bg-subtle)) 100%)`,
                        }}
                      >
                        <div style={{ ...styles.rowBetween, marginBottom: 8 }}>
                          <ResponsibleBadge person={person} label={info.label} />
                          <div style={{ color: color, fontWeight: 800 }}>{info.available_after_allocation_text}</div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div><div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Einkommen</div><div style={{ fontWeight: 700 }}>{info.income_text}</div></div>
                          <div><div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Direkt getragen</div><div style={{ fontWeight: 700 }}>{info.direct_costs_text}</div></div>
                          <div><div style={{ fontSize: 12, color: "var(--fg-muted)" }}>50% gemeinsame Fixkosten</div><div style={{ fontWeight: 700 }}>{info.shared_cost_share_text}</div></div>
                          <div><div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Gesamtbelastung</div><div style={{ fontWeight: 700 }}>{info.allocated_costs_text}</div></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.card}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Wer trägt was?</div>
                <HBarChart rows={responsibilityRows} color={FINANCE_ACCENT} />
              </div>
            </>
          )}
        </div>
      )}
    </Page>
  );
}
