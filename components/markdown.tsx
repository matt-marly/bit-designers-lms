"use client";

import ReactMarkdown from "react-markdown";
import type { ReactNode } from "react";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

function H2({ children }: { children?: ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: font.display,
        fontSize: 20,
        lineHeight: "26px",
        fontWeight: 600,
        color: "var(--color-text-primary)",
        margin: 0,
        marginTop: 48,
        marginBottom: 16,
      }}
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children?: ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: font.display,
        fontSize: 16,
        lineHeight: "22px",
        fontWeight: 600,
        color: "var(--color-text-primary)",
        margin: 0,
        marginTop: 32,
        marginBottom: 12,
      }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children?: ReactNode }) {
  return (
    <p
      style={{
        fontFamily: font.body,
        fontSize: 15,
        lineHeight: "26px",
        fontWeight: 400,
        color: "var(--color-text-secondary)",
        margin: 0,
        marginBottom: 20,
      }}
    >
      {children}
    </p>
  );
}

function Ul({ children }: { children?: ReactNode }) {
  return (
    <ul
      style={{
        fontFamily: font.body,
        fontSize: 15,
        lineHeight: "26px",
        color: "var(--color-text-secondary)",
        margin: 0,
        marginBottom: 20,
        paddingLeft: 24,
      }}
    >
      {children}
    </ul>
  );
}

function Ol({ children }: { children?: ReactNode }) {
  return (
    <ol
      style={{
        fontFamily: font.body,
        fontSize: 15,
        lineHeight: "26px",
        color: "var(--color-text-secondary)",
        margin: 0,
        marginBottom: 20,
        paddingLeft: 24,
      }}
    >
      {children}
    </ol>
  );
}

function Li({ children }: { children?: ReactNode }) {
  return <li style={{ marginBottom: 8 }}>{children}</li>;
}

function Strong({ children }: { children?: ReactNode }) {
  return <strong style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{children}</strong>;
}

function Blockquote({ children }: { children?: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-bg-surface-2)",
        borderLeft: "3px solid var(--color-indigo)",
        borderRadius: "0 8px 8px 0",
        padding: "16px 20px",
        margin: "28px 0",
      }}
    >
      <blockquote style={{ margin: 0, padding: 0 }}>{children}</blockquote>
    </div>
  );
}

function Table({ children }: { children?: ReactNode }) {
  return (
    <div style={{ overflowX: "auto", margin: "28px 0" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          fontFamily: font.body,
          fontSize: 14,
          minWidth: 480,
        }}
      >
        {children}
      </table>
    </div>
  );
}

function Th({ children }: { children?: ReactNode }) {
  return (
    <th
      style={{
        fontFamily: font.mono,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        textAlign: "left",
        color: "var(--color-text-tertiary)",
        backgroundColor: "var(--color-bg-surface-2)",
        borderBottom: "1px solid var(--color-border-subtle)",
        padding: "10px 14px",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children?: ReactNode }) {
  return (
    <td
      style={{
        fontFamily: font.body,
        fontSize: 14,
        lineHeight: "21px",
        color: "var(--color-text-secondary)",
        borderBottom: "1px solid var(--color-border-subtle)",
        padding: "10px 14px",
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

function Hr() {
  return (
    <div
      style={{
        height: 1,
        backgroundColor: "var(--color-border-subtle)",
        margin: "40px 0",
      }}
    />
  );
}

function A({ children, href }: { children?: ReactNode; href?: string }) {
  const external = Boolean(href && /^https?:\/\//i.test(href));
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      style={{
        color: "var(--color-indigo-text)",
        textDecoration: "underline",
        textUnderlineOffset: 3,
      }}
    >
      {children}
    </a>
  );
}

function Code({ children }: { children?: ReactNode }) {
  return (
    <code
      style={{
        fontFamily: font.mono,
        fontSize: "0.85em",
        color: "var(--color-text-primary)",
        backgroundColor: "var(--color-bg-surface-3)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 6,
        padding: "2px 6px",
      }}
    >
      {children}
    </code>
  );
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h2: H2,
        h3: H3,
        p: P,
        ul: Ul,
        ol: Ol,
        li: Li,
        strong: Strong,
        em: ({ children: c }) => <em>{c}</em>,
        blockquote: Blockquote,
        table: Table,
        tr: ({ children: c }) => <tr>{c}</tr>,
        th: Th,
        td: Td,
        hr: Hr,
        a: A,
        code: Code,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
