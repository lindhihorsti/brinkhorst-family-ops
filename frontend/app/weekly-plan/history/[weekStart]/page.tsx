"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getErrorMessage } from "../../../lib/errors";
import { getWeeklyPlanHref } from "../../../lib/weekly-plan-links.mjs";
import { BottomNav, StarRating } from "../../../lib/ui";

type DayEntry = {
  day: number;
  label: string;
  kind: "recipe" | "dummy" | "empty";
  recipe_id: string | null;
  title: string;
  source_url?: string | null;
  rating?: number | null;
};

type WeeklyHistoryItem = {
  week_start: string;
  week_end: string;
  calendar_week: number;
  plan: {
    days: DayEntry[];
  };
};

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function DayGrid({ days }: { days: DayEntry[] }) {
  return (
    <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
      {days.map((d) => {
        const href = getWeeklyPlanHref(d);
        const content = (
          <>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6, color: "var(--fg-muted)" }}>{d.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2, color: "var(--fg)", textDecoration: href ? "underline" : "none", textUnderlineOffset: href ? 3 : undefined }}>
              {d.title}
            </div>
            <div style={{ marginTop: 6 }}>
              <StarRating value={d.rating == null ? 0 : Number(d.rating)} readonly size={14} />
            </div>
          </>
        );
        if (!href) {
          return (
            <div key={d.day} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 12, background: "var(--bg-subtle)" }}>
              {content}
            </div>
          );
        }
        return (
          <a
            key={d.day}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 12, background: "var(--bg-subtle)", textDecoration: "none", color: "inherit", display: "block" }}
          >
            {content}
          </a>
        );
      })}
    </div>
  );
}

export default function WeeklyPlanHistoryDetailPage() {
  const params = useParams<{ weekStart: string }>();
  const weekStart = String(params.weekStart);
  const [item, setItem] = useState<WeeklyHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/weekly/history/${weekStart}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = await res.json();
        setItem(data.item ?? null);
      } catch (e) {
        setError(getErrorMessage(e, "Fehler beim Laden"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [weekStart]);

  return (
    <main style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      color: "var(--fg)",
      fontFamily: "var(--font)",
      paddingBottom: "var(--nav-height)",
    }}>
      <div style={{ maxWidth: 430, margin: "0 auto", padding: "20px 22px 44px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{
            width: 108,
            height: 108,
            borderRadius: 32,
            background: "linear-gradient(180deg, #e8673a22 0%, #e8673a40 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 60,
            boxShadow: "var(--shadow-md)",
          }}>
            📅
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 22 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#e8673a" }}>
              Historischer Wochenplan
            </p>
            <h1 style={{ margin: "8px 0 0", fontSize: 28, lineHeight: 1.08 }}>
              {item ? `KW ${item.calendar_week}` : "Lade…"}
            </h1>
            {item ? (
              <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.45, color: "var(--fg-muted)" }}>
                {formatDate(item.week_start)} bis {formatDate(item.week_end)} · nur ansehen
              </p>
            ) : null}
          </div>
          <Link href="/weekly-plan/history" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 999, border: "1px solid var(--border)", padding: "8px 12px",
            fontSize: 13, fontWeight: 700, color: "var(--fg)", textDecoration: "none",
          }}>
            Historie
          </Link>
        </div>

        {loading ? <div style={{ color: "var(--fg-muted)" }}>Lade Plan…</div> : null}
        {error ? <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div> : null}

        {item ? (
          <div style={{
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: 18,
            background: "var(--bg)",
            boxShadow: "var(--shadow-md)",
          }}>
            <div style={{ fontWeight: 800, marginBottom: 10 }}>Effektiv gültiger Plan</div>
            <DayGrid days={item.plan.days} />
          </div>
        ) : null}
      </div>
      <BottomNav current="/kueche" />
    </main>
  );
}
