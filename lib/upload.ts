import type { Id } from "@/convex/_generated/dataModel";

/** Posts a file to a Convex upload URL and returns the new storage id. */
export async function uploadToConvex(uploadUrl: string, file: File): Promise<Id<"_storage">> {
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error("Upload failed");
  }
  const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
  return storageId;
}
