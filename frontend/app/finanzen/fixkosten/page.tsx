"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type FixedExpense, type FixedExpenseMonth, type FinanceResponsibleParty } from "../../lib/api";
import { BtnLink, Page, styles } from "../../lib/ui";
import { FINANCE_ACCENT, FINANCE_CATEGORY_OPTIONS, FINANCE_INTERVAL_OPTIONS, FINANCE_PERSON_COLORS, FINANCE_RESPONSIBLE_OPTIONS, currentMonthValue, monthStartValue } from "../format.mjs";

function ResponsibleBadge({ party, label }: { party: FinanceResponsibleParty; label: string }) {
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

export default function FixedCostsPage() {
  const [items, setItems] = useState<FixedExpense[]>([]);
  const [months, setMonths] = useState<FixedExpenseMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [interval, setInterval] = useState("");
  const [responsible, setResponsible] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.listFixedExpenses({ category: category || undefined, interval: interval || undefined, responsible_party: responsible || undefined, status }),
      api.listFixedExpenseMonths(12),
    ])
      .then(([expenseItems, monthItems]) => {
        setItems(expenseItems);
        setMonths(monthItems);
      })
      .finally(() => setLoading(false));
  }, [category, interval, responsible, status]);

  const currentMonth = monthStartValue(currentMonthValue());

  return (
    <Page title="Fixkosten" subtitle="Wiederkehrende und einmalige Kosten für euren Haushalt" icon="🧾" iconAccent={FINANCE_ACCENT} right={<BtnLink href="/finanzen">Zurück</BtnLink>} navCurrent="/finanzen">
      <div style={{ ...styles.card, marginBottom: 14, textAlign: "center" }}>
        <Link href="/finanzen/fixkosten/new" style={{ ...styles.buttonPrimary, justifyContent: "center", minWidth: 240 }}>
          + Neue Fixkosten hinzufügen
        </Link>
      </div>

      <div style={{ ...styles.card, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Fixkosten pro Monat</div>
        <div style={{ display: "grid", gap: 10 }}>
          {months.map((item) => (
            <Link key={item.month} href={`/finanzen/fixkosten/monate/${item.month}`} style={{ textDecoration: "none" }}>
              <div className="nav-tile" style={styles.cardSubtle}>
                <div style={{ ...styles.rowBetween, marginBottom: 6 }}>
                  <div style={{ fontWeight: 800 }}>{item.month_label}</div>
                  <div style={{ fontWeight: 900, color: FINANCE_ACCENT }}>{item.monthly_total_text}</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                  Effektiv in diesem Monat: {item.count} Positionen · Tatsächlich fällig: {item.due_total_text}
                </div>
                {item.month === currentMonth ? (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ ...styles.chip, borderColor: `${FINANCE_ACCENT}55`, background: `${FINANCE_ACCENT}18`, color: FINANCE_ACCENT, fontWeight: 800 }}>Aktueller Monat</span>
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: 14, display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 800 }}>Stammdaten verwalten</div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
          <option value="">Alle Kategorien</option>
          {FINANCE_CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={interval} onChange={(e) => setInterval(e.target.value)} style={styles.select}>
          <option value="">Alle Intervalle</option>
          {FINANCE_INTERVAL_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={responsible} onChange={(e) => setResponsible(e.target.value)} style={styles.select}>
          <option value="">Alle Verantwortlichkeiten</option>
          {FINANCE_RESPONSIBLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.select}>
          <option value="active">Aktiv</option>
          <option value="inactive">Inaktiv</option>
          <option value="all">Alle</option>
        </select>
      </div>

      {loading ? <div style={{ color: "var(--fg-muted)" }}>Lade…</div> : null}
      {!loading && items.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏦</div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Noch keine Fixkosten erfasst</div>
          <div style={{ color: "var(--fg-muted)", marginBottom: 12 }}>Erfasse wiederkehrende Ausgaben wie Wohnen, Versicherungen oder Abos.</div>
          <Link href="/finanzen/fixkosten/new" style={styles.buttonPrimary}>Fixkosten hinzufügen</Link>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 12, paddingBottom: 30 }}>
        {items.map((item) => (
          <Link key={item.id} href={`/finanzen/fixkosten/${item.id}`} style={{ textDecoration: "none" }}>
            <div className="nav-tile" style={styles.cardLink}>
              <div style={{ ...styles.rowBetween, marginBottom: 6 }}>
                <div style={{ fontWeight: 800 }}>{item.name}</div>
                <div style={{ fontWeight: 800, color: FINANCE_ACCENT }}>{item.monthly_amount_text}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{ ...styles.chip, fontWeight: 700 }}>{item.category_label}</span>
                <ResponsibleBadge party={item.responsible_party} label={item.responsible_label} />
                {!item.is_active ? <span style={{ ...styles.chip, color: "#b91c1c", borderColor: "#fecaca", background: "#fff1f2", fontWeight: 800 }}>Inaktiv</span> : null}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{item.amount_text} · {item.interval_label}</div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 4 }}>{item.next_due_date} · monatlich angerechnet {item.monthly_amount_text}</div>
            </div>
          </Link>
        ))}
      </div>
    </Page>
  );
}
