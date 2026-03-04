"use client";

import { useEffect, useState } from "react";
import {
  BottomNav,
  ConfirmModal,
  Modal,
  Page,
  ToastProvider,
  styles,
  useToast,
} from "../lib/ui";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tag = "allgemein" | "schule" | "einkauf" | "wichtig" | "event";

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

const TAGS: Tag[] = ["allgemein", "schule", "einkauf", "wichtig", "event"];

const TAG_LABELS: Record<Tag, string> = {
  allgemein: "Allgemein",
  schule: "Schule",
  einkauf: "Einkauf",
  wichtig: "Wichtig",
  event: "Event",
};

const TAG_BG: Record<Tag, string> = {
  allgemein: "#f7f7f7",
  schule: "#eff6ff",
  einkauf: "#f0fdf4",
  wichtig: "#fff1f2",
  event: "#faf5ff",
};

const TAG_COLOR: Record<Tag, string> = {
  allgemein: "#6b7280",
  schule: "#2563eb",
  einkauf: "#16a34a",
  wichtig: "#dc2626",
  event: "#7c3aed",
};

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

function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "var(--radius-pill)",
        padding: "2px 9px",
        fontSize: "var(--font-size-xs)",
        fontWeight: 600,
        color: TAG_COLOR[tag],
        background: TAG_BG[tag],
        border: `1px solid ${TAG_COLOR[tag]}33`,
      }}
    >
      {TAG_LABELS[tag]}
    </span>
  );
}

// ─── Note card ───────────────────────────────────────────────────────────────

function NoteCard({ note, onDelete }: { note: Note; onDelete: (id: string) => void }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 14px 12px",
        background: TAG_BG[note.tag],
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
        <TagChip tag={note.tag} />
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

  // ── Load notes ──

  const loadNotes = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/pinboard");
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setErr(data?.error ?? "Fehler beim Laden");
        return;
      }
      setNotes(data.notes ?? []);
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
          {TAGS.map((tag) => (
            <span
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              role="button"
              style={
                filterTag === tag
                  ? {
                      display: "inline-flex",
                      alignItems: "center",
                      borderRadius: "var(--radius-pill)",
                      padding: "4px 10px",
                      fontSize: "var(--font-size-xs)",
                      fontWeight: 700,
                      color: TAG_COLOR[tag],
                      background: TAG_BG[tag],
                      border: `2px solid ${TAG_COLOR[tag]}`,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }
                  : {
                      ...styles.chip,
                      cursor: "pointer",
                    }
              }
            >
              {TAG_LABELS[tag]}
            </span>
          ))}
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
              <NoteCard key={note.id} note={note} onDelete={confirmDelete} />
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

      {/* BottomNav */}
      <BottomNav current="/pinnwand" />

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
              {TAGS.map((tag) => (
                <span
                  key={tag}
                  onClick={() => setFormTag(tag)}
                  role="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "var(--radius-pill)",
                    padding: "5px 12px",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: formTag === tag ? "#fff" : TAG_COLOR[tag],
                    background: formTag === tag ? TAG_COLOR[tag] : TAG_BG[tag],
                    border: `1px solid ${TAG_COLOR[tag]}`,
                    transition: "background 0.15s",
                  }}
                >
                  {TAG_LABELS[tag]}
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
