export function clerkErrorMessage(error: { message: string; longMessage?: string }) {
  return error.longMessage || error.message || "Something went wrong. Please try again.";
}
