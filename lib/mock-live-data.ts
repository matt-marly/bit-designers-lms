export type SessionStatus = "upcoming" | "live" | "recorded";

export interface LiveSession {
  slug: string;
  title: string;
  description: string;
  host: string;
  cohort: string;
  date: string;
  time: string;
  timezone: string;
  duration: number;
  joinUrl: string | null;
  recordingUrl: string | null;
  status: SessionStatus;
  module: string;
  tags: string[];
}

export const mockSessions: LiveSession[] = [
  {
    slug: "bitcoin-design-systems-critique",
    title: "Bitcoin Design Systems — Live Critique",
    description:
      "A live critique session reviewing participant design system work. Bring your Figma files.",
    host: "Adeyemi Matthew",
    cohort: "Cohort 01",
    date: "2025-07-17",
    time: "18:00",
    timezone: "WAT",
    duration: 90,
    joinUrl: "https://zoom.us/example",
    recordingUrl: null,
    status: "upcoming",
    module: "Bitcoin Design Systems",
    tags: ["Design Systems", "Critique", "Figma"],
  },
  {
    slug: "bitcoin-ux-principles-workshop",
    title: "Bitcoin UX Principles — Workshop",
    description:
      "Hands-on workshop exploring UX patterns unique to Bitcoin products. We will audit 3 real wallets together.",
    host: "Adeyemi Matthew",
    cohort: "Cohort 01",
    date: "2025-07-24",
    time: "18:00",
    timezone: "WAT",
    duration: 120,
    joinUrl: "https://zoom.us/example2",
    recordingUrl: null,
    status: "upcoming",
    module: "Bitcoin UX Principles",
    tags: ["UX", "Workshop", "Wallets"],
  },
  {
    slug: "bitcoin-foundations-kickoff",
    title: "Bitcoin Foundations — Cohort Kickoff",
    description:
      "The opening session for Cohort 01. Introduction to the program, expectations, and community.",
    host: "Adeyemi Matthew",
    cohort: "Cohort 01",
    date: "2025-07-01",
    time: "18:00",
    timezone: "WAT",
    duration: 60,
    joinUrl: null,
    recordingUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    status: "recorded",
    module: "Bitcoin Foundations",
    tags: ["Kickoff", "Orientation"],
  },
  {
    slug: "bitcoin-mental-models-session",
    title: "Bitcoin Mental Models — Deep Dive",
    description:
      "Exploring how users think about money and how Bitcoin challenges those mental models.",
    host: "Adeyemi Matthew",
    cohort: "Cohort 01",
    date: "2025-07-08",
    time: "18:00",
    timezone: "WAT",
    duration: 75,
    joinUrl: null,
    recordingUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    status: "recorded",
    module: "Bitcoin and Money",
    tags: ["Mental Models", "Research"],
  },
];
