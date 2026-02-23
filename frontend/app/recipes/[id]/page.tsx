"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, type Recipe } from "../../lib/api";
import { getErrorMessage } from "../../lib/errors";
import { BtnLink, Chip, Page, styles } from "../../lib/ui";

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = useMemo(() => {
    const v = params?.id;
    return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Recipe | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!id) return; // <- wichtig
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await api.getRecipe(id);
        if (!cancelled) setItem(r);
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

  const archiveRecipe = async () => {
    if (!id) return;
    const confirmed = window.confirm(
      "Rezept wirklich archivieren?"
    );
    if (!confirmed) return;
    setArchiveError(null);
    setArchiving(true);
    try {
      await api.archiveRecipe(id);
      router.push("/recipes");
    } catch (e) {
      setArchiveError(getErrorMessage(e, "Archivieren fehlgeschlagen."));
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Page
      title={item?.title ?? "Rezept"}
      subtitle={item?.id ? `ID: ${item.id}` : " "}
      right={<BtnLink href="/recipes">Zurück</BtnLink>}
    >
      {!id ? (
        <div style={{ textAlign: "center", padding: "10px 0", opacity: 0.75 }}>Lade…</div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: "10px 0", opacity: 0.75 }}>Lade…</div>
      ) : err ? (
        <div style={{ ...styles.card, borderColor: "#fecaca" }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Fehler</div>
          <div style={{ fontSize: 13 }}>{err}</div>
        </div>
      ) : !item ? (
        <div style={styles.card}>
          <div style={{ fontWeight: 800 }}>Nicht gefunden</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, paddingBottom: 74 }}>
          {archiveError ? (
            <div style={{ ...styles.card, borderColor: "#fecaca", background: "#fff" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Archivieren fehlgeschlagen</div>
              <div style={{ fontSize: 13 }}>{archiveError}</div>
            </div>
          ) : null}
          <div style={styles.card}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {typeof item.time_minutes === "number" ? <Chip text={`${item.time_minutes} min`} /> : <Chip text="— min" />}
              {item.difficulty ? <Chip text={`Diff ${item.difficulty}`} /> : <Chip text="Diff —" />}
              {item.tags?.length ? <Chip text={`${item.tags.length} Tags`} /> : <Chip text="0 Tags" />}
              {item.ingredients?.length ? <Chip text={`${item.ingredients.length} Zutaten`} /> : <Chip text="0 Zutaten" />}
            </div>

            {item.source_url ? (
              <>
                <div style={styles.divider} />
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Link</div>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 13, color: "#000", textDecoration: "underline" }}
                >
                  {item.source_url}
                </a>
              </>
            ) : null}

            {item.tags?.length ? (
              <>
                <div style={styles.divider} />
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Tags</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {item.tags.map((t) => (
                    <Chip key={t} text={t} />
                  ))}
                </div>
              </>
            ) : null}

            <div style={styles.divider} />

            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Zutaten</div>
            {item.ingredients?.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {item.ingredients.map((ing, idx) => (
                  <div
                    key={`${ing}-${idx}`}
                    style={{ fontSize: 14, padding: "10px 12px", border: "1px solid #eee", borderRadius: 14 }}
                  >
                    {ing}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, opacity: 0.8 }}>Keine Zutaten hinterlegt.</div>
            )}

            {item.notes ? (
              <>
                <div style={styles.divider} />
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Notizen</div>
                <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{item.notes}</div>
              </>
            ) : null}
          </div>
        </div>
      )}

      <div style={styles.fabWrap}>
        <div style={{ display: "grid", gap: 10 }}>
          <Link
            href={id ? `/recipes/${id}/edit` : "/recipes"}
            style={{ ...styles.buttonPrimary, width: "100%", justifyContent: "center" }}
          >
            Bearbeiten
          </Link>
          <button
            onClick={archiveRecipe}
            style={{ ...styles.buttonDanger, width: "100%", justifyContent: "center" }}
            disabled={archiving}
          >
            {archiving ? "Archivieren…" : "Archivieren"}
          </button>
        </div>
      </div>
    </Page>
  );
}
