"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../../lib/errors";
import { BottomNav } from "../../lib/ui";

type Birthday = {
  id: string;
  name: string;
  birth_date: string;
  relation: string;
  gift_ideas: string[];
  notes: string;
  age_next: number;
  days_until: number;
};

type BirthdaySettings = {
  gift_default_occasion: string;
  gift_budget_range: string;
  gift_preferred_types: string[];
  gift_no_goes: string[];
};

type GiftIdea = {
  title: string;
  category: string;
  price_hint: string;
  why_fit: string;
  buy_tip: string;
};

const DEFAULT_SETTINGS: BirthdaySettings = {
  gift_default_occasion: "Geburtstag",
  gift_budget_range: "25-50 CHF",
  gift_preferred_types: ["Erlebnis", "Kreativ", "Spielzeug"],
  gift_no_goes: ["zu laut", "zu groß"],
};

const OCCASIONS = ["Geburtstag", "Weihnachten", "Mitbringsel", "Kleines Extra", "Besonderer Meilenstein"];
const BUDGETS = ["unter 20 CHF", "25-50 CHF", "50-80 CHF", "80+ CHF"];
const GIFT_TYPES = ["Erlebnis", "Kreativ", "Buch", "Spielzeug", "Praktisch", "Gemeinsam", "Langlebig", "Personalisiert"];
const INTERESTS = ["Tiere", "Fahrzeuge", "Bauen", "Basteln", "Musik", "Bücher", "Rollenspiel", "Draußen", "Sensorik", "Wasser"];
const CONSTRAINTS = ["kein Lärm", "kein Bildschirm", "nicht zu groß", "kleine Wohnung", "nicht aus Plastik", "lange nutzbar", "schnell verfügbar", "für drinnen geeignet"];

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
    background: "color-mix(in srgb, #f97316 16%, var(--bg))",
    borderColor: "#f97316",
  },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    border: "1px solid #f97316",
    background: "#f97316",
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
    minHeight: 96,
    fontSize: 15,
  },
  input: {
    width: "100%",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: "12px 14px",
    background: "var(--bg)",
    color: "var(--fg)",
    fontSize: 15,
  },
};

