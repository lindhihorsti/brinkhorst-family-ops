"use client";

import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../lib/errors";
import { getWeeklyPlanHref } from "../lib/weekly-plan-links.mjs";
import { BtnLink, ConfirmModal, Page, StarRating, styles } from "../lib/ui";

type DayEntry = {
  day: number;
  label: string;
  kind: "recipe" | "dummy" | "empty";
  recipe_id: string | null;
  title: string;
  source_url?: string | null;
  rating?: number | null;
};

type PlanPayload = {
  days: DayEntry[];
  raw_days: Record<string, string>;
  message: string;
};

type DraftPayload = {
  requested_swaps: number[];
  proposed_days: DayEntry[];
  raw_proposed_days: Record<string, string>;
  message: string;
};

type WeeklyCurrent = {
  ok: boolean;
  week_start: string;
  has_plan: boolean;
  has_draft: boolean;
  plan: PlanPayload | null;
  draft: DraftPayload | null;
  message?: string;
  warning?: string;
};

type WeeklySwapResponse = {
  ok: boolean;
  week_start: string;
  draft?: DraftPayload | null;
  message?: string;
};

const daysList = [
  { day: 1, label: "Mo" },
  { day: 2, label: "Di" },
  { day: 3, label: "Mi" },
  { day: 4, label: "Do" },
  { day: 5, label: "Fr" },
  { day: 6, label: "Sa" },
  { day: 7, label: "So" },
];

