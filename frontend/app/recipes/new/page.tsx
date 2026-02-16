"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../lib/api";
import { BtnLink, Page, styles } from "../../lib/ui";

function splitCsv(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function NewRecipePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingDraft, setIngDraft] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addIng = () => {
    const v = ingDraft.trim();
    if (!v) return;
    setIngredients((prev) => [...prev, v]);
    setIngDraft("");
  };

  const removeIng = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSave = async () => {
    setErr(null);
    if (!title.trim()) {
      setErr("Titel fehlt.");
      return;
    }
    setSaving(true);
    try {
      const r = await api.createRecipe({
        title: title.trim(),
        source_url: sourceUrl.trim() || null,
        notes: notes.trim() || null,
        tags: splitCsv(tags),
        ingredients,
        time_minutes: timeMinutes ? Number(timeMinutes) : null,
        difficulty: difficulty ? Number(difficulty) : null,
      });
      router.push(`/recipes/${r.id}`);
    } catch (e: any) {
      setErr(e?.message ?? "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      title="Neues Rezept"
      subtitle="Schnell anlegen · sauber wie Home"
      right={<BtnLink href="/recipes">Rezepte</BtnLink>}
    >
      <div style={{ display: "grid", gap: 12, paddingBottom: 74 }}>
        {err ? (
          <div style={{ ...styles.card, borderColor: "#fecaca", background: "#fff" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Konnte nicht speichern</div>
            <div style={{ fontSize: 13 }}>{err}</div>
          </div>
        ) : null}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel (z.B. Shakshuka)"
          style={styles.input}
        />
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="Link (optional)"
          style={styles.input}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notizen (optional)"
          rows={3}
          style={styles.textarea}
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated) z.B. vegetarisch, schnell"
          style={styles.input}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <input
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(e.target.value)}
            placeholder="Zeit (min)"
            inputMode="numeric"
            style={styles.input}
          />
          <input
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            placeholder="Diff (1-3)"
            inputMode="numeric"
            style={styles.input}
          />
        </div>

        <div style={styles.card}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Zutaten</div>

          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={ingDraft}
              onChange={(e) => setIngDraft(e.target.value)}
              placeholder="z.B. Tomaten (Dose)"
              style={styles.input}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addIng();
                }
              }}
            />
            <button
              onClick={addIng}
              style={{ ...styles.buttonPrimary, padding: "10px 12px", borderRadius: 14 }}
              type="button"
            >
              +
            </button>
          </div>

          {ingredients.length ? (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {ingredients.map((ing, idx) => (
                <div
                  key={`${ing}-${idx}`}
                  style={{
                    ...styles.card,
                    padding: 12,
                    borderRadius: 14,
                    boxShadow: "none",
                  }}
                >
                  <div style={styles.rowBetween}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{ing}</div>
                    <button onClick={() => removeIng(idx)} style={styles.button} type="button">
                      Entfernen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>Noch keine Zutaten.</div>
          )}
        </div>
      </div>

      <div style={styles.fabWrap}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{ ...styles.fab, opacity: saving ? 0.7 : 1 }}
          type="button"
        >
          {saving ? "Speichere…" : "Speichern"}
        </button>
      </div>
    </Page>
  );
}
