"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../../lib/errors";
import { BottomNav } from "../../lib/ui";

type ActivitiesSettings = {
  home_duration_min: number;
  home_energy: "ruhig" | "mittel" | "wild";
  home_mess_level: "sauber" | "egal" | "chaos_ok";
  home_space: "wohnzimmer" | "kinderzimmer" | "klein" | "egal";
  home_parent_energy: "niedrig" | "mittel" | "hoch";
  home_materials: string[];
  home_types: string[];
};

type HomeAlternative = {
  title: string;
  setup_minutes: number;
  duration_hint: string;
  mess_level: string;
  energy_level: string;
  materials: string[];
  steps: string[];
  why_fit: string;
  parent_tip: string;
};

const DEFAULT_SETTINGS: ActivitiesSettings = {
  home_duration_min: 30,
  home_energy: "mittel",
  home_mess_level: "egal",
  home_space: "wohnzimmer",
  home_parent_energy: "mittel",
  home_materials: ["Bücher", "Bausteine", "Kissen", "Klebeband", "Papier"],
  home_types: ["Bewegung", "Rollenspiel", "Bauen"],
};

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90] as const;
const ENERGY_OPTIONS = [
  { value: "ruhig", label: "Ruhig", note: "Lesen, Rollen, kleine Hände beschäftigen" },
  { value: "mittel", label: "Ausgeglichen", note: "Etwas tun, aber ohne Dauer-Action" },
  { value: "wild", label: "Vollgas", note: "Bewegung, Klettern, Kissen, Parcours" },
] as const;
const PARENT_OPTIONS = [
  { value: "niedrig", label: "Ich bin platt" },
  { value: "mittel", label: "Ich mache mit" },
  { value: "hoch", label: "Ich habe Lust auf Action" },
] as const;
const MESS_OPTIONS = [
  { value: "sauber", label: "Bitte sauber" },
  { value: "egal", label: "Etwas Chaos ist okay" },
  { value: "chaos_ok", label: "Heute darf es krachen" },
] as const;
const SPACE_OPTIONS = [
  { value: "wohnzimmer", label: "Wohnzimmer" },
  { value: "kinderzimmer", label: "Kinderzimmer" },
  { value: "klein", label: "Wenig Platz" },
  { value: "egal", label: "Egal" },
] as const;
const THEME_OPTIONS = ["Bewegung", "Bauen", "Rollenspiel", "Basteln", "Musik", "Sensorik", "Geschichten", "Mini-Experimente"];
const MATERIAL_OPTIONS = ["Papier", "Stifte", "Klebeband", "Kissen", "Decken", "Bücher", "Bausteine", "Becher", "Schüsseln", "Wäscheklammern"];
const MOOD_OPTIONS = ["etwas Neues", "viel Lachen", "gemeinsam kuschelig", "energie rauslassen", "konzentriert spielen"];
const GOAL_OPTIONS = ["20 Minuten überbrücken", "einen echten Wow-Moment", "etwas Lernen ohne Unterrichtsgefühl", "zusammen lachen", "später besser einschlafen"];

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: "radial-gradient(circle at top, color-mix(in srgb, var(--bg-subtle) 55%, transparent) 0%, var(--bg) 58%)",
    color: "var(--fg)",
    fontFamily: "var(--font)",
    paddingBottom: "var(--nav-height)",
  },
  container: { maxWidth: 430, margin: "0 auto", padding: "18px 22px 44px" },
  card: {
    border: "1px solid var(--border)",
    borderRadius: 24,
    padding: 18,
    background: "var(--bg)",
    boxShadow: "var(--shadow-md)",
  },
  label: { fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: 10 },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    border: "1px solid var(--border)",
    borderRadius: 999,
    padding: "8px 12px",
    background: "var(--bg)",
    color: "var(--fg)",
    fontSize: 13,
    cursor: "pointer",
  },
  chipActive: {
    background: "color-mix(in srgb, #ef7d43 16%, var(--bg))",
    borderColor: "#ef7d43",
  },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    border: "1px solid #ef7d43",
    background: "#ef7d43",
    color: "white",
    padding: "12px 16px",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
  },
  secondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--fg)",
    padding: "12px 16px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  textarea: {
    width: "100%",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "12px 14px",
    background: "var(--bg)",
    color: "var(--fg)",
    minHeight: 92,
    fontSize: 15,
  },
};

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={{ ...styles.chip, ...(active ? styles.chipActive : null) }}>
      {children}
    </button>
  );
}

