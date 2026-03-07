"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { BtnLink, Page, styles } from "../../lib/ui";

export default function NewShoppingListPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [manualText, setManualText] = useState("");
  const [viewMode, setViewMode] = useState<"checklist" | "text">("checklist");
  const [includeWeekly, setIncludeWeekly] = useState(true);
  const [importMode, setImportMode] = useState<"ai_consolidated" | "per_recipe">("ai_consolidated");
  const [openAfterCreate, setOpenAfterCreate] = useState(true);
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status}`);
        const d = await res.json();
        setViewMode(d.shop?.shopping_list_view_mode ?? "checklist");
        setIncludeWeekly(d.shop?.shopping_list_include_weekly_by_default ?? true);
        setImportMode(d.shop?.shop_output_mode ?? "ai_consolidated");
        setOpenAfterCreate(d.shop?.shopping_list_open_after_create ?? true);
      } catch {
        // fall back to local defaults
      } finally {
        setDefaultsLoaded(true);
      }
    };
    loadDefaults();
  }, []);

  const onSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Bitte gib der Einkaufsliste einen Titel.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await api.createShoppingList({
        title: trimmedTitle,
        notes,
        view_mode: viewMode,
        manual_items: manualText.split("\n").map((line) => line.trim()).filter(Boolean),
        include_weekly_items: includeWeekly,
        import_mode: importMode,
      });
      if (openAfterCreate) {
        router.push(`/einkauf/${res.item.id}`);
      } else {
        router.push("/einkauf");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      title="Neue Einkaufsliste"
      subtitle="Manuelle Einträge zuerst, Wochenplan als Snapshot optional"
      icon="🛒"
      iconAccent="#0f766e"
      right={<BtnLink href="/einkauf">Zurück</BtnLink>}
      navCurrent="/einkauf"
    >
      {!defaultsLoaded ? <p style={{ ...styles.small, marginBottom: 12 }}>Lade Standardwerte…</p> : null}
      <label style={styles.label}>Titel</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...styles.input, marginBottom: 12 }} placeholder="Wocheneinkauf" />

      <label style={styles.label}>Notizen</label>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...styles.textarea, minHeight: 80, marginBottom: 12 }} placeholder="Optional" />

      <label style={styles.label}>Manuelle Einträge</label>
      <textarea
        value={manualText}
        onChange={(e) => setManualText(e.target.value)}
        style={{ ...styles.textarea, minHeight: 120, marginBottom: 12 }}
        placeholder={"Je Zeile ein Eintrag\nMilch\nWindeln\nKatzenfutter"}
      />

      <label style={{ ...styles.row, marginBottom: 12 }}>
        <input type="checkbox" checked={includeWeekly} onChange={(e) => setIncludeWeekly(e.target.checked)} />
        <span>Aktuellen Rezept-Wochenplan als Snapshot hinzufügen</span>
      </label>

      <label style={styles.label}>Importmodus</label>
      <select value={importMode} onChange={(e) => setImportMode(e.target.value as "ai_consolidated" | "per_recipe")} style={{ ...styles.select, marginBottom: 12 }}>
        <option value="ai_consolidated">Konsolidiert mit AI</option>
        <option value="per_recipe">Nach Rezept aufgeteilt</option>
      </select>

      <label style={styles.label}>Darstellung</label>
      <select value={viewMode} onChange={(e) => setViewMode(e.target.value as "checklist" | "text")} style={{ ...styles.select, marginBottom: 16 }}>
        <option value="checklist">Checkliste</option>
        <option value="text">Text mit Aufzählung</option>
      </select>

      {error ? <div style={{ ...styles.errorBox, marginBottom: 12 }}>{error}</div> : null}

      <button style={styles.buttonPrimary} disabled={saving} onClick={onSave}>
        {saving ? "Speichere…" : "Liste anlegen"}
      </button>
    </Page>
  );
}