function ToggleChip({
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

function toggleValue(values: string[], value: string) {
  const next = new Set(values);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return Array.from(next);
}

export default function GeschenkideenPage() {
  const params = useSearchParams();
  const preselectedBirthdayId = params.get("birthday_id") || "";
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [settings, setSettings] = useState<BirthdaySettings>(DEFAULT_SETTINGS);
  const [selectedBirthdayId, setSelectedBirthdayId] = useState(preselectedBirthdayId);
  const [recipientName, setRecipientName] = useState("");
  const [ageYears, setAgeYears] = useState<string>("");
  const [relation, setRelation] = useState("Familie");
  const [occasion, setOccasion] = useState(DEFAULT_SETTINGS.gift_default_occasion);
  const [budgetRange, setBudgetRange] = useState(DEFAULT_SETTINGS.gift_budget_range);
  const [giftTypes, setGiftTypes] = useState<string[]>(DEFAULT_SETTINGS.gift_preferred_types);
  const [interests, setInterests] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>(DEFAULT_SETTINGS.gift_no_goes);
  const [freeText, setFreeText] = useState("");
  const [step, setStep] = useState<"A" | "B" | "C" | "D">("A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<GiftIdea[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [birthdayRes, settingsRes] = await Promise.all([
          fetch("/api/birthdays", { cache: "no-store" }),
          fetch("/api/birthdays/settings", { cache: "no-store" }),
        ]);
        const birthdayData = await birthdayRes.json();
        const settingsData = await settingsRes.json();
        if (birthdayData.ok) setBirthdays(birthdayData.birthdays ?? []);
        if (settingsData.settings) {
          const merged = { ...DEFAULT_SETTINGS, ...settingsData.settings };
          setSettings(merged);
          setOccasion(merged.gift_default_occasion);
          setBudgetRange(merged.gift_budget_range);
          setGiftTypes(merged.gift_preferred_types);
          setConstraints(merged.gift_no_goes);
        }
      } catch (e) {
        setError(getErrorMessage(e, "Fehler beim Laden"));
      }
    };
    load();
  }, []);

  const selectedBirthday = useMemo(
    () => birthdays.find((birthday) => birthday.id === selectedBirthdayId) || null,
    [birthdays, selectedBirthdayId]
  );

  useEffect(() => {
    if (!selectedBirthday) return;
    setRecipientName(selectedBirthday.name);
    setAgeYears(String(selectedBirthday.age_next || ""));
    setRelation(selectedBirthday.relation || "Familie");
    setFreeText(selectedBirthday.notes || "");
  }, [selectedBirthday]);

  const payload = useMemo(() => ({
    birthday_id: selectedBirthdayId || null,
    recipient_name: selectedBirthdayId ? undefined : recipientName.trim(),
    age_years: ageYears.trim() ? Number(ageYears) : undefined,
    relation,
    occasion,
    budget_range: budgetRange,
    interests,
    gift_types: giftTypes,
    constraints,
    free_text: freeText.trim(),
    settings_snapshot: settings,
  }), [selectedBirthdayId, recipientName, ageYears, relation, occasion, budgetRange, interests, giftTypes, constraints, freeText, settings]);

  const runGenerate = async () => {
    if (!selectedBirthdayId && !recipientName.trim()) {
      setError("Bitte wähle zuerst eine Person oder gib einen Namen ein.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    setStep("D");
    try {
      const res = await fetch("/api/birthdays/gift-ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `${res.status}`);
      setIdeas(data.ideas ?? []);
    } catch (e) {
      setError(getErrorMessage(e, "Fehler bei der Generierung"));
      setStep("C");
    } finally {
      setLoading(false);
    }
  };

  const saveIdea = async (idea: GiftIdea) => {
    if (!selectedBirthday) {
      setError("Zum Speichern bitte zuerst einen bestehenden Geburtstag auswählen.");
      return;
    }
    setError(null);
    setSuccess(null);
    const nextIdeas = Array.from(new Set([...(selectedBirthday.gift_ideas || []), idea.title]));
    try {
      const res = await fetch(`/api/birthdays/${selectedBirthday.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gift_ideas: nextIdeas }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) throw new Error(data?.error || data?.detail || `${res.status}`);
      setBirthdays((current) => current.map((birthday) => (
        birthday.id === selectedBirthday.id ? { ...birthday, gift_ideas: nextIdeas } : birthday
      )));
      setSuccess(`"${idea.title}" wurde bei ${selectedBirthday.name} gespeichert.`);
    } catch (e) {
      setError(getErrorMessage(e, "Speichern fehlgeschlagen"));
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
            background: "linear-gradient(180deg, #f9731622 0%, #f9731640 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 60,
            boxShadow: "var(--shadow-md)",
          }}>
            🎁
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 22 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f97316" }}>
              Geschenkideen
            </p>
            <h1 style={{ margin: "8px 0 0", fontSize: 28, lineHeight: 1.08 }}>Was wäre diesmal wirklich passend?</h1>
            <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--fg-muted)" }}>
              Ein kurzer Flow für drei Geschenkideen, die Anlass, Budget, Persönlichkeit und No-Gos mitdenken.
            </p>
          </div>
          <Link href="/geburtstage" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 999, border: "1px solid var(--border)", padding: "8px 12px",
            fontSize: 13, fontWeight: 700, color: "var(--fg)", textDecoration: "none",
          }}>
            Übersicht
          </Link>
        </div>

        {step === "A" ? (
          <section style={{ ...styles.card, marginBottom: 14 }}>
            <div style={styles.label}>1. Für wen ist das Geschenk?</div>
            <div style={{ display: "grid", gap: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Schnellauswahl aus Geburtstagen</div>
                <div style={styles.chipRow}>
                  {birthdays.slice(0, 8).map((birthday) => (
                    <ToggleChip key={birthday.id} active={selectedBirthdayId === birthday.id} onClick={() => setSelectedBirthdayId(birthday.id)}>
                      {birthday.name}
                    </ToggleChip>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 8 }}>
                  Oder manuell ausfüllen, wenn die Person noch nicht in der Geburtstagsliste liegt.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Name</label>
                <input
                  value={recipientName}
                  onChange={(event) => {
                    setSelectedBirthdayId("");
                    setRecipientName(event.target.value);
                  }}
                  style={styles.input}
                  placeholder="z. B. Leni"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Alter</label>
                  <input value={ageYears} onChange={(event) => setAgeYears(event.target.value)} style={styles.input} placeholder="3" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Beziehung</label>
                  <input value={relation} onChange={(event) => setRelation(event.target.value)} style={styles.input} placeholder="Familie" />
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
            <div style={styles.label}>2. Anlass, Budget und Richtung</div>
            <div style={{ display: "grid", gap: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Anlass</div>
                <div style={styles.chipRow}>
                  {OCCASIONS.map((option) => (
                    <ToggleChip key={option} active={occasion === option} onClick={() => setOccasion(option)}>
                      {option}
                    </ToggleChip>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Budgetrahmen</div>
                <div style={styles.chipRow}>
                  {BUDGETS.map((option) => (
                    <ToggleChip key={option} active={budgetRange === option} onClick={() => setBudgetRange(option)}>
                      {option}
                    </ToggleChip>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Welche Art Geschenk wäre schön?</div>
                <div style={styles.chipRow}>
                  {GIFT_TYPES.map((option) => (
                    <ToggleChip key={option} active={giftTypes.includes(option)} onClick={() => setGiftTypes(toggleValue(giftTypes, option))}>
                      {option}
                    </ToggleChip>
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

        {step === "C" ? (
          <section style={{ ...styles.card, marginBottom: 14 }}>
            <div style={styles.label}>3. Interessen und Guardrails</div>
            <div style={{ display: "grid", gap: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Was begeistert die Person gerade?</div>
                <div style={styles.chipRow}>
                  {INTERESTS.map((option) => (
                    <ToggleChip key={option} active={interests.includes(option)} onClick={() => setInterests(toggleValue(interests, option))}>
                      {option}
                    </ToggleChip>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Was soll eher vermieden werden?</div>
                <div style={styles.chipRow}>
                  {CONSTRAINTS.map((option) => (
                    <ToggleChip key={option} active={constraints.includes(option)} onClick={() => setConstraints(toggleValue(constraints, option))}>
                      {option}
                    </ToggleChip>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
                  Noch ein hilfreicher Hinweis?
                </label>
                <textarea
                  value={freeText}
                  onChange={(event) => setFreeText(event.target.value)}
                  style={styles.textarea}
                  placeholder="z. B. liebt aktuell Pferde, hat schon viele Kuscheltiere, gern etwas für gemeinsame Zeit"
                />
              </div>
            </div>

            {error ? <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 12 }}>{error}</p> : null}

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="button" style={styles.secondary} onClick={() => setStep("B")} disabled={loading}>Zurück</button>
              <button type="button" style={styles.primary} onClick={runGenerate} disabled={loading}>
                {loading ? "Denke nach…" : "Drei Ideen finden"}
              </button>
            </div>
          </section>
        ) : null}

        {step === "D" && loading ? (
          <section style={{ ...styles.card, marginBottom: 14 }}>
            <div style={styles.label}>AI denkt mit</div>
            <p style={{ margin: 0, fontSize: 15 }}>
              Wir kombinieren Anlass, Budget, Interessen und Guardrails gerade zu drei passenden Geschenkideen.
            </p>
          </section>
        ) : null}

        {step === "D" && !loading ? (
          <section style={{ display: "grid", gap: 14 }}>
            {ideas.map((idea, index) => (
              <article key={`${idea.title}-${index}`} style={{ ...styles.card, paddingBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f97316" }}>
                      Idee {index + 1}
                    </p>
                    <h2 style={{ margin: "8px 0 0", fontSize: 22, lineHeight: 1.12 }}>{idea.title}</h2>
                  </div>
                  <div style={{
                    borderRadius: 999,
                    padding: "6px 10px",
                    background: "color-mix(in srgb, #f97316 14%, var(--bg))",
                    color: "#f97316",
                    fontSize: 12,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}>
                    {idea.price_hint}
                  </div>
                </div>

                <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--fg-muted)" }}>
                  {idea.category}
                </p>

                <div style={{ marginTop: 14 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Warum passt das?
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.5 }}>{idea.why_fit}</p>
                </div>

                <div style={{
                  marginTop: 16,
                  borderRadius: 18,
                  padding: 14,
                  background: "linear-gradient(180deg, color-mix(in srgb, #f97316 10%, var(--bg)) 0%, color-mix(in srgb, #f97316 16%, var(--bg-subtle)) 100%)",
                  border: "1px solid color-mix(in srgb, #f97316 22%, var(--border))",
                }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Kaufhinweis
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.45 }}>{idea.buy_tip}</p>
                </div>

                {selectedBirthday ? (
                  <div style={{ marginTop: 16 }}>
                    <button type="button" style={styles.secondary} onClick={() => saveIdea(idea)}>
                      Bei {selectedBirthday.name} speichern
                    </button>
                  </div>
                ) : null}
              </article>
            ))}

            {error ? <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p> : null}
            {success ? <p style={{ color: "var(--success)", fontSize: 12 }}>{success}</p> : null}

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
      <BottomNav current="/geburtstage" />
    </main>
  );
}
