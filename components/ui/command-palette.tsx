"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Home,
  BookOpen,
  Target,
  Radio,
  FolderOpen,
  Library,
  FileText,
  PlayCircle,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { useLearnerTrack } from "@/lib/use-learner-track";
import { videoEmbedUrl } from "@/lib/video";
import { missionStatusLabel, type MissionStatus, type ReviewType } from "@/components/learn/missions";

type MissionHit = { slug: string; title: string; status: MissionStatus; reviewType: ReviewType };
type UnitHit = FunctionReturnType<typeof api.curriculum.overview>["units"][number];
type ResourceHit = FunctionReturnType<typeof api.resources.list>[number];

type SearchSources = {
  units: UnitHit[];
  missions: MissionHit[];
  materials: ResourceHit[];
  references: ResourceHit[];
};

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
  { label: "Materials", href: "/materials", icon: FolderOpen },
  { label: "Reference", href: "/reference", icon: Library },
];

interface SearchResult {
  id: string;
  title: string;
  context: string;
  type: "module" | "mission" | "material" | "reference";
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
      <span style={{ color: "var(--color-indigo-text)", fontWeight: 500 }}>{match}</span>
      {after}
    </>
  );
}

function getSearchResults(query: string, { units, missions, materials, references }: SearchSources): SearchResult[] {
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const unit of units) {
    for (const mod of unit.modules) {
      if (mod.title.toLowerCase().includes(q)) {
        results.push({
          id: `mod-${mod.slug}`,
          title: mod.title,
          context: `MODULE \u00b7 ${unit.title}`,
          type: "module",
          href: `/learn/${mod.slug}`,
          icon: BookOpen,
        });
      }
    }
  }

  for (const mission of missions) {
    if (mission.title.toLowerCase().includes(q)) {
      results.push({
        id: `mis-${mission.slug}`,
        title: mission.title,
        context: `MISSION \u00b7 ${missionStatusLabel(mission.status, mission.reviewType)}`,
        type: "mission",
        href: `/missions/${mission.slug}`,
        icon: Target,
      });
    }
  }

  for (const mat of materials) {
    if (mat.url && mat.title.toLowerCase().includes(q)) {
      results.push({
        id: `mat-${mat._id}`,
        title: mat.title,
        context: ["MATERIAL", mat.resourceType === "file" ? "PDF" : null, mat.meta].filter(Boolean).join(" \u00b7 "),
        type: "material",
        url: mat.url,
        icon: FileText,
      });
    }
  }

  for (const ref of references) {
    if (ref.url && ref.title.toLowerCase().includes(q)) {
      results.push({
        id: `ref-${ref._id}`,
        title: ref.title,
        context: ["REFERENCE", ref.meta].filter(Boolean).join(" \u00b7 "),
        type: "reference",
        url: ref.url,
        icon: videoEmbedUrl(ref.url) ? PlayCircle : FileText,
      });
    }
  }

  return results;
}

function groupResults(results: SearchResult[]) {
  const groups: { label: string; type: string; items: SearchResult[] }[] = [];
  const modules = results.filter((r) => r.type === "module");
  const missions = results.filter((r) => r.type === "mission");
  const materials = results.filter((r) => r.type === "material");
  const references = results.filter((r) => r.type === "reference");

  if (modules.length) groups.push({ label: "MODULES", type: "module", items: modules });
  if (missions.length) groups.push({ label: "MISSIONS", type: "mission", items: missions });
  if (materials.length) groups.push({ label: "MATERIALS", type: "material", items: materials });
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
  // Mounting only while open gives every opening a fresh query and highlight.
  return isOpen ? <Palette onClose={onClose} /> : null;
}

function Palette({ onClose }: { onClose: () => void }) {
  const [query, setQueryState] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { loading, track } = useLearnerTrack();
  const trackArgs = track ? { trackId: track.trackId } : "skip";
  const missionData = useQuery(api.missions.list, trackArgs);
  const outline = useQuery(api.curriculum.overview, trackArgs);
  const materials = useQuery(api.resources.list, loading ? "skip" : { kind: "material", trackId: track?.trackId });
  const references = useQuery(api.resources.list, loading ? "skip" : { kind: "reference", trackId: track?.trackId });

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    setHighlightedIndex(0);
  }, []);

  const results = useMemo(
    () =>
      query
        ? getSearchResults(query, {
            units: outline?.units ?? [],
            missions: missionData?.missions ?? [],
            materials: materials ?? [],
            references: references ?? [],
          })
        : [],
    [query, outline, missionData, materials, references]
  );
  const groups = useMemo(() => groupResults(results), [results]);

  // Flatten for keyboard nav
  const allItems = useMemo(() => {
    if (!query) return quickLinks.map((l, i) => ({ ...l, _idx: i, _type: "quick" as const }));
    return results.map((r, i) => ({ ...r, _idx: i, _type: "result" as const }));
  }, [query, results]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev >= allItems.length - 1 ? 0 : prev + 1
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev <= 0 ? allItems.length - 1 : prev - 1
        );
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
  }, [highlightedIndex, allItems, activateItem, onClose]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!resultsRef.current) return;
    const el = resultsRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  let flatIndex = 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.75)",
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 580,
          width: "90vw",
          marginTop: "12vh",
          backgroundColor: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
        }}
      >
        {/* Search input row */}
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
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X
                style={{
                  width: 16,
                  height: 16,
                  color: "var(--color-text-tertiary)",
                  transitionProperty: "color",
                  transitionDuration: "var(--duration-fast)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as SVGElement).style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as SVGElement).style.color = "var(--color-text-tertiary)";
                }}
              />
            </button>
          )}
        </div>

        {/* Results area */}
        <div
          ref={resultsRef}
          className="command-palette-scroll"
          style={{ maxHeight: 440, overflowY: "auto", paddingTop: 8, paddingBottom: 8 }}
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

          {!query ? (
            /* Quick links */
            <>
              <div
                style={{
                  padding: "10px 20px 6px",
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
                      transitionProperty: "background-color",
                      transitionDuration: "var(--duration-fast)",
                    }}
                  >
                    <Icon
                      style={{
                        width: 15,
                        height: 15,
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
                padding: "40px 20px",
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
                No results for &ldquo;{query}&rdquo;
              </p>
              <p
                style={{
                  fontFamily: font.body,
                  fontSize: 13,
                  lineHeight: "19px",
                  fontWeight: 400,
                  color: "var(--color-text-tertiary)",
                  margin: 0,
                  marginTop: 4,
                }}
              >
                Try a different search term.
              </p>
            </div>
          ) : (
            /* Grouped results */
            groups.map((group, gi) => {
              return (
                <div key={group.type}>
                  <div
                    style={{
                      padding: "10px 20px 4px",
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
                          transitionProperty: "background-color",
                          transitionDuration: "var(--duration-fast)",
                        }}
                      >
                        <Icon
                          style={{
                            width: 15,
                            height: 15,
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
                            {highlightMatch(item.title, query)}
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
                              marginTop: 2,
                            }}
                          >
                            {item.context}
                          </div>
                        </div>
                        <ChevronRight
                          style={{
                            width: 13,
                            height: 13,
                            color: "var(--color-text-tertiary)",
                            flexShrink: 0,
                          }}
                        />
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
