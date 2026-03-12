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
  home_duration_min: number;
  home_energy: "ruhig" | "mittel" | "wild";
  home_mess_level: "sauber" | "egal" | "chaos_ok";
  home_space: "wohnzimmer" | "kinderzimmer" | "klein" | "egal";
  home_parent_energy: "niedrig" | "mittel" | "hoch";
  home_materials: string[];
  home_types: string[];
};

const DEFAULT: ActivitiesSettings = {
  default_location: "",
  max_travel_min: 30,
  budget: "egal",
  transport: "egal",
  types: [],
  use_weather: true,
  prefer_mountains: false,
  home_duration_min: 30,
  home_energy: "mittel",
  home_mess_level: "egal",
  home_space: "wohnzimmer",
  home_parent_energy: "mittel",
  home_materials: ["Bücher", "Bausteine", "Kissen", "Klebeband", "Papier"],
  home_types: ["Bewegung", "Rollenspiel", "Bauen"],
};

const TRAVEL_OPTIONS = [15, 30, 45, 60, 90, 120];
const TYPE_OPTIONS = ["Spielplatz", "Zoo", "Museum", "Schwimmbad", "Wald", "Café", "Bauernhof", "Indoor-Spielplatz"];
const HOME_DURATION_OPTIONS = [15, 20, 30, 45, 60, 90];
const HOME_THEME_OPTIONS = ["Bewegung", "Bauen", "Rollenspiel", "Basteln", "Musik", "Sensorik", "Geschichten", "Mini-Experimente"];
const HOME_MATERIAL_OPTIONS = ["Papier", "Stifte", "Klebeband", "Kissen", "Decken", "Bücher", "Bausteine", "Becher", "Schüsseln", "Wäscheklammern"];

function labelForTransport(v: ActivitiesSettings["transport"]) {
  switch (v) {
    case "auto": return "Auto";
    case "oev": return "ÖV";
    case "zu_fuss": return "zu Fuß";
    default: return "egal";
  }
}

