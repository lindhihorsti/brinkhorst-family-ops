"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import Link from "next/link";

// ─── Style helpers (CSS-var based) ──────────────────────────────────────────

export const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: "var(--bg)",
    color: "var(--fg)",
    fontFamily: "var(--font)",
    paddingBottom: "var(--nav-height)",
  },
  pageNoNav: {
    minHeight: "100dvh",
    background: "var(--bg)",
    color: "var(--fg)",
    fontFamily: "var(--font)",
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
  title: { fontSize: "var(--font-size-xl)", fontWeight: 700, margin: 0, lineHeight: 1.2, color: "var(--fg)" },
  subtitle: { fontSize: "var(--font-size-sm)", marginTop: 6, marginBottom: 0, color: "var(--fg-muted)" },

  card: {
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: 16,
    boxShadow: "var(--shadow-sm)",
    background: "var(--bg)",
    color: "var(--fg)",
  },
  cardLink: {
    display: "block",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: 16,
    boxShadow: "var(--shadow-sm)",
    background: "var(--bg)",
    textDecoration: "none",
    color: "var(--fg)",
  },
  cardSubtle: {
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: 14,
    background: "var(--bg-subtle)",
    color: "var(--fg)",
  },

  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  row: { display: "flex", alignItems: "center", gap: 10 },
  col: { display: "flex", flexDirection: "column", gap: 8 },

  input: {
    width: "100%",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "10px 12px",
    fontSize: "var(--font-size-md)",
    outline: "none",
    color: "var(--fg)",
    background: "var(--bg)",
  },
  textarea: {
    width: "100%",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "10px 12px",
    fontSize: "var(--font-size-md)",
    outline: "none",
    color: "var(--fg)",
    background: "var(--bg)",
    resize: "vertical",
  },
  select: {
    width: "100%",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "10px 12px",
    fontSize: "var(--font-size-md)",
    outline: "none",
    color: "var(--fg)",
    background: "var(--bg)",
  },

  small: { fontSize: "var(--font-size-xs)", color: "var(--fg-muted)" },
  label: { fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--fg)", display: "block", marginBottom: 6 },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-pill)",
    padding: "4px 10px",
    fontSize: "var(--font-size-xs)",
    color: "var(--fg)",
    background: "var(--bg)",
    whiteSpace: "nowrap",
  },
  chipActive: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid var(--fg)",
    borderRadius: "var(--radius-pill)",
    padding: "4px 10px",
    fontSize: "var(--font-size-xs)",
    color: "var(--bg)",
    background: "var(--fg)",
    whiteSpace: "nowrap",
  },

  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-pill)",
    border: "1px solid var(--border)",
    padding: "8px 12px",
    fontSize: "var(--font-size-sm)",
    fontWeight: 700,
    color: "var(--fg)",
    background: "var(--bg)",
    textDecoration: "none",
    cursor: "pointer",
  },
  buttonPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--fg)",
    padding: "12px 14px",
    fontSize: "var(--font-size-md)",
    fontWeight: 800,
    color: "var(--bg)",
    background: "var(--fg)",
    textDecoration: "none",
    cursor: "pointer",
  },
  buttonDanger: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--danger)",
    padding: "12px 14px",
    fontSize: "var(--font-size-md)",
    fontWeight: 800,
    color: "var(--danger)",
    background: "var(--bg)",
    textDecoration: "none",
    cursor: "pointer",
  },
  buttonSuccess: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--success)",
    padding: "12px 14px",
    fontSize: "var(--font-size-md)",
    fontWeight: 800,
    color: "var(--success)",
    background: "var(--bg)",
    textDecoration: "none",
    cursor: "pointer",
  },

  fabWrap: {
    position: "fixed",
    left: "50%",
    bottom: "calc(var(--nav-height) + 12px)",
    transform: "translateX(-50%)",
    width: "calc(100% - 44px)",
    maxWidth: 420,
    zIndex: 50,
  },
  fab: {
    width: "100%",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--fg)",
    background: "var(--fg)",
    color: "var(--bg)",
    padding: "14px 16px",
    fontSize: "var(--font-size-md)",
    fontWeight: 800,
    boxShadow: "var(--shadow-lg)",
    cursor: "pointer",
  },

  divider: { height: 1, background: "var(--border)", margin: "14px 0" },

  errorBox: {
    border: "1px solid var(--danger)",
    borderRadius: "var(--radius-md)",
    padding: 12,
    color: "var(--danger)",
    fontSize: "var(--font-size-sm)",
    background: "#fee2e2",
  },
  successBox: {
    border: "1px solid var(--success)",
    borderRadius: "var(--radius-md)",
    padding: 12,
    color: "var(--success)",
    fontSize: "var(--font-size-sm)",
    background: "#dcfce7",
  },
};

