"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Home,
  BookOpen,
  Target,
  Radio,
  FolderOpen,
  Library,
  Users,
  FileText,
  PlayCircle,
} from "lucide-react";
import { mockUnits } from "@/lib/mock-learn-data";
import { mockMissions } from "@/lib/mock-missions-data";
import { mockResources } from "@/lib/mock-resources-data";
import { mockReferenceItems } from "@/lib/mock-reference-data";

const font = {
  display: "var(--font-display), 'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "var(--font-body), 'Inter', system-ui, -apple-system, sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', 'SF Mono', monospace",
};

const quickLinks = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "Missions", href: "/missions", icon: Target },
  { label: "Live", href: "/live", icon: Radio },
  { label: "Resources", href: "/resources", icon: FolderOpen },
  { label: "Reference", href: "/reference", icon: Library },
];

interface SearchResult {
  id: string;
  title: string;
  context: string;
  type: "module" | "mission" | "resource" | "reference";
  href?: string;
  url?: string;
  icon: typeof BookOpen;
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return (
    <>
      {before}
      <span style={{ color: "var(--color-indigo-text)" }}>{match}</span>
      {after}
    </>
  );
}

function getSearchResults(query: string): SearchResult[] {
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  // Modules
  for (const unit of mockUnits) {
    for (const mod of unit.modules) {
      if (mod.title.toLowerCase().includes(q)) {
        results.push({
          id: `mod-${mod.slug}`,
          title: mod.title,
          context: `MODULE · ${unit.title}`,
          type: "module",
          href: `/learn/${mod.slug}`,
          icon: BookOpen,
        });
      }
    }
  }

  // Missions
  for (const mission of mockMissions) {
    if (mission.title.toLowerCase().includes(q)) {
      results.push({
        id: `mis-${mission.slug}`,
        title: mission.title,
        context: `MISSION · ${mission.status.replace("-", " ").toUpperCase()}`,
        type: "mission",
        href: `/missions/${mission.slug}`,
        icon: Target,
      });
    }
  }

  // Resources
  for (const resource of mockResources) {
    if (
      resource.title.toLowerCase().includes(q) ||
      resource.description.toLowerCase().includes(q)
    ) {
      results.push({
        id: `res-${resource.id}`,
        title: resource.title,
        context: `${resource.type.toUpperCase()} · ${resource.source}`,
        type: "resource",
        url: resource.url,
        icon: FileText,
      });
    }
  }

  // Reference
  for (const ref of mockReferenceItems) {
    if (
      ref.title.toLowerCase().includes(q) ||
      ref.description.toLowerCase().includes(q)
    ) {
      results.push({
        id: `ref-${ref.id}`,
        title: ref.title,
        context: `${ref.topic.toUpperCase()} · ${ref.duration}`,
        type: "reference",
        url: ref.url,
        icon: ref.type === "video" ? PlayCircle : FileText,
      });
    }
  }

  return results;
}

