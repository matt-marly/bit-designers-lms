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
    title: "Bitcoin Foundations",
    track: "DESIGN LAB",
    modules: [
      { slug: "what-is-bitcoin", number: "01", title: "What is Bitcoin?", status: "passed", lessons: 3, lessonsComplete: 3 },
      { slug: "bitcoin-and-money", number: "02", title: "Bitcoin and Money", status: "passed", lessons: 4, lessonsComplete: 4 },
      { slug: "bitcoin-as-a-design-medium", number: "03", title: "Bitcoin as a Design Medium", status: "in-progress", lessons: 4, lessonsComplete: 2 },
      { slug: "bitcoin-ux-principles", number: "04", title: "Bitcoin UX Principles", status: "not-started", lessons: 3, lessonsComplete: 0 },
      { slug: "bitcoin-wallets", number: "05", title: "Bitcoin Wallets", status: "not-started", lessons: 4, lessonsComplete: 0 },
      { slug: "bitcoin-transactions", number: "06", title: "Bitcoin Transactions", status: "not-started", lessons: 3, lessonsComplete: 0 },
    ],
  },
  {
    id: "unit-02",
    number: "02",
    title: "Bitcoin Product Design",
    track: "DESIGN LAB",
    modules: [
      { slug: "designing-for-bitcoin", number: "01", title: "Designing for Bitcoin", status: "not-started", lessons: 4, lessonsComplete: 0 },
      { slug: "bitcoin-design-systems", number: "02", title: "Bitcoin Design Systems", status: "not-started", lessons: 3, lessonsComplete: 0 },
      { slug: "bitcoin-onboarding", number: "03", title: "Bitcoin Onboarding Flows", status: "not-started", lessons: 4, lessonsComplete: 0 },
      { slug: "bitcoin-error-states", number: "04", title: "Bitcoin Error States", status: "not-started", lessons: 3, lessonsComplete: 0 },
      { slug: "bitcoin-accessibility", number: "05", title: "Bitcoin Accessibility", status: "not-started", lessons: 3, lessonsComplete: 0 },
      { slug: "bitcoin-mobile-design", number: "06", title: "Bitcoin Mobile Design", status: "not-started", lessons: 4, lessonsComplete: 0 },
    ],
  },
  {
    id: "unit-03",
    number: "03",
    title: "Design Lab",
    track: "DESIGN LAB",
    locked: true,
    lockMessage: "Complete Bitcoin Foundations to unlock Design Lab",
    modules: [
      { slug: "ux-audit-intro", number: "01", title: "UX Audit Introduction", status: "not-started", lessons: 3, lessonsComplete: 0 },
      { slug: "user-research-bitcoin", number: "02", title: "User Research for Bitcoin", status: "not-started", lessons: 4, lessonsComplete: 0 },
      { slug: "figma-for-bitcoin", number: "03", title: "Figma for Bitcoin", status: "not-started", lessons: 3, lessonsComplete: 0 },
      { slug: "contribution-proposals", number: "04", title: "Contribution Proposals", status: "not-started", lessons: 4, lessonsComplete: 0 },
      { slug: "github-for-designers", number: "05", title: "GitHub for Designers", status: "not-started", lessons: 3, lessonsComplete: 0 },
      { slug: "capstone-project", number: "06", title: "Capstone Project", status: "not-started", lessons: 2, lessonsComplete: 0 },
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
