"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type Recipe, type RecipeCreate, type RecipeImportDraft } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import { BtnLink, Chip, ConfirmModal, Page, StarRating, styles } from "../lib/ui";

export default function RecipesPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Recipe[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

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
  const collections = useMemo(() => {
    const names = items.map((r) => r.collection_name).filter((c): c is string => !!c);
    return Array.from(new Set(names));
  }, [items]);
  const filteredItems = useMemo(
    () => (collectionFilter ? items.filter((r) => r.collection_name === collectionFilter) : items),
    [items, collectionFilter]
  );

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
      right={<BtnLink href="/kueche">Küche</BtnLink>}
      navCurrent="/kueche"
      icon="📖"
      iconAccent="#e8673a"
    >
      <ConfirmModal
        open={confirmArchiveId !== null}
        title="Rezept archivieren"
        message="Rezept wirklich archivieren? Es wird nicht mehr im Wochenplan vorgeschlagen."
        confirmLabel="Archivieren"
        onConfirm={() => { if (confirmArchiveId) archiveRecipe(confirmArchiveId); }}
        onClose={() => setConfirmArchiveId(null)}
      />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Suchen… (Titel oder Tag)"
        style={{ ...styles.input, marginBottom: 10 }}
      />

      {collections.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <Chip text="Alle" active={!collectionFilter} onClick={() => setCollectionFilter(null)} />
          {collections.map((c) => (
            <Chip key={c} text={c} active={collectionFilter === c} onClick={() => setCollectionFilter(c === collectionFilter ? null : c)} />
          ))}
        </div>
      )}

      {err ? (
        <div style={styles.errorBox}>{err}</div>
      ) : null}
      {archiveError ? (
        <div style={{ ...styles.errorBox, marginTop: 10 }}>{archiveError}</div>
      ) : null}

      {loading ? (
        <div style={{ textAlign: "center", padding: "10px 0", color: "var(--fg-muted)" }}>Lade…</div>
      ) : filteredItems.length === 0 ? (
        <div style={styles.card}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Keine Rezepte gefunden.</div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>Lege eins neu an.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, paddingBottom: 74 }}>
          {filteredItems.map((r) => (
            <div key={r.id} style={styles.card}>
              <Link href={`/recipes/${r.id}`} style={{ textDecoration: "none", color: "var(--fg)", display: "block" }}>
                <div style={styles.rowBetween}>
                  {r.photo_url ? (
                    <div style={{ position: "relative", width: 60, height: 60, borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0 }}>
                      <Image src={r.photo_url} alt={r.title} fill style={{ objectFit: "cover" }} unoptimized />
                    </div>
                  ) : null}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>
                      {r.title}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--fg-muted)" }}>
                      {r.time_minutes ? `${r.time_minutes} min` : "—"} ·{" "}
                      {r.difficulty ? `Diff ${r.difficulty}` : "—"} ·{" "}
                      {r.ingredients?.length ? `${r.ingredients.length} Zutaten` : "keine Zutaten"}
                      {r.cooked_count ? ` · ${r.cooked_count}× gekocht` : ""}
                    </div>
                    {r.rating ? (
                      <div style={{ marginTop: 4 }}>
                        <StarRating value={r.rating} readonly />
                      </div>
                    ) : null}
                    {r.collection_name ? (
                      <div style={{ marginTop: 4 }}>
                        <span style={{ ...styles.chip, background: "var(--kueche-accent)22", borderColor: "var(--kueche-accent)44", color: "var(--kueche-accent)" }}>
                          {r.collection_name}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div style={{ fontWeight: 800, color: "var(--fg-muted)" }}>›</div>
                </div>

                {r.tags?.length ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {r.tags.slice(0, 6).map((t) => (
                      <Chip key={t} text={t} />
                    ))}
                    {r.tags.length > 6 ? <Chip text={`+${r.tags.length - 6}`} /> : null}
                  </div>
                ) : null}
              </Link>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  onClick={() => setConfirmArchiveId(r.id)}
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
