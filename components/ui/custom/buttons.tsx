"use client";

interface ButtonProps {
  children: string;
  icon?: React.ElementType;
  onClick?: () => void;
  fullWidth?: boolean;
  size?: "default" | "small" | "large";
  disabled?: boolean;
}

const sizeMap = {
  small: { height: 32, padding: "0 12px", iconSize: 16 },
  default: { height: 40, padding: "0 16px", iconSize: 16 },
  large: { height: 48, padding: "0 20px", iconSize: 18 },
} as const;

export function PrimaryButton({ children, icon: Icon, onClick, fullWidth, size = "default", disabled }: ButtonProps) {
  const s = sizeMap[size];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center transition-colors"
      style={{
        height: s.height,
        padding: s.padding,
        borderRadius: 10,
        backgroundColor: "var(--color-indigo)",
        color: "var(--color-text-on-accent)",
        fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
        fontSize: "14.5px",
        lineHeight: "22px",
        fontWeight: 500,
        gap: 8,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
        width: fullWidth ? "100%" : undefined,
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "var(--color-indigo-hover)"; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "var(--color-indigo)"; }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "var(--color-indigo-active)"; }}
      onMouseUp={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "var(--color-indigo-hover)"; }}
    >
      {Icon && <Icon style={{ width: s.iconSize, height: s.iconSize }} />}
      {children}
    </button>
  );
}

export function OutlineButton({ children, icon: Icon, onClick, fullWidth, size = "default", disabled }: ButtonProps) {
  const s = sizeMap[size];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center transition-colors"
      style={{
        height: s.height,
        padding: s.padding,
        borderRadius: 10,
        backgroundColor: "transparent",
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-border-strong)",
        fontFamily: "var(--font-body), 'Inter', system-ui, sans-serif",
        fontSize: "14.5px",
        lineHeight: "22px",
        fontWeight: 500,
        gap: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
        width: fullWidth ? "100%" : undefined,
        opacity: disabled ? 0.4 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = "var(--color-border-strong)";
        }
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
      onMouseUp={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
    >
      {Icon && <Icon style={{ width: s.iconSize, height: s.iconSize }} />}
      {children}
    </button>
  );
}
