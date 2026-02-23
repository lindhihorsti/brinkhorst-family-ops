"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type Recipe, type RecipeCreate, type RecipeImportDraft } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { BtnLink, Chip, Page, styles } from "../lib/ui";

export default function RecipesPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Recipe[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2>(1);
  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importDraft, setImportDraft] = useState<RecipeImportDraft | null>(null);
  const [importExistingId, setImportExistingId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [ingredientText, setIngredientText] = useState("");

  const query = useMemo(() => q.trim(), [q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await api.listRecipes(query || undefined);
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) setErr(getErrorMessage(e, "Fehler beim Laden"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, refreshTick]);

  const resetImport = () => {
    setImportStep(1);
    setImportUrl("");
    setImportError(null);
    setImportWarnings([]);
    setImportDraft(null);
    setImportExistingId(null);
    setImportLoading(false);
    setImportSaving(false);
    setTagInput("");
    setIngredientText("");
  };

  const openImport = () => {
    resetImport();
    setImportOpen(true);
  };

  const closeImport = () => {
    setImportOpen(false);
    resetImport();
  };

  const loadPreview = async () => {
    setImportLoading(true);
    setImportError(null);
    setImportExistingId(null);
    try {
      const res = await fetch("/api/recipes/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setImportError(data?.error ?? "Vorschau fehlgeschlagen.");
        setImportExistingId(data?.existing_recipe_id ?? null);
        return;
      }
      setImportWarnings(data.warnings ?? []);
      setImportDraft(data.draft);
      setTagInput((data.draft?.tags ?? []).join(", "));
      setIngredientText((data.draft?.ingredients ?? []).join("\n"));
      setImportStep(2);
    } catch (e) {
      setImportError(getErrorMessage(e, "Vorschau fehlgeschlagen."));
    } finally {
      setImportLoading(false);
    }
  };

  const updateTags = (value: string) => {
    setTagInput(value);
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const limited = tags.slice(0, 3);
    if (importDraft) {
      setImportDraft({ ...importDraft, tags: limited });
    }
  };

  const updateIngredients = (value: string) => {
    setIngredientText(value);
    const items = value
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    if (importDraft) {
      setImportDraft({ ...importDraft, ingredients: items });
    }
  };

  const saveImport = async () => {
    if (!importDraft) return;
    setImportSaving(true);
    setImportError(null);
    setImportExistingId(null);
    const payload: RecipeCreate = {
      title: importDraft.title,
      source_url: importDraft.source_url,
      notes: importDraft.notes,
      tags: importDraft.tags ?? [],
      ingredients: importDraft.ingredients ?? [],
      time_minutes: importDraft.time_minutes ?? null,
      difficulty: importDraft.difficulty ?? null,
    };
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const detail = data?.detail ?? data;
        setImportError(detail?.error ?? "Speichern fehlgeschlagen.");
        setImportExistingId(detail?.existing_recipe_id ?? null);
        return;
      }
      await res.json();
      setRefreshTick((v) => v + 1);
      closeImport();
    } catch (e) {
      setImportError(getErrorMessage(e, "Speichern fehlgeschlagen."));
    } finally {
      setImportSaving(false);
    }
  };

  const archiveRecipe = async (id: string) => {
    const confirmed = window.confirm(
      "Rezept wirklich archivieren?"
    );
    if (!confirmed) return;
    setArchiveError(null);
    setArchivingId(id);
    try {
      await api.archiveRecipe(id);
      setRefreshTick((v) => v + 1);
    } catch (e) {
      setArchiveError(getErrorMessage(e, "Archivieren fehlgeschlagen."));
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <Page
      title="Rezepte"
      subtitle=""
      right={<BtnLink href="/kueche">Back</BtnLink>}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Suchen… (Titel oder Tag)"
        style={{ ...styles.input, marginBottom: 14 }}
      />

      {err ? (
        <div style={{ ...styles.card, borderColor: "#fecaca", background: "#fff" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Fehler</div>
          <div style={{ fontSize: 13 }}>{err}</div>
        </div>
      ) : null}
      {archiveError ? (
        <div style={{ ...styles.card, borderColor: "#fecaca", background: "#fff", marginTop: 10 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Archivieren fehlgeschlagen</div>
          <div style={{ fontSize: 13 }}>{archiveError}</div>
        </div>
      ) : null}

      {loading ? (
        <div style={{ textAlign: "center", padding: "10px 0", opacity: 0.75 }}>Lade…</div>
      ) : items.length === 0 ? (
        <div style={styles.card}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Keine Rezepte gefunden.</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Lege eins neu an.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, paddingBottom: 74 }}>
          {items.map((r) => (
            <div key={r.id} style={styles.card}>
              <Link href={`/recipes/${r.id}`} style={{ textDecoration: "none", color: "#000", display: "block" }}>
                <div style={styles.rowBetween}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>
                      {r.title}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                      {r.time_minutes ? `${r.time_minutes} min` : "—"} ·{" "}
                      {r.difficulty ? `Diff ${r.difficulty}` : "—"} ·{" "}
                      {r.ingredients?.length ? `${r.ingredients.length} Zutaten` : "keine Zutaten"}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, opacity: 0.6 }}>›</div>
                </div>

                {r.tags?.length ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {r.tags.slice(0, 6).map((t) => (
                      <Chip key={t} text={t} />
                    ))}
                    {r.tags.length > 6 ? <Chip text={`+${r.tags.length - 6}`} /> : null}
                  </div>
                ) : null}
              </Link>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={() => archiveRecipe(r.id)}
                  style={styles.button}
                  disabled={archivingId === r.id}
                >
                  {archivingId === r.id ? "Archivieren…" : "Archivieren"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.fabWrap}>
        <div style={{ display: "grid", gap: 10 }}>
          <button
            onClick={openImport}
            style={{ ...styles.button, width: "100%", justifyContent: "center" }}
          >
            Rezept importieren (URL)
          </button>
          <Link
            href="/recipes/new"
            style={{ ...styles.buttonPrimary, width: "100%", justifyContent: "center" }}
          >
            + Neues Rezept
          </Link>
        </div>
      </div>

      {importOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 18,
            zIndex: 20,
          }}
        >
          <div style={{ ...styles.card, width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "auto" }}>
            <div style={{ ...styles.rowBetween, marginBottom: 12 }}>
              <div style={{ fontWeight: 800 }}>Rezept importieren</div>
              <button onClick={closeImport} style={styles.button}>
                X
              </button>
            </div>

            {importStep === 1 ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Schritt 1: URL eingeben</div>
                <input
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://..."
                  style={styles.input}
                />
                {importError ? (
                  <div style={{ ...styles.card, borderColor: "#fecaca", background: "#fff" }}>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Fehler</div>
                    <div style={{ fontSize: 13 }}>{importError}</div>
                    {importExistingId ? (
                      <div style={{ marginTop: 6 }}>
                        <Link href={`/recipes/${importExistingId}`} style={styles.button}>
                          Vorhandenes Rezept öffnen
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <button onClick={loadPreview} style={styles.buttonPrimary} disabled={importLoading}>
                  {importLoading ? "Erstelle Vorschau…" : "Vorschau erstellen"}
                </button>
              </div>
            ) : null}

            {importStep === 2 && importDraft ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Schritt 2: Vorschau prüfen</div>
                {importWarnings.length ? (
                  <div style={{ ...styles.card, borderColor: "#fde68a", background: "#fffbeb" }}>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Hinweise</div>
                    <div style={{ fontSize: 13 }}>{importWarnings.join(" ")}</div>
                  </div>
                ) : null}
                {importError ? (
                  <div style={{ ...styles.card, borderColor: "#fecaca", background: "#fff" }}>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Fehler</div>
                    <div style={{ fontSize: 13 }}>{importError}</div>
                    {importExistingId ? (
                      <div style={{ marginTop: 6 }}>
                        <Link href={`/recipes/${importExistingId}`} style={styles.button}>
                          Vorhandenes Rezept öffnen
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <label style={styles.small}>Titel</label>
                <input
                  value={importDraft.title}
                  onChange={(e) => setImportDraft({ ...importDraft, title: e.target.value })}
                  style={styles.input}
                />

                <label style={styles.small}>Quelle (URL)</label>
                <input
                  value={importDraft.source_url}
                  onChange={(e) => setImportDraft({ ...importDraft, source_url: e.target.value })}
                  style={styles.input}
                />

                <label style={styles.small}>Notizen (2-4 Sätze)</label>
                <textarea
                  value={importDraft.notes}
                  onChange={(e) => setImportDraft({ ...importDraft, notes: e.target.value })}
                  style={styles.textarea}
                  rows={4}
                />

                <label style={styles.small}>Tags (max 3, Komma-getrennt)</label>
                <input value={tagInput} onChange={(e) => updateTags(e.target.value)} style={styles.input} />
                <div style={styles.small}>{(importDraft.tags ?? []).length}/3 Tags</div>

                <label style={styles.small}>Zeit (Minuten)</label>
                <input
                  value={importDraft.time_minutes ?? ""}
                  onChange={(e) =>
                    setImportDraft({
                      ...importDraft,
                      time_minutes: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  type="number"
                  min={0}
                  style={styles.input}
                />

                <label style={styles.small}>Schwierigkeit</label>
                <select
                  value={importDraft.difficulty ?? 1}
                  onChange={(e) =>
                    setImportDraft({ ...importDraft, difficulty: Number(e.target.value) as 1 | 2 | 3 })
                  }
                  style={styles.input}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>

                <label style={styles.small}>Zutaten (eine pro Zeile)</label>
                <textarea
                  value={ingredientText}
                  onChange={(e) => updateIngredients(e.target.value)}
                  style={styles.textarea}
                  rows={6}
                />

                <div style={{ display: "grid", gap: 8 }}>
                  <button onClick={closeImport} style={styles.button}>
                    Abbrechen
                  </button>
                  <button onClick={saveImport} style={styles.buttonPrimary} disabled={importSaving}>
                    {importSaving ? "Speichere…" : "Speichern"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Page>
  );
}
