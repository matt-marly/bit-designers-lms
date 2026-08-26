import { getModuleContent } from "@/lib/content";
import { ModuleWorkspaceClient } from "./module-workspace-client";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  const content = await getModuleContent(moduleSlug);
  return <ModuleWorkspaceClient content={content} />;
}