const cardStyles: Record<string, React.CSSProperties> = {
  section: { ...styles.card, marginBottom: 14 },
  buttonRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  muted: { fontSize: 12, color: "var(--fg-muted)" },
  grid: { display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" },
  dayCard: {
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: 12,
    background: "var(--bg-subtle)",
  },
  dayLabel: { fontSize: 12, fontWeight: 800, marginBottom: 6, color: "var(--fg-muted)" },
  dayTitle: { fontSize: 14, fontWeight: 700, lineHeight: 1.2, color: "var(--fg)" },
  messageBox: {
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: 12,
    background: "var(--bg-subtle)",
    fontSize: 12,
    whiteSpace: "pre-wrap",
    color: "var(--fg)",
  },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  toggleRow: { display: "flex", gap: 8, marginTop: 10 },
};

function addDays(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function formatDateRangeLabel(isoDate: string): string {
  const dt = new Date(`${isoDate}T00:00:00`);
  return dt.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isoWeekNumber(isoDate: string): number | null {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function DayGrid({ days }: { days: DayEntry[] }) {
  return (
    <div style={cardStyles.grid}>
      {days.map((d) => {
        const href = getWeeklyPlanHref(d);
        const content = (
          <>
            <div style={cardStyles.dayLabel}>{d.label}</div>
            <div style={{ ...cardStyles.dayTitle, textDecoration: href ? "underline" : "none", textUnderlineOffset: href ? 3 : undefined }}>
              {d.title}
            </div>
            <div style={{ marginTop: 6 }}>
              <StarRating value={d.rating == null ? 0 : Number(d.rating)} readonly size={14} />
            </div>
          </>
        );

        if (!href) {
          return (
            <div key={d.day} style={cardStyles.dayCard}>
              {content}
            </div>
          );
        }

        return (
          <a
            key={d.day}
            href={href}
            style={{ ...cardStyles.dayCard, textDecoration: "none", color: "inherit", display: "block" }}
            target="_blank"
            rel="noreferrer noopener"
          >
            {content}
          </a>
        );
      })}
    </div>
  );
}

export default function WeeklyPlanPage() {
  const [current, setCurrent] = useState<WeeklyCurrent | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(null);

  const [planLoading, setPlanLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [swapStep, setSwapStep] = useState<"closed" | "select" | "preview">("closed");
  const [swapError, setSwapError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [swapDraft, setSwapDraft] = useState<DraftPayload | null>(null);

  const [planWarning, setPlanWarning] = useState<string | null>(null);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);

  const weekStart = current?.week_start ?? "—";
  const weekEnd = current?.week_start ? addDays(current.week_start, 6) : null;
  const calendarWeek = current?.week_start ? isoWeekNumber(current.week_start) : null;

  const planDays = current?.plan?.days ?? [];
  const draftDays = swapDraft?.proposed_days ?? [];

  const canSwap = current?.has_plan === true;

  const loadCurrent = async () => {
    setLoadingCurrent(true);
    setCurrentError(null);
    try {
      const res = await fetch("/api/weekly/current", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as WeeklyCurrent;
      setCurrent(data);
    } catch (e) {
      setCurrentError(getErrorMessage(e, "Fehler beim Laden"));
    } finally {
      setLoadingCurrent(false);
    }
  };

  useEffect(() => {
    loadCurrent();
  }, []);

  useEffect(() => {
    if (current?.has_draft && current.draft) {
      setSwapDraft(current.draft);
      setSwapStep("preview");
      return;
    }
    if (current && !current.has_draft) {
      setSwapDraft(null);
      setSwapStep("closed");
    }
  }, [current]);

  const createPlan = async () => {
    setPlanLoading(true);
    setCurrentError(null);
    setPlanWarning(null);
    try {
      const res = await fetch("/api/weekly/plan?notify=1", { method: "POST" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as WeeklyCurrent;
      setCurrent(data);
      if (data.warning) {
        setPlanWarning(data.warning);
      }
    } catch (e) {
      setCurrentError(getErrorMessage(e, "Fehler beim Planen"));
    } finally {
      setPlanLoading(false);
    }
  };

  const handlePlan = async () => {
    if (current?.has_plan) {
      setConfirmReplaceOpen(true);
      return;
    }
    await createPlan();
  };

  const handleSwapPreview = async () => {
    setSwapLoading(true);
    setSwapError(null);
    try {
      const res = await fetch("/api/weekly/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: selectedDays }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as WeeklySwapResponse;
      if (!data.ok) {
        setSwapError(data.message ?? "Swap nicht möglich");
        return;
      }
      if (data.draft) {
        setSwapDraft(data.draft);
        setSwapStep("preview");
        setCurrent((prev) => (prev ? { ...prev, has_draft: true, draft: data.draft ?? null } : prev));
      }
    } catch (e) {
      setSwapError(getErrorMessage(e, "Fehler beim Swap"));
    } finally {
      setSwapLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirmLoading(true);
    setSwapError(null);
    try {
      const res = await fetch("/api/weekly/confirm", { method: "POST" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as WeeklyCurrent;
      if (!data.ok) {
        setSwapError(data.message ?? "Kein Draft vorhanden");
        return;
      }
      setCurrent(data);
      setSwapStep("closed");
      setSelectedDays([]);
      setSwapDraft(null);
    } catch (e) {
      setSwapError(getErrorMessage(e, "Fehler beim Bestätigen"));
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    setSwapError(null);
    try {
      const res = await fetch("/api/weekly/cancel", { method: "POST" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      await res.json();
      setSwapStep("closed");
      setSelectedDays([]);
      setSwapDraft(null);
      await loadCurrent();
    } catch (e) {
      setSwapError(getErrorMessage(e, "Fehler beim Abbrechen"));
    } finally {
      setCancelLoading(false);
    }
  };

  const swapDayLabel = useMemo(() => {
    if (!selectedDays.length) return "Keine Tage gewählt";
    return selectedDays
      .slice()
      .sort((a, b) => a - b)
      .map((d) => daysList.find((x) => x.day === d)?.label ?? String(d))
      .join(", ");
  }, [selectedDays]);

  return (
    <Page title="Wochenplan" subtitle="Aktueller Plan serverseitig gespeichert" right={<BtnLink href="/kueche">Küche</BtnLink>} navCurrent="/kueche" icon="📅" iconAccent="#e8673a">
      <div style={cardStyles.section}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800 }}>Aktueller Plan</div>
            {calendarWeek && weekEnd ? (
              <div style={{ ...cardStyles.muted, marginTop: 4 }}>
                KW {calendarWeek} · {formatDateRangeLabel(weekStart)} bis {formatDateRangeLabel(weekEnd)}
              </div>
            ) : null}
          </div>
          {loadingCurrent ? <div style={{ ...cardStyles.muted, opacity: 0.8 }}>Lade aktuellen Plan…</div> : null}
        </div>
        {current?.has_plan ? (
          <DayGrid days={planDays} />
        ) : (
          <div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              {current?.message ?? "Noch kein Plan vorhanden."}
            </div>
            <button style={styles.buttonPrimary} onClick={handlePlan} disabled={planLoading}>
              {planLoading ? "Plane…" : "Plan erstellen"}
            </button>
          </div>
        )}
        {currentError ? (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--danger)" }}>{currentError}</div>
        ) : null}
        {planWarning ? (
          <div style={{ marginTop: 10, fontSize: 12 }}>{planWarning}</div>
        ) : null}
      </div>

      {(swapStep !== "closed" || current?.has_draft) && (
      <div style={cardStyles.section}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Swap-Assistent</div>
        {!canSwap ? (
          <div style={{ fontSize: 13 }}>Erst planen, dann swap.</div>
        ) : swapStep === "select" ? (
          <div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              Tage auswählen ({swapDayLabel})
            </div>
            {planDays.map((d) => (
              <label key={d.day} style={cardStyles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={selectedDays.includes(d.day)}
                  onChange={(e) => {
                    setSelectedDays((prev) =>
                      e.target.checked
                        ? Array.from(new Set([...prev, d.day]))
                        : prev.filter((x) => x !== d.day)
                    );
                  }}
                />
                <span>
                  <strong>{d.label}</strong> · {d.title}
                </span>
              </label>
            ))}
            <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
              <button
                style={styles.buttonPrimary}
                onClick={handleSwapPreview}
                disabled={swapLoading || selectedDays.length === 0}
              >
                {swapLoading ? "Erzeuge…" : "Vorschau erzeugen"}
              </button>
              <button
                style={styles.button}
                onClick={() => {
                  setSwapStep("closed");
                  setSelectedDays([]);
                }}
              >
                Schließen
              </button>
            </div>
          </div>
        ) : swapStep === "preview" && swapDraft ? (
          <div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>Vorschau</div>
            <DayGrid days={draftDays} />
            <div style={{ fontSize: 13, marginTop: 14, marginBottom: 8 }}>
              Tage für erneuten Tausch auswählen:
            </div>
            {draftDays.map((d) => (
              <label key={`reroll-${d.day}`} style={cardStyles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={selectedDays.includes(d.day)}
                  onChange={(e) => {
                    setSelectedDays((prev) =>
                      e.target.checked
                        ? Array.from(new Set([...prev, d.day]))
                        : prev.filter((x) => x !== d.day)
                    );
                  }}
                />
                <span>
                  <strong>{d.label}</strong> · {d.title}
                </span>
              </label>
            ))}
            <div style={{ marginTop: 10, ...cardStyles.messageBox }}>{swapDraft.message}</div>
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                style={styles.button}
                onClick={handleSwapPreview}
                disabled={swapLoading || selectedDays.length === 0}
              >
                {swapLoading ? "Erzeuge…" : "Erneut würfeln"}
              </button>
              <button style={styles.buttonPrimary} onClick={handleConfirm} disabled={confirmLoading}>
                {confirmLoading ? "Bestätige…" : "Bestätigen"}
              </button>
              <button style={styles.buttonDanger} onClick={handleCancel} disabled={cancelLoading}>
                {cancelLoading ? "Verwerfe…" : "Abbrechen"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              Tausche einzelne Tage gegen neue Vorschläge.
            </div>
            <button style={styles.button} onClick={() => setSwapStep("select")}>
              Tausch starten
            </button>
          </div>
        )}
        {swapError ? (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--danger)" }}>{swapError}</div>
        ) : null}
      </div>
      )}

      <div style={{ ...cardStyles.section, marginTop: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Aktionen</div>
        <div style={cardStyles.buttonRow}>
          <button style={styles.buttonPrimary} onClick={handlePlan} disabled={planLoading}>
            {planLoading ? "Plane…" : current?.has_plan ? "Plan neu erstellen" : "Plan erstellen"}
          </button>
          <BtnLink href="/weekly-plan/history">Historie</BtnLink>
          <button
            style={styles.button}
            onClick={() => {
              setSwapError(null);
              setSwapStep((s) => (s === "closed" ? "select" : s));
            }}
            disabled={!canSwap}
          >
            Tauschen
          </button>
        </div>
        {!canSwap ? <div style={{ ...cardStyles.muted, marginTop: 8 }}>Sobald ein Plan existiert, kannst du einzelne Tage tauschen.</div> : null}
      </div>

      <ConfirmModal
        open={confirmReplaceOpen}
        title="Vorhandenen Plan ersetzen?"
        message="Für diese Woche existiert bereits ein Plan. Willst du ihn wirklich neu erstellen und damit überschreiben?"
        confirmLabel={planLoading ? "Plane…" : "Ja, ersetzen"}
        onConfirm={async () => {
          setConfirmReplaceOpen(false);
          await createPlan();
        }}
        onClose={() => setConfirmReplaceOpen(false)}
      />
    </Page>
  );
}
