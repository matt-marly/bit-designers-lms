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
  { label: "Contribute", value: "research-contribute" },
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
      className="group"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: 14,
        padding: "20px 20px 16px 20px",
        cursor: "pointer",
        transitionProperty: "border-color, background-color",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
        display: "flex",
        flexDirection: "column",
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
      {/* Hover ExternalLink icon — top right */}
      <div
        className="opacity-0 group-hover:opacity-100"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          transitionProperty: "opacity",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
        }}
      >
        <ExternalLink
          style={{ width: 13, height: 13, color: "var(--color-text-tertiary)" }}
        />
      </div>

      {/* Title row — icon inline with title */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <FileText
          style={{ width: 13, height: 13, color: "var(--color-text-tertiary)", flexShrink: 0 }}
        />
        <p
          style={{
            fontFamily: font.display,
            fontSize: 15,
            lineHeight: "21px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {material.title}
        </p>
      </div>

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
          flex: 1,
          wordBreak: "break-word",
        }}
      >
        {material.description}
      </p>

      {/* Footer row — read time only */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--color-border-subtle)",
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
  );
}

export default function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (let i = 0; i < mockMaterialGroups.length; i++) {
      initial[mockMaterialGroups[i].id] = i === 0;
    }
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

  const isSpecificFilter = activeFilter !== "all";

  const allExpanded = mockMaterialGroups.every((g) => expandedGroups[g.id] !== false);

  const toggleAll = () => {
    const newState: Record<string, boolean> = {};
    const target = !allExpanded;
    for (const g of mockMaterialGroups) newState[g.id] = target;
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
            padding: "40px 0",
          }}
        >
          <Search style={{ width: 32, height: 32, color: "#737373" }} />
          <p
            style={{
              fontFamily: font.body,
              fontSize: 16,
              fontWeight: 500,
              color: "#FFFFFF",
              margin: 0,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            No materials match your search
          </p>
          <p
            style={{
              fontFamily: font.body,
              fontSize: 14,
              color: "#737373",
              margin: 0,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            Try a different keyword.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            style={{
              marginTop: 16,
              padding: "0 16px",
              height: 40,
              fontFamily: font.body,
              fontSize: "14.5px",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              transitionProperty: "background-color, color",
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-out-quart)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
              e.currentTarget.style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-text-secondary)";
            }}
          >
            Clear search
          </button>
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
                      {group.materials.length} documents
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
                      {group.materials.length} documents
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