export default function IdeenZuhausePage() {
  const [settings, setSettings] = useState<ActivitiesSettings>(DEFAULT_SETTINGS);
  const [step, setStep] = useState<"A" | "B" | "C" | "D">("A");
  const [initialized, setInitialized] = useState(false);
  const [durationMin, setDurationMin] = useState<number>(30);
  const [childEnergy, setChildEnergy] = useState<ActivitiesSettings["home_energy"]>("mittel");
  const [parentEnergy, setParentEnergy] = useState<ActivitiesSettings["home_parent_energy"]>("mittel");
  const [messLevel, setMessLevel] = useState<ActivitiesSettings["home_mess_level"]>("egal");
  const [space, setSpace] = useState<ActivitiesSettings["home_space"]>("wohnzimmer");
  const [mood, setMood] = useState("etwas Neues");
  const [goal, setGoal] = useState("zusammen lachen");
  const [themes, setThemes] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<HomeAlternative[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/activities/settings", { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status}`);
        const d = await res.json();
        if (d.settings) setSettings({ ...DEFAULT_SETTINGS, ...d.settings });
      } catch (e) {
        setError(getErrorMessage(e, "Fehler beim Laden"));
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (initialized) return;
    setDurationMin(settings.home_duration_min || 30);
    setChildEnergy(settings.home_energy || "mittel");
    setParentEnergy(settings.home_parent_energy || "mittel");
    setMessLevel(settings.home_mess_level || "egal");
    setSpace(settings.home_space || "wohnzimmer");
    setThemes(settings.home_types || []);
    setMaterials(settings.home_materials || []);
    setInitialized(true);
  }, [initialized, settings]);

  const payload = useMemo(
    () => ({
      duration_min: durationMin,
      child_energy: childEnergy,
      mess_level: messLevel,
      space,
      parent_energy: parentEnergy,
      mood,
      goal,
      themes,
      materials,
      free_text: freeText,
      settings_snapshot: settings,
    }),
    [durationMin, childEnergy, messLevel, space, parentEnergy, mood, goal, themes, materials, freeText, settings]
  );

  const toggleListItem = (current: string[], value: string, setter: (next: string[]) => void) => {
    const set = new Set(current);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    setter(Array.from(set));
  };

  const runGenerate = async () => {
    setLoading(true);
    setError(null);
    setStep("C");
    try {
      const res = await fetch("/api/activities/home/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `${res.status}`);
      setAlternatives(data.alternatives ?? []);
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
      <div style={styles.container}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{
            width: 108,
            height: 108,
            borderRadius: 32,
            background: "linear-gradient(180deg, #ef7d4322 0%, #ef7d4340 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 60,
            boxShadow: "var(--shadow-md)",
          }}>
            🧸
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 22 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ef7d43" }}>
              Zuhause
            </p>
            <h1 style={{ margin: "8px 0 0", fontSize: 28, lineHeight: 1.08 }}>Was spielen wir drinnen?</h1>
            <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--fg-muted)" }}>
              Ein kurzer Guided Flow für Wohnungstage mit wenig Wetter und viel Fantasie.
            </p>
          </div>
          <Link href="/ideen" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 999, border: "1px solid var(--border)", padding: "8px 12px",
            fontSize: 13, fontWeight: 700, color: "var(--fg)", textDecoration: "none",
          }}>
            Übersicht
          </Link>
        </div>

        {step === "A" ? (
          <section style={{ ...styles.card, marginBottom: 14 }}>
            <div style={styles.label}>1. Wie fühlt sich der Nachmittag an?</div>
            <div style={{ display: "grid", gap: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Wie viel Energie hat Leni?</div>
                <div style={styles.chipRow}>
                  {ENERGY_OPTIONS.map((option) => (
                    <Chip key={option.value} active={childEnergy === option.value} onClick={() => setChildEnergy(option.value)}>
                      {option.label}
                    </Chip>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 8 }}>
                  {ENERGY_OPTIONS.find((option) => option.value === childEnergy)?.note}
                </p>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Wie viel Energie hast du selbst?</div>
                <div style={styles.chipRow}>
                  {PARENT_OPTIONS.map((option) => (
                    <Chip key={option.value} active={parentEnergy === option.value} onClick={() => setParentEnergy(option.value)}>
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Welches Gefühl soll rauskommen?</div>
                <div style={styles.chipRow}>
                  {MOOD_OPTIONS.map((option) => (
                    <Chip key={option} active={mood === option} onClick={() => setMood(option)}>
                      {option}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="button" style={styles.primary} onClick={() => setStep("B")}>Weiter</button>
            </div>
          </section>
        ) : null}

        {step === "B" ? (
          <section style={{ ...styles.card, marginBottom: 14 }}>
            <div style={styles.label}>2. Rahmen & Material</div>
            <div style={{ display: "grid", gap: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Wie lange soll es ungefähr tragen?</div>
                <div style={styles.chipRow}>
                  {DURATION_OPTIONS.map((option) => (
                    <Chip key={option} active={durationMin === option} onClick={() => setDurationMin(option)}>
                      {option} Min
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Wieviel Chaos darf entstehen?</div>
                <div style={styles.chipRow}>
                  {MESS_OPTIONS.map((option) => (
                    <Chip key={option.value} active={messLevel === option.value} onClick={() => setMessLevel(option.value)}>
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Wo spielt sich das ab?</div>
                <div style={styles.chipRow}>
                  {SPACE_OPTIONS.map((option) => (
                    <Chip key={option.value} active={space === option.value} onClick={() => setSpace(option.value)}>
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Was ist ungefähr da?</div>
                <div style={styles.chipRow}>
                  {MATERIAL_OPTIONS.map((option) => (
                    <Chip key={option} active={materials.includes(option)} onClick={() => toggleListItem(materials, option, setMaterials)}>
                      {option}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="button" style={styles.secondary} onClick={() => setStep("A")} disabled={loading}>Zurück</button>
              <button type="button" style={styles.primary} onClick={() => setStep("C")}>Weiter</button>
            </div>
          </section>
        ) : null}

        {step === "C" && !loading && alternatives.length === 0 ? (
          <section style={{ ...styles.card, marginBottom: 14 }}>
            <div style={styles.label}>3. Der kreative Feinschliff</div>
            <div style={{ display: "grid", gap: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Welche Richtung wäre schön?</div>
                <div style={styles.chipRow}>
                  {THEME_OPTIONS.map((option) => (
                    <Chip key={option} active={themes.includes(option)} onClick={() => toggleListItem(themes, option, setThemes)}>
                      {option}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Was soll die Idee heute schaffen?</div>
                <div style={styles.chipRow}>
                  {GOAL_OPTIONS.map((option) => (
                    <Chip key={option} active={goal === option} onClick={() => setGoal(option)}>
                      {option}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
                  Noch ein extra Hinweis?
                </label>
                <textarea
                  value={freeText}
                  onChange={(event) => setFreeText(event.target.value)}
                  style={styles.textarea}
                  placeholder="z. B. wenig Vorbereitungszeit, nicht zu laut, gerne mit Höhle bauen"
                />
              </div>
            </div>

            {error ? <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 12 }}>{error}</p> : null}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="button" style={styles.secondary} onClick={() => setStep("B")} disabled={loading}>Zurück</button>
              <button type="button" style={styles.primary} onClick={runGenerate} disabled={loading}>
                {loading ? "Denke nach…" : "Ideen zaubern"}
              </button>
            </div>
          </section>
        ) : null}

        {step === "C" && loading ? (
          <section style={{ ...styles.card, marginBottom: 14 }}>
            <div style={styles.label}>AI denkt mit</div>
            <p style={{ margin: 0, fontSize: 15 }}>Wir bauen gerade drinnen-taugliche Ideen, die zu Stimmung, Platz und Material passen.</p>
          </section>
        ) : null}

        {step === "D" ? (
          <section style={{ display: "grid", gap: 14 }}>
            {alternatives.map((alt, index) => (
              <article key={`${alt.title}-${index}`} style={{ ...styles.card, paddingBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ef7d43" }}>
                      Idee {index + 1}
                    </p>
                    <h2 style={{ margin: "8px 0 0", fontSize: 22, lineHeight: 1.12 }}>{alt.title}</h2>
                  </div>
                  <div style={{
                    borderRadius: 999,
                    padding: "6px 10px",
                    background: "color-mix(in srgb, #ef7d43 14%, var(--bg))",
                    color: "#ef7d43",
                    fontSize: 12,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}>
                    Setup {alt.setup_minutes} Min
                  </div>
                </div>

                <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--fg-muted)" }}>
                  Dauer: {alt.duration_hint} · Energie: {alt.energy_level} · Chaos: {alt.mess_level}
                </p>

                <div style={{ marginTop: 14 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Warum passt das heute?
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.5 }}>{alt.why_fit}</p>
                </div>

                <div style={{ marginTop: 14 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Ihr braucht
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {alt.materials.map((material) => (
                      <span key={material} style={{
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border)",
                        fontSize: 12,
                      }}>
                        {material}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    So startet ihr
                  </p>
                  <ol style={{ margin: "10px 0 0", paddingLeft: 18, display: "grid", gap: 8, fontSize: 15, lineHeight: 1.45 }}>
                    {alt.steps.map((stepItem) => (
                      <li key={stepItem}>{stepItem}</li>
                    ))}
                  </ol>
                </div>

                <div style={{
                  marginTop: 16,
                  borderRadius: 18,
                  padding: 14,
                  background: "linear-gradient(180deg, color-mix(in srgb, #ef7d43 10%, var(--bg)) 0%, color-mix(in srgb, #ef7d43 16%, var(--bg-subtle)) 100%)",
                  border: "1px solid color-mix(in srgb, #ef7d43 22%, var(--border))",
                }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#ef7d43", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Eltern-Hinweis
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.45 }}>{alt.parent_tip}</p>
                </div>
              </article>
            ))}

            {error ? <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p> : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={styles.secondary} onClick={() => setStep("C")} disabled={loading}>
                Eingaben anpassen
              </button>
              <button type="button" style={styles.primary} onClick={runGenerate} disabled={loading}>
                {loading ? "Denke nach…" : "Weitere Vorschläge"}
              </button>
            </div>
          </section>
        ) : null}
      </div>
      <BottomNav current="/ideen" />
    </main>
  );
}
