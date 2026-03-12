"use client";

import { useEffect, useState } from "react";
import { BtnLink, Page, styles } from "../../lib/ui";

export default function AufgabenSettingsPage() {
  const [maxPoints, setMaxPoints] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/chores/settings")
      .then((r) => r.json())
      .then((d) => { if (d?.ok) setMaxPoints(d.settings?.max_points ?? 3); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/chores/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_points: maxPoints }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Speichern fehlgeschlagen");
        return;
      }
      setMaxPoints(data.settings.max_points);
      setMsg("Gespeichert");
      setTimeout(() => setMsg(null), 2000);
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      title="Aufgaben"
      subtitle="Punkte konfigurieren"
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "32px 0", opacity: 0.6 }}>Lade…</div>
      ) : (
        <>
          <div style={styles.card}>
            {error ? <div style={{ ...styles.errorBox, marginBottom: 14 }}>{error}</div> : null}
            {msg ? <div style={{ ...styles.successBox, marginBottom: 14 }}>{msg}</div> : null}

            <label style={styles.label}>
              Maximale Punkte pro Aufgabe: <strong>{maxPoints}</strong>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={maxPoints}
              onChange={(e) => setMaxPoints(Number(e.target.value))}
              style={{ width: "100%", margin: "12px 0 16px", accentColor: "#7c3aed" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-xs)", color: "var(--fg-muted)" }}>
              <span>1</span><span>5</span><span>10</span>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} style={{ ...styles.buttonPrimary, width: "100%" }}>Speichern</button>
        </>
      )}
    </Page>
  );
}
