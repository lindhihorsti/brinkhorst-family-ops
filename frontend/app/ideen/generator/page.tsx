"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getErrorMessage } from "../../lib/errors";

type ActivitiesSettings = {
  default_location: string;
  max_travel_min: number;
  budget: "niedrig" | "mittel" | "egal";
  transport: "auto" | "oev" | "zu_fuss" | "egal";
  types: string[];
  use_weather: boolean;
  prefer_mountains: boolean;
};

type ActivityAlternative = {
  title: string;
  location: string;
  travel_time_min: number;
  opening_hours_today: string;
  price_hint: string;
  duration_hint: string;
  why_fit: string;
  sources: string[];
};

type GenerateResponse = {
  ok: boolean;
  alternatives?: ActivityAlternative[];
  error?: string;
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

const TIME_BUCKETS = ["1–2 Stunden", "2–4 Stunden", "Halber Tag", "Ganzer Tag"] as const;
const TRAVEL_OPTIONS = [15, 30, 45, 60, 90, 120];
const ENERGY_OPTIONS = ["low", "mittel", "hoch"] as const;
const VIBE_OPTIONS = ["ruhig", "aktiv", "sozial"] as const;
const IO_OPTIONS = ["egal", "drinnen", "draußen"] as const;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: "#fff",
    color: "#000",
    fontFamily:
      'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  container: {
    maxWidth: 420,
    margin: "0 auto",
    padding: "16px 22px 44px 22px",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 22,
  },
  title: { fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.2, color: "#000" },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    border: "1px solid #ddd",
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 700,
    color: "#000",
    background: "#fff",
    textDecoration: "none",
    cursor: "pointer",
  },
  section: {
    border: "1px solid #ddd",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    background: "#fff",
    color: "#000",
  },
  label: { fontSize: 13, fontWeight: 700, marginBottom: 6 },
  input: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 16,
    outline: "none",
    color: "#000",
    background: "#fff",
  },
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
  textarea: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 15,
    outline: "none",
    color: "#000",
    background: "#fff",
    resize: "vertical",
  },
  chipRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  chip: {
    border: "1px solid #ddd",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    background: "#fff",
    color: "#000",
    cursor: "pointer",
  },
  chipActive: {
    background: "#eaf4ff",
    borderColor: "#8ab6e6",
  },
  stepTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12 },
  row: { display: "grid", gap: 12 },
  buttonRow: { display: "flex", gap: 10, marginTop: 16, alignItems: "center" },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    border: "1px solid #000",
    padding: "12px 14px",
    fontSize: 15,
    fontWeight: 800,
    color: "#fff",
    background: "#000",
    textDecoration: "none",
    cursor: "pointer",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    border: "1px solid #ddd",
    padding: "12px 14px",
    fontSize: 14,
    fontWeight: 700,
    color: "#000",
    background: "#fff",
    textDecoration: "none",
    cursor: "pointer",
  },
  cardStack: { display: "grid", gap: 14 },
  resultCard: {
    border: "1px solid #ddd",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    background: "#fff",
    color: "#000",
  },
  resultTitle: { fontSize: 16, fontWeight: 700, margin: 0 },
  resultMeta: { fontSize: 12, margin: "6px 0 0 0" },
  resultWhy: { fontSize: 13, marginTop: 10 },
  sources: { fontSize: 12, marginTop: 10, display: "grid", gap: 4 },
  error: { color: "#b91c1c", fontSize: 12 },
};

function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...styles.chip, ...(selected ? styles.chipActive : null) }}
    >
      {label}
    </button>
  );
}

