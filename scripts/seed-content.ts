import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

interface MetaJson {
  slug: string;
  week: number;
  unit: { number: string; title: string; track: string };
  title: string;
  description: string;
  lesson: { path: string; readingMinutes: number; videoUrl: string | null };
}

const TRACK_ID_BY_LABEL: Record<string, string> = {
  "DESIGN LAB": "design_lab",
  "OPEN SOURCE LAB": "oss_lab",
};

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding."
    );
    process.exit(1);
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const contentRoot = path.join(process.cwd(), "content");
  let entries;
  try {
    entries = await fs.readdir(contentRoot, { withFileTypes: true });
  } catch (err) {
    console.error(`Could not read content directory at ${contentRoot}:`, err);
    process.exit(1);
  }

  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();

  let tracksUpserted = 0;
  let unitsUpserted = 0;
  let modulesUpserted = 0;
  let lessonsUpserted = 0;
  let failures = 0;

  for (const dir of dirs) {
    const metaPath = path.join(contentRoot, dir, "meta.json");
    let metaRaw: string;
    try {
      metaRaw = await fs.readFile(metaPath, "utf8");
    } catch {
      console.warn(`Skipping ${dir}: no meta.json found.`);
      continue;
    }

    let meta: MetaJson;
    try {
      meta = JSON.parse(metaRaw) as MetaJson;
    } catch (err) {
      console.error(`Skipping ${dir}: invalid JSON in meta.json:`, err);
      failures++;
      continue;
    }

    const trackId = TRACK_ID_BY_LABEL[meta.unit.track];
    if (!trackId) {
      console.error(`[${meta.slug}] Unknown track label "${meta.unit.track}". Skipping.`);
      failures++;
      continue;
    }

    // 1. Track (upsert by id)
    {
      const { error } = await supabase.from("tracks").upsert(
        {
          id: trackId,
          name: meta.unit.track.charAt(0) + meta.unit.track.slice(1).toLowerCase(),
        },
        { onConflict: "id" }
      );
      if (error) {
        console.error(`[track:${trackId}] upsert failed:`, error.message);
        failures++;
      } else {
        tracksUpserted++;
        console.log(`✓ track:${trackId}`);
      }
    }

    // 2. Unit (match by track_id + title + sort_order = week number)
    let unitId: string | null = null;
    {
      const { data: existing, error: selectError } = await supabase
        .from("units")
        .select("id, description")
        .eq("track_id", trackId)
        .eq("title", meta.unit.title)
        .eq("sort_order", meta.week)
        .maybeSingle();

      if (selectError) {
        console.error(`[unit:${meta.unit.title}] select failed:`, selectError.message);
        failures++;
        continue;
      }

      if (existing) {
        unitId = existing.id as string;
        if ((existing.description ?? null) !== meta.description) {
          const { error } = await supabase
            .from("units")
            .update({ description: meta.description })
            .eq("id", unitId);
          if (error) {
            console.error(`[unit:${meta.unit.title}] update failed:`, error.message);
            failures++;
          } else {
            unitsUpserted++;
            console.log(`✓ unit:${meta.unit.title} (updated description)`);
          }
        } else {
          unitsUpserted++;
          console.log(`✓ unit:${meta.unit.title} (unchanged)`);
        }
      } else {
        const { data: inserted, error } = await supabase
          .from("units")
          .insert({
            track_id: trackId,
            title: meta.unit.title,
            description: meta.description,
            sort_order: meta.week,
          })
          .select("id")
          .single();
        if (error || !inserted) {
          console.error(`[unit:${meta.unit.title}] insert failed:`, error?.message);
          failures++;
          continue;
        }
        unitId = inserted.id as string;
        unitsUpserted++;
        console.log(`✓ unit:${meta.unit.title} (created)`);
      }
    }

    if (!unitId) continue;

    // 3. Module (upsert by unique slug)
    let moduleId: string | null = null;
    {
      const { data, error } = await supabase
        .from("modules")
        .upsert(
          {
            slug: meta.slug,
            unit_id: unitId,
            title: meta.title,
            description: meta.description,
            sort_order: 1,
            review_type: "reviewed",
          },
          { onConflict: "slug" }
        )
        .select("id")
        .single();
      if (error || !data) {
        console.error(`[module:${meta.slug}] upsert failed:`, error?.message);
        failures++;
        continue;
      }
      moduleId = data.id as string;
      modulesUpserted++;
      console.log(`✓ module:${meta.slug} -> ${moduleId}`);
    }

    // 4. Lesson (upsert by module_id + slug)
    {
      const lessonSlug = `${meta.slug}-lesson`;
      const contentPath = `content/${dir}/${meta.lesson.path}`;
      const { error } = await supabase.from("lessons").upsert(
        {
          module_id: moduleId,
          slug: lessonSlug,
          title: meta.title,
          content_path: contentPath,
          video_url: meta.lesson.videoUrl,
          summary: meta.description,
          sort_order: 1,
        },
        { onConflict: "module_id,slug" }
      );
      if (error) {
        console.error(`[lesson:${lessonSlug}] upsert failed:`, error.message);
        failures++;
      } else {
        lessonsUpserted++;
        console.log(`✓ lesson:${lessonSlug} (${contentPath})`);
      }
    }
  }

  console.log("\n── Seed summary ──");
  console.log(`Tracks upserted:   ${tracksUpserted}`);
  console.log(`Units upserted:    ${unitsUpserted}`);
  console.log(`Modules upserted:  ${modulesUpserted}`);
  console.log(`Lessons upserted:  ${lessonsUpserted}`);
  console.log(`Failures:          ${failures}`);

  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Seed script crashed:", err);
  process.exit(1);
});
