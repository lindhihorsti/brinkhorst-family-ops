"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, type Recipe } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";
import { BtnLink, Page, styles } from "../../../lib/ui";

function splitCsv(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function EditRecipePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => {
    const v = params?.id;
    return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingDraft, setIngDraft] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r: Recipe = await api.getRecipe(id);
        if (cancelled) return;

        setTitle(r.title ?? "");
        setSourceUrl((r.source_url ?? "") as string);
        setNotes((r.notes ?? "") as string);
        setTags((r.tags ?? []).join(", "));
        setTimeMinutes(r.time_minutes != null ? String(r.time_minutes) : "");
        setDifficulty(r.difficulty != null ? String(r.difficulty) : "");
        setIngredients((r.ingredients ?? []) as string[]);
      } catch (e) {
        if (!cancelled) setErr(getErrorMessage(e, "Fehler beim Laden"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

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
    if (!id) return;
    setErr(null);
    if (!title.trim()) {
      setErr("Titel fehlt.");
      return;
    }

    setSaving(true);
    try {
      await api.updateRecipe(id, {
        title: title.trim(),
        source_url: sourceUrl.trim() || null,
        notes: notes.trim() || null,
        tags: splitCsv(tags),
        ingredients,
        time_minutes: timeMinutes ? Number(timeMinutes) : null,
        difficulty: difficulty ? Number(difficulty) : null,
      });
      router.push(`/recipes/${id}`);
    } catch (e) {
      setErr(getErrorMessage(e, "Fehler beim Speichern"));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    setErr(null);
    if (!confirm("Rezept wirklich löschen?")) return;

    setSaving(true);
    try {
      await api.deleteRecipe(id);
      router.push("/recipes");
    } catch (e) {
      setErr(getErrorMessage(e, "Fehler beim Löschen"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      title="Rezept bearbeiten"
      subtitle={id ?? " "}
      right={<BtnLink href={id ? `/recipes/${id}` : "/recipes"}>Zurück</BtnLink>}
    >
      {!id ? (
        <div style={{ textAlign: "center", padding: "10px 0", opacity: 0.75 }}>Lade…</div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "10px 0", opacity: 0.75 }}>Lade…</div>
      ) : (
        <div style={{ display: "grid", gap: 12, paddingBottom: 120 }}>
          {err ? (
            <div style={{ ...styles.card, borderColor: "#fecaca", background: "#fff" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Fehler</div>
              <div style={{ fontSize: 13 }}>{err}</div>
            </div>
          ) : null}

          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" style={styles.input} />
          <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Link (optional)" style={styles.input} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notizen (optional)" rows={3} style={styles.textarea} />
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma-separated)" style={styles.input} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input value={timeMinutes} onChange={(e) => setTimeMinutes(e.target.value)} placeholder="Zeit (min)" inputMode="numeric" style={styles.input} />
            <input value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="Diff (1-3)" inputMode="numeric" style={styles.input} />
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
              <button onClick={addIng} style={{ ...styles.buttonPrimary, padding: "10px 12px", borderRadius: 14 }} type="button">
                +
              </button>
            </div>

            {ingredients.length ? (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {ingredients.map((ing, idx) => (
                  <div key={`${ing}-${idx}`} style={{ ...styles.card, padding: 12, borderRadius: 14, boxShadow: "none" }}>
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

          <button
            onClick={onDelete}
            disabled={saving}
            style={{ ...styles.buttonDanger, width: "100%", justifyContent: "center" }}
            type="button"
          >
            Rezept löschen
          </button>
        </div>
      )}

      <div style={styles.fabWrap}>
        <button
          onClick={onSave}
          disabled={saving || loading || !id}
          style={{ ...styles.fab, opacity: saving || loading || !id ? 0.7 : 1 }}
          type="button"
        >
          {saving ? "Speichere…" : "Speichern"}
        </button>
      </div>
    </Page>
  );
}
