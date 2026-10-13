"use client";

import { useId, useState } from "react";
import { PASSWORD_MIN_LENGTH, PASSWORD_RULES } from "@/lib/password-policy";

const font = {
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

// Motion follows docs/design-system.md §5: only color, border, opacity and
// progress-bar width animate; nothing animates layout.
const styles = `
  .pw-field {
    display: flex;
    align-items: center;
    height: 40px;
    background: #181818;
    border: 1px solid #333333;
    border-radius: 10px;
    transition: border-color 180ms cubic-bezier(0.25, 1, 0.5, 1);
  }
  .pw-field:focus-within {
    border-color: rgba(99,102,241,0.70);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }
  .pw-field[data-invalid="true"] { border-color: rgba(239,68,68,0.55); }
  .pw-field[data-invalid="true"]:focus-within { box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
  .pw-field input {
    flex: 1;
    min-width: 0;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    padding: 0 0 0 14px;
    font-family: ${font.body};
    font-size: 14px;
    letter-spacing: 0.02em;
    color: #FFFFFF;
  }
  .pw-field input::placeholder { color: #737373; letter-spacing: 0; }
  .pw-toggle {
    height: 100%;
    padding: 0 14px;
    flex-shrink: 0;
    background: none;
    border: none;
    border-radius: 0 10px 10px 0;
    font-family: ${font.mono};
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: #737373;
    cursor: pointer;
    transition: color 120ms cubic-bezier(0.25, 1, 0.5, 1);
  }
  .pw-toggle:hover { color: #B5B5B5; }
  .pw-toggle:focus-visible { outline: 2px solid rgba(129,140,248,0.90); outline-offset: -6px; border-radius: 8px; }
  .pw-toggle:disabled { cursor: not-allowed; opacity: 0.5; }

  .pw-mark {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 999px;
    border: 1px solid #333333;
    background: transparent;
    transition: background-color 180ms cubic-bezier(0.25, 1, 0.5, 1), border-color 180ms cubic-bezier(0.25, 1, 0.5, 1);
  }
  .pw-mark[data-on="true"] { background: rgba(34,197,94,0.10); border-color: rgba(34,197,94,0.30); }
  .pw-mark path {
    stroke-dasharray: 12;
    stroke-dashoffset: 12;
    transition: stroke-dashoffset 160ms cubic-bezier(0.25, 1, 0.5, 1);
  }
  .pw-mark[data-on="true"] path {
    stroke-dashoffset: 0;
    transition: stroke-dashoffset 240ms cubic-bezier(0.25, 1, 0.5, 1) 60ms;
  }

  .pw-bar-fill { transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1), background-color 180ms cubic-bezier(0.25, 1, 0.5, 1); }
  .pw-rule { transition: color 180ms cubic-bezier(0.25, 1, 0.5, 1); }

  @media (prefers-reduced-motion: reduce) {
    .pw-field, .pw-toggle, .pw-mark, .pw-mark path, .pw-mark[data-on="true"] path, .pw-bar-fill, .pw-rule {
      transition: none;
    }
  }
`;

/** A hand-drawn check that strokes itself in when `on` flips to true. */
export function CheckMark({ on, label }: { on: boolean; label?: string }) {
  return (
    <span className="pw-mark" data-on={on ? "true" : "false"} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path
          d="M2.25 5.25 L4.25 7.25 L7.75 3"
          stroke="#4ADE80"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

type PasswordInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  invalid?: boolean;
  trailing?: React.ReactNode;
  describedBy?: string;
  onBlur?: () => void;
};

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
  disabled,
  invalid,
  trailing,
  describedBy,
  onBlur,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <style>{styles}</style>
      <div className="pw-field" data-invalid={invalid ? "true" : "false"}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onBlur={onBlur}
          spellCheck={false}
        />
        {trailing}
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={disabled}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </>
  );
}