// ─── Page wrapper ────────────────────────────────────────────────────────────

export function Page({
  title,
  subtitle,
  right,
  noBottomNav,
  navCurrent,
  icon,
  iconAccent,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  noBottomNav?: boolean;
  navCurrent?: string;
  icon?: string;
  iconAccent?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={noBottomNav ? styles.pageNoNav : styles.page}>
      <div style={styles.container}>
        {icon && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, marginTop: 4 }}>
            <span style={{
              width: 104, height: 104, borderRadius: 28,
              background: iconAccent ? iconAccent + "22" : "var(--bg-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 64,
            }}>
              {icon}
            </span>
          </div>
        )}
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>{title}</h1>
            {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {right ? <div>{right}</div> : null}
        </div>
        {children}
      </div>
      {navCurrent !== undefined && <BottomNav current={navCurrent} />}
    </div>
  );
}

// ─── BtnLink / Chip ──────────────────────────────────────────────────────────

export function BtnLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} scroll={href === "/" ? false : undefined} style={styles.button}>
      {children}
    </Link>
  );
}

export function Chip({ text, active, onClick }: { text: string; active?: boolean; onClick?: () => void }) {
  return (
    <span style={active ? styles.chipActive : styles.chip} onClick={onClick} role={onClick ? "button" : undefined}>
      {text}
    </span>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

export function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.38) }}
      title={initials}
    >
      {initials.toUpperCase().slice(0, 2)}
    </span>
  );
}

// ─── StarRating ──────────────────────────────────────────────────────────────

export function StarRating({
  value,
  onChange,
  readonly,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`star ${i <= display ? "filled" : "empty"}`}
          onClick={() => !readonly && onChange?.(i)}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(null)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function Skeleton({ width, height = 16 }: { width?: number | string; height?: number }) {
  return (
    <div
      className="skeleton"
      style={{ width: width ?? "100%", height, display: "block" }}
    />
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="modal-sheet"
        style={{
          background: "var(--bg)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          padding: "24px 22px 32px",
          width: "100%",
          maxWidth: 480,
          maxHeight: "85dvh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ ...styles.rowBetween, marginBottom: 16 }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ ...styles.button, padding: "4px 10px", fontSize: 18 }}>✕</button>
        </div>
        {children}
        {footer && <div style={{ marginTop: 18 }}>{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Bestätigen",
  dangerConfirm,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  dangerConfirm?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...styles.button, flex: 1 }}>Abbrechen</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            style={{ ...(dangerConfirm ? styles.buttonDanger : styles.buttonPrimary), flex: 1 }}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p style={{ fontSize: "var(--font-size-md)", color: "var(--fg-muted)" }}>{message}</p>
    </Modal>
  );
}

// ─── Toast system ─────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = React.useRef(0);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 200);
    }, 3000);
  }, []);

  const TOAST_COLORS: Record<ToastType, string> = {
    success: "var(--success)",
    error: "var(--danger)",
    info: "var(--info)",
    warning: "var(--warning)",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: "fixed", bottom: "calc(var(--nav-height) + 16px)", left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 44px)", maxWidth: 420,
        zIndex: 300, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none",
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={t.exiting ? "toast-exit" : "toast-enter"}
            style={{
              background: TOAST_COLORS[t.type],
              color: "#fff",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              boxShadow: "var(--shadow-lg)",
              pointerEvents: "auto",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/kueche", label: "Küche", icon: "🍳" },
  { href: "/einkauf", label: "Eink.", icon: "🛒" },
  { href: "/finanzen", label: "Fin.", icon: "🏦" },
  { href: "/ideen", label: "Ideen", icon: "💡" },
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/einstellungen", label: "Einst.", icon: "⚙️" },
  { href: "/aufgaben", label: "Aufgaben", icon: "✅" },
  { href: "/geburtstage", label: "Geb.", icon: "🎂" },
  { href: "/pinnwand", label: "Pinnwand", icon: "📌" },
  { href: "/split", label: "Split", icon: "💸" },
];

export function BottomNav({ current }: { current?: string }) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          scroll={item.href === "/" ? false : undefined}
          className={`bottom-nav-item${current === item.href || (item.href !== "/" && current?.startsWith(item.href)) ? " active" : ""}`}
        >
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
