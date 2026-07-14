"use client";

const variantMap = {
  indigo: {
    dot: "var(--color-indigo)",
    text: "var(--color-indigo-text)",
    bg: "var(--color-indigo-subtle)",
    border: "var(--color-indigo-border)",
  },
  warning: {
    dot: "var(--color-warning)",
    text: "var(--color-warning-text)",
    bg: "var(--color-warning-subtle)",
    border: "var(--color-warning-border)",
  },
  success: {
    dot: "var(--color-success)",
    text: "var(--color-success-text)",
    bg: "var(--color-success-subtle)",
    border: "var(--color-success-border)",
  },
  danger: {
    dot: "var(--color-danger)",
    text: "var(--color-danger-text)",
    bg: "var(--color-danger-subtle)",
    border: "var(--color-danger-border)",
  },
  neutral: {
    dot: "",
    text: "var(--color-text-secondary)",
    bg: "var(--color-bg-surface-3)",
    border: "var(--color-border-subtle)",
  },
} as const;

export function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant: keyof typeof variantMap;
}) {
  const t = variantMap[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        padding: "0 10px",
        borderRadius: 999,
        backgroundColor: t.bg,
        border: `1px solid ${t.border}`,
        fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
        fontSize: 11,
        lineHeight: "14px",
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: t.text,
      }}
    >
      {variant !== "neutral" && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: t.dot,
            marginRight: 6,
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </span>
  );
}
