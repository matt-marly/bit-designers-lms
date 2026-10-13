export type SampleRoadmapStep = {
  title: string;
  lane: string;
  badge: "required" | "optional" | "alternative";
  description?: string;
  url?: string;
};

export type SampleRoadmap = {
  title: string;
  slug: string;
  description: string;
  steps: SampleRoadmapStep[];
};

export const SAMPLE_ROADMAPS: SampleRoadmap[] = [
  {
    title: "Bitcoin Design Foundations",
    slug: "bitcoin-design-foundations",
    description: "A starter path: money, wallets, and designing for Bitcoin users.",
    steps: [
      { title: "What is money?", lane: "Start here", badge: "required" },
      { title: "How Bitcoin works", lane: "Start here", badge: "required" },
      { title: "Wallets and keys", lane: "Start here", badge: "required" },
      { title: "Designing for low-bandwidth users", lane: "Design practice", badge: "optional" },
      { title: "Lightning for designers", lane: "Design practice", badge: "alternative" },
    ],
  },
  {
    title: "AI for Open Source Bitcoin Devs",
    slug: "ai-for-opensource-bitcoin-devs",
    description:
      "Use AI as a coding partner while contributing to Bitcoin open source: setup, assisted workflows, and your first merged PR.",
    steps: [
      {
        title: "How Bitcoin development works",
        lane: "Start here",
        badge: "required",
        description: "Bitcoin Core, BIPs, and how open source review works before you touch any code.",
      },
      {
        title: "Set up a Bitcoin dev environment",
        lane: "Start here",
        badge: "required",
        description: "Build Bitcoin Core from source and run a local regtest node.",
      },
      {
        title: "Learn the contribution workflow",
        lane: "Start here",
        badge: "required",
        description: "Forks, branches, and opening a pull request on GitHub.",
        url: "https://github.com/bitcoin/bitcoin",
      },
      {
        title: "AI-assisted code reading",
        lane: "AI workflows",
        badge: "required",
        description: "Ask an AI assistant to explain unfamiliar C++ or Python code before you change it.",
      },
      {
        title: "AI code review on your own PRs",
        lane: "AI workflows",
        badge: "required",
        description: "Run an AI review pass for bugs, style, and missing tests before requesting human review.",
      },
      {
        title: "Generating tests with AI",
        lane: "AI workflows",
        badge: "required",
        description: "Draft unit and functional tests with AI, then verify every assertion yourself.",
      },
      {
        title: "Triage issues with AI help",
        lane: "AI workflows",
        badge: "optional",
        description: "Summarize long issue threads and reproduce reported bugs faster.",
      },
      {
        title: "AI-assisted documentation",
        lane: "AI workflows",
        badge: "alternative",
        description: "Draft RPC docs and release notes, then check each claim against the code.",
      },
      {
        title: "Find a good first issue",
        lane: "Ship it",
        badge: "required",
        description: "Pick a small, well-scoped issue and confirm the approach with a maintainer.",
      },
      {
        title: "Open your first PR",
        lane: "Ship it",
        badge: "required",
        description: "Small diff, clear description, tests included. Respond to review feedback patiently.",
      },
      {
        title: "Review someone else's work",
        lane: "Ship it",
        badge: "optional",
        description: "Concept ACKs and testing ACKs count. Reviewing teaches as much as writing code.",
      },
    ],
  },
];
