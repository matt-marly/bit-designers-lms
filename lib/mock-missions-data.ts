export type MissionStatus = "not-started" | "submitted" | "in-review" | "passed" | "needs-revision";
export type MissionType = "reviewed" | "completion-only";

export interface MissionReview {
  outcome: "passed" | "needs-revision";
  comment: string;
  reviewedAt: string;
  reviewerName: string;
}

export interface MissionSubmission {
  id: string;
  version: number;
  linkUrl: string;
  fileName: string | null;
  submittedAt: string;
  status: MissionStatus;
  review: MissionReview | null;
}

export interface Mission {
  slug: string;
  number: string;
  title: string;
  module: string;
  unit: string;
  type: MissionType;
  status: MissionStatus;
  dueAt: string;
  isLate: boolean;
  rubric?: string[];
  brief?: string;
  submissions: MissionSubmission[];
}

export const mockMissions: Mission[] = [
  {
    slug: "bitcoin-ux-audit-wallets",
    number: "01",
    title: "Bitcoin UX Audit — Wallets",
    module: "Bitcoin as a Design Medium",
    unit: "UNIT 01",
    type: "reviewed",
    status: "needs-revision",
    dueAt: "2025-07-17",
    isLate: false,
    rubric: [
      "Clear identification of UX problems in at least 2 Bitcoin wallets",
      "Evidence of real user perspective, not just personal opinion",
      "Actionable design recommendations for each identified problem",
      "Professional Figma presentation of findings",
    ],
    brief:
      "Conduct a UX audit of at least two Bitcoin wallets. Identify usability problems, document them with screenshots and annotations, and propose specific design improvements for each issue. Deliver your findings as a structured Figma file.",
    submissions: [
      {
        id: "sub-01",
        version: 1,
        linkUrl: "https://figma.com/file/example",
        fileName: null,
        submittedAt: "2025-07-10T14:30:00Z",
        status: "needs-revision",
        review: {
          outcome: "needs-revision",
          comment:
            "Good start — you identified real problems in the wallet onboarding flow. However the design recommendations are too vague. For each problem, I need to see a specific design solution, not just a description of what is wrong. Resubmit with at least one wireframe or annotated mockup per recommendation.",
          reviewedAt: "2025-07-11T09:00:00Z",
          reviewerName: "Adeyemi Matthew",
        },
      },
    ],
  },
  {
    slug: "bitcoin-mental-models",
    number: "02",
    title: "Bitcoin Mental Models Map",
    module: "Bitcoin and Money",
    unit: "UNIT 01",
    type: "reviewed",
    status: "passed",
    dueAt: "2025-07-10",
    isLate: false,
    rubric: [
      "Mental model map covers at least 5 distinct user types",
      "Clear visual hierarchy and grouping of concepts",
      "Connects Bitcoin concepts to familiar financial analogies",
      "Delivered as a structured Figma file",
    ],
    brief:
      "Create a mental model map that visualizes how different user types understand money and Bitcoin. Cover at least five distinct personas, connect Bitcoin concepts to familiar financial analogies, and deliver the map as a structured Figma file.",
    submissions: [
      {
        id: "sub-02",
        version: 1,
        linkUrl: "https://figma.com/file/example2",
        fileName: null,
        submittedAt: "2025-07-08T10:00:00Z",
        status: "passed",
        review: {
          outcome: "passed",
          comment:
            "Excellent work. The mental model map is clear, well-structured, and shows genuine insight into how different user types think about money and Bitcoin. The analogies you drew between Bitcoin wallets and physical wallets were particularly strong.",
          reviewedAt: "2025-07-09T11:00:00Z",
          reviewerName: "Adeyemi Matthew",
        },
      },
    ],
  },
  {
    slug: "bitcoin-onboarding-flow",
    number: "03",
    title: "Bitcoin Onboarding Flow Redesign",
    module: "Bitcoin UX Principles",
    unit: "UNIT 01",
    type: "reviewed",
    status: "not-started",
    dueAt: "2025-07-24",
    isLate: false,
    rubric: [
      "Complete onboarding flow for a new Bitcoin user (minimum 6 screens)",
      "Addresses key anxiety points: seed phrases, irreversibility, fees",
      "Delivered as a clickable Figma prototype",
      "Brief written rationale for key design decisions",
    ],
    brief:
      "Redesign the onboarding flow for a Bitcoin wallet aimed at first-time users. Your prototype should address the key anxiety points new users face — seed phrase backup, transaction irreversibility, and fee estimation. Deliver a clickable Figma prototype with a written rationale.",
    submissions: [],
  },
  {
    slug: "weekly-reflection-01",
    number: "04",
    title: "Week 1 Reflection",
    module: "Bitcoin Foundations",
    unit: "UNIT 01",
    type: "completion-only",
    status: "submitted",
    dueAt: "2025-07-07",
    isLate: false,
    brief:
      "Write a short reflection on your first week in the program. What surprised you about Bitcoin? What concept was hardest to grasp? Share a link to your reflection document.",
    submissions: [
      {
        id: "sub-03",
        version: 1,
        linkUrl: "https://docs.google.com/document/example",
        fileName: null,
        submittedAt: "2025-07-06T18:00:00Z",
        status: "submitted",
        review: null,
      },
    ],
  },
  {
    slug: "weekly-reflection-02",
    number: "05",
    title: "Week 2 Reflection",
    module: "Bitcoin Foundations",
    unit: "UNIT 01",
    type: "completion-only",
    status: "not-started",
    dueAt: "2025-07-14",
    isLate: false,
    brief:
      "Reflect on your second week. What design patterns did you encounter? How has your understanding of Bitcoin UX evolved? Share a link to your reflection document.",
    submissions: [],
  },
];

export function getMissionBySlug(slug: string): Mission | undefined {
  return mockMissions.find((m) => m.slug === slug);
}

export function getMissionStats() {
  let passed = 0;
  let needsRevision = 0;
  let submitted = 0;
  let inReview = 0;
  let notStarted = 0;

  for (const m of mockMissions) {
    switch (m.status) {
      case "passed":
        passed++;
        break;
      case "needs-revision":
        needsRevision++;
        break;
      case "submitted":
        submitted++;
        break;
      case "in-review":
        inReview++;
        break;
      case "not-started":
        notStarted++;
        break;
    }
  }

  return { passed, needsRevision, submitted, inReview, notStarted };
}
