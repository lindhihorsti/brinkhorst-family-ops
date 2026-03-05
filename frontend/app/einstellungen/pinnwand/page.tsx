"use client";

import { useEffect, useState } from "react";
import { BtnLink, Page, styles } from "../../lib/ui";

type Category = { id: string; label: string; color: string };

const DEFAULT_CATEGORIES: Category[] = [
  { id: "allgemein", label: "Allgemein", color: "#6b7280" },
  { id: "schule",    label: "Schule",    color: "#3b82f6" },
  { id: "einkauf",   label: "Einkauf",   color: "#10b981" },
  { id: "wichtig",   label: "Wichtig",   color: "#ef4444" },
  { id: "event",     label: "Event",     color: "#8b5cf6" },
];

export default function PinnwandSettingsPage() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pinboard/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setCategories(d.categories ?? DEFAULT_CATEGORIES);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (updated: Category[]) => {
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/pinboard/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: updated }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Speichern fehlgeschlagen");
        return;
      }
      setCategories(data.categories);
      setMsg("Gespeichert");
      setTimeout(() => setMsg(null), 2000);
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    save(updated);
  };

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) { setAddError("Bezeichnung ist erforderlich."); return; }
    const id = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (categories.find((c) => c.id === id)) {
      setAddError("Kategorie mit dieser Bezeichnung existiert bereits.");
      return;
    }
    setAddError(null);
    const updated = [...categories, { id, label, color: newColor }];
    setCategories(updated);
    setNewLabel("");
    setNewColor("#3b82f6");
    save(updated);
  };

  return (
    <Page
      title="Pinnwand"
      subtitle="Kategorien"
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "32px 0", opacity: 0.6 }}>Lade…</div>
      ) : (
        <>
          {error ? <div style={{ ...styles.errorBox, marginBottom: 14 }}>{error}</div> : null}
          {msg ? (
            <div style={{ ...styles.successBox, marginBottom: 14 }}>{msg}</div>
          ) : null}

          {/* Existing categories */}
          <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  ...styles.card,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: cat.color,
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span style={{ flex: 1, fontSize: "var(--font-size-md)", fontWeight: 600 }}>
                  {cat.label}
                </span>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={saving}
                  style={{
                    ...styles.button,
                    fontSize: "var(--font-size-xs)",
                    color: "var(--danger)",
                    borderColor: "var(--danger)",
                    padding: "4px 10px",
                  }}
                >
                  Entfernen
                </button>
              </div>
            ))}
          </div>

          {/* Add new */}
          <div style={{ ...styles.card, display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: "var(--font-size-md)", fontWeight: 700 }}>
              Neue Kategorie
            </h3>
            {addError ? <div style={styles.errorBox}>{addError}</div> : null}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Bezeichnung"
                style={{ ...styles.input, flex: 1 }}
              />
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                style={{
                  width: 40,
                  height: 40,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: 2,
                  cursor: "pointer",
                  background: "none",
                  flexShrink: 0,
                }}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving}
              style={{ ...styles.buttonPrimary }}
            >
              {saving ? "Speichere…" : "Hinzufügen"}
            </button>
          </div>
        </>
      )}
    </Page>
  );
}
