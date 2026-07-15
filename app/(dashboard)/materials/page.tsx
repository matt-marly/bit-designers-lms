"use client";

import { useState, useMemo } from "react";
import { FileText, ExternalLink, Clock, ChevronDown, Search } from "lucide-react";
import { mockMaterialGroups } from "@/lib/mock-materials-data";
import type { Material } from "@/lib/mock-materials-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const filterTabs = [
  { label: "All", value: "all" },
  { label: "Core", value: "core" },
  { label: "Craft", value: "craft" },
  { label: "Research & Contribute", value: "research-contribute" },
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

function MaterialCard({ material }: { material: Material }) {
  return (
    <div
      onClick={() => window.open(material.url, "_blank")}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") window.open(material.url, "_blank");
      }}
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        padding: "20px 24px",
        cursor: "pointer",
        transitionProperty: "border-color, background-color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
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
      {/* Left */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Type row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FileText
            style={{ width: 13, height: 13, color: "var(--color-text-tertiary)", flexShrink: 0 }}
          />
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
            DOC
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
          {material.title}
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
          {material.description}
        </p>

        {/* Read time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 12,
          }}
        >
          <Clock
            style={{ width: 12, height: 12, color: "var(--color-text-tertiary)", flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              lineHeight: "14px",
              fontWeight: 500,
              color: "var(--color-text-tertiary)",
            }}
          >
            {material.readTime} read
          </span>
        </div>
      </div>

      {/* Right */}
      <div style={{ flexShrink: 0 }}>
        <ExternalLink
          style={{
            width: 16,
            height: 16,
            color: "var(--color-text-tertiary)",
            transitionProperty: "color",
            transitionDuration: "var(--duration-fast)",
          }}
        />
      </div>
    </div>
  );
}

export default function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of mockMaterialGroups) initial[g.id] = true;
    return initial;
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mockMaterialGroups
      .filter((group) => activeFilter === "all" || group.id === activeFilter)
      .map((group) => {
        if (!q) return group;
        const filtered = group.materials.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q)
        );
        return { ...group, materials: filtered };
      })
      .filter((group) => group.materials.length > 0);
  }, [searchQuery, activeFilter]);

  const totalResults = filteredGroups.reduce((sum, g) => sum + g.materials.length, 0);

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
          marginBottom: 12,
        }}
      >
        DESIGN LAB · COHORT 01
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
        }}
      >
        Materials
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
        Program documents, guides, and templates. Updated each cohort.
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
          placeholder="Search materials..."
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

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 16,
          borderBottom: "1px solid var(--color-border-subtle)",
          overflowX: "auto",
        }}
      >
        {filterTabs.map((tab) => (
          <FilterTab
            key={tab.value}
            label={tab.label}
            active={activeFilter === tab.value}
            onClick={() => setActiveFilter(tab.value)}
          />
        ))}
      </div>

      {/* Results count */}
      <p
        style={{
          fontFamily: font.mono,
          fontSize: 11,
          lineHeight: "14px",
          fontWeight: 500,
          color: "var(--color-text-tertiary)",
          margin: 0,
          marginTop: 8,
          marginBottom: 32,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {totalResults} result{totalResults !== 1 ? "s" : ""}
      </p>

      {/* Groups or empty state */}
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
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroups[group.id] !== false;
            return (
              <section key={group.id}>
                {/* Group header — clickable accordion */}
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
                    marginBottom: 20,
                    cursor: "pointer",
                  }}
                >
                  {/* Left */}
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
                          marginTop: 3,
                        }}
                      >
                        {group.description}
                      </p>
                    </div>
                  </div>

                  {/* Right — count badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      height: 24,
                      padding: "4px 10px",
                      borderRadius: 999,
                      backgroundColor: "var(--color-bg-surface-2)",
                      border: "1px solid var(--color-border-subtle)",
                      fontFamily: font.mono,
                      fontSize: 11,
                      lineHeight: "14px",
                      fontWeight: 500,
                      color: "var(--color-text-tertiary)",
                      flexShrink: 0,
                      marginLeft: 16,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {group.materials.length} documents
                  </span>
                </button>

                {/* Collapsible cards grid */}
                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: isExpanded ? 2000 : 0,
                    opacity: isExpanded ? 1 : 0,
                    transition:
                      "max-height 300ms var(--ease-out-quart), opacity 200ms var(--ease-out-quart)",
                  }}
                >
                  <div
                    className="grid grid-cols-1 md:grid-cols-2"
                    style={{ gap: 12 }}
                  >
                    {group.materials.map((material) => (
                      <MaterialCard key={material.slug} material={material} />
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