function groupResults(results: SearchResult[]) {
  const groups: { label: string; type: string; items: SearchResult[] }[] = [];
  const modules = results.filter((r) => r.type === "module");
  const missions = results.filter((r) => r.type === "mission");
  const resources = results.filter((r) => r.type === "resource");
  const references = results.filter((r) => r.type === "reference");

  if (modules.length) groups.push({ label: "MODULES", type: "module", items: modules });
  if (missions.length) groups.push({ label: "MISSIONS", type: "mission", items: missions });
  if (resources.length) groups.push({ label: "RESOURCES", type: "resource", items: resources });
  if (references.length) groups.push({ label: "REFERENCE", type: "reference", items: references });

  return groups;
}

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced query
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(
    () => (debouncedQuery ? getSearchResults(debouncedQuery) : []),
    [debouncedQuery]
  );
  const groups = useMemo(() => groupResults(results), [results]);

  // Flatten for keyboard nav
  const allItems = useMemo(() => {
    if (!debouncedQuery) return quickLinks.map((l, i) => ({ ...l, _idx: i, _type: "quick" as const }));
    return results.map((r, i) => ({ ...r, _idx: i, _type: "result" as const }));
  }, [debouncedQuery, results]);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setDebouncedQuery("");
      setHighlightedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [debouncedQuery]);

  const activateItem = useCallback(
    (index: number) => {
      const item = allItems[index];
      if (!item) return;

      if (item._type === "quick") {
        router.push((item as (typeof quickLinks)[0] & { _idx: number; _type: "quick" }).href);
        onClose();
      } else {
        const r = item as SearchResult & { _idx: number; _type: "result" };
        if (r.href) {
          router.push(r.href);
          onClose();
        } else if (r.url) {
          window.open(r.url, "_blank", "noopener");
          onClose();
        }
      }
    },
    [allItems, router, onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        activateItem(highlightedIndex);
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, highlightedIndex, allItems, activateItem, onClose]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const el = resultsRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 600,
          width: "90vw",
          marginTop: "15vh",
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Search input */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Search
            style={{
              width: 18,
              height: 18,
              color: "var(--color-text-tertiary)",
              flexShrink: 0,
            }}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search everything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              fontFamily: font.body,
              fontSize: 16,
              lineHeight: "22px",
              fontWeight: 400,
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {/* Results area */}
        <div
          ref={resultsRef}
          className="command-palette-scroll"
          style={{ maxHeight: 480, overflowY: "auto" }}
        >
          <style>{`
            .command-palette-scroll::-webkit-scrollbar {
              width: 4px;
            }
            .command-palette-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .command-palette-scroll::-webkit-scrollbar-thumb {
              background: var(--color-border-subtle);
              border-radius: 999px;
            }
          `}</style>

          {!debouncedQuery ? (
            /* Quick links */
            <>
              <div
                style={{
                  padding: "12px 20px 6px",
                  fontFamily: font.mono,
                  fontSize: 10,
                  lineHeight: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "var(--color-text-tertiary)",
                }}
              >
                QUICK LINKS
              </div>
              {quickLinks.map((link, i) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    data-index={i}
                    onClick={() => activateItem(i)}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "10px 20px",
                      backgroundColor:
                        highlightedIndex === i
                          ? "var(--color-bg-surface-2)"
                          : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <Icon
                      style={{
                        width: 16,
                        height: 16,
                        color: "var(--color-text-tertiary)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: font.body,
                        fontSize: 14,
                        lineHeight: "22px",
                        fontWeight: 400,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {link.label}
                    </span>
                  </button>
                );
              })}
            </>
          ) : results.length === 0 ? (
            /* No results */
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  lineHeight: "22px",
                  fontWeight: 400,
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                No results for &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          ) : (
            /* Grouped results */
            groups.map((group, gi) => {
              return (
                <div key={group.type}>
                  <div
                    style={{
                      padding: "12px 20px 4px",
                      fontFamily: font.mono,
                      fontSize: 10,
                      lineHeight: "12px",
                      fontWeight: 600,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: "var(--color-text-tertiary)",
                      ...(gi > 0
                        ? {
                            borderTop: "1px solid var(--color-border-subtle)",
                          }
                        : {}),
                    }}
                  >
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const currentIndex = flatIndex++;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        data-index={currentIndex}
                        onClick={() => activateItem(currentIndex)}
                        onMouseEnter={() => setHighlightedIndex(currentIndex)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "10px 20px",
                          backgroundColor:
                            highlightedIndex === currentIndex
                              ? "var(--color-bg-surface-2)"
                              : "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <Icon
                          style={{
                            width: 14,
                            height: 14,
                            color: "var(--color-text-tertiary)",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontFamily: font.body,
                              fontSize: 14,
                              lineHeight: "22px",
                              fontWeight: 400,
                              color: "var(--color-text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {highlightMatch(item.title, debouncedQuery)}
                          </div>
                          <div
                            style={{
                              fontFamily: font.mono,
                              fontSize: 11,
                              lineHeight: "14px",
                              fontWeight: 500,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              color: "var(--color-text-tertiary)",
                            }}
                          >
                            {item.context}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
