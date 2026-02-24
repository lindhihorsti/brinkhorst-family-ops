"use client";

import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../lib/errors";
import { BtnLink, Page, styles } from "../lib/ui";

type DayEntry = {
  day: number;
  label: string;
  kind: "recipe" | "dummy" | "empty";
  recipe_id: string | null;
  title: string;
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

type WeeklyShopResponse = {
  ok: boolean;
  week_start: string;
  items: { name: string; count: number }[];
  buy?: { name: string; count: number }[];
  pantry_used?: { name: string; count: number }[];
  pantry_uncertain_used?: { name: string; count: number }[];
  message: string;
  warning?: string;
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
  muted: { fontSize: 12, opacity: 0.7 },
  grid: { display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" },
  dayCard: {
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 12,
    background: "#fff",
  },
  dayLabel: { fontSize: 12, fontWeight: 800, marginBottom: 6 },
  dayTitle: { fontSize: 14, fontWeight: 700, lineHeight: 1.2 },
  messageBox: {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "#fafafa",
    fontSize: 12,
    whiteSpace: "pre-wrap",
  },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  toggleRow: { display: "flex", gap: 8, marginTop: 10 },
};

function DayGrid({ days }: { days: DayEntry[] }) {
  return (
    <div style={cardStyles.grid}>
      {days.map((d) => (
        <div key={d.day} style={cardStyles.dayCard}>
          <div style={cardStyles.dayLabel}>{d.label}</div>
          <div style={cardStyles.dayTitle}>{d.title}</div>
        </div>
      ))}
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
  const [shopLoading, setShopLoading] = useState(false);

  const [swapStep, setSwapStep] = useState<"closed" | "select" | "preview">("closed");
  const [swapError, setSwapError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [swapDraft, setSwapDraft] = useState<DraftPayload | null>(null);

  const [shopError, setShopError] = useState<string | null>(null);
  const [shopWarning, setShopWarning] = useState<string | null>(null);
  const [shopData, setShopData] = useState<WeeklyShopResponse | null>(null);
  const [shopView, setShopView] = useState<"text" | "checklist">("text");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [planWarning, setPlanWarning] = useState<string | null>(null);

  const weekStart = current?.week_start ?? "—";

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

  const handlePlan = async () => {
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

  const handleShop = async () => {
    setShopLoading(true);
    setShopError(null);
    setShopWarning(null);
    try {
      const res = await fetch("/api/weekly/shop?notify=1", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as WeeklyShopResponse;
      setShopData(data);
      setChecked({});
      if (data.warning) {
        setShopWarning(data.warning);
      }
    } catch (e) {
      setShopError(getErrorMessage(e, "Fehler beim Laden der Einkaufsliste"));
    } finally {
      setShopLoading(false);
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

  const shopMessage = shopData?.message ?? "";
  const shopItems = shopData?.buy ?? shopData?.items ?? [];
  const pantryUsed = shopData?.pantry_used ?? [];
  const pantryUncertain = shopData?.pantry_uncertain_used ?? [];

  return (
    <Page title="Wochenplan" subtitle={`Woche ab ${weekStart} (Mo–So)`} right={<BtnLink href="/kueche">Back</BtnLink>}>
      <div style={{ ...cardStyles.section, marginBottom: 18 }}>
        <div style={cardStyles.buttonRow}>
          <button style={styles.buttonPrimary} onClick={handlePlan} disabled={planLoading}>
            {planLoading ? "Plane…" : "Plan"}
          </button>
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
          <button style={styles.button} onClick={handleShop} disabled={shopLoading}>
            {shopLoading ? "Lade…" : "Shop"}
          </button>
        </div>
        {loadingCurrent ? (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>Lade aktuellen Plan…</div>
        ) : null}
        {currentError ? (
          <div style={{ marginTop: 10, fontSize: 12, color: "#b91c1c" }}>{currentError}</div>
        ) : null}
        {planWarning ? (
          <div style={{ marginTop: 10, fontSize: 12 }}>{planWarning}</div>
        ) : null}
      </div>

      <div style={cardStyles.section}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Aktueller Plan</div>
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
      </div>

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
          <div style={{ marginTop: 10, fontSize: 12, color: "#b91c1c" }}>{swapError}</div>
        ) : null}
      </div>

      <div style={cardStyles.section}>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>Shop</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <button style={styles.button} onClick={handleShop} disabled={shopLoading}>
            {shopLoading ? "Lade…" : "Shop laden"}
          </button>
          <div style={cardStyles.toggleRow}>
            <button
              style={styles.button}
              onClick={() => setShopView("text")}
              disabled={shopView === "text"}
            >
              Text
            </button>
            <button
              style={styles.button}
              onClick={() => setShopView("checklist")}
              disabled={shopView === "checklist"}
            >
              Checklist
            </button>
          </div>
        </div>

        {shopError ? (
          <div style={{ marginBottom: 10, fontSize: 12, color: "#b91c1c" }}>{shopError}</div>
        ) : null}
        {shopWarning ? (
          <div style={{ marginBottom: 10, fontSize: 12 }}>{shopWarning}</div>
        ) : null}

        {shopData ? (
          shopView === "text" ? (
            <div>
              <div style={cardStyles.messageBox}>{shopMessage}</div>
              <button
                style={{ ...styles.button, marginTop: 10 }}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shopMessage);
                  } catch {
                    setShopError("Kopieren nicht möglich");
                  }
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {shopItems.length === 0 && pantryUsed.length === 0 && pantryUncertain.length === 0 ? (
                <div style={{ fontSize: 13 }}>{shopMessage}</div>
              ) : (
                <>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>To Buy</div>
                    {shopItems.length === 0 ? (
                      <div style={{ fontSize: 13 }}>Keine Items.</div>
                    ) : (
                      shopItems.map((item) => (
                        <label key={`buy-${item.name}`} style={cardStyles.checkboxRow}>
                          <input
                            type="checkbox"
                            checked={!!checked[`buy-${item.name}`]}
                            onChange={(e) =>
                              setChecked((prev) => ({
                                ...prev,
                                [`buy-${item.name}`]: e.target.checked,
                              }))
                            }
                          />
                          <span>
                            {item.name} {item.count > 1 ? `x${item.count}` : ""}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Pantry Used</div>
                    {pantryUsed.length === 0 ? (
                      <div style={{ fontSize: 13 }}>Keine Pantry-Items.</div>
                    ) : (
                      pantryUsed.map((item) => (
                        <label key={`pantry-${item.name}`} style={cardStyles.checkboxRow}>
                          <input
                            type="checkbox"
                            checked={!!checked[`pantry-${item.name}`]}
                            onChange={(e) =>
                              setChecked((prev) => ({
                                ...prev,
                                [`pantry-${item.name}`]: e.target.checked,
                              }))
                            }
                          />
                          <span>
                            {item.name} {item.count > 1 ? `x${item.count}` : ""}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Pantry Uncertain</div>
                    {pantryUncertain.length === 0 ? (
                      <div style={{ fontSize: 13 }}>Keine unsicheren Pantry-Items.</div>
                    ) : (
                      pantryUncertain.map((item) => (
                        <label key={`uncertain-${item.name}`} style={cardStyles.checkboxRow}>
                          <input
                            type="checkbox"
                            checked={!!checked[`uncertain-${item.name}`]}
                            onChange={(e) =>
                              setChecked((prev) => ({
                                ...prev,
                                [`uncertain-${item.name}`]: e.target.checked,
                              }))
                            }
                          />
                          <span>
                            {item.name} {item.count > 1 ? `x${item.count}` : ""}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )
        ) : (
          <div style={cardStyles.muted}>Noch keine Einkaufsliste geladen.</div>
        )}
      </div>
    </Page>
  );
}
