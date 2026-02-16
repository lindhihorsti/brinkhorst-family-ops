"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type Recipe } from "../../../lib/api";

function splitCsv(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [r, setR] = useState<Recipe | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [timeMinutes, setTimeMinutes] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingDraft, setIngDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      try {
        const data = await api.getRecipe(id);
        if (cancelled) return;
        setR(data);
        setTitle(data.title ?? "");
        setSourceUrl(data.source_url ?? "");
        setNotes(data.notes ?? "");
        setTags((data.tags ?? []).join(", "));
        setTimeMinutes(data.time_minutes ? String(data.time_minutes) : "");
        setDifficulty(data.difficulty ? String(data.difficulty) : "");
        setIngredients(data.ingredients ?? []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Fehler");
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
    } catch (e: any) {
      setErr(e?.message ?? "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  if (!r && !err) {
    return (
      <main className="min-h-dvh bg-white">
        <div className="mx-auto max-w-md px-4 pt-4 text-sm text-gray-600">Lade…</div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-dvh bg-white">
        <div className="mx-auto max-w-md px-4 pt-4">
          <div className="mb-3 text-sm text-red-700">{err}</div>
          <Link className="text-sm text-blue-600" href="/recipes">
            Zurück
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto max-w-md px-4 pb-24 pt-4">
        <header className="mb-3 flex items-center justify-between">
          <Link className="text-sm text-blue-600" href={`/recipes/${id}`}>
            ← Abbrechen
          </Link>
          <div className="text-sm text-gray-600">Bearbeiten</div>
        </header>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            className="w-full rounded-xl border px-3 py-2 text-base"
          />

          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Link (optional)"
            className="w-full rounded-xl border px-3 py-2 text-base"
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notizen (optional)"
            className="w-full rounded-xl border px-3 py-2 text-base"
            rows={3}
          />

          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            className="w-full rounded-xl border px-3 py-2 text-base"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(e.target.value)}
              placeholder="Zeit (min)"
              inputMode="numeric"
              className="w-full rounded-xl border px-3 py-2 text-base"
            />
            <input
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              placeholder="Diff (1-3)"
              inputMode="numeric"
              className="w-full rounded-xl border px-3 py-2 text-base"
            />
          </div>

          <section className="rounded-2xl border p-3">
            <div className="mb-2 text-sm font-semibold">Zutaten</div>

            <div className="flex gap-2">
              <input
                value={ingDraft}
                onChange={(e) => setIngDraft(e.target.value)}
                placeholder="z.B. Tomaten (Dose)"
                className="w-full rounded-xl border px-3 py-2 text-base"
              />
              <button
                onClick={addIng}
                className="rounded-xl bg-black px-4 py-2 text-base font-semibold text-white"
              >
                +
              </button>
            </div>

            {ingredients.length ? (
              <ul className="mt-3 space-y-2">
                {ingredients.map((ing, idx) => (
                  <li key={`${ing}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
                    <span className="text-base">{ing}</span>
                    <button
                      onClick={() => removeIng(idx)}
                      className="rounded-lg border px-2 py-1 text-sm"
                    >
                      Entfernen
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-sm text-gray-600">Noch keine Zutaten.</div>
            )}
          </section>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="fixed bottom-6 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-black px-4 py-3 text-center text-base font-semibold text-white shadow-lg disabled:opacity-60"
      >
        {saving ? "Speichere…" : "Speichern"}
      </button>
    </main>
  );
}
