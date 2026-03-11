"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type FinanceIncomeMonth } from "../../lib/api";
import { BtnLink, Page, styles } from "../../lib/ui";
import { currentMonthValue, FINANCE_ACCENT, FINANCE_PERSON_COLORS, monthStartValue } from "../format.mjs";

export default function FinanzEinkommenPage() {
  const [items, setItems] = useState<FinanceIncomeMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.listFinanceIncomeMonths(12)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Monatseinkommen konnten nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  const currentMonth = monthStartValue(currentMonthValue());

  return (
    <Page title="Monatseinkommen" subtitle="Pro Monat je ein Eintrag mit Dennis, Julia und Haushalt gesamt" icon="💼" iconAccent={FINANCE_ACCENT} right={<BtnLink href="/finanzen">Zurück</BtnLink>} navCurrent="/finanzen">
      <div style={{ ...styles.card, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>So funktioniert es</div>
        <div style={{ color: "var(--fg-muted)", fontSize: 14, lineHeight: 1.5 }}>
          Einkommen schwankt monatlich. Deshalb pflegt ihr pro Monat einen gemeinsamen Eintrag, in dem Dennis und Julia separat erfasst und zum Haushaltseinkommen summiert werden.
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: 14 }}>
        <Link href={`/finanzen/einkommen/${currentMonth}`} style={styles.buttonPrimary}>Aktuellen Monat öffnen</Link>
      </div>

      {loading ? <div style={{ color: "var(--fg-muted)" }}>Lade…</div> : null}
      {error ? <div style={{ ...styles.errorBox, marginBottom: 14 }}>{error}</div> : null}

      <div style={{ display: "grid", gap: 12, paddingBottom: 24 }}>
        {items.map((item) => (
          <Link key={item.month} href={`/finanzen/einkommen/${item.month}`} style={{ textDecoration: "none" }}>
            <div className="nav-tile" style={styles.cardLink}>
              <div style={{ ...styles.rowBetween, marginBottom: 8 }}>
                <div style={{ fontWeight: 800 }}>{item.month_label}</div>
                <div style={{ fontWeight: 900, color: FINANCE_ACCENT }}>{item.gesamt_text}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${FINANCE_PERSON_COLORS.dennis} 35%, var(--border))` }}>
                  <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Dennis</div>
                  <div style={{ fontWeight: 800, color: FINANCE_PERSON_COLORS.dennis }}>{item.dennis_text}</div>
                </div>
                <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${FINANCE_PERSON_COLORS.julia} 35%, var(--border))` }}>
                  <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Julia</div>
                  <div style={{ fontWeight: 800, color: FINANCE_PERSON_COLORS.julia }}>{item.julia_text}</div>
                </div>
                <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${FINANCE_ACCENT} 35%, var(--border))` }}>
                  <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>Status</div>
                  <div style={{ fontWeight: 800 }}>{item.has_values ? "Erfasst" : "Noch leer"}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Page>
  );
}
