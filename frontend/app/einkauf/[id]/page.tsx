"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, type ShoppingList, type ShoppingListItem } from "../../lib/api";
import { BtnLink, ConfirmModal, Page, styles, ToastProvider, useToast } from "../../lib/ui";
import { estimateCurrencyLabel, formatEstimateTotal } from "../currency.mjs";
import { categoryGroups, pantryGroups, recipeGroups, shoppingTextOutput, splitShoppingItems } from "../format.mjs";

type RecipeGroup = {
  title: string | null;
  items: ShoppingListItem[];
};

type PantryGroup = {
  title: string | null;
  items: ShoppingListItem[];
  pantry_name?: string | null;
  pantry_uncertain?: boolean;
  count?: number;
};

const pantryActionButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  minWidth: 30,
  minHeight: 30,
  boxSizing: "border-box",
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1,
  flexShrink: 0,
  borderWidth: 1,
  borderStyle: "solid",
};

const pantryAddButtonStyle: React.CSSProperties = {
  ...pantryActionButtonStyle,
  background: "var(--einkauf-accent)",
  color: "var(--bg)",
  borderColor: "var(--einkauf-accent)",
};

const pantryRemoveButtonStyle: React.CSSProperties = {
  ...pantryActionButtonStyle,
  background: "var(--bg)",
  color: "var(--fg)",
  borderColor: "var(--border)",
};

function EinkaufDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const id = String(params.id);
  const [item, setItem] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItem(await api.getShoppingList(id));
    } catch {
      toast("Liste konnte nicht geladen werden", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const manualAndRecipe = useMemo(
    () => splitShoppingItems(item?.items ?? []) as { manual: ShoppingListItem[]; recipe: ShoppingListItem[]; pantry: ShoppingListItem[] },
    [item]
  );
  const recipeSections = useMemo(
    () => recipeGroups(manualAndRecipe.recipe) as RecipeGroup[],
    [manualAndRecipe.recipe]
  );
  const recipeCategorySections = useMemo(
    () => categoryGroups(manualAndRecipe.recipe) as RecipeGroup[],
    [manualAndRecipe.recipe]
  );
  const pantrySections = useMemo(
    () => pantryGroups(manualAndRecipe.pantry, item?.import_mode === "ai_consolidated") as PantryGroup[],
    [manualAndRecipe.pantry, item?.import_mode]
  );
  const hasRecipeCategories = useMemo(
    () => manualAndRecipe.recipe.some((shoppingItem) => shoppingItem.category),
    [manualAndRecipe.recipe]
  );

  const updateViewMode = async (viewMode: "checklist" | "text") => {
    if (!item) return;
    setBusy("view");
    try {
      const res = await api.updateShoppingList(item.id, { view_mode: viewMode });
      setItem(res.item);
    } catch {
      toast("Ansicht konnte nicht geändert werden", "error");
    } finally {
      setBusy(null);
    }
  };

  const updateImportMode = async (importMode: "ai_consolidated" | "per_recipe") => {
    if (!item) return;
    setBusy("import-mode");
    try {
      const res = await api.updateShoppingList(item.id, { import_mode: importMode });
      setItem(res.item);
    } catch {
      toast("Importmodus konnte nicht geändert werden", "error");
    } finally {
      setBusy(null);
    }
  };

  const updateEstimateCurrency = async (estimateCurrency: "chf" | "eur") => {
    if (!item) return;
    setBusy("estimate-currency");
    try {
      const res = await api.updateShoppingList(item.id, { estimate_currency: estimateCurrency });
      setItem(res.item);
    } catch {
      toast("Währung konnte nicht geändert werden", "error");
    } finally {
      setBusy(null);
    }
  };

  const addManual = async () => {
    if (!item || !manualInput.trim()) return;
    setBusy("add");
    try {
      const res = await api.addShoppingListItem(item.id, manualInput.trim());
      setItem(res.item);
      setManualInput("");
    } catch {
      toast("Eintrag konnte nicht hinzugefügt werden", "error");
    } finally {
      setBusy(null);
    }
  };

  const toggleChecked = async (shoppingItem: ShoppingListItem) => {
    if (!item) return;
    try {
      const res = await api.updateShoppingListItem(item.id, shoppingItem.id, { checked: !shoppingItem.checked });
      setItem(res.item);
    } catch {
      toast("Status konnte nicht geändert werden", "error");
    }
  };

  const deleteItem = async (shoppingItem: ShoppingListItem) => {
    if (!item) return;
    try {
      const res = await api.deleteShoppingListItem(item.id, shoppingItem.id);
      setItem(res.item);
    } catch {
      toast("Eintrag konnte nicht entfernt werden", "error");
    }
  };

  const movePantryToBuy = async (shoppingItem: ShoppingListItem) => {
    if (!item) return;
    try {
      const res = await api.updateShoppingListItem(item.id, shoppingItem.id, { source: "recipe" });
      setItem(res.item);
      toast("Eintrag wird jetzt eingekauft", "success");
    } catch {
      toast("Eintrag konnte nicht übernommen werden", "error");
    }
  };

  const movePantryGroupToBuy = async (group: PantryGroup) => {
    if (!item) return;
    setBusy("pantry-buy");
    try {
      let latest: ShoppingList | null = item;
      if (item.import_mode === "ai_consolidated" && group.items.length > 0) {
        const first = group.items[0];
        const groupLabel = group.pantry_name || group.title || first.content;
        const groupedContent = group.items.length > 1 ? `${group.items.length} ${groupLabel}` : String(groupLabel);
        const firstRes = await api.updateShoppingListItem(item.id, first.id, {
          source: "recipe",
          content: groupedContent,
        });
        latest = firstRes.item;
        for (const shoppingItem of group.items.slice(1)) {
          const res = await api.deleteShoppingListItem(item.id, shoppingItem.id);
          latest = res.item;
        }
      } else {
        for (const shoppingItem of group.items) {
          const res = await api.updateShoppingListItem(item.id, shoppingItem.id, { source: "recipe" });
          latest = res.item;
        }
      }
      if (latest) setItem(latest);
      toast("Einträge werden jetzt eingekauft", "success");
    } catch {
      toast("Einträge konnten nicht übernommen werden", "error");
    } finally {
      setBusy(null);
    }
  };

  const deletePantryGroup = async (group: PantryGroup) => {
    if (!item) return;
    setBusy("pantry-delete");
    try {
      let latest: ShoppingList | null = item;
      for (const shoppingItem of group.items) {
        const res = await api.deleteShoppingListItem(item.id, shoppingItem.id);
        latest = res.item;
      }
      if (latest) setItem(latest);
      toast("Einträge entfernt", "success");
    } catch {
      toast("Einträge konnten nicht gelöscht werden", "error");
    } finally {
      setBusy(null);
    }
  };

  const importWeekly = async () => {
    if (!item) return;
    setBusy("snapshot");
    try {
      const res = await api.snapshotShoppingListWeekly(item.id, item.import_mode);
      setItem(res.item);
      if (res.warning) toast(res.warning, "error");
    } catch {
      toast("Wochenplan konnte nicht übernommen werden", "error");
    } finally {
      setBusy(null);
    }
  };

  const estimate = async () => {
    if (!item) return;
    setBusy("estimate");
    try {
      const res = await api.estimateShoppingList(item.id);
      setItem(res.item);
      toast("Schätzung aktualisiert", "success");
    } catch {
      toast("Kostenschätzung fehlgeschlagen", "error");
    } finally {
      setBusy(null);
    }
  };

  const categorize = async () => {
    if (!item) return;
    setBusy("categorize");
    try {
      const res = await api.categorizeShoppingList(item.id);
      if (!res.ok || !res.item) {
        toast(res.error || "Kategorisierung fehlgeschlagen", "error");
        return;
      }
      setItem(res.item);
      toast("Rezept-Zutaten wurden kategorisiert", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kategorisierung fehlgeschlagen";
      toast(message, "error");
    } finally {
      setBusy(null);
    }
  };

  const removeList = async () => {
    if (!item) return;
    setBusy("delete");
    try {
      await api.deleteShoppingList(item.id);
      router.push("/einkauf");
    } catch {
      toast("Liste konnte nicht gelöscht werden", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Page
      title={item?.title ?? "Einkaufsliste"}
      subtitle={item ? `${item.manual_count} manuell · ${item.recipe_count} einkaufen · ${item.pantry_count} im Basisvorrat` : "Lade…"}
      icon="🛒"
      iconAccent="#0f766e"
      right={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {formatEstimateTotal(item) ? (
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--einkauf-accent)" }}>
              {formatEstimateTotal(item)}
            </span>
          ) : null}
          <BtnLink href="/einkauf">Zurück</BtnLink>
        </div>
      }
      navCurrent="/einkauf"
    >
      <ConfirmModal
        open={confirmDeleteOpen}
        title="Einkaufsliste löschen"
        message={item ? `Soll die Einkaufsliste "${item.title}" wirklich gelöscht werden?` : "Einkaufsliste wirklich löschen?"}
        confirmLabel="Löschen"
        dangerConfirm
        onConfirm={() => { void removeList(); }}
        onClose={() => setConfirmDeleteOpen(false)}
      />
      {loading || !item ? (
        <div style={{ color: "var(--fg-muted)" }}>Lade…</div>
      ) : (
        <>
          <div style={{ ...styles.card, marginBottom: 14 }}>
            <label style={styles.label}>Manuell hinzufügen</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={manualInput} onChange={(e) => setManualInput(e.target.value)} style={{ ...styles.input, flex: 1 }} placeholder="z. B. Waschmittel" />
              <button style={styles.buttonPrimary} disabled={busy === "add"} onClick={addManual}>
                +
              </button>
            </div>
          </div>

              {item.view_mode === "text" ? (
            <div style={{ ...styles.card, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5 }}>
              {shoppingTextOutput(item.items ?? [], item.import_mode) || "Liste ist leer."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14, paddingBottom: 20 }}>
              {manualAndRecipe.manual.length > 0 && (
                <div style={styles.card}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Manuell
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {manualAndRecipe.manual.map((shoppingItem) => (
                      <label key={shoppingItem.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input type="checkbox" checked={shoppingItem.checked} onChange={() => toggleChecked(shoppingItem)} />
                        <span style={{ flex: 1, textDecoration: shoppingItem.checked ? "line-through" : "none", opacity: shoppingItem.checked ? 0.65 : 1 }}>{shoppingItem.content}</span>
                        <button type="button" style={{ ...styles.button, padding: "4px 8px", fontSize: 12 }} onClick={() => deleteItem(shoppingItem)}>✕</button>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {manualAndRecipe.recipe.length > 0 && (
                <div style={styles.card}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Aus Rezepten
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {(hasRecipeCategories ? recipeCategorySections : recipeSections).map((group, idx) => (
                      <div key={`${group.title ?? "generic"}-${idx}`}>
                        {group.title ? <div style={{ fontWeight: 700, marginBottom: 6 }}>{group.title}</div> : null}
                        <div style={{ display: "grid", gap: 8 }}>
                          {group.items.map((shoppingItem) => (
                            <label key={shoppingItem.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <input type="checkbox" checked={shoppingItem.checked} onChange={() => toggleChecked(shoppingItem)} />
                              <span style={{ flex: 1, textDecoration: shoppingItem.checked ? "line-through" : "none", opacity: shoppingItem.checked ? 0.65 : 1 }}>{shoppingItem.content}</span>
                              <button type="button" style={{ ...styles.button, padding: "4px 8px", fontSize: 12 }} onClick={() => deleteItem(shoppingItem)}>✕</button>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {manualAndRecipe.pantry.length > 0 && (
                <div style={{ ...styles.card, borderColor: "color-mix(in srgb, var(--einkauf-accent) 30%, var(--border))", background: "color-mix(in srgb, var(--einkauf-accent) 6%, var(--bg))" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--einkauf-accent)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Im Basisvorrat erkannt
                  </div>
                  <p style={{ ...styles.small, marginBottom: 12 }}>
                    Diese Zutaten wurden beim Erstellen der Liste als vorhanden erkannt und deshalb nicht auf die Einkaufsliste gesetzt. Bitte kurz gegenchecken.
                  </p>
                  <div style={{ display: "grid", gap: 12 }}>
                    {pantrySections.map((group, idx) => (
                      <div key={`${group.title ?? "pantry"}-${idx}`}>
                        {group.title ? <div style={{ fontWeight: 700, marginBottom: 6 }}>{group.title}</div> : null}
                        <div style={{ display: "grid", gap: 8 }}>
                          {item.import_mode === "ai_consolidated" ? (
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <span style={{ marginTop: 2, fontSize: 16 }}>🧺</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>
                                  {group.count && group.count > 1 ? `${group.count} ${group.title}` : group.title}
                                </div>
                                <div style={{ ...styles.small, marginTop: 4 }}>
                                  {group.pantry_name ? `Als ${group.pantry_name} erkannt` : "Im Basisvorrat erkannt"}
                                  {group.pantry_uncertain ? " · bitte prüfen" : ""}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                                <button
                                  type="button"
                                  aria-label="Zur Einkaufsliste hinzufügen"
                                  title="Zur Einkaufsliste hinzufügen"
                                  style={pantryAddButtonStyle}
                                  disabled={busy === "pantry-buy" || busy === "pantry-delete"}
                                  onClick={() => movePantryGroupToBuy(group)}
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  aria-label="Aus Vorschlägen entfernen"
                                  title="Aus Vorschlägen entfernen"
                                  style={pantryRemoveButtonStyle}
                                  disabled={busy === "pantry-buy" || busy === "pantry-delete"}
                                  onClick={() => deletePantryGroup(group)}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            group.items.map((shoppingItem) => (
                              <div key={shoppingItem.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                <span style={{ marginTop: 2, fontSize: 16 }}>🧺</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 600 }}>{shoppingItem.content}</div>
                                  <div style={{ ...styles.small, marginTop: 4 }}>
                                    {shoppingItem.pantry_name ? `Als ${shoppingItem.pantry_name} erkannt` : "Im Basisvorrat erkannt"}
                                    {shoppingItem.pantry_uncertain ? " · bitte prüfen" : ""}
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                                  <button
                                    type="button"
                                    aria-label="Zur Einkaufsliste hinzufügen"
                                    title="Zur Einkaufsliste hinzufügen"
                                    style={pantryAddButtonStyle}
                                    onClick={() => movePantryToBuy(shoppingItem)}
                                  >
                                    +
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Aus Vorschlägen entfernen"
                                    title="Aus Vorschlägen entfernen"
                                    style={pantryRemoveButtonStyle}
                                    onClick={() => deleteItem(shoppingItem)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(item.items ?? []).length === 0 && (
                <div style={{ ...styles.card, textAlign: "center", color: "var(--fg-muted)" }}>
                  Liste ist leer.
                </div>
              )}
            </div>
          )}

          {item.estimated_total_text ? (
            <div style={{ ...styles.card, marginTop: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                AI-Schätzung
              </div>
              <div style={{ ...styles.cardSubtle, borderColor: "color-mix(in srgb, var(--einkauf-accent) 28%, var(--border))" }}>
                <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 4 }}>Geschätzte Gesamtkosten</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--einkauf-accent)" }}>{formatEstimateTotal(item)}</div>
                {item.estimated_total_note ? <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 8, whiteSpace: "pre-wrap" }}>{item.estimated_total_note}</div> : null}
              </div>
            </div>
          ) : null}

          <div style={{ ...styles.card, marginTop: 14, marginBottom: 14 }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={styles.label}>Optionen</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={item.view_mode === "checklist" ? styles.buttonPrimary : styles.button} disabled={busy === "view"} onClick={() => updateViewMode("checklist")}>Checkliste</button>
                  <button style={item.view_mode === "text" ? styles.buttonPrimary : styles.button} disabled={busy === "view"} onClick={() => updateViewMode("text")}>Text</button>
                </div>
              </div>

              <div>
                <label style={styles.label}>Wochenplan-Import</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <select value={item.import_mode} onChange={(e) => updateImportMode(e.target.value as "ai_consolidated" | "per_recipe")} style={{ ...styles.select, flex: 1, minWidth: 180 }}>
                    <option value="ai_consolidated">Konsolidiert mit AI</option>
                    <option value="per_recipe">Nach Rezept</option>
                  </select>
                  <button style={styles.button} disabled={busy === "snapshot" || busy === "import-mode"} onClick={importWeekly}>
                    {busy === "snapshot" ? "Importiere…" : item.recipe_count > 0 ? "Wochenplan aktualisieren" : "Wochenplan hinzufügen"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <select
                  value={item.estimate_currency}
                  onChange={(e) => updateEstimateCurrency(e.target.value as "chf" | "eur")}
                  disabled={busy === "estimate" || busy === "estimate-currency"}
                  aria-label="Währung für AI-Schätzung"
                  style={{ ...styles.select, minWidth: 180, flex: "0 0 auto" }}
                >
                  <option value="chf">{estimateCurrencyLabel("chf")} · Schweiz</option>
                  <option value="eur">{estimateCurrencyLabel("eur")} · Deutschland</option>
                </select>
                <button style={styles.button} disabled={busy === "estimate"} onClick={estimate}>
                  {busy === "estimate" ? "Schätze…" : "AI-Kostenschätzung"}
                </button>
                <button style={styles.button} disabled={busy === "categorize"} onClick={categorize}>
                  {busy === "categorize" ? "Sortiere…" : "AI sortieren"}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            style={{ ...styles.buttonDanger, width: "100%" }}
            disabled={busy === "delete"}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            Liste löschen
          </button>
        </>
      )}
    </Page>
  );
}

export default function EinkaufDetailPage() {
  return (
    <ToastProvider>
      <EinkaufDetailContent />
    </ToastProvider>
  );
}
