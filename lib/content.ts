import fs from "node:fs/promises";
import path from "node:path";

export interface ResourceItem {
  title: string;
  desc: string;
  type: string;
  url: string;
}

export interface AssignmentMeta {
  title: string;
  path: string;
  due: string;
  submissionFormat: string;
  unlocks: string;
}

export interface ModuleContent {
  slug: string;
  week: number;
  unit: { number: string; title: string; track: string };
  title: string;
  description: string;
  overview: { objectives: string[]; keyConcepts: string[] };
  lesson: { path: string; readingMinutes: number; videoUrl: string | null; videoNote?: string };
  resources: ResourceItem[];
  sessions: { title: string; date: string; duration: string }[];
  assignment: AssignmentMeta | null;
  quiz: { question: string; options: string[]; correctIndex: number; hint: string }[];
}

export interface LoadedModuleContent {
  meta: ModuleContent;
  lessonMd: string;
  assignmentMd: string;
}

const CONTENT_ROOT = path.join(process.cwd(), "content");

async function readTextFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function getModuleContent(
  moduleSlug: string
): Promise<LoadedModuleContent | null> {
  try {
    const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    for (const dir of dirs) {
      const metaRaw = await readTextFileSafe(path.join(CONTENT_ROOT, dir, "meta.json"));
      if (!metaRaw) continue;

      let meta: ModuleContent;
      try {
        meta = JSON.parse(metaRaw) as ModuleContent;
      } catch {
        continue;
      }
      if (meta.slug !== moduleSlug) continue;

      const lessonMd = await readTextFileSafe(path.join(CONTENT_ROOT, dir, "lesson.md"));
      if (lessonMd === null) return null;

      let assignmentMd = "";
      if (meta.assignment?.path) {
        assignmentMd = (await readTextFileSafe(path.join(CONTENT_ROOT, dir, meta.assignment.path))) ?? "";
      }

      return { meta, lessonMd, assignmentMd };
    }
    return null;
  } catch {
    return null;
  }
}
