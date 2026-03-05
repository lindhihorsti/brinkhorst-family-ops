"use client";

import { useEffect, useState } from "react";
import {
  BottomNav,
  BtnLink,
  ConfirmModal,
  Modal,
  Page,
  ToastProvider,
  styles,
  useToast,
} from "../lib/ui";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tag = string;

type Category = { id: string; label: string; color: string };

interface Note {
  id: string;
  content: string;
  author_name: string;
  author_id: string;
  tag: Tag;
  expires_on: string | null;
  created_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = "#d97706";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "allgemein", label: "Allgemein", color: "#6b7280" },
  { id: "schule",    label: "Schule",    color: "#3b82f6" },
  { id: "einkauf",   label: "Einkauf",   color: "#10b981" },
  { id: "wichtig",   label: "Wichtig",   color: "#ef4444" },
  { id: "event",     label: "Event",     color: "#8b5cf6" },
];

function catColor(cats: Category[], id: string): string {
  return cats.find((c) => c.id === id)?.color ?? "#6b7280";
}
function catLabel(cats: Category[], id: string): string {
  return cats.find((c) => c.id === id)?.label ?? id;
}
function catBg(color: string): string {
  return color + "18";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffSec < 60) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Minute${diffMin !== 1 ? "n" : ""}`;
  if (diffH < 24) return `vor ${diffH} Stunde${diffH !== 1 ? "n" : ""}`;
  if (diffD < 7) return `vor ${diffD} Tag${diffD !== 1 ? "en" : ""}`;
  return new Date(dateStr).toLocaleDateString("de-DE");
}

// ─── Tag chip ────────────────────────────────────────────────────────────────

function TagChip({ tag, cats }: { tag: Tag; cats: Category[] }) {
  const color = catColor(cats, tag);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--radius-pill)",
        padding: "2px 9px",
        fontSize: "var(--font-size-xs)",
        fontWeight: 600,
        color,
        background: catBg(color),
        border: `1px solid ${color}33`,
      }}
    >
      {catLabel(cats, tag)}
    </span>
  );
}

// ─── Note card ───────────────────────────────────────────────────────────────

function NoteCard({ note, cats, onDelete }: { note: Note; cats: Category[]; onDelete: (id: string) => void }) {
  const color = catColor(cats, note.tag);
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 14px 12px",
        background: catBg(color),
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <p
          style={{
            margin: 0,
            fontSize: "var(--font-size-md)",
            lineHeight: 1.5,
            color: "var(--fg)",
            flex: 1,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {note.content}
        </p>
        <button
          onClick={() => onDelete(note.id)}
          aria-label="Notiz löschen"
          style={{
            ...styles.button,
            padding: "2px 7px",
            fontSize: 13,
            flexShrink: 0,
            color: "var(--fg-muted)",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <TagChip tag={note.tag} cats={cats} />
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--fg-muted)" }}>
          {note.author_name ? `${note.author_name} · ` : ""}
          {relativeTime(note.created_at)}
        </span>
      </div>
    </div>
  );
}

// ─── Inner page (needs toast context) ────────────────────────────────────────

function PinnwandInner() {
  const { toast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<Tag | null>(null);

  // New note form
  const [formOpen, setFormOpen] = useState(false);
  const [formContent, setFormContent] = useState("");
  const [formTag, setFormTag] = useState<Tag>("allgemein");
  const [formAuthor, setFormAuthor] = useState("");
  const [formExpires, setFormExpires] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load notes + categories ──

  const loadNotes = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [notesRes, catsRes] = await Promise.all([
        fetch("/api/pinboard"),
        fetch("/api/pinboard/categories"),
      ]);
      const [notesData, catsData] = await Promise.all([
        notesRes.json().catch(() => null),
        catsRes.json().catch(() => null),
      ]);
      if (!notesRes.ok || !notesData?.ok) {
        setErr(notesData?.error ?? "Fehler beim Laden");
        return;
      }
      setNotes(notesData.notes ?? []);
      if (catsRes.ok && catsData?.ok) setCategories(catsData.categories ?? DEFAULT_CATEGORIES);
    } catch {
      setErr("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  // ── Filter ──

  const visible = filterTag ? notes.filter((n) => n.tag === filterTag) : notes;

  // ── New note ──

  const openForm = () => {
    setFormContent("");
    setFormTag("allgemein");
    setFormAuthor("");
    setFormExpires("");
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError(null);
  };

  const saveNote = async () => {
    if (!formContent.trim()) {
      setFormError("Inhalt darf nicht leer sein.");
      return;
    }
    setFormSaving(true);
    setFormError(null);
    try {
      const body: Record<string, string> = {
        content: formContent.trim(),
        tag: formTag,
      };
      if (formAuthor.trim()) body.author_name = formAuthor.trim();
      if (formExpires) body.expires_on = formExpires;

      const res = await fetch("/api/pinboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setFormError(data?.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      closeForm();
      toast("Notiz gespeichert", "success");
      await loadNotes();
    } catch {
      setFormError("Netzwerkfehler");
    } finally {
      setFormSaving(false);
    }
  };

  // ── Delete ──

  const confirmDelete = (id: string) => setDeleteId(id);

  const doDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pinboard/${deleteId}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast(data?.error ?? "Löschen fehlgeschlagen", "error");
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== deleteId));
      toast("Notiz gelöscht", "success");
    } catch {
      toast("Netzwerkfehler", "error");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  // ── Render ──

  return (
    <>
      <Page
        title="Pinnwand"
        subtitle="Notizen & Nachrichten für die Familie"
        right={<BtnLink href="/">Home</BtnLink>}
        navCurrent="/pinnwand"
        icon="📌"
        iconAccent="#d97706"
      >
        {/* Filter chips */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <span
            onClick={() => setFilterTag(null)}
            role="button"
            style={
              filterTag === null
                ? { ...styles.chipActive, cursor: "pointer" }
                : { ...styles.chip, cursor: "pointer" }
            }
          >
            Alle
          </span>
          {categories.map((cat) => {
            const active = filterTag === cat.id;
            return (
              <span
                key={cat.id}
                onClick={() => setFilterTag(active ? null : cat.id)}
                role="button"
                style={
                  active
                    ? {
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: "var(--radius-pill)",
                        padding: "4px 10px",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 700,
                        color: cat.color,
                        background: catBg(cat.color),
                        border: `2px solid ${cat.color}`,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }
                    : {
                        ...styles.chip,
                        cursor: "pointer",
                      }
                }
              >
                {cat.label}
              </span>
            );
          })}
        </div>

        {/* Error */}
        {err ? (
          <div style={{ ...styles.errorBox, marginBottom: 14 }}>{err}</div>
        ) : null}

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "32px 0", opacity: 0.6 }}>Lade…</div>
        ) : visible.length === 0 ? (
          <div style={{ ...styles.card, textAlign: "center", padding: "32px 16px" }}>
            <div style={{ fontSize: "var(--font-size-md)", fontWeight: 700, marginBottom: 6 }}>
              Keine Notizen
            </div>
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--fg-muted)" }}>
              {filterTag ? "Kein Eintrag für diesen Filter." : "Noch keine Notizen vorhanden."}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12, paddingBottom: 80 }}>
            {visible.map((note) => (
              <NoteCard key={note.id} note={note} cats={categories} onDelete={confirmDelete} />
            ))}
          </div>
        )}

        {/* FAB */}
        <div style={styles.fabWrap}>
          <button
            onClick={openForm}
            style={{
              ...styles.fab,
              background: ACCENT,
              border: `1px solid ${ACCENT}`,
              color: "#fff",
            }}
          >
            + Neue Notiz
          </button>
        </div>
      </Page>

      {/* New note modal */}
      <Modal
        open={formOpen}
        title="Neue Notiz"
        onClose={closeForm}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={closeForm} style={{ ...styles.button, flex: 1 }}>
              Abbrechen
            </button>
            <button
              onClick={saveNote}
              disabled={formSaving}
              style={{
                ...styles.buttonPrimary,
                flex: 1,
                background: ACCENT,
                borderColor: ACCENT,
              }}
            >
              {formSaving ? "Speichere…" : "Speichern"}
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Content */}
          <div>
            <label style={styles.label}>Inhalt</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Was möchtest du mitteilen?"
              rows={4}
              style={{
                width: "100%",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px",
                fontSize: "var(--font-size-md)",
                outline: "none",
                color: "var(--fg)",
                background: "var(--bg)",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Tag selector */}
          <div>
            <label style={styles.label}>Kategorie</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  onClick={() => setFormTag(cat.id)}
                  role="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "var(--radius-pill)",
                    padding: "5px 12px",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: formTag === cat.id ? "#fff" : cat.color,
                    background: formTag === cat.id ? cat.color : catBg(cat.color),
                    border: `1px solid ${cat.color}`,
                    transition: "background 0.15s",
                  }}
                >
                  {cat.label}
                </span>
              ))}
            </div>
          </div>

          {/* Author */}
          <div>
            <label style={styles.label}>Name (optional)</label>
            <input
              value={formAuthor}
              onChange={(e) => setFormAuthor(e.target.value)}
              placeholder="z.B. Mama"
              style={{ ...styles.input, boxSizing: "border-box" }}
            />
          </div>

          {/* Expires */}
          <div>
            <label style={styles.label}>Ablaufdatum (optional)</label>
            <input
              type="date"
              value={formExpires}
              onChange={(e) => setFormExpires(e.target.value)}
              style={{ ...styles.input, boxSizing: "border-box" }}
            />
          </div>

          {/* Error */}
          {formError ? (
            <div style={styles.errorBox}>{formError}</div>
          ) : null}
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <ConfirmModal
        open={deleteId !== null}
        title="Notiz löschen"
        message="Soll diese Notiz wirklich gelöscht werden?"
        confirmLabel={deleting ? "Löschen…" : "Löschen"}
        dangerConfirm
        onConfirm={doDelete}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
}

// ─── Page export ─────────────────────────────────────────────────────────────

export default function PinnwandPage() {
  return (
    <ToastProvider>
      <PinnwandInner />
    </ToastProvider>
  );
}
