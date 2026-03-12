"use client";

import { useEffect, useState } from "react";
import { getErrorMessage } from "../../lib/errors";
import { BtnLink, Page, styles } from "../../lib/ui";

type TelegramSettings = {
  auto_send_plan: boolean;
  auto_send_shop: boolean;
  notify_new_recipe: boolean;
  notify_new_weekly_plan: boolean;
  notify_new_chore: boolean;
  notify_new_shopping_list: boolean;
  notify_new_expense: boolean;
  notify_new_fixed_expense: boolean;
  notify_new_pinboard_note: boolean;
  notify_new_birthday: boolean;
  notify_new_family_member: boolean;
};

export default function BenachrichtigungenPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [telegram, setTelegram] = useState<TelegramSettings>({
    auto_send_plan: false,
    auto_send_shop: false,
    notify_new_recipe: false,
    notify_new_weekly_plan: false,
    notify_new_chore: false,
    notify_new_shopping_list: false,
    notify_new_expense: false,
    notify_new_fixed_expense: false,
    notify_new_pinboard_note: false,
    notify_new_birthday: false,
    notify_new_family_member: false,
  });
  const [chatId, setChatId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status}`);
        const d = await res.json();
        setTelegram({
          auto_send_plan: d.telegram?.auto_send_plan ?? false,
          auto_send_shop: d.telegram?.auto_send_shop ?? false,
          notify_new_recipe: d.telegram?.notify_new_recipe ?? false,
          notify_new_weekly_plan: d.telegram?.notify_new_weekly_plan ?? false,
          notify_new_chore: d.telegram?.notify_new_chore ?? false,
          notify_new_shopping_list: d.telegram?.notify_new_shopping_list ?? false,
          notify_new_expense: d.telegram?.notify_new_expense ?? false,
          notify_new_fixed_expense: d.telegram?.notify_new_fixed_expense ?? false,
          notify_new_pinboard_note: d.telegram?.notify_new_pinboard_note ?? false,
          notify_new_birthday: d.telegram?.notify_new_birthday ?? false,
          notify_new_family_member: d.telegram?.notify_new_family_member ?? false,
        });
        setChatId(d.telegram_last_chat_id ?? null);
      } catch (e) {
        setError(getErrorMessage(e, "Fehler beim Laden"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/settings/telegram", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegram),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setMsg("Gespeichert.");
    } catch (e) { setMsg(getErrorMessage(e, "Fehler")); } finally { setSaving(false); }
  };

  const small: React.CSSProperties = { fontSize: 12, color: "var(--fg-muted)", marginTop: 6 };

  return (
    <Page
      title="Benachrichtigungen"
      subtitle="Telegram Auto-Send"
      right={<BtnLink href="/einstellungen">Zurück</BtnLink>}
      navCurrent="/einstellungen"
    >
      {loading && <p style={styles.small}>Lade…</p>}
      {error && <p style={{ ...styles.small, color: "var(--danger)" }}>{error}</p>}

      <div style={styles.card}>
        <p style={{ fontWeight: 800, margin: "0 0 12px" }}>Telegram</p>
        <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
            <input type="checkbox" checked={telegram.auto_send_plan}
              onChange={(e) => setTelegram((prev) => ({ ...prev, auto_send_plan: e.target.checked }))} />
            Wochenplan automatisch senden
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
            <input type="checkbox" checked={telegram.auto_send_shop}
              onChange={(e) => setTelegram((prev) => ({ ...prev, auto_send_shop: e.target.checked }))} />
            Einkaufsliste automatisch senden
          </label>
        </div>

        <div style={{ ...styles.card, background: "var(--bg-subtle)", marginBottom: 16 }}>
          <p style={{ fontWeight: 800, margin: "0 0 12px" }}>Neue Inhalte senden</p>
          <div style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={telegram.notify_new_recipe}
                onChange={(e) => setTelegram((prev) => ({ ...prev, notify_new_recipe: e.target.checked }))} />
              Neues Rezept
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={telegram.notify_new_weekly_plan}
                onChange={(e) => setTelegram((prev) => ({ ...prev, notify_new_weekly_plan: e.target.checked }))} />
              Neuer Wochenplan
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={telegram.notify_new_chore}
                onChange={(e) => setTelegram((prev) => ({ ...prev, notify_new_chore: e.target.checked }))} />
              Neue Aufgabe
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={telegram.notify_new_shopping_list}
                onChange={(e) => setTelegram((prev) => ({ ...prev, notify_new_shopping_list: e.target.checked }))} />
              Neue Einkaufsliste
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={telegram.notify_new_expense}
                onChange={(e) => setTelegram((prev) => ({ ...prev, notify_new_expense: e.target.checked }))} />
              Neue Ausgabe
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={telegram.notify_new_fixed_expense}
                onChange={(e) => setTelegram((prev) => ({ ...prev, notify_new_fixed_expense: e.target.checked }))} />
              Neue Fixkosten
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={telegram.notify_new_pinboard_note}
                onChange={(e) => setTelegram((prev) => ({ ...prev, notify_new_pinboard_note: e.target.checked }))} />
              Neue Pinnwand-Notiz
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={telegram.notify_new_birthday}
                onChange={(e) => setTelegram((prev) => ({ ...prev, notify_new_birthday: e.target.checked }))} />
              Neuer Geburtstag
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <input type="checkbox" checked={telegram.notify_new_family_member}
                onChange={(e) => setTelegram((prev) => ({ ...prev, notify_new_family_member: e.target.checked }))} />
              Neues Familienmitglied
            </label>
          </div>
        </div>

        <div style={{ ...styles.card, background: "var(--bg-subtle)", marginBottom: 16 }}>
          <p style={{ fontSize: 13, margin: 0 }}>
            Chat registriert: <strong>{chatId ? "ja" : "nein"}</strong>
          </p>
          {!chatId && (
            <p style={small}>Sende dem Bot eine Nachricht, um den Chat zu registrieren.</p>
          )}
        </div>
      </div>
      <button style={{ ...styles.buttonPrimary, width: "100%" }} onClick={handleSave} disabled={saving}>Speichern</button>
      {msg && <p style={small}>{msg}</p>}
    </Page>
  );
}
