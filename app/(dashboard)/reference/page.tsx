"use client";

import { useState, useMemo } from "react";
import { Search, ExternalLink, PlayCircle, FileText, BookOpen } from "lucide-react";
import { mockReferenceItems } from "@/lib/mock-reference-data";
import type { ReferenceItem } from "@/lib/mock-reference-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const allTopics = ["All", "GitHub", "Figma", "Claude", "Bitcoin", "Open Source", "UX Research"];

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
  const isVideo = item.type === "video";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block", height: "100%" }}
    >
      <div
        style={{
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 14,
          overflow: "hidden",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          transitionProperty: "border-color, background-color",
          transitionDuration: "var(--duration-fast)",
          transitionTimingFunction: "var(--ease-out-quart)",
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
        {/* Card top */}
        {isVideo ? (
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              backgroundColor: "var(--color-bg-surface-2)",
              borderBottom: "1px solid var(--color-border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <PlayCircle
              style={{ width: 32, height: 32, color: "var(--color-text-tertiary)" }}
            />
            {/* VIDEO badge top-left */}
            <span
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: "4px 8px",
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
            {/* Duration top-right */}
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: "4px 8px",
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
        ) : (
          <div
            style={{
              width: "100%",
              height: 80,
              backgroundColor: "var(--color-bg-surface-2)",
              borderBottom: "1px solid var(--color-border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {item.type === "guide" ? (
              <BookOpen
                style={{ width: 28, height: 28, color: "var(--color-text-tertiary)" }}
              />
            ) : (
              <FileText
                style={{ width: 28, height: 28, color: "var(--color-text-tertiary)" }}
              />
            )}
            {/* Type badge top-left */}
            <span
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: "4px 8px",
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
              {item.type}
            </span>
            {/* Duration top-right */}
            <span
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: "4px 8px",
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
        )}

        {/* Card body */}
        <div style={{ padding: 14, flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Topic pill */}
          <span
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              alignItems: "center",
              backgroundColor: "var(--color-bg-surface-3)",
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
              marginBottom: 8,
            }}
          >
            {item.topic}
          </span>

          {/* Title */}
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

          {/* Description */}
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
            }}
          >
            {item.description}
          </p>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid var(--color-border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
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
              {item.source}
            </span>
            <ExternalLink
              style={{ width: 13, height: 13, color: "var(--color-text-tertiary)" }}
            />
          </div>
        </div>
      </div>
    </a>
  );
}

export default function ReferencePage() {
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("All");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return mockReferenceItems.filter((item) => {
      const matchesTopic = activeTopic === "All" || item.topic === activeTopic;
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesTopic && matchesQuery;
    });
  }, [query, activeTopic]);

  return (
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
          Reference
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
          FREE LEARNING RESOURCES
        </p>
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
          A curated library of free resources for designers working in Bitcoin and open source.
        </p>
      </header>

      {/* SEARCH */}
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
          placeholder="Search reference materials..."
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

      {/* Topic filter tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          marginTop: 16,
          borderBottom: "1px solid var(--color-border-subtle)",
          overflowX: "auto",
        }}
      >
        {allTopics.map((topic) => (
          <FilterTab
            key={topic}
            label={topic}
            active={activeTopic === topic}
            onClick={() => setActiveTopic(topic)}
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
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {filtered.length} item{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* GRID */}
      {filtered.length === 0 ? (
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
            No items found
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
            Try a different search term or topic.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: 16, marginTop: 20 }}
        >
          {filtered.map((item) => (
            <ReferenceCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
