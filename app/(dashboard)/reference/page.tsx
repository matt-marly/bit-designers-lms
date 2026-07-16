"use client";

import { useState, useMemo } from "react";
import { PlayCircle, ExternalLink, ChevronDown, Search } from "lucide-react";
import { mockReferenceGroups } from "@/lib/mock-reference-data";
import type { ReferenceItem } from "@/lib/mock-reference-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const filterTabs = [
  { label: "All", value: "all" },
  { label: "Foundations", value: "foundations" },
  { label: "Craft", value: "craft" },
  { label: "Research", value: "research" },
  { label: "Contribution", value: "contribution" },
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
        borderBottom: active ? "2px solid var(--color-indigo)" : "2px solid transparent",
        marginBottom: -1,
        cursor: "pointer",
        transitionProperty: "color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
        whiteSpace: "nowrap",
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

function ReferenceCard({ item }: { item: ReferenceItem }) {
  return (
    <div
      onClick={() => window.open(item.url, "_blank")}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") window.open(item.url, "_blank");
      }}
      className="group"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        transitionProperty: "border-color, background-color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-strong)";
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border-subtle)";
        e.currentTarget.style.backgroundColor = "var(--color-bg-surface)";
      }}
    >
      {/* Hover ExternalLink icon — top right of card */}
      <div
        className="opacity-0 group-hover:opacity-100"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1,
          transitionProperty: "opacity",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
      >
        <ExternalLink
          style={{ width: 13, height: 13, color: "var(--color-text-tertiary)" }}
        />
      </div>

      {/* Card top — fixed height thumbnail */}
      <div
        style={{
          width: "100%",
          height: 140,
          backgroundColor: "var(--color-bg-surface-2)",
          borderBottom: "1px solid var(--color-border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <PlayCircle
          style={{ width: 28, height: 28, color: "var(--color-text-secondary)" }}
        />
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "3px 8px",
            borderRadius: 6,
            fontFamily: font.mono,
            fontSize: 10,
            lineHeight: "12px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-text-primary)",
          }}
        >
          VIDEO
        </span>
        <span
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "3px 8px",
            borderRadius: 6,
            fontFamily: font.mono,
            fontSize: 10,
            lineHeight: "12px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
          }}
        >
          {item.duration}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column" }}>
        <p
          className="line-clamp-2"
          style={{
            fontFamily: font.display,
            fontSize: 14,
            lineHeight: "19px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {item.title}
        </p>
        <p
          className="line-clamp-2"
          style={{
            fontFamily: font.body,
            fontSize: 13,
            lineHeight: "19px",
            fontWeight: 400,
            color: "var(--color-text-secondary)",
            margin: 0,
            marginTop: 4,
            minHeight: 38,
            flex: 1,
          }}
        >
          {item.description}
        </p>
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--color-border-subtle)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: font.body,
              fontSize: 12,
              lineHeight: "16px",
              fontWeight: 400,
              color: "var(--color-text-tertiary)",
            }}
          >
            {item.source}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ReferencePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of mockReferenceGroups) initial[g.id] = true;
    return initial;
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mockReferenceGroups
      .filter((group) => activeFilter === "all" || group.id === activeFilter)
      .map((group) => {
        if (!q) return group;
        const filtered = group.items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
        );
        return { ...group, items: filtered };
      })
      .filter((group) => group.items.length > 0);
  }, [searchQuery, activeFilter]);

  const isSpecificFilter = activeFilter !== "all";

  const allExpanded = mockReferenceGroups.every((g) => expandedGroups[g.id] !== false);

  const toggleAll = () => {
    const newState: Record<string, boolean> = {};
    const target = !allExpanded;
    for (const g of mockReferenceGroups) newState[g.id] = target;
    setExpandedGroups(newState);
  };

  return (
    <div
      className="px-8 py-12 md:px-8 md:py-12 max-md:px-5 max-md:py-6"
      style={{ maxWidth: 880, margin: "0 auto" }}
    >
      {/* Context line */}
      <span
        style={{
          fontFamily: font.mono,
          fontSize: 11,
          lineHeight: "14px",
          fontWeight: 600,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "var(--color-text-tertiary)",
          display: "block",
        }}
      >
        FREE · BITCOIN & OPEN SOURCE
      </span>

      {/* Title */}
      <h1
        style={{
          fontFamily: font.display,
          fontSize: 44,
          lineHeight: 1.1,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--color-text-primary)",
          margin: 0,
          marginTop: 12,
        }}
      >
        Reference
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: font.body,
          fontSize: 15,
          lineHeight: "24px",
          fontWeight: 400,
          color: "var(--color-text-secondary)",
          margin: 0,
          marginTop: 8,
          maxWidth: 520,
        }}
      >
        Curated videos and articles for designers working in Bitcoin and open source. Every pick earns its place — no filler.
      </p>

      {/* Search input */}
      <div style={{ marginTop: 24, position: "relative" }}>
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
          placeholder="Search reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Filter tabs row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", overflowX: "auto" }}>
          {filterTabs.map((tab) => (
            <FilterTab
              key={tab.value}
              label={tab.label}
              active={activeFilter === tab.value}
              onClick={() => setActiveFilter(tab.value)}
            />
          ))}
        </div>

        {!isSpecificFilter && (
          <button
            onClick={toggleAll}
            style={{
              fontFamily: font.body,
              fontSize: 12,
              fontWeight: 400,
              color: "var(--color-text-tertiary)",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px 0",
              whiteSpace: "nowrap",
              marginLeft: 16,
              transitionProperty: "color",
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-out-quart)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-text-tertiary)";
            }}
          >
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>

      <div style={{ height: 32 }} />

      {filteredGroups.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: 360,
            margin: "0 auto",
            padding: "48px 24px",
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
            <Search style={{ width: 40, height: 40, color: "var(--color-text-tertiary)" }} />
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
            No results found
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
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {filteredGroups.map((group) => {
            const isExpanded = isSpecificFilter || expandedGroups[group.id] !== false;
            const isAccordion = !isSpecificFilter;
            return (
              <section key={group.id}>
                {isAccordion ? (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--color-border-subtle)",
                      textAlign: "left",
                      padding: 0,
                      paddingBottom: 16,
                      marginBottom: isExpanded ? 20 : 0,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <ChevronDown
                        style={{
                          width: 16,
                          height: 16,
                          color: "var(--color-text-tertiary)",
                          flexShrink: 0,
                          transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                          transition: "transform 200ms var(--ease-out-quart)",
                        }}
                      />
                      <div>
                        <h2
                          style={{
                            fontFamily: font.display,
                            fontSize: 20,
                            lineHeight: "26px",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                            margin: 0,
                          }}
                        >
                          {group.label}
                        </h2>
                        <p
                          style={{
                            fontFamily: font.body,
                            fontSize: 13,
                            lineHeight: "19px",
                            fontWeight: 400,
                            color: "var(--color-text-tertiary)",
                            margin: 0,
                            marginTop: 6,
                          }}
                        >
                          {group.description}
                        </p>
                      </div>
                    </div>

                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 11,
                        lineHeight: "14px",
                        fontWeight: 500,
                        color: "var(--color-text-tertiary)",
                        flexShrink: 0,
                        marginLeft: 16,
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {group.items.length} picks
                    </span>
                  </button>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--color-border-subtle)",
                      paddingBottom: 16,
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontFamily: font.display,
                          fontSize: 20,
                          lineHeight: "26px",
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                          margin: 0,
                        }}
                      >
                        {group.label}
                      </h2>
                      <p
                        style={{
                          fontFamily: font.body,
                          fontSize: 13,
                          lineHeight: "19px",
                          fontWeight: 400,
                          color: "var(--color-text-tertiary)",
                          margin: 0,
                          marginTop: 6,
                        }}
                      >
                        {group.description}
                      </p>
                    </div>

                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 11,
                        lineHeight: "14px",
                        fontWeight: 500,
                        color: "var(--color-text-tertiary)",
                        flexShrink: 0,
                        marginLeft: 16,
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {group.items.length} picks
                    </span>
                  </div>
                )}

                <div
                  style={
                    isAccordion
                      ? {
                          overflow: "hidden",
                          maxHeight: isExpanded ? 2000 : 0,
                          opacity: isExpanded ? 1 : 0,
                          transition:
                            "max-height 300ms var(--ease-out-quart), opacity 200ms var(--ease-out-quart)",
                        }
                      : {}
                  }
                >
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    style={{ gap: 12, alignItems: "stretch" }}
                  >
                    {group.items.map((item) => (
                      <ReferenceCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
