"use client";

import { useEffect, useMemo, useState } from "react";
import { BtnLink, Page, styles } from "../lib/ui";

type PantryItem = {
  name: string;
  uncertain: boolean;
  aliases: string[];
};

type SettingsResponse = {
  ok: boolean;
  pantry: { items: PantryItem[] };
  preferences: { tags: string[] };
  telegram: { auto_send_plan: boolean; auto_send_shop: boolean };
  telegram_last_chat_id: string | null;
};

type PreferenceOptionsResponse = {
  ok: boolean;
  tags: string[];
};

const DEFAULT_PANTRY_ITEMS: PantryItem[] = [
  { name: "salt", uncertain: false, aliases: [] },
  { name: "pepper", uncertain: false, aliases: [] },
  { name: "sugar", uncertain: false, aliases: [] },
  { name: "flour", uncertain: false, aliases: [] },
  { name: "olive oil", uncertain: false, aliases: ["cooking oil"] },
  { name: "vinegar", uncertain: false, aliases: [] },
  { name: "soy sauce", uncertain: false, aliases: [] },
  { name: "mustard", uncertain: false, aliases: [] },
  { name: "tomato paste", uncertain: false, aliases: [] },
  { name: "stock", uncertain: false, aliases: ["bouillon"] },
  { name: "rice", uncertain: false, aliases: [] },
  { name: "pasta", uncertain: false, aliases: [] },
  { name: "paprika powder", uncertain: false, aliases: [] },
  { name: "curry", uncertain: false, aliases: [] },
  { name: "chili", uncertain: false, aliases: [] },
  { name: "oregano", uncertain: false, aliases: [] },
  { name: "basil", uncertain: false, aliases: [] },
  { name: "baking powder", uncertain: false, aliases: [] },
  { name: "starch", uncertain: false, aliases: [] },
  { name: "garlic", uncertain: true, aliases: [] },
  { name: "onions", uncertain: true, aliases: [] },
];

const cardStyles: Record<string, React.CSSProperties> = {
  section: { ...styles.card, marginBottom: 14 },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  itemRow: { display: "grid", gap: 8, gridTemplateColumns: "1.2fr 0.6fr 1.4fr" },
  itemHeader: { fontSize: 12, fontWeight: 700, opacity: 0.8 },
  helper: { fontSize: 12, opacity: 0.7 },
};

function aliasesToText(aliases: string[]) {
  return aliases.join(", ");
}