function toggleValue(list: string[], value: string) {
  const next = new Set(list);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return Array.from(next);
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
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/activities/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const d = await res.json();
      if (d.settings) setSettings({ ...DEFAULT, ...d.settings });
      setMsg("Gespeichert.");
    } catch (e) {
      setMsg(getErrorMessage(e, "Fehler"));
    } finally {
      setSaving(false);
    }
  };

  const selectedTypes = useMemo(() => new Set(settings.types), [settings.types]);
  const selectedHomeTypes = useMemo(() => new Set(settings.home_types), [settings.home_types]);
  const selectedHomeMaterials = useMemo(() => new Set(settings.home_materials), [settings.home_materials]);

  return (
    <Page
      title="Aktivitäten"
      subtitle="Ausflüge und Zuhause getrennt konfigurieren"
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      {loading && <p style={styles.small}>Lade…</p>}
      {error && <p style={{ ...styles.small, color: "var(--danger)" }}>{error}</p>}

      <div style={{ display: "grid", gap: 16 }}>
        <div style={styles.card}>
          <p style={{ fontWeight: 800, margin: "0 0 12px" }}>Ausflüge</p>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={styles.label}>Standard-Ort</label>
              <input
                style={styles.input}
                value={settings.default_location}
                placeholder="z.B. Zürich, Seefeld"
                onChange={(e) => setSettings((prev) => ({ ...prev, default_location: e.target.value }))}
              />
            </div>

            <div>
              <label style={styles.label}>Max. Fahrzeit (Min.)</label>
              <select
                style={styles.select}
                value={settings.max_travel_min}
                onChange={(e) => setSettings((prev) => ({ ...prev, max_travel_min: Number(e.target.value) }))}
              >
                {TRAVEL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label style={styles.label}>Budget</label>
              <select
                style={styles.select}
                value={settings.budget}
                onChange={(e) => setSettings((prev) => ({ ...prev, budget: e.target.value as ActivitiesSettings["budget"] }))}
              >
                {(["niedrig", "mittel", "egal"] as const).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label style={styles.label}>Transport</label>
              <select
                style={styles.select}
                value={settings.transport}
                onChange={(e) => setSettings((prev) => ({ ...prev, transport: e.target.value as ActivitiesSettings["transport"] }))}
              >
                {(["auto", "oev", "zu_fuss", "egal"] as const).map((o) => (
                  <option key={o} value={o}>{labelForTransport(o)}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Lieblingsrichtungen</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {TYPE_OPTIONS.map((o) => {
                  const active = selectedTypes.has(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, types: toggleValue(prev.types, o) }))}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: `1px solid ${active ? "var(--fg)" : "var(--border)"}`,
                        borderRadius: 999,
                        padding: "6px 12px",
                        fontSize: 13,
                        background: active ? "var(--fg)" : "var(--bg)",
                        color: active ? "var(--bg)" : "var(--fg-muted)",
                        cursor: "pointer",
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                <input type="checkbox" checked={settings.use_weather} onChange={(e) => setSettings((prev) => ({ ...prev, use_weather: e.target.checked }))} />
                Wetter berücksichtigen
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                <input type="checkbox" checked={settings.prefer_mountains} onChange={(e) => setSettings((prev) => ({ ...prev, prefer_mountains: e.target.checked }))} />
                Berge bevorzugen
              </label>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <p style={{ fontWeight: 800, margin: "0 0 12px" }}>Zuhause</p>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={styles.label}>Standarddauer</label>
              <select
                style={styles.select}
                value={settings.home_duration_min}
                onChange={(e) => setSettings((prev) => ({ ...prev, home_duration_min: Number(e.target.value) }))}
              >
                {HOME_DURATION_OPTIONS.map((o) => <option key={o} value={o}>{o} Minuten</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={styles.label}>Kinder-Energie</label>
                <select
                  style={styles.select}
                  value={settings.home_energy}
                  onChange={(e) => setSettings((prev) => ({ ...prev, home_energy: e.target.value as ActivitiesSettings["home_energy"] }))}
                >
                  <option value="ruhig">Ruhig</option>
                  <option value="mittel">Mittel</option>
                  <option value="wild">Wild</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Eltern-Energie</label>
                <select
                  style={styles.select}
                  value={settings.home_parent_energy}
                  onChange={(e) => setSettings((prev) => ({ ...prev, home_parent_energy: e.target.value as ActivitiesSettings["home_parent_energy"] }))}
                >
                  <option value="niedrig">Niedrig</option>
                  <option value="mittel">Mittel</option>
                  <option value="hoch">Hoch</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={styles.label}>Chaos-Level</label>
                <select
                  style={styles.select}
                  value={settings.home_mess_level}
                  onChange={(e) => setSettings((prev) => ({ ...prev, home_mess_level: e.target.value as ActivitiesSettings["home_mess_level"] }))}
                >
                  <option value="sauber">Bitte sauber</option>
                  <option value="egal">Egal</option>
                  <option value="chaos_ok">Chaos okay</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Raum</label>
                <select
                  style={styles.select}
                  value={settings.home_space}
                  onChange={(e) => setSettings((prev) => ({ ...prev, home_space: e.target.value as ActivitiesSettings["home_space"] }))}
                >
                  <option value="wohnzimmer">Wohnzimmer</option>
                  <option value="kinderzimmer">Kinderzimmer</option>
                  <option value="klein">Wenig Platz</option>
                  <option value="egal">Egal</option>
                </select>
              </div>
            </div>

            <div>
              <label style={styles.label}>Bevorzugte Zuhause-Ideen</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {HOME_THEME_OPTIONS.map((o) => {
                  const active = selectedHomeTypes.has(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, home_types: toggleValue(prev.home_types, o) }))}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: `1px solid ${active ? "#ef7d43" : "var(--border)"}`,
                        borderRadius: 999,
                        padding: "6px 12px",
                        fontSize: 13,
                        background: active ? "color-mix(in srgb, #ef7d43 14%, var(--bg))" : "var(--bg)",
                        color: active ? "#ef7d43" : "var(--fg-muted)",
                        cursor: "pointer",
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={styles.label}>Material, das oft da ist</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {HOME_MATERIAL_OPTIONS.map((o) => {
                  const active = selectedHomeMaterials.has(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, home_materials: toggleValue(prev.home_materials, o) }))}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: `1px solid ${active ? "#ef7d43" : "var(--border)"}`,
                        borderRadius: 999,
                        padding: "6px 12px",
                        fontSize: 13,
                        background: active ? "color-mix(in srgb, #ef7d43 14%, var(--bg))" : "var(--bg)",
                        color: active ? "#ef7d43" : "var(--fg-muted)",
                        cursor: "pointer",
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <button style={{ ...styles.buttonPrimary, width: "100%" }} onClick={handleSave} disabled={saving}>Speichern</button>
        {msg && <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 4 }}>{msg}</p>}
      </div>
    </Page>
  );
}
