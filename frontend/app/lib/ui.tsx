"use client";

import React from "react";
import Link from "next/link";

export const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: "#fff",
    color: "#000",
    fontFamily:
      'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  container: {
    maxWidth: 420,
    margin: "0 auto",
    padding: "28px 22px 44px 22px",
  },

  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  title: { fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.2, color: "#000" },
  subtitle: { fontSize: 14, marginTop: 6, marginBottom: 0, color: "#000" },

  card: {
    border: "1px solid #ddd",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    background: "#fff",
    color: "#000",
  },
  cardLink: {
    display: "block",
    border: "1px solid #ddd",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    background: "#fff",
    textDecoration: "none",
    color: "#000",
  },

  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  row: { display: "flex", alignItems: "center", gap: 10 },

  input: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 16,
    outline: "none",
    color: "#000",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: 14,
    padding: "10px 12px",
    fontSize: 16,
    outline: "none",
    color: "#000",
    background: "#fff",
    resize: "vertical",
  },

  small: { fontSize: 12, color: "#000" },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #ddd",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    color: "#000",
    background: "#fff",
    whiteSpace: "nowrap",
  },

  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    border: "1px solid #ddd",
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 700,
    color: "#000",
    background: "#fff",
    textDecoration: "none",
    cursor: "pointer",
  },
  buttonPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    border: "1px solid #000",
    padding: "12px 14px",
    fontSize: 15,
    fontWeight: 800,
    color: "#fff",
    background: "#000",
    textDecoration: "none",
    cursor: "pointer",
  },
  buttonDanger: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    border: "1px solid #ef4444",
    padding: "12px 14px",
    fontSize: 15,
    fontWeight: 800,
    color: "#ef4444",
    background: "#fff",
    textDecoration: "none",
    cursor: "pointer",
  },

  fabWrap: {
    position: "fixed",
    left: "50%",
    bottom: 22,
    transform: "translateX(-50%)",
    width: "calc(100% - 44px)",
    maxWidth: 420,
  },
  fab: {
    width: "100%",
    borderRadius: 18,
    border: "1px solid #000",
    background: "#000",
    color: "#fff",
    padding: "14px 16px",
    fontSize: 16,
    fontWeight: 800,
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
    cursor: "pointer",
  },

  divider: { height: 1, background: "#eee", margin: "14px 0" },
};

export function Page({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>{title}</h1>
            {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function BtnLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={styles.button}>
      {children}
    </Link>
  );
}

export function Chip({ text }: { text: string }) {
  return <span style={styles.chip}>{text}</span>;
}
