"use client";

import { useEffect, useState } from "react";
import {
  applyHomeLayout,
  HOME_LAYOUT_KEY,
  HOME_LAYOUT_STANDARD,
  HOME_LAYOUT_TILES,
  normalizeHomeLayout,
} from "../../lib/appearance.mjs";
import { BtnLink, Page, styles } from "../../lib/ui";

type Theme = "light" | "dark" | "system";
type HomeLayout = "standard" | "tiles";

const OPTIONS: { value: Theme; label: string; sub: string; icon: string }[] = [
  { value: "light", label: "Hell",   sub: "Immer helles Design",        icon: "☀️" },
  { value: "dark",  label: "Dunkel", sub: "Immer dunkles Design",       icon: "🌙" },
  { value: "system",label: "System", sub: "Folgt der Systemeinstellung", icon: "⚙️" },
];

export default function ErscheinungsbildPage() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [homeLayout, setHomeLayoutState] = useState<HomeLayout>(HOME_LAYOUT_STANDARD);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") setThemeState(stored);
      setHomeLayoutState(normalizeHomeLayout(localStorage.getItem(HOME_LAYOUT_KEY)) as HomeLayout);
    } catch { /* ssr */ }
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    const html = document.documentElement;
    if (t === "system") {
      html.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    } else {
      html.setAttribute("data-theme", t);
      localStorage.setItem("theme", t);
    }
  }

  function setHomeLayout(nextLayout: HomeLayout) {
    setHomeLayoutState(nextLayout);
    try {
      localStorage.setItem(HOME_LAYOUT_KEY, nextLayout);
    } catch { /* ignore */ }
    applyHomeLayout(document.documentElement, nextLayout);
  }

  return (
    <Page
      title="Erscheinungsbild"
      subtitle="Farb- und Helligkeitseinstellung"
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      <div style={{ display: "grid", gap: 10 }}>
        {OPTIONS.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                border: active ? "2px solid var(--fg)" : "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: "14px 16px",
                background: active ? "var(--fg)" : "var(--bg)",
                cursor: "pointer", textAlign: "left", width: "100%",
                boxShadow: active ? "none" : "var(--shadow-sm)",
              }}
            >
              <span style={{
                width: 44, height: 44, borderRadius: 14,
                background: active ? "rgba(255,255,255,0.15)" : "var(--bg-subtle)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>
                {opt.icon}
              </span>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: active ? "var(--bg)" : "var(--fg)" }}>
                  {opt.label}
                </p>
                <p style={{ fontSize: 12, marginTop: 2, color: active ? "rgba(128,128,128,0.8)" : "var(--fg-muted)" }}>
                  {opt.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ height: 22 }} />

      <div style={{ ...styles.card, padding: 18 }}>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Startseite</p>
          <p style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 4 }}>
            Umschalten zwischen der bisherigen Listenansicht und dem neuen Kachel-Design.
          </p>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {[
            {
              value: HOME_LAYOUT_STANDARD as HomeLayout,
              label: "Standard",
              sub: "Kompakte Liste mit kleineren Einstiegsboxen",
              icon: "☰",
            },
            {
              value: HOME_LAYOUT_TILES as HomeLayout,
              label: "Kachel-Design",
              sub: "Große mobile Kacheln mit starken Einstiegen pro Bereich",
              icon: "▣",
            },
          ].map((opt) => {
            const active = homeLayout === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setHomeLayout(opt.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  border: active ? "2px solid var(--fg)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", padding: "14px 16px",
                  background: active ? "var(--fg)" : "var(--bg)",
                  cursor: "pointer", textAlign: "left", width: "100%",
                  boxShadow: active ? "none" : "var(--shadow-sm)",
                }}
              >
                <span style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: active ? "rgba(255,255,255,0.15)" : "var(--bg-subtle)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>
                  {opt.icon}
                </span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: active ? "var(--bg)" : "var(--fg)" }}>
                    {opt.label}
                  </p>
                  <p style={{ fontSize: 12, marginTop: 2, color: active ? "rgba(128,128,128,0.8)" : "var(--fg-muted)" }}>
                    {opt.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Page>
  );
}
