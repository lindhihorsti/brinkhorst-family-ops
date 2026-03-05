"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Avatar,
  BottomNav,
  ConfirmModal,
  Modal,
  ProgressBar,
  Skeleton,
  ToastProvider,
  styles,
  useToast,
} from "../lib/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type Chore = {
  id: string;
  title: string;
  description: string;
  recurrence: "daily" | "weekly" | "monthly";
  assigned_to: string[];
  current_idx: number;
  points: number;
  is_active: boolean;
  completed_today: boolean;
};

type Member = {
  id: string;
  name: string;
  color: string;
  initials: string;
};

type ScoreEntry = {
  member_id: string;
  name: string;
  points: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#7c3aed";

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "täglich",
  weekly: "wöchentlich",
  monthly: "monatlich",
};

// ─── Inner page (needs toast context) ────────────────────────────────────────

function AufgabenInner() {
  const { toast } = useToast();

  const [chores, setChores] = useState<Chore[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [maxPoints, setMaxPoints] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Complete modal
  const [completeChore, setCompleteChore] = useState<Chore | null>(null);
  const [completing, setCompleting] = useState(false);

  // New chore modal
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRecurrence, setNewRecurrence] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [newPoints, setNewPoints] = useState(1);
  const [newSaving, setNewSaving] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ─── Load data ──────────────────────────────────────────────────────────────

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [choresRes, statsRes, familyRes, settingsRes] = await Promise.all([
        fetch("/api/chores"),
        fetch("/api/chores/stats"),
        fetch("/api/family"),
        fetch("/api/chores/settings"),
      ]);

      const [choresData, statsData, familyData, settingsData] = await Promise.all([
        choresRes.json(),
        statsRes.json(),
        familyRes.json(),
        settingsRes.json().catch(() => null),
      ]);

      if (!choresRes.ok || !choresData.ok) throw new Error(choresData.error ?? "Fehler beim Laden der Aufgaben");
      if (!statsRes.ok || !statsData.ok) throw new Error(statsData.error ?? "Fehler beim Laden der Punkte");
      if (!familyRes.ok || !familyData.ok) throw new Error(familyData.error ?? "Fehler beim Laden der Familie");

      setChores((choresData.chores ?? []).filter((c: Chore) => c.is_active));
      setScores(statsData.scores ?? []);
      setMembers(familyData.members ?? []);
      if (settingsData?.ok) setMaxPoints(settingsData.settings?.max_points ?? 3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const memberById = (id: string): Member | undefined => members.find((m) => m.id === id);

  const whoIsNext = (chore: Chore): Member | undefined => {
    const assignedId = chore.assigned_to[chore.current_idx];
    return memberById(assignedId);
  };

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleComplete = async (memberId: string) => {
    if (!completeChore) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/chores/${completeChore.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed_by: memberId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Fehler beim Erledigen");
      toast("Aufgabe erledigt!", "success");
      setCompleteChore(null);
      await loadAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Fehler", "error");
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/chores/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Fehler beim Löschen");
      toast("Aufgabe gelöscht", "success");
      await loadAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Fehler", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateChore = async () => {
    if (!newTitle.trim()) {
      setNewError("Titel ist erforderlich.");
      return;
    }
    setNewSaving(true);
    setNewError(null);
    try {
      const res = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          recurrence: newRecurrence,
          assigned_to: members.map((m) => m.id),
          points: newPoints,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.id) throw new Error(data?.error ?? "Fehler beim Erstellen");
      toast("Aufgabe erstellt!", "success");
      setNewOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewRecurrence("weekly");
      setNewPoints(1);
      await loadAll();
    } catch (e) {
      setNewError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setNewSaving(false);
    }
  };

  const maxScore = Math.max(...scores.map((s) => s.points), 1);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="section-aufgaben" style={styles.page}>
      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Aufgabe löschen"
        message="Aufgabe wirklich löschen?"
        confirmLabel="Löschen"
        dangerConfirm
        onConfirm={() => { if (confirmDeleteId) handleDelete(confirmDeleteId); }}
        onClose={() => setConfirmDeleteId(null)}
      />
      <div style={styles.container}>
        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, marginTop: 4 }}>
          <span style={{
            width: 104, height: 104, borderRadius: 28,
            background: "#7c3aed22",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 64,
          }}>✅</span>
        </div>
        {/* Header */}
        <div style={styles.headerRow}>
          <div>
            <h1 style={{ ...styles.title, color: ACCENT }}>Aufgaben</h1>
            <p style={styles.subtitle}>Haushaltsaufgaben der Familie</p>
          </div>
          <Link href="/" style={styles.button}>Home</Link>
        </div>

        {/* Error */}
        {error ? (
          <div style={{ ...styles.errorBox, marginBottom: 16 }}>
            {error}
            <div style={{ marginTop: 10 }}>
              <button onClick={loadAll} style={{ ...styles.button, fontSize: "var(--font-size-xs)" }}>
                Erneut versuchen
              </button>
            </div>
          </div>
        ) : null}

        {/* Scoreboard */}
        {scores.length > 0 ? (
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: "var(--font-size-lg)",
                fontWeight: 700,
                marginBottom: 14,
                color: "var(--fg)",
              }}
            >
              Monatliche Punkte
            </h2>
            <div style={{ display: "grid", gap: 14 }}>
              {scores
                .slice()
                .sort((a, b) => b.points - a.points)
                .map((entry, idx) => {
                  const member = memberById(entry.member_id);
                  return (
                    <div key={entry.member_id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          fontSize: "var(--font-size-sm)",
                          fontWeight: 700,
                          color: idx === 0 ? ACCENT : "var(--fg-muted)",
                          width: 18,
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                      {member ? (
                        <Avatar initials={member.initials} color={member.color} size={28} />
                      ) : null}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 5,
                          }}
                        >
                          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
                            {entry.name}
                          </span>
                          <span
                            style={{
                              fontSize: "var(--font-size-sm)",
                              fontWeight: 700,
                              color: idx === 0 ? ACCENT : "var(--fg-muted)",
                            }}
                          >
                            {entry.points} Pkt.
                          </span>
                        </div>
                        <ProgressBar value={entry.points} max={maxScore} />
                      </div>
                    </div>
                  );
                })}
            </div>
            <div style={{ height: 1, background: "var(--border)", margin: "20px 0 0 0" }} />
          </div>
        ) : null}

        {/* Chore list */}
        {loading ? (
          <div style={{ display: "grid", gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={styles.card}>
                <Skeleton height={20} width="60%" />
                <div style={{ marginTop: 10 }}>
                  <Skeleton height={14} width="40%" />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Skeleton height={14} width="80%" />
                </div>
              </div>
            ))}
          </div>
        ) : !error && chores.length === 0 ? (
          <div style={{ ...styles.cardSubtle, textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: "var(--font-size-md)", fontWeight: 700, marginBottom: 6 }}>
              Keine aktiven Aufgaben
            </div>
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--fg-muted)" }}>
              Lege eine neue Aufgabe an.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {chores.map((chore) => {
              const next = whoIsNext(chore);
              const borderColor = chore.completed_today ? "var(--success)" : ACCENT;
              return (
                <div
                  key={chore.id}
                  style={{
                    ...styles.card,
                    borderLeft: `4px solid ${borderColor}`,
                    paddingLeft: 14,
                  }}
                >
                  <div style={styles.rowBetween}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "var(--font-size-md)",
                            fontWeight: 700,
                            color: "var(--fg)",
                          }}
                        >
                          {chore.title}
                        </span>
                        {chore.completed_today ? (
                          <span
                            style={{
                              fontSize: "var(--font-size-xs)",
                              color: "var(--success)",
                              fontWeight: 700,
                            }}
                          >
                            Erledigt
                          </span>
                        ) : null}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Recurrence badge */}
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: "var(--radius-pill)",
                            border: `1px solid ${ACCENT}`,
                            padding: "2px 9px",
                            fontSize: "var(--font-size-xs)",
                            color: ACCENT,
                            background: "#f5f3ff",
                            fontWeight: 600,
                          }}
                        >
                          {RECURRENCE_LABELS[chore.recurrence] ?? chore.recurrence}
                        </span>

                        {/* Points badge */}
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: "var(--radius-pill)",
                            border: "1px solid var(--border)",
                            padding: "2px 9px",
                            fontSize: "var(--font-size-xs)",
                            color: "var(--fg-muted)",
                            fontWeight: 600,
                          }}
                        >
                          {chore.points} {chore.points === 1 ? "Punkt" : "Punkte"}
                        </span>
                      </div>

                      {/* Who's next */}
                      {next ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 10,
                          }}
                        >
                          <Avatar initials={next.initials} color={next.color} size={24} />
                          <span style={{ fontSize: "var(--font-size-sm)", color: "var(--fg-muted)" }}>
                            {next.name} ist dran
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 14,
                      justifyContent: "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => setConfirmDeleteId(chore.id)}
                      disabled={deletingId === chore.id}
                      style={{
                        ...styles.button,
                        fontSize: "var(--font-size-xs)",
                        color: "var(--danger)",
                        borderColor: "var(--danger)",
                        padding: "6px 12px",
                      }}
                    >
                      {deletingId === chore.id ? "Lösche…" : "Löschen"}
                    </button>

                    <button
                      onClick={() => setCompleteChore(chore)}
                      disabled={chore.completed_today}
                      style={{
                        ...styles.button,
                        fontSize: "var(--font-size-xs)",
                        color: chore.completed_today ? "var(--fg-muted)" : ACCENT,
                        borderColor: chore.completed_today ? "var(--border)" : ACCENT,
                        padding: "6px 12px",
                        fontWeight: 700,
                      }}
                    >
                      {chore.completed_today ? "Erledigt" : "Erledigt"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom padding for FAB */}
        <div style={{ height: 80 }} />
      </div>

      {/* FAB */}
      <div style={styles.fabWrap}>
        <button
          onClick={() => setNewOpen(true)}
          style={{
            ...styles.fab,
            background: ACCENT,
            borderColor: ACCENT,
            color: "#fff",
          }}
        >
          + Neue Aufgabe
        </button>
      </div>

      {/* Complete modal */}
      <Modal
        open={!!completeChore}
        title={`Wer hat "${completeChore?.title ?? ""}" erledigt?`}
        onClose={() => !completing && setCompleteChore(null)}
      >
        {members.length === 0 ? (
          <div style={styles.col}>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--fg-muted)", margin: 0 }}>
              Noch keine Familienmitglieder angelegt. Füge sie zuerst in den Einstellungen hinzu.
            </p>
            <Link
              href="/einstellungen/familie"
              style={{ ...styles.buttonPrimary, textAlign: "center" }}
              onClick={() => setCompleteChore(null)}
            >
              Zu den Einstellungen
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => handleComplete(member.id)}
                disabled={completing}
                style={{
                  ...styles.button,
                  width: "100%",
                  justifyContent: "flex-start",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--font-size-md)",
                }}
              >
                <Avatar initials={member.initials} color={member.color} size={32} />
                <span style={{ fontWeight: 600 }}>{member.name}</span>
              </button>
            ))}
            {completing ? (
              <div style={{ textAlign: "center", fontSize: "var(--font-size-sm)", color: "var(--fg-muted)", marginTop: 4 }}>
                Speichere…
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      {/* New chore modal */}
      <Modal
        open={newOpen}
        title="Neue Aufgabe"
        onClose={() => {
          if (newSaving) return;
          setNewOpen(false);
          setNewTitle("");
          setNewDesc("");
          setNewRecurrence("weekly");
          setNewPoints(1);
          setNewError(null);
        }}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                setNewOpen(false);
                setNewTitle("");
                setNewDesc("");
                setNewRecurrence("weekly");
                setNewPoints(1);
                setNewError(null);
              }}
              disabled={newSaving}
              style={{ ...styles.button, flex: 1 }}
            >
              Abbrechen
            </button>
            <button
              onClick={handleCreateChore}
              disabled={newSaving}
              style={{
                ...styles.buttonPrimary,
                flex: 1,
                background: ACCENT,
                borderColor: ACCENT,
              }}
            >
              {newSaving ? "Speichere…" : "Erstellen"}
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 14 }}>
          {newError ? <div style={styles.errorBox}>{newError}</div> : null}

          <div>
            <label style={styles.label} htmlFor="chore-title">
              Titel
            </label>
            <input
              id="chore-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="z.B. Geschirrspüler ausräumen"
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label} htmlFor="chore-desc">
              Beschreibung (optional)
            </label>
            <input
              id="chore-desc"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Weitere Details…"
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label} htmlFor="chore-recurrence">
              Häufigkeit
            </label>
            <select
              id="chore-recurrence"
              value={newRecurrence}
              onChange={(e) =>
                setNewRecurrence(e.target.value as "daily" | "weekly" | "monthly")
              }
              style={styles.input}
            >
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
            </select>
          </div>

          <div>
            <label style={styles.label} htmlFor="chore-points">
              Punkte
            </label>
            <select
              id="chore-points"
              value={newPoints}
              onChange={(e) => setNewPoints(Number(e.target.value))}
              style={styles.input}
            >
              {Array.from({ length: maxPoints }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>{p} {p === 1 ? "Punkt" : "Punkte"}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <BottomNav current="/aufgaben" />
    </div>
  );
}

// ─── Default export (wraps with ToastProvider) ────────────────────────────────

export default function AufgabenPage() {
  return (
    <ToastProvider>
      <AufgabenInner />
    </ToastProvider>
  );
}
