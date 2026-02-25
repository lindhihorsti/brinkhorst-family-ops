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

type ActivitiesSettingsResponse = {
  ok: boolean;
  settings: ActivitiesSettings;
};

const DEFAULT_SETTINGS: ActivitiesSettings = {
  default_location: "",
  max_travel_min: 30,
  budget: "egal",
  transport: "egal",
  types: [],
  use_weather: true,
  prefer_mountains: false,
};

const TRAVEL_OPTIONS = [15, 30, 45, 60, 90, 120];
const BUDGET_OPTIONS: ActivitiesSettings["budget"][] = ["niedrig", "mittel", "egal"];
const TRANSPORT_OPTIONS: ActivitiesSettings["transport"][] = ["auto", "oev", "zu_fuss", "egal"];
const TYPE_OPTIONS = [
  "Spielplatz",
  "Zoo",
  "Museum",
  "Schwimmbad",
  "Wald",
  "Café",
  "Bauernhof",
  "Indoor-Spielplatz",
];

const cardStyles: Record<string, React.CSSProperties> = {
  section: { ...styles.card, marginBottom: 14 },
  row: { display: "grid", gap: 10 },
  rowInline: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  label: { fontSize: 13, fontWeight: 700, color: "#000" },
  helper: { fontSize: 12, opacity: 0.7 },
  select: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 16,
    outline: "none",
    color: "#000",
    background: "#fff",
  },
  checkbox: { display: "flex", alignItems: "center", gap: 8 },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid #ddd",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    color: "#000",
    background: "#fff",
  },
};

function labelForTransport(value: ActivitiesSettings["transport"]) {
  switch (value) {
    case "auto":
      return "Auto";
    case "oev":
      return "ÖV";
    case "zu_fuss":
      return "zu Fuß";
    default:
      return "egal";
  }
}

export default function AktivitätenSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ActivitiesSettings>(DEFAULT_SETTINGS);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/activities/settings", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as ActivitiesSettingsResponse;
      if (data.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
    } catch (e) {
      setError(getErrorMessage(e, "Fehler beim Laden"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/activities/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as ActivitiesSettingsResponse;
      if (data.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
      setMessage("Gespeichert.");
    } catch (e) {
      setError(getErrorMessage(e, "Fehler beim Speichern"));
    } finally {
      setSaving(false);
    }
  };

  const selectedTypes = useMemo(() => new Set(settings.types), [settings.types]);

  const toggleType = (value: string) => {
    setSettings((prev) => {
      const next = new Set(prev.types);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, types: Array.from(next) };
    });
  };

  return (
    <Page title="Einstellungen" right={<BtnLink href="/ideen">Zurück</BtnLink>}>
      {loading ? <p style={styles.small}>Lade…</p> : null}
      {error ? <p style={{ ...styles.small, color: "#b91c1c" }}>{error}</p> : null}

      <section style={cardStyles.section}>
        <div style={cardStyles.row}>
          <label style={cardStyles.label} htmlFor="default-location">
            Standard-Ort
          </label>
          <input
            id="default-location"
            style={styles.input}
            value={settings.default_location}
            onChange={(event) => setSettings((prev) => ({ ...prev, default_location: event.target.value }))}
            placeholder="z.B. Zürich, Seefeld"
          />
        </div>
      </section>

      <section style={cardStyles.section}>
        <div style={cardStyles.row}>
          <label style={cardStyles.label} htmlFor="max-travel">
            Max. Fahrzeit (Min.)
          </label>
          <select
            id="max-travel"
            style={cardStyles.select}
            value={settings.max_travel_min}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, max_travel_min: Number(event.target.value) }))
            }
          >
            {TRAVEL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section style={cardStyles.section}>
        <div style={cardStyles.row}>
          <label style={cardStyles.label} htmlFor="budget">
            Budget
          </label>
          <select
            id="budget"
            style={cardStyles.select}
            value={settings.budget}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, budget: event.target.value as ActivitiesSettings["budget"] }))
            }
          >
            {BUDGET_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section style={cardStyles.section}>
        <div style={cardStyles.row}>
          <label style={cardStyles.label} htmlFor="transport">
            Transport
          </label>
          <select
            id="transport"
            style={cardStyles.select}
            value={settings.transport}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                transport: event.target.value as ActivitiesSettings["transport"],
              }))
            }
          >
            {TRANSPORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {labelForTransport(option)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section style={cardStyles.section}>
        <div style={cardStyles.row}>
          <p style={cardStyles.label}>Aktivitätstypen</p>
          <div style={cardStyles.rowInline}>
            {TYPE_OPTIONS.map((option) => (
              <label key={option} style={cardStyles.tag}>
                <input
                  type="checkbox"
                  checked={selectedTypes.has(option)}
                  onChange={() => toggleType(option)}
                />
                {option}
              </label>
            ))}
          </div>
          <p style={cardStyles.helper}>Mehrfachauswahl möglich.</p>
        </div>
      </section>

      <section style={cardStyles.section}>
        <div style={cardStyles.row}>
          <label style={cardStyles.checkbox}>
            <input
              type="checkbox"
              checked={settings.use_weather}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, use_weather: event.target.checked }))
              }
            />
            Wetter berücksichtigen
          </label>
          <label style={cardStyles.checkbox}>
            <input
              type="checkbox"
              checked={settings.prefer_mountains}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, prefer_mountains: event.target.checked }))
              }
            />
            Berge bevorzugen
          </label>
        </div>
      </section>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button type="button" style={styles.buttonPrimary} onClick={handleSave} disabled={saving}>
          {saving ? "Speichere…" : "Speichern"}
        </button>
        {message ? <span style={styles.small}>{message}</span> : null}
      </div>
    </Page>
  );
}