function sourceLabel(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function IdeenGeneratorPage() {
  const [step, setStep] = useState<"A" | "B" | "C" | "D">("A");
  const [settings, setSettings] = useState<ActivitiesSettings>(DEFAULT_SETTINGS);
  const [initialized, setInitialized] = useState(false);

  const [locationText, setLocationText] = useState("");
  const [timeLeftBucket, setTimeLeftBucket] = useState<(typeof TIME_BUCKETS)[number]>(TIME_BUCKETS[0]);
  const [maxTravelMin, setMaxTravelMin] = useState(30);
  const [mountains, setMountains] = useState(false);

  const [energy, setEnergy] = useState<(typeof ENERGY_OPTIONS)[number]>("mittel");
  const [vibe, setVibe] = useState<(typeof VIBE_OPTIONS)[number]>("ruhig");
  const [indoorOutdoor, setIndoorOutdoor] = useState<(typeof IO_OPTIONS)[number]>("egal");
  const [freeText, setFreeText] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<ActivityAlternative[]>([]);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/activities/settings", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as ActivitiesSettingsResponse;
      setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    } catch (e) {
      setError(getErrorMessage(e, "Fehler beim Laden"));
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (initialized) return;
    setLocationText(settings.default_location || "");
    setMaxTravelMin(settings.max_travel_min || 30);
    setMountains(Boolean(settings.prefer_mountains));
    setInitialized(true);
  }, [initialized, settings]);

  const payload = useMemo(
    () => ({
      location_text: locationText,
      time_left_bucket: timeLeftBucket,
      max_travel_min: maxTravelMin,
      mountains,
      mood: {
        energy,
        vibe,
        indoor_outdoor: indoorOutdoor,
        free_text: freeText,
      },
      settings_snapshot: settings,
    }),
    [
      locationText,
      timeLeftBucket,
      maxTravelMin,
      mountains,
      energy,
      vibe,
      indoorOutdoor,
      freeText,
      settings,
    ]
  );

  const runGenerate = async () => {
    setLoading(true);
    setError(null);
    setStep("C");
    try {
      const res = await fetch("/api/activities/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as GenerateResponse;
      if (!res.ok || !data.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
      const items = data.alternatives ?? [];
      setAlternatives(items);
      setStep("D");
    } catch (e) {
      setError(getErrorMessage(e, "Fehler bei der Generierung"));
      setStep("B");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 12, marginBottom: 10 }}>
        <Image
          src="/logo.PNG"
          alt="Family Ops"
          width={600}
          height={380}
          priority
          style={{
            width: 220,
            height: "auto",
          }}
        />
      </div>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Ideen-Generator</h1>
          </div>
          <Link href="/ideen" style={styles.button}>
            Zurück
          </Link>
        </div>

        {step === "A" ? (
          <section style={styles.section}>
            <div style={styles.stepTitle}>Rahmenbedingungen</div>
            <div style={styles.row}>
              <div>
                <label style={styles.label} htmlFor="location">
                  Wo sind wir?
                </label>
                <input
                  id="location"
                  style={styles.input}
                  value={locationText}
                  onChange={(event) => setLocationText(event.target.value)}
                  placeholder="z.B. Zürich, Seefeld"
                />
              </div>

              <div>
                <p style={styles.label}>Wie lange haben wir noch?</p>
                <div style={styles.chipRow}>
                  {TIME_BUCKETS.map((option) => (
                    <ChipButton
                      key={option}
                      label={option}
                      selected={timeLeftBucket === option}
                      onClick={() => setTimeLeftBucket(option)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={styles.label} htmlFor="max-travel">
                  Wie weit wollen wir fahren?
                </label>
                <select
                  id="max-travel"
                  style={styles.select}
                  value={maxTravelMin}
                  onChange={(event) => setMaxTravelMin(Number(event.target.value))}
                >
                  {TRAVEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} Min.
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p style={styles.label}>Wollt ihr in die Berge?</p>
                <div style={styles.chipRow}>
                  <ChipButton label="Ja" selected={mountains} onClick={() => setMountains(true)} />
                  <ChipButton label="Nein" selected={!mountains} onClick={() => setMountains(false)} />
                </div>
              </div>
            </div>

            <div style={styles.buttonRow}>
              <button type="button" style={styles.primary} onClick={() => setStep("B")}
                disabled={!locationText.trim()}
              >
                Weiter
              </button>
            </div>
            {!locationText.trim() ? <p style={styles.error}>Bitte einen Ort eingeben.</p> : null}
          </section>
        ) : null}

        {step === "B" ? (
          <section style={styles.section}>
            <div style={styles.stepTitle}>Tagesform & Laune</div>
            <div style={styles.row}>
              <div>
                <p style={styles.label}>Energie</p>
                <div style={styles.chipRow}>
                  {ENERGY_OPTIONS.map((option) => (
                    <ChipButton
                      key={option}
                      label={option}
                      selected={energy === option}
                      onClick={() => setEnergy(option)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p style={styles.label}>Stimmung</p>
                <div style={styles.chipRow}>
                  {VIBE_OPTIONS.map((option) => (
                    <ChipButton
                      key={option}
                      label={option}
                      selected={vibe === option}
                      onClick={() => setVibe(option)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p style={styles.label}>Drinnen/Draußen</p>
                <div style={styles.chipRow}>
                  {IO_OPTIONS.map((option) => (
                    <ChipButton
                      key={option}
                      label={option}
                      selected={indoorOutdoor === option}
                      onClick={() => setIndoorOutdoor(option)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={styles.label} htmlFor="free-text">
                  Worauf habt ihr heute Lust?
                </label>
                <textarea
                  id="free-text"
                  style={styles.textarea}
                  rows={3}
                  value={freeText}
                  onChange={(event) => setFreeText(event.target.value)}
                  placeholder="z.B. Spielplatz, Tiere, kurzer Spaziergang"
                />
              </div>
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}

            <div style={styles.buttonRow}>
              <button type="button" style={styles.secondary} onClick={() => setStep("A")}
                disabled={loading}
              >
                Zurück
              </button>
              <button type="button" style={styles.primary} onClick={runGenerate} disabled={loading}>
                {loading ? "Generiere…" : "Ideen generieren"}
              </button>
            </div>
          </section>
        ) : null}

        {step === "C" ? (
          <section style={styles.section}>
            <div style={styles.stepTitle}>Vorschläge werden erstellt…</div>
            <p style={styles.resultMeta}>Bitte kurz warten. Wir holen Daten aus dem Web.</p>
          </section>
        ) : null}

        {step === "D" ? (
          <section style={styles.section}>
            <div style={styles.stepTitle}>Eure Ideen</div>
            <div style={styles.cardStack}>
              {alternatives.map((alt, index) => (
                <div key={`${alt.title}-${index}`} style={styles.resultCard}>
                  <p style={styles.resultTitle}>{alt.title}</p>
                  <p style={styles.resultMeta}>Ort: {alt.location}</p>
                  <p style={styles.resultMeta}>Fahrzeit: {alt.travel_time_min} Min.</p>
                  <p style={styles.resultMeta}>Öffnungszeiten heute: {alt.opening_hours_today}</p>
                  <p style={styles.resultMeta}>Kosten: {alt.price_hint}</p>
                  <p style={styles.resultMeta}>Dauer: {alt.duration_hint}</p>
                  <p style={styles.resultWhy}>Warum passt das? {alt.why_fit}</p>
                  <div style={styles.sources}>
                    {alt.sources && alt.sources.length > 0 ? (
                      alt.sources.map((src) => (
                        <a key={src} href={src} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                          {sourceLabel(src)}
                        </a>
                      ))
                    ) : (
                      <span style={styles.resultMeta}>Keine Quellen gefunden.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}

            <div style={styles.buttonRow}>
              <button type="button" style={styles.secondary} onClick={() => setStep("B")}
                disabled={loading}
              >
                Eingaben anpassen
              </button>
              <button type="button" style={styles.primary} onClick={runGenerate} disabled={loading}>
                {loading ? "Generiere…" : "Neue Vorschläge"}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
