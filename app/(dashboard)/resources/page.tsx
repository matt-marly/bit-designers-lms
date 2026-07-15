"use client";

import { useState, useMemo } from "react";
import { Search, ExternalLink } from "lucide-react";
import { mockResources } from "@/lib/mock-resources-data";
import type { Resource } from "@/lib/mock-resources-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

type FilterType = "all" | "guide" | "research" | "tool" | "article";

const filterTabs: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Guide", value: "guide" },
  { label: "Research", value: "research" },
  { label: "Tool", value: "tool" },
  { label: "Article", value: "article" },
];

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        fontFamily: font.body,
        fontSize: 14,
        fontWeight: 500,
        color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
        backgroundColor: "transparent",
        border: "none",
        borderBottom: active
          ? "2px solid var(--color-indigo)"
          : "2px solid transparent",
        marginBottom: -1,
        cursor: "pointer",
        transitionProperty: "color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = "var(--color-text-secondary)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = "var(--color-text-tertiary)";
      }}
    >
      {label}
    </button>
  );
}

function TypeBadge({ type }: { type: Resource["type"] }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        padding: "3px 8px",
        borderRadius: 999,
        backgroundColor: "var(--color-bg-surface-3)",
        border: "1px solid var(--color-border-subtle)",
        fontFamily: font.mono,
        fontSize: 10,
        lineHeight: "12px",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--color-text-tertiary)",
      }}
    >
      {type}
    </span>
  );
}

function ResourceRow({ resource }: { resource: Resource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        padding: "20px 24px",
        borderBottom: "1px solid var(--color-border-subtle)",
        textDecoration: "none",
        cursor: "pointer",
        transitionProperty: "background-color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#1C1C1C";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* Left */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: type badge + source */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TypeBadge type={resource.type} />
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 10,
              lineHeight: "12px",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
            }}
          >
            · {resource.source}
          </span>
        </div>

        {/* Title */}
        <p
          style={{
            fontFamily: font.display,
            fontSize: 15,
            lineHeight: "21px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
            marginTop: 8,
          }}
        >
          {resource.title}
        </p>

        {/* Description */}
        <p
          className="line-clamp-2"
          style={{
            fontFamily: font.body,
            fontSize: 14,
            lineHeight: "21px",
            fontWeight: 400,
            color: "var(--color-text-secondary)",
            margin: 0,
            marginTop: 4,
          }}
        >
          {resource.description}
        </p>

        {/* Topics */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {resource.topics.map((topic) => (
            <span
              key={topic}
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "var(--color-bg-surface-2)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 999,
                padding: "3px 8px",
                fontFamily: font.mono,
                fontSize: 10,
                lineHeight: "12px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-text-tertiary)",
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Right: external link icon */}
      <div
        className="resource-link-icon"
        style={{
          flexShrink: 0,
          alignSelf: "center",
          transitionProperty: "color",
          transitionDuration: "var(--duration-fast)",
          color: "var(--color-text-tertiary)",
        }}
      >
        <ExternalLink style={{ width: 16, height: 16 }} />
      </div>
    </a>
  );
}

export default function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return mockResources.filter((r) => {
      const matchesFilter = filter === "all" || r.type === filter;
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.topics.some((t) => t.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  return (
    <>
      <style>{`
        a:last-child > .resource-link-icon {
          /* handled via inline */
        }
        a:hover .resource-link-icon {
          color: var(--color-text-primary) !important;
        }
        /* Remove border on last row */
        .resource-list > a:last-child {
          border-bottom: none !important;
        }
      `}</style>

      <div
        className="px-8 py-12 md:px-8 md:py-12 max-md:px-5 max-md:py-6"
        style={{ maxWidth: 880, margin: "0 auto" }}
      >
        {/* PAGE HEADER */}
        <header>
          <h1
            style={{
              fontFamily: font.display,
              fontSize: 44,
              lineHeight: 1.1,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Resources
          </h1>
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
            DESIGN LAB · COHORT 01
          </p>
        </header>

        {/* SEARCH + FILTER ROW */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 16,
            marginTop: 24,
            flexWrap: "wrap",
          }}
        >
          {/* Search input */}
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                width: 16,
                height: 16,
                color: "var(--color-text-tertiary)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search resources..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                backgroundColor: "var(--color-bg-surface-2)",
                border: "1px solid var(--color-border-strong)",
                borderRadius: 10,
                padding: "10px 14px 10px 40px",
                fontFamily: font.body,
                fontSize: "14.5px",
                lineHeight: "22px",
                fontWeight: 400,
                color: "var(--color-text-primary)",
                outline: "none",
                transitionProperty: "border-color",
                transitionDuration: "var(--duration-base)",
                transitionTimingFunction: "var(--ease-out-quart)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-focus)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-strong)";
              }}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginTop: 16,
            borderBottom: "1px solid var(--color-border-subtle)",
          }}
        >
          {filterTabs.map((tab) => (
            <FilterTab
              key={tab.value}
              label={tab.label}
              active={filter === tab.value}
              onClick={() => setFilter(tab.value)}
            />
          ))}
        </div>

        {/* Results count */}
        <p
          style={{
            fontFamily: font.mono,
            fontSize: 12,
            lineHeight: "14px",
            fontWeight: 500,
            color: "var(--color-text-tertiary)",
            margin: 0,
            marginTop: 16,
            marginBottom: 20,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
        </p>

        {/* RESOURCE LIST */}
        {filtered.length === 0 ? (
          /* Empty state */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: 360,
              margin: "0 auto",
              padding: "64px 24px",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                backgroundColor: "var(--color-bg-surface-2)",
                border: "1px solid var(--color-border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search
                style={{ width: 40, height: 40, color: "var(--color-text-tertiary)" }}
              />
            </div>
            <p
              style={{
                fontFamily: font.body,
                fontSize: 16,
                lineHeight: "22px",
                fontWeight: 600,
                letterSpacing: "-0.005em",
                color: "var(--color-text-primary)",
                margin: 0,
                marginTop: 20,
                textAlign: "center",
              }}
            >
              No resources found
            </p>
            <p
              style={{
                fontFamily: font.body,
                fontSize: 13,
                lineHeight: "19px",
                fontWeight: 400,
                color: "var(--color-text-secondary)",
                margin: 0,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Try a different search term or filter.
            </p>
          </div>
        ) : (
          <div
            className="resource-list"
            style={{
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {filtered.map((resource) => (
              <ResourceRow key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
