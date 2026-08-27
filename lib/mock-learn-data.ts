export type ModuleStatus = "passed" | "in-progress" | "not-started";

export interface MockModule {
  slug: string;
  number: string;
  title: string;
  status: ModuleStatus;
  lessons: number;
  lessonsComplete: number;
}

export interface MockUnit {
  id: string;
  number: string;
  title: string;
  track: string;
  locked?: boolean;
  lockMessage?: string;
  modules: MockModule[];
}

export const mockUnits: MockUnit[] = [
  {
    id: "unit-01",
    number: "01",
    title: "Why Bitcoin Matters",
    track: "DESIGN LAB",
    modules: [
      { slug: "why-bitcoin-matters", number: "01", title: "Why Bitcoin Matters", status: "in-progress", lessons: 1, lessonsComplete: 0 },
    ],
  },
  {
    id: "unit-02",
    number: "02",
    title: "Bitcoin UX Principles",
    track: "DESIGN LAB",
    modules: [
      { slug: "bitcoin-ux-principles", number: "01", title: "Bitcoin UX Principles", status: "not-started", lessons: 1, lessonsComplete: 0 },
    ],
  },
  {
    id: "unit-03",
    number: "03",
    title: "Self-Custody & Lightning UX",
    track: "DESIGN LAB",
    modules: [
      { slug: "self-custody-lightning-ux", number: "01", title: "Self-Custody & Lightning UX", status: "not-started", lessons: 1, lessonsComplete: 0 },
    ],
  },
  {
    id: "unit-04",
    number: "04",
    title: "Researching Bitcoin Products",
    track: "DESIGN LAB",
    modules: [
      { slug: "researching-bitcoin-products", number: "01", title: "Researching Bitcoin Products", status: "not-started", lessons: 1, lessonsComplete: 0 },
    ],
  },
  {
    id: "unit-05",
    number: "05",
    title: "How Open Design Works",
    track: "DESIGN LAB",
    modules: [
      { slug: "how-open-design-works", number: "01", title: "How Open Design Works", status: "not-started", lessons: 1, lessonsComplete: 0 },
    ],
  },
  {
    id: "unit-06",
    number: "06",
    title: "Your First Contribution",
    track: "DESIGN LAB",
    modules: [
      { slug: "your-first-contribution", number: "01", title: "Your First Contribution", status: "not-started", lessons: 1, lessonsComplete: 0 },
    ],
  },
];

export interface ModuleNavigation {
  prev: { slug: string; title: string; unitNumber: string; unitTitle: string } | null;
  current: { slug: string; title: string; unitNumber: string; unitTitle: string; moduleNumber: string; track: string; lessons: number; lessonsComplete: number } | null;
  next: { slug: string; title: string; unitNumber: string; unitTitle: string } | null;
}

export function getModuleNavigation(currentSlug: string): ModuleNavigation {
  const allModules = mockUnits.flatMap((unit) =>
    unit.modules.map((mod) => ({
      slug: mod.slug,
      title: mod.title,
      unitNumber: unit.number,
      unitTitle: unit.title,
      moduleNumber: mod.number,
      track: unit.track,
      lessons: mod.lessons,
      lessonsComplete: mod.lessonsComplete,
    }))
  );

  const idx = allModules.findIndex((m) => m.slug === currentSlug);
  if (idx === -1) return { prev: null, current: null, next: null };

  return {
    prev: idx > 0 ? allModules[idx - 1] : null,
    current: allModules[idx],
    next: idx < allModules.length - 1 ? allModules[idx + 1] : null,
  };
}

export function getTotalProgress() {
  const allModules = mockUnits.flatMap((u) => u.modules);
  const total = allModules.length;
  const complete = allModules.filter((m) => m.status === "passed").length;
  return { total, complete, percent: Math.round((complete / total) * 100) };
}
