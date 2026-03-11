"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getErrorMessage } from "../../lib/errors";
import { BottomNav } from "../../lib/ui";

type DayEntry = {
  day: number;
  label: string;
  kind: "recipe" | "dummy" | "empty";
  recipe_id: string | null;
  title: string;
  source_url?: string | null;
};

type WeeklyHistoryItem = {
  week_start: string;
  week_end: string;
  calendar_week: number;
  plan: {
    days: DayEntry[];
  };
};

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function WeeklyPlanHistoryPage() {
  const [items, setItems] = useState<WeeklyHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/weekly/history", { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        setItems(data.items ?? []);
      } catch (e) {
        setError(getErrorMessage(e, "Fehler beim Laden"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      color: "var(--fg)",
      fontFamily: "var(--font)",
      paddingBottom: "var(--nav-height)",
    }}>
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "20px 22px 44px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{
            width: 108,
            height: 108,
            borderRadius: 32,
            background: "linear-gradient(180deg, #e8673a22 0%, #e8673a40 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 60,
            boxShadow: "var(--shadow-md)",
          }}>
            📅
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 22 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#e8673a" }}>
              Wochenplan
            </p>
            <h1 style={{ margin: "8px 0 0", fontSize: 28, lineHeight: 1.08 }}>Historie</h1>
            <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--fg-muted)" }}>
              Vergangene Wochenpläne nach Kalenderwoche öffnen und read-only ansehen.
            </p>
          </div>
          <Link href="/weekly-plan" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 999, border: "1px solid var(--border)", padding: "8px 12px",
            fontSize: 13, fontWeight: 700, color: "var(--fg)", textDecoration: "none",
          }}>
            Zurück
          </Link>
        </div>

        {loading ? <div style={{ color: "var(--fg-muted)" }}>Lade Historie…</div> : null}
        {error ? <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div> : null}

        {!loading && !error && items.length === 0 ? (
          <div style={{
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: 18,
            background: "var(--bg)",
            boxShadow: "var(--shadow-md)",
            color: "var(--fg-muted)",
          }}>
            Noch keine historischen Wochenpläne vorhanden.
          </div>
        ) : null}

        <div className="home-layout-standard">
          <div style={{ display: "grid", gap: 14 }}>
            {items.map((item) => (
              <Link
                key={item.week_start}
                href={`/weekly-plan/history/${item.week_start}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <article className="nav-tile" style={{
                  borderRadius: 24,
                  border: "1px solid color-mix(in srgb, #e8673a 24%, var(--border))",
                  background: "linear-gradient(180deg, color-mix(in srgb, #e8673a 10%, var(--bg)) 0%, color-mix(in srgb, #e8673a 16%, var(--bg-subtle)) 100%)",
                  boxShadow: "var(--shadow-md)",
                  padding: 18,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#e8673a", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        KW {item.calendar_week}
                      </div>
                      <h2 style={{ margin: "8px 0 0", fontSize: 20, lineHeight: 1.1 }}>
                        {formatDate(item.week_start)} bis {formatDate(item.week_end)}
                      </h2>
                    </div>
                    <span style={{ fontSize: 22, color: "#e8673a", fontWeight: 800 }}>→</span>
                  </div>

                  <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
                    {item.plan.days.slice(0, 3).map((day) => (
                      <div key={`${item.week_start}-${day.day}`} style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                        <strong style={{ color: "var(--fg)" }}>{day.label}</strong> · {day.title}
                      </div>
                    ))}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>

        <div className="home-layout-tiles">
          <div style={{ display: "grid", gap: 14 }}>
            {items.map((item) => (
              <Link key={item.week_start} href={`/weekly-plan/history/${item.week_start}`} style={{ textDecoration: "none", color: "inherit" }}>
                <article className="nav-tile" style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 26,
                  border: "1px solid color-mix(in srgb, #e8673a 24%, var(--border))",
                  background: "linear-gradient(180deg, color-mix(in srgb, #e8673a 10%, var(--bg)) 0%, color-mix(in srgb, #e8673a 16%, var(--bg-subtle)) 100%)",
                  boxShadow: "var(--shadow-md)",
                  padding: 18,
                  minHeight: 168,
                }}>
                  <div style={{ position: "absolute", right: -20, top: -18, width: 108, height: 108, borderRadius: 999, background: "color-mix(in srgb, #e8673a 16%, transparent)" }} />
                  <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#e8673a", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        KW {item.calendar_week}
                      </div>
                      <h2 style={{ margin: "8px 0 0", fontSize: 20, lineHeight: 1.1 }}>
                        {formatDate(item.week_start)} bis {formatDate(item.week_end)}
                      </h2>
                    </div>
                    <span style={{ fontSize: 22, color: "#e8673a", fontWeight: 800 }}>→</span>
                  </div>
                  <div style={{ position: "relative", marginTop: 14, display: "grid", gap: 6 }}>
                    {item.plan.days.slice(0, 3).map((day) => (
                      <div key={`${item.week_start}-${day.day}`} style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                        <strong style={{ color: "var(--fg)" }}>{day.label}</strong> · {day.title}
                      </div>
                    ))}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <BottomNav current="/kueche" />
    </main>
  );
}
