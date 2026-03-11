"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api, type FixedExpense } from "../../../lib/api";
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

export default function FixedExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<FixedExpense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getFixedExpense(String(id)).then(setItem).catch((e) => setError(e instanceof Error ? e.message : "Laden fehlgeschlagen"));
  }, [id]);

  const save = async () => {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.updateFixedExpense(item.id, {
        name: item.name,
        provider: item.provider || undefined,
        category: item.category,
        amount: item.amount,
        interval: item.interval,
        next_due_date: item.next_due_date,
        payment_method: item.payment_method || undefined,
        responsible_party: item.responsible_party,
        account_label: item.account_label || undefined,
        contract_start_date: item.contract_start_date || undefined,
        contract_end_date: item.contract_end_date || undefined,
        cancellation_notice_days: item.cancellation_notice_days ?? undefined,
        notes: item.notes || undefined,
        is_active: item.is_active,
      });
      setItem(res.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    if (!item) return;
    if (!confirm("Fixkosten deaktivieren?")) return;
    setSaving(true);
    try {
      await api.archiveFixedExpense(item.id);
      router.push("/finanzen/fixkosten");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deaktivieren fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title={item?.name ?? "Fixkosten"} subtitle={item ? `${item.category_label} · ${item.monthly_amount_text} pro Monat` : "Lade…"} icon="🏦" iconAccent={FINANCE_ACCENT} right={<BtnLink href="/finanzen/fixkosten">Zurück</BtnLink>} navCurrent="/finanzen">
      {!item ? <div style={{ color: "var(--fg-muted)" }}>Lade…</div> : (
        <div style={{ display: "grid", gap: 12 }}>
          <FieldWrap label="Name">
            <input value={item.name} onChange={(e) => setItem((p) => p ? { ...p, name: e.target.value } : p)} style={styles.input} placeholder="Name" />
          </FieldWrap>

          <FieldWrap label="Anbieter" hint="Optional, z. B. Vermieter, Krankenkasse oder Anbietername.">
            <input value={item.provider ?? ""} onChange={(e) => setItem((p) => p ? { ...p, provider: e.target.value } : p)} style={styles.input} placeholder="Anbieter" />
          </FieldWrap>

          <FieldWrap label="Kategorie">
            <select value={item.category} onChange={(e) => setItem((p) => p ? { ...p, category: e.target.value as FixedExpense["category"], category_label: FINANCE_CATEGORY_OPTIONS.find(([value]) => value === e.target.value)?.[1] ?? p.category_label } : p)} style={styles.select}>
              {FINANCE_CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </FieldWrap>

          <FieldWrap label="Betrag">
            <input type="number" min="0.01" step="0.01" value={item.amount} onChange={(e) => setItem((p) => p ? { ...p, amount: Number(e.target.value) } : p)} style={styles.input} />
          </FieldWrap>

          <FieldWrap label="Intervall">
            <select value={item.interval} onChange={(e) => setItem((p) => p ? { ...p, interval: e.target.value as FixedExpense["interval"], interval_label: FINANCE_INTERVAL_OPTIONS.find(([value]) => value === e.target.value)?.[1] ?? p.interval_label } : p)} style={styles.select}>
              {FINANCE_INTERVAL_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </FieldWrap>

          <FieldWrap label="Nächste Fälligkeit" hint="Das nächste Datum, an dem die Zahlung effektiv fällig oder abgebucht wird. Dieser Wert erscheint in den Fälligkeits-Übersichten.">
            <input type="date" value={item.next_due_date} onChange={(e) => setItem((p) => p ? { ...p, next_due_date: e.target.value } : p)} style={styles.input} />
          </FieldWrap>

          <FieldWrap label="Wer trägt die Kosten?" hint="Gemeinsame Fixkosten werden im persönlichen Budget von Dennis und Julia je zur Hälfte berücksichtigt.">
            <select value={item.responsible_party} onChange={(e) => setItem((p) => p ? { ...p, responsible_party: e.target.value as FixedExpense["responsible_party"], responsible_label: FINANCE_RESPONSIBLE_OPTIONS.find(([value]) => value === e.target.value)?.[1] ?? p.responsible_label } : p)} style={styles.select}>
              {FINANCE_RESPONSIBLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </FieldWrap>

          <FieldWrap label="Zahlungsart" hint="Optional, z. B. Lastschrift, Kreditkarte oder Dauerauftrag.">
            <input value={item.payment_method ?? ""} onChange={(e) => setItem((p) => p ? { ...p, payment_method: e.target.value } : p)} style={styles.input} placeholder="Zahlungsart" />
          </FieldWrap>

          <FieldWrap label="Konto / Karte" hint="Optional für die interne Zuordnung, z. B. Privatkonto Dennis oder gemeinsame Karte.">
            <input value={item.account_label ?? ""} onChange={(e) => setItem((p) => p ? { ...p, account_label: e.target.value } : p)} style={styles.input} placeholder="Konto / Karte" />
          </FieldWrap>

          <FieldWrap label="Vertragsbeginn" hint="Optionaler Start des Vertrags oder Abos. Dient nur als Referenz und ändert die Berechnung nicht.">
            <input type="date" value={item.contract_start_date ?? ""} onChange={(e) => setItem((p) => p ? { ...p, contract_start_date: e.target.value } : p)} style={styles.input} />
          </FieldWrap>

          <FieldWrap label="Vertragsende" hint="Optionales Enddatum, falls der Vertrag befristet ist oder bereits gekündigt wurde.">
            <input type="date" value={item.contract_end_date ?? ""} onChange={(e) => setItem((p) => p ? { ...p, contract_end_date: e.target.value } : p)} style={styles.input} />
          </FieldWrap>

          <FieldWrap label="Kündigungsfrist (Tage)" hint="Optional, damit sichtbar bleibt, wie lange vor dem Vertragsende gekündigt werden müsste.">
            <input type="number" min="0" step="1" value={item.cancellation_notice_days ?? ""} onChange={(e) => setItem((p) => p ? { ...p, cancellation_notice_days: e.target.value ? Number(e.target.value) : null } : p)} style={styles.input} placeholder="Kündigungsfrist (Tage)" />
          </FieldWrap>

          <FieldWrap label="Notizen" hint="Optional für Zusatzinfos wie Tarif, Familienrabatt oder Vertragsdetails.">
            <textarea value={item.notes ?? ""} onChange={(e) => setItem((p) => p ? { ...p, notes: e.target.value } : p)} style={{ ...styles.textarea, minHeight: 96 }} placeholder="Notizen" />
          </FieldWrap>

          {error ? <div style={styles.errorBox}>{error}</div> : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={styles.buttonPrimary} disabled={saving} onClick={save}>{saving ? "Speichere…" : "Änderungen speichern"}</button>
            <button style={styles.buttonDanger} disabled={saving} onClick={archive}>Deaktivieren</button>
          </div>
        </div>
      )}
    </Page>
  );
}
