export const mockAdminStats = {
  totalLearners: 7,
  activeLearners: 6,
  totalMissions: 5,
  submissionsThisWeek: 4,
  pendingReviews: 2,
  passedMissions: 3,
  cohorts: 1,
};

export const mockCohorts = [
  {
    id: "cohort-01",
    name: "Cohort 01",
    track: "Design Lab",
    startDate: "2025-07-01",
    endDate: "2025-09-30",
    status: "active" as const,
    learnerCount: 6,
    mentorCount: 1,
    completionRate: 42,
  },
];

export const mockInvites = [
  {
    id: "inv-01",
    code: "BDA-DL-2025-A1B2",
    track: "Design Lab",
    cohortId: "cohort-01",
    cohortName: "Cohort 01",
    createdAt: "2025-06-25",
    expiresAt: "2025-07-25",
    usageCount: 6,
    usageLimit: 10,
    status: "active" as "active" | "inactive",
    createdBy: "Adeyemi Matthew",
  },
  {
    id: "inv-02",
    code: "BDA-OSL-2025-C3D4",
    track: "Open Source Lab",
    cohortId: "cohort-01",
    cohortName: "Cohort 01",
    createdAt: "2025-06-25",
    expiresAt: "2025-07-25",
    usageCount: 1,
    usageLimit: 5,
    status: "active" as "active" | "inactive",
    createdBy: "Adeyemi Matthew",
  },
];

export const mockReviewQueue = [
  {
    id: "rev-01",
    missionTitle: "Bitcoin UX Audit — Wallets",
    missionSlug: "bitcoin-ux-audit-wallets",
    learnerName: "Amara Okonkwo",
    learnerId: "mem-01",
    submittedAt: "2025-07-10T14:30:00Z",
    version: 2,
    linkUrl: "https://figma.com/file/example",
    status: "pending" as const,
    track: "Design Lab",
    cohort: "Cohort 01",
  },
  {
    id: "rev-02",
    missionTitle: "Bitcoin Mental Models Map",
    missionSlug: "bitcoin-mental-models",
    learnerName: "Kwame Asante",
    learnerId: "mem-02",
    submittedAt: "2025-07-11T10:00:00Z",
    version: 1,
    linkUrl: "https://figma.com/file/example2",
    status: "pending" as const,
    track: "Design Lab",
    cohort: "Cohort 01",
  },
];

export const mockAnnouncements = [
  {
    id: "ann-01",
    title: "Cohort 1 Kickoff Recording Available",
    body: "The recording from our kickoff session is now available in the Live page. Make sure to watch it before Week 2.",
    scope: "global" as const,
    cohortId: null,
    createdAt: "2025-07-01T18:00:00Z",
    createdBy: "Adeyemi Matthew",
    status: "published" as const,
  },
  {
    id: "ann-02",
    title: "Week 3 Mission Brief Posted",
    body: "The Week 3 mission brief is now live in your Missions page. Deadline is July 24.",
    scope: "cohort" as const,
    cohortId: "cohort-01",
    createdAt: "2025-07-14T09:00:00Z",
    createdBy: "Adeyemi Matthew",
    status: "published" as const,
  },
];
