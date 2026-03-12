"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "../../lib/errors";
import { BtnLink, Page, styles } from "../../lib/ui";

type BirthdaySettings = {
  birthday_default_relation: string;
  birthday_upcoming_window_days: number;
  gift_default_occasion: string;
  gift_budget_range: string;
  gift_preferred_types: string[];
  gift_no_goes: string[];
};

const DEFAULT: BirthdaySettings = {
  birthday_default_relation: "Familie",
  birthday_upcoming_window_days: 7,
  gift_default_occasion: "Geburtstag",
  gift_budget_range: "25-50 CHF",
  gift_preferred_types: ["Erlebnis", "Kreativ", "Spielzeug"],
  gift_no_goes: ["zu laut", "zu groß"],
};

function updateCsv(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function GeburtstageSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<BirthdaySettings>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/birthdays/settings", { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (data.settings) setSettings({ ...DEFAULT, ...data.settings });
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
      const res = await fetch("/api/birthdays/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      if (data.settings) setSettings({ ...DEFAULT, ...data.settings });
      setMsg("Gespeichert.");
    } catch (e) {
      setMsg(getErrorMessage(e, "Fehler"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      title="Geburtstage & Geschenke"
      subtitle="Geburtstagsübersicht und Geschenkideen getrennt konfigurieren"
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      {loading ? <p style={styles.small}>Lade…</p> : null}
      {error ? <p style={{ ...styles.small, color: "var(--danger)" }}>{error}</p> : null}

      <div style={{ display: "grid", gap: 16 }}>
        <div style={styles.card}>
          <p style={{ fontWeight: 800, margin: "0 0 12px" }}>Geburtstage</p>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={styles.label}>Standard-Relation für neue Einträge</label>
              <select
                style={styles.select}
                value={settings.birthday_default_relation}
                onChange={(event) => setSettings((prev) => ({ ...prev, birthday_default_relation: event.target.value }))}
              >
                {["Familie", "Freunde", "Arbeit"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Geburtstage prominent zeigen für</label>
              <select
                style={styles.select}
                value={settings.birthday_upcoming_window_days}
                onChange={(event) => setSettings((prev) => ({ ...prev, birthday_upcoming_window_days: Number(event.target.value) }))}
              >
                {[3, 5, 7, 10, 14, 21].map((value) => (
                  <option key={value} value={value}>
                    {value} Tage
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <p style={{ fontWeight: 800, margin: "0 0 12px" }}>Geschenkideen</p>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={styles.label}>Standard-Anlass</label>
              <input
                style={styles.input}
                value={settings.gift_default_occasion}
                onChange={(event) => setSettings((prev) => ({ ...prev, gift_default_occasion: event.target.value }))}
              />
            </div>

            <div>
              <label style={styles.label}>Standard-Budgetrahmen</label>
              <input
                style={styles.input}
                value={settings.gift_budget_range}
                onChange={(event) => setSettings((prev) => ({ ...prev, gift_budget_range: event.target.value }))}
              />
            </div>

            <div>
              <label style={styles.label}>Bevorzugte Geschenkarten (kommagetrennt)</label>
              <input
                style={styles.input}
                value={settings.gift_preferred_types.join(", ")}
                onChange={(event) => setSettings((prev) => ({ ...prev, gift_preferred_types: updateCsv(event.target.value) }))}
              />
            </div>

            <div>
              <label style={styles.label}>Typische No-Gos (kommagetrennt)</label>
              <input
                style={styles.input}
                value={settings.gift_no_goes.join(", ")}
                onChange={(event) => setSettings((prev) => ({ ...prev, gift_no_goes: updateCsv(event.target.value) }))}
              />
            </div>
          </div>
        </div>

        <button type="button" style={{ ...styles.buttonPrimary, width: "100%" }} onClick={handleSave} disabled={saving}>Speichern</button>
        {msg ? <p style={{ ...styles.small, color: msg === "Gespeichert." ? "var(--success)" : "var(--danger)" }}>{msg}</p> : null}
      </div>
    </Page>
  );
}
