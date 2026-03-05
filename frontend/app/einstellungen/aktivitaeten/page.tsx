"use client";

import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../../lib/errors";
import { BtnLink, Page, styles } from "../../lib/ui";

type ActivitiesSettings = {
  default_location: string;
  max_travel_min: number;
  budget: "niedrig" | "mittel" | "egal";
  transport: "auto" | "oev" | "zu_fuss" | "egal";
  types: string[];
  use_weather: boolean;
  prefer_mountains: boolean;
};

const DEFAULT: ActivitiesSettings = {
  default_location: "",
  max_travel_min: 30,
  budget: "egal",
  transport: "egal",
  types: [],
  use_weather: true,
  prefer_mountains: false,
};

const TRAVEL_OPTIONS = [15, 30, 45, 60, 90, 120];
const TYPE_OPTIONS = ["Spielplatz", "Zoo", "Museum", "Schwimmbad", "Wald", "Café", "Bauernhof", "Indoor-Spielplatz"];

function labelForTransport(v: ActivitiesSettings["transport"]) {
  switch (v) {
    case "auto": return "Auto";
    case "oev": return "ÖV";
    case "zu_fuss": return "zu Fuß";
    default: return "egal";
  }
}

export default function AktivitaetenPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ActivitiesSettings>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/activities/settings", { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status}`);
        const d = await res.json();
        if (d.settings) setSettings({ ...DEFAULT, ...d.settings });
      } catch (e) {
        setError(getErrorMessage(e, "Fehler beim Laden"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/activities/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const d = await res.json();
      if (d.settings) setSettings({ ...DEFAULT, ...d.settings });
      setMsg("Gespeichert.");
    } catch (e) { setMsg(getErrorMessage(e, "Fehler")); } finally { setSaving(false); }
  };

  const selectedTypes = useMemo(() => new Set(settings.types), [settings.types]);
  const toggleType = (v: string) => {
    setSettings((prev) => {
      const next = new Set(prev.types);
      if (next.has(v)) next.delete(v); else next.add(v);
      return { ...prev, types: Array.from(next) };
    });
  };

  return (
    <Page
      title="Aktivitäten"
      subtitle="Standard-Ort, Budget, Transport"
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      {loading && <p style={styles.small}>Lade…</p>}
      {error && <p style={{ ...styles.small, color: "var(--danger)" }}>{error}</p>}

      <div style={{ display: "grid", gap: 14 }}>
        <div style={styles.card}>
          <label style={styles.label}>Standard-Ort</label>
          <input style={styles.input} value={settings.default_location} placeholder="z.B. Zürich, Seefeld"
            onChange={(e) => setSettings((prev) => ({ ...prev, default_location: e.target.value }))} />
        </div>

        <div style={styles.card}>
          <label style={styles.label}>Max. Fahrzeit (Min.)</label>
          <select style={styles.input} value={settings.max_travel_min}
            onChange={(e) => setSettings((prev) => ({ ...prev, max_travel_min: Number(e.target.value) }))}>
            {TRAVEL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={styles.card}>
          <label style={styles.label}>Budget</label>
          <select style={styles.input} value={settings.budget}
            onChange={(e) => setSettings((prev) => ({ ...prev, budget: e.target.value as ActivitiesSettings["budget"] }))}>
            {(["niedrig", "mittel", "egal"] as const).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={styles.card}>
          <label style={styles.label}>Transport</label>
          <select style={styles.input} value={settings.transport}
            onChange={(e) => setSettings((prev) => ({ ...prev, transport: e.target.value as ActivitiesSettings["transport"] }))}>
            {(["auto", "oev", "zu_fuss", "egal"] as const).map((o) => (
              <option key={o} value={o}>{labelForTransport(o)}</option>
            ))}
          </select>
        </div>

        <div style={styles.card}>
          <label style={styles.label}>Aktivitätstypen</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {TYPE_OPTIONS.map((o) => {
              const active = selectedTypes.has(o);
              return (
                <button
                  key={o}
                  onClick={() => toggleType(o)}
                  style={{
                    display: "inline-flex", alignItems: "center",
                    border: `1px solid ${active ? "var(--fg)" : "var(--border)"}`,
                    borderRadius: 999, padding: "6px 12px", fontSize: 13,
                    background: active ? "var(--fg)" : "var(--bg)",
                    color: active ? "var(--bg)" : "var(--fg-muted)",
                    cursor: "pointer", fontWeight: active ? 700 : 400,
                  }}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.card}>
          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={settings.use_weather}
                onChange={(e) => setSettings((prev) => ({ ...prev, use_weather: e.target.checked }))} />
              Wetter berücksichtigen
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={settings.prefer_mountains}
                onChange={(e) => setSettings((prev) => ({ ...prev, prefer_mountains: e.target.checked }))} />
              Berge bevorzugen
            </label>
          </div>
        </div>

        <button style={styles.buttonPrimary} onClick={handleSave} disabled={saving}>
          {saving ? "Speichere…" : "Einstellungen speichern"}
        </button>
        {msg && <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 4 }}>{msg}</p>}
      </div>
    </Page>
  );
}
