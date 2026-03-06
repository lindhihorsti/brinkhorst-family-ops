"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Expense, type BalanceResult } from "../lib/api";
import { BtnLink, ConfirmModal, Page, Skeleton, styles, ToastProvider, useToast } from "../lib/ui";

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = "var(--split-accent)";

const CATEGORY_ICONS: Record<string, string> = {
  Haushalt: "🏠",
  Essen: "🍕",
  Freizeit: "🎉",
  Transport: "🚗",
  Sonstiges: "💼",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return amount.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// ─── Inner page ──────────────────────────────────────────────────────────────

function SplitContent() {
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<BalanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [exp, bal] = await Promise.all([api.listExpenses(), api.getExpenseBalance()]);
      setExpenses(exp);
      setBalance(bal);
    } catch {
      addToast("Laden fehlgeschlagen", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteExpense(deleteTarget);
      addToast("Ausgabe gelöscht", "success");
      setDeleteTarget(null);
      await load();
    } catch {
      addToast("Löschen fehlgeschlagen", "error");
    } finally {
      setDeleting(false);
    }
  };

  const net = balance?.net_balances ?? {};
  const debts = balance?.debts ?? [];

  return (
    <Page
      title="Ausgaben & Split"
      subtitle="Wer hat was gezahlt · Salden"
      right={
        <div style={{ display: "flex", gap: 8 }}>
          <BtnLink href="/split/auswertung">Auswertung</BtnLink>
        </div>
      }
      navCurrent="/split"
    >
      {/* ── Salden ── */}
      {!loading && Object.keys(net).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Salden
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
            {Object.entries(net).map(([person, amount]) => {
              const positive = amount >= 0;
              return (
                <div key={person} style={{
                  ...styles.card,
                  textAlign: "center",
                  borderColor: positive ? "#bbf7d0" : "#fecaca",
                  background: positive ? "#f0fdf4" : "#fff5f5",
                }}>
                  <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 4 }}>{person}</div>
                  <div style={{
                    fontSize: 18, fontWeight: 800,
                    color: positive ? "#059669" : "#ef4444",
                  }}>
                    {positive ? "+" : ""}{fmt(amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Offene Schulden ── */}
      {!loading && debts.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Abrechnung
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {debts.map((d, i) => (
              <div key={i} style={{
                ...styles.card,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderColor: "#fde68a",
                background: "#fffbeb",
              }}>
                <span style={{ fontSize: 18 }}>💸</span>
                <div style={{ flex: 1, fontSize: 14 }}>
                  <strong>{d.from}</strong> schuldet <strong>{d.to}</strong>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#d97706" }}>
                  {fmt(d.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && debts.length === 0 && Object.keys(net).length > 0 && (
        <div style={{ ...styles.successBox, marginBottom: 16 }}>
          Alles ausgeglichen — keine offenen Schulden.
        </div>
      )}

      {/* ── Ausgaben-Liste ── */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Ausgaben
      </div>

      {loading && (
        <div style={{ display: "grid", gap: 10 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height={72} />)}
        </div>
      )}

      {!loading && expenses.length === 0 && (
        <div style={{ ...styles.card, textAlign: "center", padding: 32, color: "var(--fg-muted)" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Noch keine Ausgaben</div>
          <div style={{ fontSize: 13 }}>Erste Ausgabe erfassen und loslegen.</div>
        </div>
      )}

      {!loading && expenses.length > 0 && (
        <div style={{ display: "grid", gap: 10, paddingBottom: 80 }}>
          {expenses.map((exp) => {
            const share = exp.split_among.length > 0
              ? exp.amount / exp.split_among.length
              : exp.amount;
            return (
              <div key={exp.id} style={styles.card}>
                <div style={styles.rowBetween}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <span style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: "#f0fdf4",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {CATEGORY_ICONS[exp.category] ?? "💼"}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {exp.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>
                        {exp.paid_by} · {fmtDate(exp.date)}
                        {exp.split_among.length > 0 && ` · je ${fmt(share)}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: ACCENT }}>
                      {fmt(exp.amount)}
                    </div>
                    <button
                      onClick={() => setDeleteTarget(exp.id)}
                      style={{ ...styles.button, padding: "4px 8px", fontSize: 12 }}
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {exp.notes && (
                  <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                    {exp.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── FAB ── */}
      <div style={styles.fabWrap}>
        <Link href="/split/neu" style={{ ...styles.fab, display: "block", textAlign: "center", textDecoration: "none", color: "var(--bg)" }}>
          + Ausgabe erfassen
        </Link>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Ausgabe löschen?"
        message="Diese Ausgabe wird unwiderruflich gelöscht und die Salden werden neu berechnet."
        confirmLabel={deleting ? "Lösche…" : "Löschen"}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Page>
  );
}

export default function SplitPage() {
  return (
    <ToastProvider>
      <SplitContent />
    </ToastProvider>
  );
}
