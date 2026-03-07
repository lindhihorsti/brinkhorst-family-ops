"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "../../lib/errors";
import { BtnLink, Page, styles } from "../../lib/ui";

type ShopSettings = {
  shop_output_mode?: "ai_consolidated" | "per_recipe";
  shopping_list_view_mode?: "checklist" | "text";
  shopping_list_include_weekly_by_default?: boolean;
  shopping_list_open_after_create?: boolean;
  shopping_list_estimate_currency?: "chf" | "eur";
};

export default function EinkaufSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [shop, setShop] = useState<Required<ShopSettings>>({
    shop_output_mode: "ai_consolidated",
    shopping_list_view_mode: "checklist",
    shopping_list_include_weekly_by_default: true,
    shopping_list_open_after_create: true,
    shopping_list_estimate_currency: "chf",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status}`);
        const d = await res.json();
        setShop({
          shop_output_mode: d.shop?.shop_output_mode ?? "ai_consolidated",
          shopping_list_view_mode: d.shop?.shopping_list_view_mode ?? "checklist",
          shopping_list_include_weekly_by_default: d.shop?.shopping_list_include_weekly_by_default ?? true,
          shopping_list_open_after_create: d.shop?.shopping_list_open_after_create ?? true,
          shopping_list_estimate_currency: d.shop?.shopping_list_estimate_currency ?? "chf",
        });
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
      const res = await fetch("/api/settings/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shop),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setMsg("Gespeichert.");
    } catch (e) {
      setMsg(getErrorMessage(e, "Fehler"));
    } finally {
      setSaving(false);
    }
  };

  const small: React.CSSProperties = { fontSize: 12, color: "var(--fg-muted)", marginTop: 6 };

  return (
    <Page
      title="Einkaufsliste"
      subtitle="Standards für Snapshot, Darstellung und Shop-Format"
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
      icon="🛒"
      iconAccent="#0f766e"
    >
      {loading && <p style={styles.small}>Lade…</p>}
      {error && <p style={{ ...styles.small, color: "var(--danger)" }}>{error}</p>}

      <div style={{ ...styles.card, marginBottom: 16 }}>
        <p style={{ fontWeight: 800, margin: "0 0 12px" }}>Standard beim Erstellen neuer Listen</p>

        <label style={styles.label}>Wochenplan-Zutaten formatieren als</label>
        <select
          style={{ ...styles.select, marginBottom: 12 }}
          value={shop.shop_output_mode}
          onChange={(e) => setShop((prev) => ({ ...prev, shop_output_mode: e.target.value as "ai_consolidated" | "per_recipe" }))}
        >
          <option value="ai_consolidated">Konsolidiert (AI)</option>
          <option value="per_recipe">Nach Rezept aufgeteilt</option>
        </select>

        <label style={styles.label}>Standardansicht einer Liste</label>
        <select
          style={{ ...styles.select, marginBottom: 12 }}
          value={shop.shopping_list_view_mode}
          onChange={(e) => setShop((prev) => ({ ...prev, shopping_list_view_mode: e.target.value as "checklist" | "text" }))}
        >
          <option value="checklist">Checkliste</option>
          <option value="text">Text mit Aufzählungszeichen</option>
        </select>

        <label style={styles.label}>Standardwährung für AI-Schätzungen</label>
        <select
          style={{ ...styles.select, marginBottom: 12 }}
          value={shop.shopping_list_estimate_currency}
          onChange={(e) => setShop((prev) => ({ ...prev, shopping_list_estimate_currency: e.target.value as "chf" | "eur" }))}
        >
          <option value="chf">CHF für Einkäufe in der Schweiz</option>
          <option value="eur">EUR für Einkäufe in Deutschland</option>
        </select>

        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={shop.shopping_list_include_weekly_by_default}
              onChange={(e) => setShop((prev) => ({ ...prev, shopping_list_include_weekly_by_default: e.target.checked }))}
            />
            Wochenplan beim Anlegen standardmäßig als Snapshot übernehmen
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={shop.shopping_list_open_after_create}
              onChange={(e) => setShop((prev) => ({ ...prev, shopping_list_open_after_create: e.target.checked }))}
            />
            Nach dem Anlegen direkt in die neue Liste springen
          </label>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: 16 }}>
        <p style={{ fontWeight: 800, margin: "0 0 8px" }}>Telegram & Shop-Kompatibilität</p>
        <p style={{ ...small, marginTop: 0 }}>
          Das hier eingestellte Shop-Format wird weiterhin auch für die bestehende Shop-/Telegram-Logik verwendet.
          `Auto-Send Shop` unter Benachrichtigungen bleibt damit kompatibel.
        </p>
      </div>

      <button style={styles.buttonPrimary} onClick={handleSave} disabled={saving}>
        {saving ? "Speichere…" : "Speichern"}
      </button>
      {msg && <p style={small}>{msg}</p>}
    </Page>
  );
}
