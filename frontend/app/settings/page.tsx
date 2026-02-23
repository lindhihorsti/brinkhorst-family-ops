"use client";

import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../lib/errors";
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
    } catch (e) {
      setError(getErrorMessage(e, "Fehler beim Laden"));
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
    } catch (e) {
      setPantryMessage(getErrorMessage(e, "Fehler beim Speichern"));
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
    } catch (e) {
      setPreferencesMessage(getErrorMessage(e, "Fehler beim Speichern"));
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
    } catch (e) {
      setTelegramMessage(getErrorMessage(e, "Fehler beim Speichern"));
    } finally {
      setTelegramSaving(false);
    }
  };

  const tagsByRow = useMemo(() => {
    if (!preferenceOptions.length) return [] as string[];
    return preferenceOptions;
  }, [preferenceOptions]);

  return (
    <Page title="Einstellungen" subtitle="Basisvorrat, Präferenzen, Telegram" right={<BtnLink href="/kueche">Back</BtnLink>}>
      {loading ? <div style={styles.small}>Einstellungen werden geladen…</div> : null}
      {error ? <div style={{ ...styles.small, color: "#b91c1c" }}>{error}</div> : null}

      <div style={cardStyles.section}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Basisvorrat</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={cardStyles.itemRow}>
            <div style={cardStyles.itemHeader}>Name</div>
            <div style={cardStyles.itemHeader}>Unsicher</div>
            <div style={cardStyles.itemHeader}>Synonyme (Komma)</div>
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
            Auf Standard zurücksetzen
          </button>
          <button style={styles.buttonPrimary} onClick={handlePantrySave} disabled={pantrySaving}>
            {pantrySaving ? "Speichere…" : "Basisvorrat speichern"}
          </button>
        </div>
        {pantryMessage ? <div style={styles.small}>{pantryMessage}</div> : null}
      </div>

      <div style={cardStyles.section}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Präferenzen</div>
        <div style={cardStyles.helper}>
          Präferenzen beeinflussen bis zu 50% des Wochenplans.
        </div>
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
            {preferencesSaving ? "Speichere…" : "Präferenzen speichern"}
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
            <span>Plan automatisch senden</span>
          </label>
          <label style={cardStyles.row}>
            <input
              type="checkbox"
              checked={telegram.auto_send_shop}
              onChange={(e) => setTelegram((prev) => ({ ...prev, auto_send_shop: e.target.checked }))}
            />
            <span>Einkauf automatisch senden</span>
          </label>
        </div>
        <div style={{ marginTop: 10, ...styles.small }}>
          Letzter Telegram-Chat bekannt: {telegramLastChatId ? "ja" : "nein"}
        </div>
        {!telegramLastChatId ? (
          <div style={{ ...styles.small, marginTop: 4 }}>
            Sende einmal eine Nachricht an den Bot, um den Chat zu registrieren.
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
