"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BtnLink,
  Chip,
  ConfirmModal,
  Modal,
  Page,
  Skeleton,
  ToastProvider,
  styles,
  useToast,
} from "../lib/ui";

interface Birthday {
  id: string;
  name: string;
  birth_date: string;
  relation: string;
  gift_ideas: string[];
  notes: string;
  member_id: string | null;
  days_until: number;
  age_next: number;
  created_at: string;
}

interface BirthdaySettings {
  birthday_default_relation: string;
  birthday_upcoming_window_days: number;
}

const ACCENT = "#db2777";
const RELATIONS = ["Familie", "Freunde", "Arbeit"];
const DEFAULT_SETTINGS: BirthdaySettings = {
  birthday_default_relation: "Familie",
  birthday_upcoming_window_days: 7,
};
const GERMAN_MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}.${month}.`;
}

function cardBg(days: number): string {
  if (days === 0) return "#fff1f2";
  if (days <= 7) return "#fffbeb";
  return "var(--bg)";
}

function cardBorder(days: number): string {
  if (days === 0) return "#fda4af";
  if (days <= 7) return "#fcd34d";
  return "var(--border)";
}

function cardEmoji(days: number): string {
  if (days === 0) return "🎉";
  return "🎂";
}

function daysLabel(days: number): string {
  if (days === 0) return "Heute!";
  if (days === 1) return "Morgen!";
  return `in ${days} Tagen`;
}

function daysLabelColor(days: number): string {
  if (days === 0) return ACCENT;
  if (days <= 7) return "#b45309";
  return "var(--fg-muted)";
}

function birthMonthIndex(dateStr: string): number {
  return parseInt(dateStr.split("-")[1], 10) - 1;
}

function groupByMonth(birthdays: Birthday[]): Map<number, Birthday[]> {
  const map = new Map<number, Birthday[]>();
  for (const b of birthdays) {
    const m = birthMonthIndex(b.birth_date);
    if (!map.has(m)) map.set(m, []);
    map.get(m)!.push(b);
  }
  return map;
}

interface FormState {
  name: string;
  birth_date: string;
  relation: string;
  gift_ideas_text: string;
  notes: string;
}

function emptyForm(defaultRelation: string): FormState {
  return { name: "", birth_date: "", relation: defaultRelation, gift_ideas_text: "", notes: "" };
}

function birthdayToForm(b: Birthday): FormState {
  return {
    name: b.name,
    birth_date: b.birth_date,
    relation: b.relation,
    gift_ideas_text: b.gift_ideas.join("\n"),
    notes: b.notes ?? "",
  };
}

function BirthdayCard({
  b,
  onEdit,
  onDelete,
}: {
  b: Birthday;
  onEdit: (b: Birthday) => void;
  onDelete: (b: Birthday) => void;
}) {
  const [giftsOpen, setGiftsOpen] = useState(false);

  return (
    <div
      style={{
        ...styles.card,
        background: cardBg(b.days_until),
        borderColor: cardBorder(b.days_until),
        marginBottom: 10,
      }}
    >
      <div style={styles.rowBetween}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 22 }}>{cardEmoji(b.days_until)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "var(--font-size-md)", fontWeight: 800, lineHeight: 1.2 }}>{b.name}</div>
            <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Chip text={b.relation} />
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--fg-muted)" }}>{formatDate(b.birth_date)}</span>
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--fg-muted)" }}>wird {b.age_next}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: 700,
              color: daysLabelColor(b.days_until),
              whiteSpace: "nowrap",
            }}
          >
            {daysLabel(b.days_until)}
          </span>
          <button
            onClick={() => onEdit(b)}
            style={{ ...styles.button, padding: "4px 8px", fontSize: 14, border: "none", background: "transparent" }}
            title="Bearbeiten"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(b)}
            style={{ ...styles.button, padding: "4px 8px", fontSize: 14, border: "none", background: "transparent" }}
            title="Löschen"
          >
            🗑️
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <Link
          href={`/geburtstage/geschenkideen?birthday_id=${b.id}`}
          style={{
            ...styles.button,
            color: ACCENT,
            borderColor: ACCENT,
            textDecoration: "none",
          }}
        >
          🎁 Ideen finden
        </Link>
        {b.gift_ideas.length > 0 ? (
          <button
            onClick={() => setGiftsOpen((o) => !o)}
            style={{
              ...styles.button,
              color: ACCENT,
              borderColor: ACCENT,
              background: "transparent",
            }}
          >
            {giftsOpen ? "Ideen verbergen" : `Geschenkideen (${b.gift_ideas.length})`}
          </button>
        ) : null}
      </div>

      {giftsOpen ? (
        <ul
          style={{
            margin: "10px 0 0 0",
            paddingLeft: 18,
            fontSize: "var(--font-size-sm)",
            color: "var(--fg-muted)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {b.gift_ideas.map((idea, i) => (
            <li key={i}>{idea}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function BirthdayFormModal({
  open,
  editTarget,
  defaultRelation,
  onClose,
  onSaved,
}: {
  open: boolean;
  editTarget: Birthday | null;
  defaultRelation: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm(defaultRelation));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(editTarget ? birthdayToForm(editTarget) : emptyForm(defaultRelation));
      setErr(null);
    }
  }, [open, editTarget, defaultRelation]);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.birth_date) {
      setErr("Name und Geburtsdatum sind erforderlich.");
      return;
    }
    setSaving(true);
    setErr(null);
    const payload = {
      name: form.name.trim(),
      birth_date: form.birth_date,
      relation: form.relation,
      gift_ideas: form.gift_ideas_text.split("\n").map((l) => l.trim()).filter(Boolean),
      notes: form.notes.trim(),
    };
    try {
      const res = editTarget
        ? await fetch(`/api/birthdays/${editTarget.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/birthdays", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErr(data?.error ?? data?.detail ?? "Speichern fehlgeschlagen.");
        return;
      }
      toast(editTarget ? "Geburtstag aktualisiert." : "Geburtstag gespeichert.", "success");
      onSaved();
      onClose();
    } catch {
      setErr("Netzwerkfehler.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={editTarget ? "Geburtstag bearbeiten" : "Geburtstag hinzufügen"}
      onClose={onClose}
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...styles.button, flex: 1 }}>
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...styles.buttonPrimary, flex: 1, background: ACCENT, borderColor: ACCENT }}
          >
            {saving ? "Speichere…" : "Speichern"}
          </button>
        </div>
      }
    >
      <div style={{ display: "grid", gap: 14 }}>
        {err ? <div style={styles.errorBox}>{err}</div> : null}
        <div>
          <label style={styles.label}>Name</label>
          <input value={form.name} onChange={set("name")} placeholder="z.B. Oma Erika" style={styles.input} />
        </div>
        <div>
          <label style={styles.label}>Geburtsdatum</label>
          <input type="date" value={form.birth_date} onChange={set("birth_date")} style={styles.input} />
        </div>
        <div>
          <label style={styles.label}>Relation</label>
          <select value={form.relation} onChange={set("relation")} style={styles.select}>
            {RELATIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={styles.label}>Geschenkideen (eine pro Zeile)</label>
          <textarea value={form.gift_ideas_text} onChange={set("gift_ideas_text")} placeholder={"Bücher\nSchokolade\n…"} style={styles.textarea} rows={4} />
        </div>
        <div>
          <label style={styles.label}>Notizen</label>
          <textarea value={form.notes} onChange={set("notes")} placeholder="Optionale Notizen…" style={styles.textarea} rows={2} />
        </div>
      </div>
    </Modal>
  );
}

