cat > frontend/app/recipes/page.tsx <<'EOF'
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type Recipe } from "../lib/api";
import { BtnLink, Chip, Page, styles } from "../lib/ui";

export default function RecipesPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Recipe[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const query = useMemo(() => q.trim(), [q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await api.listRecipes(query || undefined);
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
  }, [query]);

  return (
    <Page
      title="Rezepte"
      subtitle="Mobile-first · gleicher Stil wie Home"
      right={<BtnLink href="/">Home</BtnLink>}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Suchen… (Titel oder Tag)"
        style={{ ...styles.input, marginBottom: 14 }}
      />

      {err ? (
        <div style={{ ...styles.card, borderColor: "#fecaca", background: "#fff" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Fehler</div>
          <div style={{ fontSize: 13 }}>{err}</div>
        </div>
      ) : null}

      {loading ? (
        <div style={{ textAlign: "center", padding: "10px 0", opacity: 0.75 }}>Lade…</div>
      ) : items.length === 0 ? (
        <div style={styles.card}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Keine Rezepte gefunden.</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Lege eins neu an.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, paddingBottom: 74 }}>
          {items.map((r) => (
            <Link key={r.id} href={`/recipes/${r.id}`} style={styles.cardLink}>
              <div style={styles.rowBetween}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>
                    {r.title}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.9 }}>
                    {r.time_minutes ? `${r.time_minutes} min` : "—"} ·{" "}
                    {r.difficulty ? `Diff ${r.difficulty}` : "—"} ·{" "}
                    {r.ingredients?.length ? `${r.ingredients.length} Zutaten` : "keine Zutaten"}
                  </div>
                </div>
                <div style={{ fontWeight: 800, opacity: 0.6 }}>›</div>
              </div>

              {r.tags?.length ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {r.tags.slice(0, 6).map((t) => (
                    <Chip key={t} text={t} />
                  ))}
                  {r.tags.length > 6 ? <Chip text={`+${r.tags.length - 6}`} /> : null}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}

      <div style={styles.fabWrap}>
        <Link
          href="/recipes/new"
          style={{ ...styles.buttonPrimary, width: "100%", justifyContent: "center" }}
        >
          + Neues Rezept
        </Link>
      </div>
    </Page>
  );
}
EOF
