"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type Recipe } from "../lib/api";

function Chip({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
      {text}
    </span>
  );
}

export default function RecipesPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Recipe[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const debouncedQ = useMemo(() => q.trim(), [q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await api.listRecipes(debouncedQ || undefined);
        if (!cancelled) setItems(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Fehler beim Laden");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  return (
    <main className="min-h-dvh bg-white">
      <div className="mx-auto max-w-md px-4 pb-24 pt-4">
        <header className="mb-3">
          <h1 className="text-xl font-semibold">Rezepte</h1>
          <p className="text-sm text-gray-600">
            Mobile-first Editor (Zutaten, Tags, Zeit, Schwierigkeit)
          </p>
        </header>

        <div className="mb-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suchen…"
            className="w-full rounded-xl border px-3 py-2 text-base outline-none focus:ring"
          />
        </div>

        {err && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-600">Lade…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-600">Keine Rezepte gefunden.</div>
        ) : (
          <ul className="space-y-3">
            {items.map((r) => (
              <li key={r.id} className="rounded-2xl border p-3 shadow-sm">
                <Link href={`/recipes/${r.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-medium">{r.title}</div>
                      <div className="mt-1 text-xs text-gray-600">
                        {r.time_minutes ? `${r.time_minutes} min` : "—"} ·{" "}
                        {r.difficulty ? `Diff ${r.difficulty}` : "—"} ·{" "}
                        {r.ingredients?.length ? `${r.ingredients.length} Zutaten` : "keine Zutaten"}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">›</div>
                  </div>

                  {r.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.tags.slice(0, 5).map((t) => (
                        <Chip key={t} text={t} />
                      ))}
                      {r.tags.length > 5 && <Chip text={`+${r.tags.length - 5}`} />}
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Floating action button */}
      <Link
        href="/recipes/new"
        className="fixed bottom-6 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-black px-4 py-3 text-center text-base font-semibold text-white shadow-lg"
      >
        + Neues Rezept
      </Link>
    </main>
  );
}
