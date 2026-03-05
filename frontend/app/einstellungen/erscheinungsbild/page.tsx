"use client";

import { useEffect, useState } from "react";
import { BtnLink, Page, styles } from "../../lib/ui";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string; sub: string; icon: string }[] = [
  { value: "light", label: "Hell",   sub: "Immer helles Design",        icon: "☀️" },
  { value: "dark",  label: "Dunkel", sub: "Immer dunkles Design",       icon: "🌙" },
  { value: "system",label: "System", sub: "Folgt der Systemeinstellung", icon: "⚙️" },
];

export default function ErscheinungsbildPage() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") setThemeState(stored);
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
    </Page>
  );
}
