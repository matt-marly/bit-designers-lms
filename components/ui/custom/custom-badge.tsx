"use client";

const styles = {
  default: {
    bg: "var(--color-bg-surface-3)",
    text: "var(--color-text-secondary)",
    border: "var(--color-border-subtle)",
  },
  indigo: {
    bg: "var(--color-indigo-subtle)",
    text: "var(--color-indigo-text)",
    border: "var(--color-indigo-border)",
  },
  btc: {
    bg: "var(--color-btc-subtle)",
    text: "var(--color-btc-text)",
    border: "var(--color-btc-border)",
  },
} as const;

export function CustomBadge({
  children,
  variant = "default",
}: {
  children: string;
  variant?: keyof typeof styles;
}) {
  const s = styles[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        padding: "0 8px",
        borderRadius: 6,
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
        fontSize: 10,
        lineHeight: "12px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: s.text,
      }}
    >
      {children}
    </span>
  );
}
