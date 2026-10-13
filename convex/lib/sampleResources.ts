import type { ResourceKind } from "./resources";

export type SampleResource = {
  kind: ResourceKind;
  category: string;
  title: string;
  description: string;
  url: string;
  meta: string;
  source?: string;
};

/** Starter Materials and Reference entries. URLs are placeholders to replace in Admin › Resources. */
export const SAMPLE_RESOURCES: SampleResource[] = [
  { kind: "material", category: "core", title: "Onboarding", description: "Pre-work checklist, channels, expectations, and how gates work.", url: "https://notion.so/placeholder-onboarding", meta: "10 min" },
  { kind: "material", category: "core", title: "Program Guide", description: "The full 9-week week-by-week guide. Start here.", url: "https://notion.so/placeholder-program-guide", meta: "30 min" },
  { kind: "material", category: "core", title: "Bitcoin Fundamentals Reader", description: "Principles, mechanics, ecosystem map with glossary. Three parts.", url: "https://notion.so/placeholder-bitcoin-fundamentals", meta: "60 min" },
  { kind: "material", category: "core", title: "Wallet Lab Guide", description: "The Lesson 2 lab, step by step, with safety rules.", url: "https://notion.so/placeholder-wallet-lab", meta: "15 min" },
  { kind: "material", category: "craft", title: "Flow Redesign Project Brief", description: "Scope, options, rubric, and critique format.", url: "https://notion.so/placeholder-flow-redesign", meta: "10 min" },
  { kind: "material", category: "craft", title: "UI Kit & Figma Setup", description: "Cohort file conventions and Bitcoin UI Kit usage.", url: "https://notion.so/placeholder-figma-setup", meta: "15 min" },
  { kind: "material", category: "craft", title: "Designing for the African User", description: "Our flagship original module. Also a public org asset.", url: "https://notion.so/placeholder-african-user", meta: "30 min" },
  { kind: "material", category: "craft", title: "Design Guide Companion", description: "How we use bitcoin.design and which chapters map to which lessons.", url: "https://notion.so/placeholder-design-guide", meta: "10 min" },
  { kind: "material", category: "research-contribute", title: "Audit Rubric & Templates", description: "Rubric, report template, and publishing checklist.", url: "https://notion.so/placeholder-audit-rubric", meta: "15 min" },
  { kind: "material", category: "research-contribute", title: "Research Ethics & Consent Kit", description: "Consent script, anonymization rules, interview and test templates.", url: "https://notion.so/placeholder-research-ethics", meta: "10 min" },
  { kind: "material", category: "research-contribute", title: "GitHub for Designers", description: "Just enough Git and GitHub to contribute design. Nothing more.", url: "https://notion.so/placeholder-github", meta: "20 min" },
  { kind: "material", category: "research-contribute", title: "Contribution Playbook", description: "Good-first-design-issues list, proposal templates, annotated example threads, case study template.", url: "https://notion.so/placeholder-contribution", meta: "20 min" },
  { kind: "reference", category: "foundations", title: "Bitcoin Explained — 3Blue1Brown", description: "The clearest visual explanation of how Bitcoin works mechanically.", url: "https://youtube.com/watch?v=example1", meta: "26 min", source: "YouTube" },
  { kind: "reference", category: "foundations", title: "Bitcoin in Africa — Anita Posch", description: "Real usage stories from African Bitcoin users. Essential context for African designers.", url: "https://youtube.com/watch?v=example2", meta: "42 min", source: "YouTube" },
  { kind: "reference", category: "foundations", title: "Bitcoin Principles — Andreas Antonopoulos", description: "Why Bitcoin matters and what makes it different. Principles over mechanics.", url: "https://youtube.com/watch?v=example3", meta: "38 min", source: "YouTube" },
  { kind: "reference", category: "craft", title: "Bitcoin Design Community — Design Review", description: "Real Bitcoin product design critiques from the community.", url: "https://youtube.com/watch?v=example4", meta: "55 min", source: "YouTube" },
  { kind: "reference", category: "craft", title: "Bitcoin UI Kit Walkthrough", description: "How to use the Bitcoin UI Kit in Figma for real product work.", url: "https://youtube.com/watch?v=example5", meta: "22 min", source: "YouTube" },
  { kind: "reference", category: "craft", title: "Designing for the Next Billion Users", description: "Google talk on designing for emerging market users — directly applicable.", url: "https://youtube.com/watch?v=example6", meta: "34 min", source: "YouTube" },
  { kind: "reference", category: "research", title: "Heuristic Evaluation Walkthrough", description: "How to run a heuristic evaluation on a real product, step by step.", url: "https://youtube.com/watch?v=example7", meta: "28 min", source: "YouTube" },
  { kind: "reference", category: "research", title: "User Interview Techniques — Erika Hall", description: "How to conduct user interviews that actually reveal useful insights.", url: "https://youtube.com/watch?v=example8", meta: "45 min", source: "YouTube" },
  { kind: "reference", category: "contribution", title: "Bitcoin Design Community — Design Proposal Discussion", description: "A real BDC call where a designer's proposal is reviewed by maintainers.", url: "https://youtube.com/watch?v=example9", meta: "60 min", source: "YouTube" },
  { kind: "reference", category: "contribution", title: "First-Time OSS Contribution Story", description: "A designer walks through their first open source contribution end to end.", url: "https://youtube.com/watch?v=example10", meta: "18 min", source: "YouTube" },
];
