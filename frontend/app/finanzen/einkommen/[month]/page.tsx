"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import { BtnLink, Page, styles } from "../../../lib/ui";
import { FINANCE_ACCENT, FINANCE_PERSON_COLORS, formatMonthLabel, monthInputValue } from "../../format.mjs";

export default function FinanzEinkommenMonthDetailPage() {
  const params = useParams<{ month: string }>();
  const rawMonth = String(params.month || "").slice(0, 7);
  const [dennis, setDennis] = useState("");
  const [julia, setJulia] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const monthLabel = useMemo(() => formatMonthLabel(rawMonth), [rawMonth]);
  const totalValue = (Number(dennis || "0") + Number(julia || "0")).toFixed(2);

  const load = async () => {
    setError(null);
    try {
      const res = await api.listFinanceIncomes(rawMonth);
      const byPerson = Object.fromEntries((res.items ?? []).map((item) => [item.person, item]));
      setDennis(byPerson.dennis ? String(byPerson.dennis.net_income_amount) : "");
      setJulia(byPerson.julia ? String(byPerson.julia.net_income_amount) : "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Monatseinkommen konnten nicht geladen werden");
    }
  };

  useEffect(() => {
    if (rawMonth) load();
  }, [rawMonth]);

  const save = async () => {
    setSaving("save");
    setMessage(null);
    setError(null);
    try {
      await api.upsertFinanceIncome({ month: rawMonth, person: "dennis", net_income_amount: Number(dennis || "0") });
      await api.upsertFinanceIncome({ month: rawMonth, person: "julia", net_income_amount: Number(julia || "0") });
      setMessage("Monatseinkommen gespeichert");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(null);
    }
  };

  const copyPrevious = async () => {
    setSaving("copy");
    setMessage(null);
    setError(null);
    try {
      const res = await api.copyPreviousFinanceIncome(rawMonth);
      if (!res.ok) {
        setError(res.error || "Kopieren fehlgeschlagen");
        return;
      }
      setMessage("Werte aus dem Vormonat übernommen");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kopieren fehlgeschlagen");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Page title={monthLabel} subtitle="Monatseinkommen für Dennis, Julia und den Haushalt gesamt" icon="💼" iconAccent={FINANCE_ACCENT} right={<BtnLink href="/finanzen/einkommen">Zurück</BtnLink>} navCurrent="/finanzen">
      <div style={{ ...styles.card, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="month" value={monthInputValue(rawMonth)} readOnly style={{ ...styles.input, flex: 1, minWidth: 180, opacity: 0.8 }} />
          <button style={styles.button} disabled={saving === "copy"} onClick={copyPrevious}>
            {saving === "copy" ? "Kopiere…" : "Vormonat kopieren"}
          </button>
        </div>
      </div>

      {error ? <div style={{ ...styles.errorBox, marginBottom: 14 }}>{error}</div> : null}
      {message ? <div style={{ ...styles.successBox, marginBottom: 14 }}>{message}</div> : null}

      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ ...styles.cardSubtle, borderColor: `color-mix(in srgb, ${FINANCE_ACCENT} 35%, var(--border))` }}>
          <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 4 }}>Haushaltseinkommen im Monat</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: FINANCE_ACCENT }}>CHF {totalValue}</div>
        </div>

        <div style={{ ...styles.card, borderColor: `color-mix(in srgb, ${FINANCE_PERSON_COLORS.dennis} 30%, var(--border))` }}>
          <div style={{ fontWeight: 800, marginBottom: 10, color: FINANCE_PERSON_COLORS.dennis }}>Dennis</div>
          <label style={styles.label}>Verfügbares Einkommen im Monat</label>
          <input type="number" min="0" step="0.01" value={dennis} onChange={(e) => setDennis(e.target.value)} style={styles.input} placeholder="0.00" />
        </div>

        <div style={{ ...styles.card, borderColor: `color-mix(in srgb, ${FINANCE_PERSON_COLORS.julia} 30%, var(--border))` }}>
          <div style={{ fontWeight: 800, marginBottom: 10, color: FINANCE_PERSON_COLORS.julia }}>Julia</div>
          <label style={styles.label}>Verfügbares Einkommen im Monat</label>
          <input type="number" min="0" step="0.01" value={julia} onChange={(e) => setJulia(e.target.value)} style={styles.input} placeholder="0.00" />
        </div>

        <button style={styles.buttonPrimary} disabled={saving === "save"} onClick={save}>
          {saving === "save" ? "Speichere…" : "Monat speichern"}
        </button>
      </div>
    </Page>
  );
}