function textToAliases(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [pantrySaving, setPantrySaving] = useState(false);
  const [pantryMessage, setPantryMessage] = useState<string | null>(null);

  const [preferenceOptions, setPreferenceOptions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);

  const [telegram, setTelegram] = useState({ auto_send_plan: false, auto_send_shop: false });
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState<string | null>(null);
  const [telegramLastChatId, setTelegramLastChatId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, optionsRes] = await Promise.all([
        fetch("/api/settings", { cache: "no-store" }),
        fetch("/api/settings/preferences/options", { cache: "no-store" }),
      ]);
      if (!settingsRes.ok) throw new Error(`${settingsRes.status} ${settingsRes.statusText}`);
      if (!optionsRes.ok) throw new Error(`${optionsRes.status} ${optionsRes.statusText}`);
      const settingsData = (await settingsRes.json()) as SettingsResponse;
      const optionsData = (await optionsRes.json()) as PreferenceOptionsResponse;

      setPantryItems(settingsData.pantry?.items ?? []);
      setSelectedTags(settingsData.preferences?.tags ?? []);
      setTelegram(settingsData.telegram ?? { auto_send_plan: false, auto_send_shop: false });
      setTelegramLastChatId(settingsData.telegram_last_chat_id ?? null);
      setPreferenceOptions(optionsData.tags ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handlePantrySave = async () => {
    setPantrySaving(true);
    setPantryMessage(null);
    try {
      const res = await fetch("/api/settings/pantry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pantryItems }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as SettingsResponse;
      setPantryItems(data.pantry?.items ?? pantryItems);
      setPantryMessage("Gespeichert.");
    } catch (e: any) {
      setPantryMessage(e?.message ?? "Fehler beim Speichern");
    } finally {
      setPantrySaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    setPreferencesSaving(true);
    setPreferencesMessage(null);
    try {
      const res = await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: selectedTags }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as SettingsResponse;
      setSelectedTags(data.preferences?.tags ?? selectedTags);
      setPreferencesMessage("Gespeichert.");
    } catch (e: any) {
      setPreferencesMessage(e?.message ?? "Fehler beim Speichern");
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleTelegramSave = async () => {
    setTelegramSaving(true);
    setTelegramMessage(null);
    try {
      const res = await fetch("/api/settings/telegram", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegram),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      await res.json();
      setTelegramMessage("Gespeichert.");
    } catch (e: any) {
      setTelegramMessage(e?.message ?? "Fehler beim Speichern");
    } finally {
      setTelegramSaving(false);
    }
  };

  const tagsByRow = useMemo(() => {
    if (!preferenceOptions.length) return [] as string[];
    return preferenceOptions;
  }, [preferenceOptions]);

  return (
    <Page title="Einstellungen" subtitle="Basisvorrat, Präferenzen, Telegram" right={<BtnLink href="/">Home</BtnLink>}>
      {loading ? <div style={styles.small}>Lade Einstellungen…</div> : null}
      {error ? <div style={{ ...styles.small, color: "#b91c1c" }}>{error}</div> : null}

      <div style={cardStyles.section}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Pantry / Basisvorrat</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={cardStyles.itemRow}>
            <div style={cardStyles.itemHeader}>Name</div>
            <div style={cardStyles.itemHeader}>Unsicher</div>
            <div style={cardStyles.itemHeader}>Aliases (comma)</div>
          </div>
          {pantryItems.map((item, idx) => (
            <div key={`${item.name}-${idx}`} style={cardStyles.itemRow}>
              <input
                style={styles.input}
                value={item.name}
                onChange={(e) =>
                  setPantryItems((prev) =>
                    prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p))
                  )
                }
                placeholder="z.B. Salz"
              />
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={item.uncertain}
                  onChange={(e) =>
                    setPantryItems((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, uncertain: e.target.checked } : p))
                    )
                  }
                />
                <span style={styles.small}>?</span>
              </label>
              <input
                style={styles.input}
                value={aliasesToText(item.aliases)}
                onChange={(e) =>
                  setPantryItems((prev) =>
                    prev.map((p, i) =>
                      i === idx ? { ...p, aliases: textToAliases(e.target.value) } : p
                    )
                  )
                }
                placeholder="z.B. Speisesalz, grobes Salz"
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  style={styles.buttonDanger}
                  onClick={() => setPantryItems((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Entfernen
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            style={styles.button}
            onClick={() => setPantryItems((prev) => [...prev, { name: "", uncertain: false, aliases: [] }])}
          >
            Item hinzufügen
          </button>
          <button style={styles.button} onClick={() => setPantryItems(DEFAULT_PANTRY_ITEMS)}>
            Reset to defaults
          </button>
          <button style={styles.buttonPrimary} onClick={handlePantrySave} disabled={pantrySaving}>
            {pantrySaving ? "Speichere…" : "Pantry speichern"}
          </button>
        </div>
        {pantryMessage ? <div style={styles.small}>{pantryMessage}</div> : null}
      </div>

      <div style={cardStyles.section}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Preferences</div>
        <div style={cardStyles.helper}>Preferences influence up to 50% of the week plan.</div>
        {tagsByRow.length === 0 ? (
          <div style={styles.small}>Keine Tags gefunden.</div>
        ) : (
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {tagsByRow.map((tag) => (
              <label key={tag} style={cardStyles.row}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={(e) =>
                    setSelectedTags((prev) =>
                      e.target.checked ? [...prev, tag] : prev.filter((t) => t !== tag)
                    )
                  }
                />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            style={styles.buttonPrimary}
            onClick={handlePreferencesSave}
            disabled={preferencesSaving}
          >
            {preferencesSaving ? "Speichere…" : "Preferences speichern"}
          </button>
        </div>
        {preferencesMessage ? <div style={styles.small}>{preferencesMessage}</div> : null}
      </div>

      <div style={cardStyles.section}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Telegram</div>
        <div style={{ display: "grid", gap: 8 }}>
          <label style={cardStyles.row}>
            <input
              type="checkbox"
              checked={telegram.auto_send_plan}
              onChange={(e) => setTelegram((prev) => ({ ...prev, auto_send_plan: e.target.checked }))}
            />
            <span>Auto-Send Plan</span>
          </label>
          <label style={cardStyles.row}>
            <input
              type="checkbox"
              checked={telegram.auto_send_shop}
              onChange={(e) => setTelegram((prev) => ({ ...prev, auto_send_shop: e.target.checked }))}
            />
            <span>Auto-Send Shop</span>
          </label>
        </div>
        <div style={{ marginTop: 10, ...styles.small }}>
          Last Telegram chat known: {telegramLastChatId ? "yes" : "no"}
        </div>
        {!telegramLastChatId ? (
          <div style={{ ...styles.small, marginTop: 4 }}>
            Send any message to the bot once to register chat.
          </div>
        ) : null}
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={styles.buttonPrimary} onClick={handleTelegramSave} disabled={telegramSaving}>
            {telegramSaving ? "Speichere…" : "Telegram speichern"}
          </button>
        </div>
        {telegramMessage ? <div style={styles.small}>{telegramMessage}</div> : null}
      </div>
    </Page>
  );
}
