"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type Recipe } from "../../lib/api";

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [r, setR] = useState<Recipe | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await api.getRecipe(id);
        if (!cancelled) setR(data);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Fehler");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const deactivate = async () => {
    if (!r) return;
    setBusy(true);
    try {
      await api.updateRecipe(r.id, { is_active: false });
      router.push("/recipes");
    } catch (e: any) {
      setErr(e?.message ?? "Fehler");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-dvh bg-white">
        <div className="mx-auto max-w-md px-4 pt-4 text-sm text-gray-600">Lade…</div>
      </main>
    );
  }

  if (err || !r) {
    return (
      <main className="min-h-dvh bg-white">
        <div className="mx-auto max-w-md px-4 pt-4">
          <div className="mb-3 text-sm text-red-700">{err ?? "Nicht gefunden"}</div>
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
          <Link className="text-sm text-blue-600" href="/recipes">
            ← Rezepte
          </Link>
          <Link className="text-sm text-blue-600" href={`/recipes/${r.id}/edit`}>
            Bearbeiten
          </Link>
        </header>

        <h1 className="text-xl font-semibold">{r.title}</h1>

        <div className="mt-2 text-sm text-gray-600">
          {r.time_minutes ? `${r.time_minutes} min` : "—"} ·{" "}
          {r.difficulty ? `Diff ${r.difficulty}` : "—"}
        </div>

        {r.source_url ? (
          <a
            className="mt-2 block truncate text-sm text-blue-600"
            href={r.source_url}
            target="_blank"
            rel="noreferrer"
          >
            {r.source_url}
          </a>
        ) : null}

        {r.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {r.tags.map((t) => (
              <span key={t} className="rounded-full border px-2 py-0.5 text-xs">
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <section className="mt-4 rounded-2xl border p-3">
          <div className="mb-2 text-sm font-semibold">Zutaten</div>
          {r.ingredients?.length ? (
            <ul className="space-y-2">
              {r.ingredients.map((ing, idx) => (
                <li key={`${ing}-${idx}`} className="rounded-xl border px-3 py-2 text-base">
                  {ing}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">Noch keine Zutaten.</div>
          )}
        </section>

        {r.notes ? (
          <section className="mt-4 rounded-2xl border p-3">
            <div className="mb-2 text-sm font-semibold">Notizen</div>
            <div className="text-base whitespace-pre-wrap">{r.notes}</div>
          </section>
        ) : null}

        {err && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 gap-3">
        <Link
          href={`/recipes/${r.id}/edit`}
          className="flex-1 rounded-2xl border px-4 py-3 text-center text-base font-semibold"
        >
          Bearbeiten
        </Link>
        <button
          onClick={deactivate}
          disabled={busy}
          className="flex-1 rounded-2xl bg-black px-4 py-3 text-center text-base font-semibold text-white disabled:opacity-60"
        >
          {busy ? "…" : "Deaktivieren"}
        </button>
      </div>
    </main>
  );
}
