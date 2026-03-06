"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type FamilyMember } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { BtnLink, Page, styles } from "../../lib/ui";
import { createExpensePayload, defaultExpenseSelection } from "../expense-form.mjs";

const CATEGORIES = ["Haushalt", "Essen", "Freizeit", "Transport", "Sonstiges"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function NeuePage() {
  const router = useRouter();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");
  const [splitAmongIds, setSplitAmongIds] = useState<string[]>([]);
  const [category, setCategory] = useState("Sonstiges");
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.listFamilyMembers().then((ms) => {
      const active = ms.filter((m) => m.is_active);
      setMembers(active);
      const defaults = defaultExpenseSelection(active);
      setPaidById(defaults.paidById);
      setSplitAmongIds(defaults.splitAmongIds);
    }).catch(() => {});
  }, []);

  const toggleSplit = (memberId: string) => {
    setSplitAmongIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const onSave = async () => {
    setErr(null);
    if (!title.trim()) { setErr("Titel fehlt."); return; }
    const amountNum = parseFloat(amount.replace(",", "."));
    if (!amount || isNaN(amountNum) || amountNum <= 0) { setErr("Betrag ungültig."); return; }
    if (!paidById) { setErr("Wer hat gezahlt?"); return; }
    if (splitAmongIds.length === 0) { setErr("Mindestens eine Person für Aufteilung wählen."); return; }
    setSaving(true);
    try {
      await api.createExpense(createExpensePayload({
        members,
        title: title.trim(),
        amount: amountNum,
        paidById,
        splitAmongIds,
        category,
        date,
        notes: notes.trim() || null,
      }));
      router.push("/split");
    } catch (e) {
      setErr(getErrorMessage(e, "Fehler beim Speichern"));
    } finally {
      setSaving(false);
    }
  };

  const perPerson = (() => {
    const n = parseFloat(amount.replace(",", "."));
    if (!n || isNaN(n) || splitAmongIds.length === 0) return null;
    return (n / splitAmongIds.length).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  })();

  return (
    <Page
      title="Neue Ausgabe"
      subtitle="Ausgabe erfassen"
      icon="➕"
      iconAccent="#059669"
      right={<BtnLink href="/split">Zurück</BtnLink>}
      navCurrent="/split"
    >
      <div style={{ display: "grid", gap: 14, paddingBottom: 80 }}>
        {err && (
          <div style={styles.errorBox}>{err}</div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel (z.B. REWE Einkauf)"
          style={styles.input}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Betrag (z.B. 84.50)"
            inputMode="decimal"
            style={styles.input}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={styles.input}
          />
        </div>

        {perPerson && (
          <div style={{ fontSize: 13, color: "var(--fg-muted)", textAlign: "right" }}>
            je Person: <strong>{perPerson}</strong>
          </div>
        )}

        <div>
          <label style={styles.small}>Kategorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...styles.input, marginTop: 6 }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {members.length > 0 && (
          <>
            <div>
              <label style={styles.small}>Wer hat gezahlt?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaidById(m.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      border: `1.5px solid ${paidById === m.id ? "var(--split-accent)" : "var(--border)"}`,
                      background: paidById === m.id ? "#f0fdf4" : "var(--bg)",
                      fontWeight: paidById === m.id ? 700 : 400,
                      fontSize: 14,
                      color: paidById === m.id ? "var(--split-accent)" : "var(--fg)",
                      cursor: "pointer",
                    }}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={styles.small}>Aufgeteilt unter</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {members.map((m) => {
                  const selected = splitAmongIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleSplit(m.id)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: `1.5px solid ${selected ? "var(--split-accent)" : "var(--border)"}`,
                        background: selected ? "#f0fdf4" : "var(--bg)",
                        fontWeight: selected ? 700 : 400,
                        fontSize: 14,
                        color: selected ? "var(--split-accent)" : "var(--fg)",
                        cursor: "pointer",
                      }}
                    >
                      {selected ? "✓ " : ""}{m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {members.length === 0 && (
          <div style={styles.cardSubtle}>
            <div style={{ fontSize: 13 }}>
              Keine Familienmitglieder gefunden.{" "}
              <a href="/einstellungen/familie" style={{ color: "var(--split-accent)" }}>
                Jetzt anlegen →
              </a>
            </div>
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notizen (optional)"
          rows={2}
          style={styles.textarea}
        />
      </div>

      <div style={styles.fabWrap}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{ ...styles.fab, opacity: saving ? 0.7 : 1 }}
          type="button"
        >
          {saving ? "Speichere…" : "Speichern"}
        </button>
      </div>
    </Page>
  );
}
