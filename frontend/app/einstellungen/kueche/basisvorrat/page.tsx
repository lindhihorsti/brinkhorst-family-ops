"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "../../../lib/errors";
import { BtnLink, Modal, Page, styles } from "../../../lib/ui";

type PantryItem = { name: string; uncertain: boolean; aliases: string[] };
type PantrySuggestion = { pantry_name: string; uncertain: boolean; aliases: { alias: string; count: number; source: "heuristic" | "ai" }[] };

type SettingsData = {
  ok: boolean;
  pantry: { items: PantryItem[] };
};

const DEFAULT_PANTRY: PantryItem[] = [
  { name: "Salz", uncertain: false, aliases: [] },
  { name: "Pfeffer", uncertain: false, aliases: [] },
  { name: "Zucker", uncertain: false, aliases: [] },
  { name: "Mehl", uncertain: false, aliases: [] },
  { name: "Olivenöl", uncertain: false, aliases: ["Speiseöl", "Kochöl"] },
  { name: "Essig", uncertain: false, aliases: [] },
  { name: "Sojasauce", uncertain: false, aliases: [] },
  { name: "Senf", uncertain: false, aliases: [] },
  { name: "Tomatenmark", uncertain: false, aliases: [] },
  { name: "Brühe", uncertain: false, aliases: ["Bouillon"] },
  { name: "Reis", uncertain: false, aliases: [] },
  { name: "Pasta", uncertain: false, aliases: ["Nudeln"] },
  { name: "Paprikapulver", uncertain: false, aliases: [] },
  { name: "Curry", uncertain: false, aliases: [] },
  { name: "Chili", uncertain: false, aliases: [] },
  { name: "Oregano", uncertain: false, aliases: [] },
  { name: "Basilikum", uncertain: false, aliases: [] },
  { name: "Backpulver", uncertain: false, aliases: [] },
  { name: "Stärke", uncertain: false, aliases: ["Speisestärke"] },
  { name: "Knoblauch", uncertain: true, aliases: [] },
  { name: "Zwiebeln", uncertain: true, aliases: [] },
];

