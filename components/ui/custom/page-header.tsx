"use client";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

export function PageHeader({
  title,
  context,
  action,
}: {
  title: string;
  context?: string;
  action?: React.ReactNode;
}) {
  return (
    <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <h1
          style={{
            fontFamily: font.display,
            fontSize: 36,
            lineHeight: "42px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {title}
        </h1>
        {context && (
          <p
            style={{
              fontFamily: font.mono,
              fontSize: 13,
              lineHeight: "18px",
              fontWeight: 500,
              letterSpacing: "0",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              marginTop: 10,
            }}
          >
            {context}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
