"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { api, type FixedExpenseCreate } from "../../../lib/api";
import { BtnLink, Page, styles } from "../../../lib/ui";
import { FINANCE_ACCENT, FINANCE_CATEGORY_OPTIONS, FINANCE_INTERVAL_OPTIONS, FINANCE_RESPONSIBLE_OPTIONS } from "../../format.mjs";

function FieldWrap({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      {children}
      {hint ? <div style={{ ...styles.small, marginTop: 6 }}>{hint}</div> : null}
    </div>
  );
}

export default function NewFixedExpensePage() {
  const router = useRouter();
  const [form, setForm] = useState<FixedExpenseCreate>({
    name: "",
    provider: "",
    category: "wohnen",
    amount: 0,
    interval: "monthly",
    next_due_date: new Date().toISOString().slice(0, 10),
    payment_method: "",
    responsible_party: "gemeinsam",
    account_label: "",
    contract_start_date: "",
    contract_end_date: "",
    cancellation_notice_days: undefined,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await api.createFixedExpense({
        ...form,
        provider: form.provider || undefined,
        payment_method: form.payment_method || undefined,
        account_label: form.account_label || undefined,
        contract_start_date: form.contract_start_date || undefined,
        contract_end_date: form.contract_end_date || undefined,
        notes: form.notes || undefined,
      });
      router.push(`/finanzen/fixkosten/${res.item.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title="Neue Fixkosten" subtitle="Wiederkehrende Kosten manuell erfassen" icon="🏦" iconAccent={FINANCE_ACCENT} right={<BtnLink href="/finanzen/fixkosten">Zurück</BtnLink>} navCurrent="/finanzen">
      <div style={{ display: "grid", gap: 12 }}>
        <FieldWrap label="Name">
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={styles.input} placeholder="z. B. Miete Wohnung" />
        </FieldWrap>

        <FieldWrap label="Anbieter" hint="Optional, z. B. Vermieter, Krankenkasse oder Anbietername.">
          <input value={form.provider ?? ""} onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))} style={styles.input} placeholder="Anbieter" />
        </FieldWrap>

        <FieldWrap label="Kategorie">
          <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as FixedExpenseCreate["category"] }))} style={styles.select}>
            {FINANCE_CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </FieldWrap>

        <FieldWrap label="Betrag">
          <input type="number" min="0.01" step="0.01" value={form.amount || ""} onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))} style={styles.input} placeholder="Betrag in CHF" />
        </FieldWrap>

        <FieldWrap label="Intervall">
          <select value={form.interval} onChange={(e) => setForm((p) => ({ ...p, interval: e.target.value as FixedExpenseCreate["interval"] }))} style={styles.select}>
            {FINANCE_INTERVAL_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </FieldWrap>

        <FieldWrap label="Nächste Fälligkeit" hint="Das ist das nächste Datum, an dem der Betrag real bezahlt oder abgebucht wird. Dieser Wert steuert auch die Übersicht für die nächsten 30 Tage.">
          <input type="date" value={form.next_due_date} onChange={(e) => setForm((p) => ({ ...p, next_due_date: e.target.value }))} style={styles.input} />
        </FieldWrap>

        <FieldWrap label="Wer trägt die Kosten?" hint="Gemeinsame Fixkosten werden im persönlichen Budget von Dennis und Julia je zur Hälfte berücksichtigt.">
          <select value={form.responsible_party} onChange={(e) => setForm((p) => ({ ...p, responsible_party: e.target.value as FixedExpenseCreate["responsible_party"] }))} style={styles.select}>
            {FINANCE_RESPONSIBLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </FieldWrap>

        <FieldWrap label="Zahlungsart" hint="Optional, z. B. Lastschrift, Kreditkarte oder Dauerauftrag.">
          <input value={form.payment_method ?? ""} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))} style={styles.input} placeholder="Zahlungsart" />
        </FieldWrap>

        <FieldWrap label="Konto / Karte" hint="Optional für die interne Zuordnung, z. B. Privatkonto Dennis oder gemeinsame Karte.">
          <input value={form.account_label ?? ""} onChange={(e) => setForm((p) => ({ ...p, account_label: e.target.value }))} style={styles.input} placeholder="Konto / Karte" />
        </FieldWrap>

        <FieldWrap label="Vertragsbeginn" hint="Optionaler Start des Vertrags oder Abos. Dient nur als Referenz und ändert die Berechnung nicht.">
          <input type="date" value={form.contract_start_date ?? ""} onChange={(e) => setForm((p) => ({ ...p, contract_start_date: e.target.value }))} style={styles.input} />
        </FieldWrap>

        <FieldWrap label="Vertragsende" hint="Optionales Enddatum, falls der Vertrag befristet ist oder bereits gekündigt wurde.">
          <input type="date" value={form.contract_end_date ?? ""} onChange={(e) => setForm((p) => ({ ...p, contract_end_date: e.target.value }))} style={styles.input} />
        </FieldWrap>

        <FieldWrap label="Kündigungsfrist (Tage)" hint="Optional, damit sichtbar bleibt, wie lange vor dem Vertragsende gekündigt werden müsste.">
          <input type="number" min="0" step="1" value={form.cancellation_notice_days ?? ""} onChange={(e) => setForm((p) => ({ ...p, cancellation_notice_days: e.target.value ? Number(e.target.value) : undefined }))} style={styles.input} placeholder="Kündigungsfrist (Tage)" />
        </FieldWrap>

        <FieldWrap label="Notizen" hint="Optional für Zusatzinfos wie Tarif, Familienrabatt oder Vertragsdetails.">
          <textarea value={form.notes ?? ""} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} style={{ ...styles.textarea, minHeight: 96 }} placeholder="Notizen" />
        </FieldWrap>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        <button style={styles.buttonPrimary} disabled={saving} onClick={save}>{saving ? "Speichere…" : "Fixkosten anlegen"}</button>
      </div>
    </Page>
  );
}