export default function BasisvorratSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [pantrySuggestions, setPantrySuggestions] = useState<PantrySuggestion[]>([]);
  const [commonPantryCandidates, setCommonPantryCandidates] = useState<{ name: string; count: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [aliasModalIndex, setAliasModalIndex] = useState<number | null>(null);
  const [aliasInput, setAliasInput] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [settingsRes, suggestionsRes] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/settings/pantry/suggestions", { cache: "no-store" }),
        ]);
        if (!settingsRes.ok) throw new Error(`${settingsRes.status}`);
        const d = (await settingsRes.json()) as SettingsData;
        const s = suggestionsRes.ok ? await suggestionsRes.json() : { suggestions: [], unmatched_common: [] };
        setPantryItems(d.pantry?.items ?? []);
        setPantrySuggestions(s.suggestions ?? []);
        setCommonPantryCandidates(s.unmatched_common ?? []);
      } catch (e) {
        setError(getErrorMessage(e, "Fehler beim Laden"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const pantryRes = await fetch("/api/settings/pantry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pantryItems }),
      });
      if (!pantryRes.ok) throw new Error(`${pantryRes.status}`);
      const d = (await pantryRes.json()) as SettingsData;
      setPantryItems(d.pantry?.items ?? pantryItems);
      setMsg("Gespeichert.");
    } catch (e) {
      setMsg(getErrorMessage(e, "Fehler"));
    } finally {
      setSaving(false);
    }
  };

  const small: React.CSSProperties = { fontSize: 12, color: "var(--fg-muted)", marginTop: 6 };

  const applySuggestedAlias = (pantryName: string, alias: string) => {
    setPantryItems((prev) =>
      prev.map((item) => {
        if (item.name !== pantryName) return item;
        if (item.aliases.includes(alias)) return item;
        return { ...item, aliases: [...item.aliases, alias] };
      })
    );
    setPantrySuggestions((prev) =>
      prev.map((group) =>
        group.pantry_name === pantryName
          ? { ...group, aliases: group.aliases.filter((entry) => entry.alias !== alias) }
          : group
      )
    );
  };

  const addCommonPantryCandidate = (name: string) => {
    if (pantryItems.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
    setPantryItems((prev) => [...prev, { name, uncertain: true, aliases: [] }]);
    setCommonPantryCandidates((prev) => prev.filter((item) => item.name !== name));
  };

  const openAliasModal = (idx: number) => {
    setAliasModalIndex(idx);
    setAliasInput("");
  };

  const addAliasToItem = () => {
    if (aliasModalIndex === null) return;
    const alias = aliasInput.trim();
    if (!alias) return;
    setPantryItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== aliasModalIndex) return item;
        if (item.aliases.some((entry) => entry.toLowerCase() === alias.toLowerCase())) return item;
        return { ...item, aliases: [...item.aliases, alias] };
      })
    );
    setAliasModalIndex(null);
    setAliasInput("");
  };

  return (
    <Page
      title="Basisvorrat"
      subtitle="Immer da, prüfen und Varianten aus euren Rezepten"
      right={<BtnLink href="/einstellungen/kueche">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      <Modal
        open={aliasModalIndex !== null}
        title="Variante hinzufügen"
        onClose={() => {
          setAliasModalIndex(null);
          setAliasInput("");
        }}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={{ ...styles.button, flex: 1 }} onClick={() => { setAliasModalIndex(null); setAliasInput(""); }}>
              Abbrechen
            </button>
            <button type="button" style={{ ...styles.buttonPrimary, flex: 1 }} onClick={addAliasToItem}>
              Speichern
            </button>
          </div>
        }
      >
        <label style={styles.label}>Zusätzliche Variante</label>
        <input
          style={styles.input}
          value={aliasInput}
          placeholder="z. B. Speiseöl"
          onChange={(e) => setAliasInput(e.target.value)}
        />
      </Modal>

      {loading && <p style={styles.small}>Lade…</p>}
      {error && <p style={{ ...styles.small, color: "var(--danger)" }}>{error}</p>}

      <div style={{ ...styles.card, marginBottom: 16 }}>
        <p style={{ fontWeight: 800, marginBottom: 6, margin: "0 0 6px" }}>Basisvorrat</p>
        <p style={{ ...small, marginTop: 0, marginBottom: 14 }}>
          Alles, was fast immer da ist, wird bei neuen Einkaufslisten automatisch erkannt. Dinge mit „Bitte prüfen“ erscheinen separat als Hinweis.
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {pantryItems.map((item, idx) => (
            <div key={idx} style={{ ...styles.cardSubtle, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  value={item.name}
                  placeholder="z. B. Salz"
                  onChange={(e) => setPantryItems((prev) => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))}
                />
                <button
                  type="button"
                  style={{ ...styles.buttonDanger, padding: "8px 10px", fontSize: 12 }}
                  onClick={() => setPantryItems((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Entfernen
                </button>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={styles.label}>Verfügbarkeit</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <button
                    type="button"
                    style={{ ...(item.uncertain ? styles.button : styles.buttonPrimary), padding: "10px 12px", fontSize: 13 }}
                    onClick={() => setPantryItems((prev) => prev.map((p, i) => i === idx ? { ...p, uncertain: false } : p))}
                  >
                    Immer da
                  </button>
                  <button
                    type="button"
                    style={{ ...(item.uncertain ? styles.buttonPrimary : styles.button), padding: "10px 12px", fontSize: 13 }}
                    onClick={() => setPantryItems((prev) => prev.map((p, i) => i === idx ? { ...p, uncertain: true } : p))}
                  >
                    Prüfen
                  </button>
                </div>
                <div style={small}>
                  {item.uncertain
                    ? "Erscheint separat in der Liste zum Gegenchecken."
                    : "Wird bei neuen Einkaufslisten automatisch ausgeblendet."}
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <label style={styles.label}>Zusätzliche Varianten</label>
                  <button type="button" style={{ ...styles.button, padding: "6px 10px", fontSize: 12 }} onClick={() => openAliasModal(idx)}>
                    + Variante
                  </button>
                </div>
                {item.aliases.length > 0 ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {item.aliases.map((alias) => (
                      <button
                        key={`remove-${alias}`}
                        type="button"
                        style={{ ...styles.button, padding: "6px 10px", fontSize: 12 }}
                        onClick={() =>
                          setPantryItems((prev) =>
                            prev.map((p, i) => i === idx ? { ...p, aliases: p.aliases.filter((entry) => entry !== alias) } : p)
                          )
                        }
                      >
                        {alias} ✕
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={small}>Noch keine zusätzlichen Varianten.</div>
                )}
              </div>

              {(pantrySuggestions.find((group) => group.pantry_name === item.name)?.aliases.length ?? 0) > 0 ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ ...small, marginTop: 0 }}>Erkannte Varianten aus euren Rezepten</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {pantrySuggestions.find((group) => group.pantry_name === item.name)?.aliases.map((entry) => (
                      <button
                        key={`${item.name}-${entry.alias}`}
                        type="button"
                        style={styles.button}
                        onClick={() => applySuggestedAlias(item.name, entry.alias)}
                      >
                        {entry.alias} {entry.count > 0 ? `· ${entry.count}x` : ""} {entry.source === "ai" ? "· AI" : ""}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <button style={styles.button} onClick={() => setPantryItems((prev) => [...prev, { name: "", uncertain: false, aliases: [] }])}>
            + Hinzufügen
          </button>
          <button style={styles.button} onClick={() => setPantryItems(DEFAULT_PANTRY)}>Zurücksetzen</button>
        </div>
      </div>

      {commonPantryCandidates.length > 0 ? (
        <div style={{ ...styles.card, marginBottom: 16 }}>
          <p style={{ fontWeight: 800, margin: "0 0 6px" }}>Häufige Zutaten aus euren Rezepten</p>
          <p style={{ ...small, marginTop: 0, marginBottom: 12 }}>
            Diese Zutaten tauchen oft auf, sind aber noch nicht im Basisvorrat. Du kannst sie mit einem Klick übernehmen.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {commonPantryCandidates.map((entry) => (
              <button key={entry.name} type="button" style={styles.button} onClick={() => addCommonPantryCandidate(entry.name)}>
                {entry.name} · {entry.count}x
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button type="button" style={{ ...styles.buttonPrimary, width: "100%" }} onClick={handleSave} disabled={saving}>Speichern</button>
      {msg ? <p style={{ ...styles.small, color: msg === "Gespeichert." ? "var(--success)" : "var(--danger)" }}>{msg}</p> : null}
    </Page>
  );
}