function BirthdayListInner() {
  const { toast } = useToast();
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [settings, setSettings] = useState<BirthdaySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Birthday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Birthday | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    Promise.all([
      fetch("/api/birthdays", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/birthdays/settings", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ settings: DEFAULT_SETTINGS })),
    ])
      .then(([birthdayData, settingsData]) => {
        if (cancelled) return;
        if (birthdayData.ok) setBirthdays(birthdayData.birthdays ?? []);
        else setErr(birthdayData.error ?? "Fehler beim Laden.");
        if (settingsData?.settings) setSettings({ ...DEFAULT_SETTINGS, ...settingsData.settings });
      })
      .catch(() => {
        if (!cancelled) setErr("Netzwerkfehler.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = () => setTick((t) => t + 1);
  const openAdd = () => {
    setEditTarget(null);
    setFormOpen(true);
  };
  const openEdit = (b: Birthday) => {
    setEditTarget(b);
    setFormOpen(true);
  };
  const confirmDelete = (b: Birthday) => setDeleteTarget(b);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/birthdays/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast(`${deleteTarget.name} gelöscht.`, "success");
        refresh();
      } else {
        toast("Löschen fehlgeschlagen.", "error");
      }
    } catch {
      toast("Netzwerkfehler.", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const upcoming = birthdays.filter((b) => b.days_until <= settings.birthday_upcoming_window_days);
  const sorted = [...birthdays].sort((a, b) => a.days_until - b.days_until);
  const grouped = groupByMonth(sorted);
  const monthKeys = Array.from(grouped.keys()).sort((a, b) => {
    const today = new Date().getMonth();
    return ((a - today + 12) % 12) - ((b - today + 12) % 12);
  });

  return (
    <>
      <Page
        title="Geburtstage"
        subtitle="Personen pflegen und Geschenkideen vorbereiten"
        right={<BtnLink href="/geburtstage">Übersicht</BtnLink>}
        navCurrent="/geburtstage"
        icon="🎂"
        iconAccent="#db2777"
      >
        {!loading && upcoming.length > 0 ? (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: "var(--font-size-md)", fontWeight: 700, marginBottom: 12, color: ACCENT }}>
              Heute &amp; die nächsten {settings.birthday_upcoming_window_days} Tage
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              {upcoming.map((b) => (
                <div
                  key={b.id}
                  style={{
                    border: `2px solid ${cardBorder(b.days_until)}`,
                    borderRadius: "var(--radius-lg)",
                    padding: 18,
                    background: cardBg(b.days_until),
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <span style={{ fontSize: 36 }}>{cardEmoji(b.days_until)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 800 }}>{b.name}</div>
                    <div style={{ fontSize: "var(--font-size-sm)", color: daysLabelColor(b.days_until), fontWeight: 700, marginTop: 2 }}>
                      {daysLabel(b.days_until)} · wird {b.age_next}
                    </div>
                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--fg-muted)", marginTop: 2 }}>
                      {formatDate(b.birth_date)} · {b.relation}
                    </div>
                  </div>
                  <Link href={`/geburtstage/geschenkideen?birthday_id=${b.id}`} style={{ ...styles.button, textDecoration: "none", color: ACCENT, borderColor: ACCENT }}>
                    🎁
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {err ? <div style={{ ...styles.errorBox, marginBottom: 16 }}>{err}</div> : null}

        {loading ? (
          <div style={{ display: "grid", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={styles.card}>
                <Skeleton height={20} width="60%" />
                <div style={{ marginTop: 8 }}>
                  <Skeleton height={14} width="40%" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && !err && sorted.length === 0 ? (
          <div style={styles.card}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Keine Geburtstage</div>
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--fg-muted)" }}>Füge den ersten Geburtstag hinzu.</div>
          </div>
        ) : null}

        {!loading && monthKeys.map((monthIdx) => (
          <div key={monthIdx} style={{ marginBottom: 20 }}>
            <h2
              style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: 700,
                color: "var(--fg-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 10,
              }}
            >
              {GERMAN_MONTHS[monthIdx]}
            </h2>
            {(grouped.get(monthIdx) || []).map((b) => (
              <BirthdayCard key={b.id} b={b} onEdit={openEdit} onDelete={confirmDelete} />
            ))}
          </div>
        ))}

        <div style={{ height: 80 }} />
      </Page>

      <div style={styles.fabWrap}>
        <button onClick={openAdd} style={{ ...styles.fab, background: ACCENT, borderColor: ACCENT }}>
          + Geburtstag
        </button>
      </div>

      <BirthdayFormModal
        open={formOpen}
        editTarget={editTarget}
        defaultRelation={settings.birthday_default_relation}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Geburtstag löschen"
        message={deleteTarget ? `"${deleteTarget.name}" wirklich löschen?` : ""}
        confirmLabel={deleting ? "Lösche…" : "Löschen"}
        dangerConfirm
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

export function BirthdayListContent() {
  return (
    <ToastProvider>
      <BirthdayListInner />
    </ToastProvider>
  );
}
