"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 22px",
      fontFamily: "var(--font)",
      color: "var(--fg)",
      background: "var(--bg)",
      textAlign: "center",
      gap: 16,
    }}>
      <span style={{ fontSize: 48 }}>⚠️</span>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Etwas ist schiefgelaufen</h1>
      <p style={{ fontSize: 14, color: "var(--fg-muted)", maxWidth: 300 }}>
        {error.message || "Unbekannter Fehler. Bitte Seite neu laden."}
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={reset}
          style={{
            padding: "10px 18px", borderRadius: 12, border: "1px solid var(--fg)",
            background: "var(--fg)", color: "var(--bg)", fontWeight: 700, cursor: "pointer",
          }}
        >
          Nochmal versuchen
        </button>
        <Link href="/" style={{
          padding: "10px 18px", borderRadius: 12, border: "1px solid var(--border)",
          background: "var(--bg)", color: "var(--fg)", fontWeight: 700,
        }}>
          Startseite
        </Link>
      </div>
    </div>
  );
}