/** Password input with a requirements panel that tracks progress as you type. */
export function NewPasswordField({
  label,
  value,
  onChange,
  disabled,
  labelStyle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  labelStyle: React.CSSProperties;
}) {
  const id = useId();
  const results = PASSWORD_RULES.map((rule) => ({ rule, met: rule.test(value) }));
  const metCount = results.filter((r) => r.met).length;
  const total = results.length;
  const complete = metCount === total;
  const [lengthRule, ...otherRules] = results;

  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <PasswordInput
        id={id}
        value={value}
        onChange={onChange}
        placeholder="Create a password"
        disabled={disabled}
        describedBy={`${id}-requirements`}
      />

      <div
        id={`${id}-requirements`}
        style={{
          marginTop: 8,
          border: "1px solid #242424",
          borderRadius: 10,
          padding: "12px 14px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "#737373",
            }}
          >
            {complete ? "Looks good" : "Requirements"}
          </span>
          <span
            aria-live="polite"
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: complete ? "#4ADE80" : metCount > 0 ? "#A5B4FC" : "#737373",
              transition: "color 180ms cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {metCount}/{total}
            <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              {" "}requirements met
            </span>
          </span>
        </div>

        <div
          aria-hidden="true"
          style={{ height: 2, borderRadius: 999, backgroundColor: "#242424", marginTop: 8, overflow: "hidden" }}
        >
          <div
            className="pw-bar-fill"
            style={{
              height: "100%",
              width: `${(metCount / total) * 100}%`,
              borderRadius: 999,
              backgroundColor: complete ? "#22C55E" : "#6366F1",
            }}
          />
        </div>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 16,
            rowGap: 10,
          }}
        >
          <RuleRow
            label={lengthRule.rule.shortLabel}
            met={lengthRule.met}
            fullWidth
            meta={
              !lengthRule.met && value.length > 0 ? `${value.length}/${PASSWORD_MIN_LENGTH}` : undefined
            }
          />
          {otherRules.map(({ rule, met }) => (
            <RuleRow key={rule.id} label={rule.shortLabel} met={met} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function RuleRow({
  label,
  met,
  meta,
  fullWidth,
}: {
  label: string;
  met: boolean;
  meta?: string;
  fullWidth?: boolean;
}) {
  return (
    <li
      className="pw-rule"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: font.body,
        fontSize: 13,
        lineHeight: "16px",
        color: met ? "#B5B5B5" : "#737373",
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      <CheckMark on={met} />
      <span style={{ flex: 1 }}>
        {label}
        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          {met ? ", met" : ", not met"}
        </span>
      </span>
      {meta && (
        <span style={{ fontFamily: font.mono, fontSize: 11, color: "#737373", fontVariantNumeric: "tabular-nums" }}>
          {meta}
        </span>
      )}
    </li>
  );
}

/** Confirmation input that only complains once the user has had a fair chance to finish typing. */
export function ConfirmPasswordField({
  label,
  value,
  onChange,
  password,
  disabled,
  labelStyle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  password: string;
  disabled?: boolean;
  labelStyle: React.CSSProperties;
}) {
  const id = useId();
  const [touched, setTouched] = useState(false);

  const matches = value.length > 0 && value === password;
  const mismatch = value.length > 0 && !matches && (touched || value.length >= password.length);

  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <PasswordInput
        id={id}
        value={value}
        onChange={onChange}
        placeholder="Type it again"
        disabled={disabled}
        invalid={mismatch}
        describedBy={mismatch ? `${id}-error` : undefined}
        onBlur={() => setTouched(true)}
        trailing={
          value.length > 0 ? (
            <span style={{ display: "inline-flex", paddingLeft: 8 }}>
              <CheckMark on={matches} label={matches ? "Passwords match" : undefined} />
            </span>
          ) : null
        }
      />
      {mismatch && (
        <p
          id={`${id}-error`}
          role="alert"
          style={{ fontFamily: font.body, fontSize: 12, color: "#F87171", margin: 0, marginTop: 6 }}
        >
          Passwords don&apos;t match
        </p>
      )}
    </div>
  );
}
