"use client";

export function SectionLabel({
  children,
  color = "var(--color-text-tertiary)",
}: {
  children: string;
  color?: string;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
        fontSize: 11,
        lineHeight: "14px",
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </span>
  );
}
