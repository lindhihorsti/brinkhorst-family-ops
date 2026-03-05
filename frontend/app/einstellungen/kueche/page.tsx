"use client";

import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../../lib/errors";
import { BtnLink, Page, styles } from "../../lib/ui";

type PantryItem = { name: string; uncertain: boolean; aliases: string[] };

type SettingsData = {
  ok: boolean;
  pantry: { items: PantryItem[] };
  preferences: { tags: string[] };
  shop?: { shop_output_mode?: "ai_consolidated" | "per_recipe" };
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

function aliasesToText(a: string[]) { return a.join(", "); }
function textToAliases(v: string) { return v.split(",").map((s) => s.trim()).filter(Boolean); }

export default function KuecheSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [pantrySaving, setPantrySaving] = useState(false);
  const [pantryMsg, setPantryMsg] = useState<string | null>(null);

  const [preferenceOptions, setPreferenceOptions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefMsg, setPrefMsg] = useState<string | null>(null);

  const [shopMode, setShopMode] = useState<"ai_consolidated" | "per_recipe">("ai_consolidated");
  const [shopSaving, setShopSaving] = useState(false);
  const [shopMsg, setShopMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [settingsRes, optionsRes] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/settings/preferences/options", { cache: "no-store" }),
        ]);
        if (!settingsRes.ok) throw new Error(`${settingsRes.status}`);
        const d = (await settingsRes.json()) as SettingsData;
        const o = await optionsRes.json();
        setPantryItems(d.pantry?.items ?? []);
        setSelectedTags(d.preferences?.tags ?? []);
        setShopMode(d.shop?.shop_output_mode ?? "ai_consolidated");
        setPreferenceOptions(o.tags ?? []);
      } catch (e) {
        setError(getErrorMessage(e, "Fehler beim Laden"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePantrySave = async () => {
    setPantrySaving(true); setPantryMsg(null);
    try {
      const res = await fetch("/api/settings/pantry", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pantryItems }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const d = (await res.json()) as SettingsData;
      setPantryItems(d.pantry?.items ?? pantryItems);
      setPantryMsg("Gespeichert.");
    } catch (e) { setPantryMsg(getErrorMessage(e, "Fehler")); } finally { setPantrySaving(false); }
  };

  const handlePrefSave = async () => {
    setPrefSaving(true); setPrefMsg(null);
    try {
      const res = await fetch("/api/settings/preferences", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: selectedTags }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setPrefMsg("Gespeichert.");
    } catch (e) { setPrefMsg(getErrorMessage(e, "Fehler")); } finally { setPrefSaving(false); }
  };

  const handleShopSave = async () => {
    setShopSaving(true); setShopMsg(null);
    try {
      const res = await fetch("/api/settings/shop", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_output_mode: shopMode }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setShopMsg("Gespeichert.");
    } catch (e) { setShopMsg(getErrorMessage(e, "Fehler")); } finally { setShopSaving(false); }
  };

  const small: React.CSSProperties = { fontSize: 12, color: "var(--fg-muted)", marginTop: 6 };

  return (
    <Page
      title="Küche & Einkaufen"
      subtitle="Basisvorrat, Präferenzen, Einkaufsliste"
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      {loading && <p style={styles.small}>Lade…</p>}
      {error && <p style={{ ...styles.small, color: "var(--danger)" }}>{error}</p>}

      {/* Basisvorrat */}
      <div style={{ ...styles.card, marginBottom: 16 }}>
        <p style={{ fontWeight: 800, marginBottom: 12, margin: "0 0 12px" }}>Basisvorrat</p>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.5fr 1.4fr 28px", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>Name</span>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>?</span>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>Synonyme</span>
            <span />
          </div>
          {pantryItems.map((item, idx) => (
            <div key={`${item.name}-${idx}`} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.5fr 1.4fr 28px", gap: 6, alignItems: "center" }}>
              <input style={styles.input} value={item.name} placeholder="z.B. Salz"
                onChange={(e) => setPantryItems((prev) => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))} />
              <label style={{ display: "flex", justifyContent: "center" }}>
                <input type="checkbox" checked={item.uncertain}
                  onChange={(e) => setPantryItems((prev) => prev.map((p, i) => i === idx ? { ...p, uncertain: e.target.checked } : p))} />
              </label>
              <input style={styles.input} value={aliasesToText(item.aliases)} placeholder="Speisesalz"
                onChange={(e) => setPantryItems((prev) => prev.map((p, i) => i === idx ? { ...p, aliases: textToAliases(e.target.value) } : p))} />
              <button style={{ ...styles.buttonDanger, padding: "6px 8px", fontSize: 11 }}
                onClick={() => setPantryItems((prev) => prev.filter((_, i) => i !== idx))}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <button style={styles.button}
            onClick={() => setPantryItems((prev) => [...prev, { name: "", uncertain: false, aliases: [] }])}>
            + Hinzufügen
          </button>
          <button style={styles.button} onClick={() => setPantryItems(DEFAULT_PANTRY)}>Zurücksetzen</button>
          <button style={styles.buttonPrimary} onClick={handlePantrySave} disabled={pantrySaving}>
            {pantrySaving ? "Speichere…" : "Speichern"}
          </button>
        </div>
        {pantryMsg && <p style={small}>{pantryMsg}</p>}
      </div>

      {/* Präferenzen */}
      <div style={{ ...styles.card, marginBottom: 16 }}>
        <p style={{ fontWeight: 800, margin: "0 0 4px" }}>Präferenzen</p>
        <p style={{ ...small, marginTop: 0, marginBottom: 12 }}>Beeinflussen den Wochenplan bis zu 50%.</p>
        {preferenceOptions.length === 0 && !loading && <p style={small}>Keine Optionen verfügbar.</p>}
        <div style={{ display: "grid", gap: 8 }}>
          {preferenceOptions.map((tag) => (
            <label key={tag} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <input type="checkbox" checked={selectedTags.includes(tag)}
                onChange={(e) => setSelectedTags((prev) => e.target.checked ? [...prev, tag] : prev.filter((t) => t !== tag))} />
              {tag}
            </label>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button style={styles.buttonPrimary} onClick={handlePrefSave} disabled={prefSaving}>
            {prefSaving ? "Speichere…" : "Präferenzen speichern"}
          </button>
        </div>
        {prefMsg && <p style={small}>{prefMsg}</p>}
      </div>

      {/* Einkaufsliste */}
      <div style={styles.card}>
        <p style={{ fontWeight: 800, margin: "0 0 12px" }}>Einkaufsliste</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "var(--fg-muted)", flexShrink: 0 }}>Format</span>
          <select style={{ ...styles.input, flex: 1 }} value={shopMode}
            onChange={(e) => setShopMode(e.target.value as "ai_consolidated" | "per_recipe")}>
            <option value="ai_consolidated">Konsolidiert (AI)</option>
            <option value="per_recipe">Pro Rezept</option>
          </select>
        </div>
        <div style={{ marginTop: 12 }}>
          <button style={styles.buttonPrimary} onClick={handleShopSave} disabled={shopSaving}>
            {shopSaving ? "Speichere…" : "Speichern"}
          </button>
        </div>
        {shopMsg && <p style={small}>{shopMsg}</p>}
      </div>
    </Page>
  );
}
