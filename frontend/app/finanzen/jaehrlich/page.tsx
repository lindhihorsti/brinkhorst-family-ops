"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, type FinanceYearlyOverview } from "../../lib/api";
import { BtnLink, Page, styles } from "../../lib/ui";
import { FINANCE_ACCENT, FINANCE_PERSON_COLORS } from "../format.mjs";

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${accent} 35%, var(--border))` }}>
      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{value}</div>
    </div>
  );
}

function HBar({ rows, colorKey }: { rows: { label: string; text: string; value: number; color?: string }[]; colorKey: string }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((row) => (
        <div key={row.label}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: row.color ?? "var(--fg)" }}>{row.label}</span>
            <span style={{ color: "var(--fg-muted)" }}>{row.text}</span>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: "var(--bg-subtle)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(row.value / max) * 100}%`, background: row.color ?? colorKey, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FinanzenJaehrlichPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [overview, setOverview] = useState<FinanceYearlyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getFinanceYearlyOverview(Number(year))
      .then(setOverview)
      .catch((e) => setError(e instanceof Error ? e.message : "Jahresübersicht konnte nicht geladen werden"))
      .finally(() => setLoading(false));
  }, [year]);

  const categoryRows = useMemo(
    () => (overview?.by_category ?? []).map((row) => ({ label: row.label, value: row.annual_total, text: `${row.annual_total_text} · ${row.percentage}%` })),
    [overview]
  );
  const responsibilityRows = useMemo(
    () => (overview?.by_responsible_party ?? []).map((row) => ({ label: row.label, value: row.annual_total, text: `${row.annual_total_text} · ${row.percentage}%`, color: row.color })),
    [overview]
  );
  const monthRows = useMemo(
    () => (overview?.monthly_breakdown ?? []).map((row) => ({ label: row.label, value: row.monthly_total, text: row.monthly_total_text })),
    [overview]
  );
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const selectedYear = Number(year) || currentYear;
    const startYear = Math.min(currentYear - 4, selectedYear - 1);
    const endYear = Math.max(currentYear + 4, selectedYear + 1);
    return Array.from({ length: endYear - startYear + 1 }, (_, index) => String(startYear + index));
  }, [year]);

  return (
    <Page title="Jährliche Fixkosten" subtitle="" icon="📆" iconAccent={FINANCE_ACCENT} right={<BtnLink href="/finanzen">Zurück</BtnLink>} navCurrent="/finanzen">
      <div style={{ ...styles.card, marginBottom: 14 }}>
        <label style={styles.label}>Jahr</label>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={styles.select}>
          {yearOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {loading ? <div style={{ color: "var(--fg-muted)" }}>Lade…</div> : null}
      {error ? <div style={{ ...styles.errorBox, marginBottom: 14 }}>{error}</div> : null}

      {!loading && !error && overview ? (
        <div style={{ display: "grid", gap: 14, paddingBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
            Allgemeine Sicht
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StatCard label="Jährliche Fixkosten" value={overview.summary.annual_fixed_total_text} accent={FINANCE_ACCENT} />
            <StatCard label="Durchschnitt pro Monat" value={overview.summary.monthly_average_text} accent="#7c3aed" />
            <StatCard label="Effektiv fällige Zahlungen" value={overview.summary.actual_due_total_text} accent="#d97706" />
            <StatCard label="Verfügbar nach Fixkosten" value={overview.summary.available_after_fixed_total_text} accent="#059669" />
          </div>

          <div style={styles.card}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Jahreseinkommen im Haushalt</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${FINANCE_PERSON_COLORS.dennis} 35%, var(--border))` }}><div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Dennis</div><div style={{ fontWeight: 800, color: FINANCE_PERSON_COLORS.dennis }}>{overview.people.dennis.income_total_text}</div></div>
              <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${FINANCE_PERSON_COLORS.julia} 35%, var(--border))` }}><div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Julia</div><div style={{ fontWeight: 800, color: FINANCE_PERSON_COLORS.julia }}>{overview.people.julia.income_total_text}</div></div>
            </div>
            <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${FINANCE_ACCENT} 35%, var(--border))`, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 4 }}>Gesamt verfügbar im Haushalt</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: FINANCE_ACCENT }}>{overview.summary.household_income_total_text}</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Kategorie-Ranking im Jahr</div>
            <HBar rows={categoryRows} colorKey={FINANCE_ACCENT} />
          </div>

          <div style={styles.card}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Monatsverlauf</div>
            <HBar rows={monthRows} colorKey={FINANCE_ACCENT} />
          </div>

          <div style={styles.card}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Größte Kostentreiber im Jahr</div>
            <div style={{ display: "grid", gap: 10 }}>
              {overview.annual_cost_drivers.map((item, index) => (
                <div key={item.id} style={styles.cardSubtle}>
                  <div style={{ ...styles.rowBetween, marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 999, background: `${FINANCE_ACCENT}22`, color: FINANCE_ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{index + 1}</div>
                      <div style={{ fontWeight: 800 }}>{item.name}</div>
                    </div>
                    <div style={{ fontWeight: 900, color: FINANCE_ACCENT }}>{item.annual_total_text}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{item.category_label} · {item.interval_label} · {item.responsible_label}</div>
                </div>
              ))}
            </div>
          </div>

          {overview.one_time_costs.length > 0 ? (
            <div style={styles.card}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Einmalige Kosten im Jahr</div>
              <div style={{ display: "grid", gap: 10 }}>
                {overview.one_time_costs.map((item) => (
                  <div key={`${item.id}-${item.month_label}`} style={styles.cardSubtle}>
                    <div style={{ ...styles.rowBetween }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{item.month_label} · {item.category_label} · {item.responsible_label}</div>
                      </div>
                      <div style={{ fontWeight: 800 }}>{item.amount_text}</div>
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
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Persönliche Jahressicht</div>
            <div style={{ display: "grid", gap: 10 }}>
              {(["dennis", "julia"] as const).map((person) => {
                const info = overview.people[person];
                const color = info.color || FINANCE_PERSON_COLORS[person];
                return (
                  <div key={person} style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${color} 35%, var(--border))` }}>
                    <div style={{ ...styles.rowBetween, marginBottom: 8 }}>
                      <div style={{ fontWeight: 900, color }}>{info.label}</div>
                      <div style={{ fontWeight: 900, color }}>{info.available_after_allocation_text}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div><div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Direkt getragen</div><div style={{ fontWeight: 700 }}>{info.direct_costs_text}</div></div>
                      <div><div style={{ fontSize: 12, color: "var(--fg-muted)" }}>50% gemeinsame Kosten</div><div style={{ fontWeight: 700 }}>{info.shared_cost_share_text}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.card}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Verteilung im Jahr</div>
            <HBar rows={responsibilityRows} colorKey={FINANCE_ACCENT} />
          </div>
        </div>
      ) : null}
    </Page>
  );
}
