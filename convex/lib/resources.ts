/** Shared by the backend and the client, so it must stay free of server imports. */

export type ResourceKind = "material" | "reference";

export type ResourceCategory = { id: string; label: string; description: string };

export const RESOURCE_CATEGORIES: Record<ResourceKind, ResourceCategory[]> = {
  material: [
    { id: "core", label: "Core", description: "Start here. Program essentials every cohort member needs." },
    { id: "craft", label: "Craft", description: "Design tools, frameworks, and project briefs." },
    {
      id: "research-contribute",
      label: "Research & Contribute",
      description: "Tools and frameworks for research, audits, and open source contribution.",
    },
  ],
  reference: [
    { id: "foundations", label: "Foundations", description: "Bitcoin principles, mechanics, and context for designers." },
    { id: "craft", label: "Craft", description: "Design tools, systems, and Bitcoin-specific design practice." },
    { id: "research", label: "Research", description: "User research methods and evaluation techniques." },
    { id: "contribution", label: "Contribution", description: "Open source contribution for designers." },
  ],
};

export const RESOURCE_LIMITS = {
  title: 140,
  description: 400,
  meta: 40,
  source: 60,
  fileName: 200,
} as const;

export const MAX_RESOURCE_FILE_BYTES = 20 * 1024 * 1024;
export const RESOURCE_FILE_TYPES = ["application/pdf"] as const;
