"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "../../../lib/errors";
import { BtnLink, Page, styles } from "../../../lib/ui";

type SettingsData = {
  ok: boolean;
  preferences: { tags: string[] };
};

export default function KuechePraeferenzenPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferenceOptions, setPreferenceOptions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
        setSelectedTags(d.preferences?.tags ?? []);
        setPreferenceOptions(o.tags ?? []);
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
      const prefRes = await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: selectedTags }),
      });
      if (!prefRes.ok) throw new Error(`${prefRes.status}`);
      setMsg("Gespeichert.");
    } catch (e) {
      setMsg(getErrorMessage(e, "Fehler"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      title="Präferenzen"
      subtitle="Beeinflussen den Wochenplan bis zu 50 %"
      right={<BtnLink href="/einstellungen/kueche">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      {loading && <p style={styles.small}>Lade…</p>}
      {error && <p style={{ ...styles.small, color: "var(--danger)" }}>{error}</p>}

      <div style={{ ...styles.card, marginBottom: 16 }}>
        <p style={{ fontWeight: 800, margin: "0 0 4px" }}>Präferenzen</p>
        <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 0, marginBottom: 12 }}>
          Diese Vorlieben beeinflussen den Wochenplan, ohne ihn komplett festzulegen.
        </p>
        {preferenceOptions.length === 0 && !loading ? <p style={styles.small}>Keine Optionen verfügbar.</p> : null}
        <div style={{ display: "grid", gap: 8 }}>
          {preferenceOptions.map((tag) => (
            <label key={tag} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={(e) =>
                  setSelectedTags((prev) => e.target.checked ? [...prev, tag] : prev.filter((entry) => entry !== tag))
                }
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      <button type="button" style={{ ...styles.buttonPrimary, width: "100%" }} onClick={handleSave} disabled={saving}>
        Speichern
      </button>
      {msg ? <p style={{ ...styles.small, color: msg === "Gespeichert." ? "var(--success)" : "var(--danger)" }}>{msg}</p> : null}
    </Page>
  );
}
