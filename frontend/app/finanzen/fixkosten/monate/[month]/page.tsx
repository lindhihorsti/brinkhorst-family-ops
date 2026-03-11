"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type FixedExpense, type FixedExpenseMonthDetail } from "../../../../lib/api";
import { BtnLink, Page, styles } from "../../../../lib/ui";
import { FINANCE_ACCENT, FINANCE_PERSON_COLORS } from "../../../format.mjs";

function ResponsibleBadge({ party, label }: { party: FixedExpense["responsible_party"]; label: string }) {
  const color = FINANCE_PERSON_COLORS[party];
  return (
    <span
      style={{
        ...styles.chip,
        borderColor: `color-mix(in srgb, ${color} 40%, var(--border))`,
        background: `color-mix(in srgb, ${color} 14%, var(--bg))`,
        color,
        fontWeight: 800,
      }}
    >
      {label}
    </span>
  );
}

export default function FixedExpenseMonthDetailPage() {
  const params = useParams<{ month: string }>();
  const month = String(params.month || "");
  const [data, setData] = useState<FixedExpenseMonthDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getFixedExpenseMonthDetail(month)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Monatsansicht konnte nicht geladen werden"));
  }, [month]);

  return (
    <Page
      title={data?.month_label ?? "Monatsansicht"}
      subtitle="Fixkosten, die in diesem Monat effektiv berücksichtigt werden"
      icon="🗓️"
      iconAccent={FINANCE_ACCENT}
      right={<BtnLink href="/finanzen/fixkosten">Zurück</BtnLink>}
      navCurrent="/finanzen"
    >
      {error ? <div style={{ ...styles.errorBox, marginBottom: 14 }}>{error}</div> : null}
      {!data ? <div style={{ color: "var(--fg-muted)" }}>Lade…</div> : null}

      {data ? (
        <div style={{ display: "grid", gap: 14, paddingBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${FINANCE_ACCENT} 35%, var(--border))` }}>
              <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Monatlich angerechnet</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: FINANCE_ACCENT }}>{data.summary.monthly_total_text}</div>
            </div>
            <div style={styles.cardSubtle}>
              <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Effektiv fällig im Monat</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{data.summary.due_total_text}</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Positionen in {data.month_label}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {data.items.map((item) => (
                <div key={item.id} style={styles.cardSubtle}>
                  <div style={{ ...styles.rowBetween, marginBottom: 6 }}>
                    <div style={{ fontWeight: 800 }}>{item.name}</div>
                    <div style={{ fontWeight: 800, color: FINANCE_ACCENT }}>{item.monthly_amount_text}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ ...styles.chip, fontWeight: 700 }}>{item.category_label}</span>
                    <ResponsibleBadge party={item.responsible_party} label={item.responsible_label} />
                    <span style={{ ...styles.chip }}>{item.interval_label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                    Originalbetrag: {item.amount_text}
                    {item.month_due_date ? ` · fällig am ${item.month_due_date}` : " · in diesem Monat nicht separat fällig"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </Page>
  );
}
