"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type ShoppingList } from "../lib/api";
import { BtnLink, Page, Skeleton, styles, ToastProvider, useToast } from "../lib/ui";
import { formatEstimateTotal } from "./currency.mjs";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("de-CH");
}

function EinkaufContent() {
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await api.listShoppingLists());
    } catch {
      toast("Einkaufslisten konnten nicht geladen werden", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Page
      title="Einkaufsliste"
      subtitle="Mehrere Listen, Snapshot aus dem Wochenplan und AI-Schätzung"
      icon="🛒"
      iconAccent="#0f766e"
      right={<BtnLink href="/">Home</BtnLink>}
      navCurrent="/einkauf"
    >
      {loading ? (
        <div style={{ display: "grid", gap: 10 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height={92} />)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Noch keine Einkaufslisten</div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>Lege die erste Liste an und importiere optional den Wochenplan.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, paddingBottom: 84 }}>
          {items.map((item) => (
            <Link key={item.id} href={`/einkauf/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="nav-tile" style={styles.card}>
                <div style={{ ...styles.rowBetween, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 4 }}>
                      {item.manual_count} manuell · {item.recipe_count} aus Rezepten · {item.checked_count}/{item.total_count} erledigt
                    </div>
                    <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 4 }}>
                      {item.view_mode === "checklist" ? "Checkliste" : "Text"} · {item.import_mode === "per_recipe" ? "Pro Rezept" : "AI konsolidiert"} · aktualisiert {fmtDate(item.updated_at)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {formatEstimateTotal(item) ? (
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--einkauf-accent)" }}>
                        {formatEstimateTotal(item)}
                      </span>
                    ) : null}
                    <span style={{ fontSize: 22, color: "var(--fg-muted)" }}>→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={styles.fabWrap}>
        <Link href="/einkauf/new" style={{ ...styles.fab, display: "block", textAlign: "center", textDecoration: "none", color: "var(--bg)" }}>
          + Neue Einkaufsliste
        </Link>
      </div>
    </Page>
  );
}

export default function EinkaufPage() {
  return (
    <ToastProvider>
      <EinkaufContent />
    </ToastProvider>
  );
}
