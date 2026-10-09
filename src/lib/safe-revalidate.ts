import { revalidatePath } from "next/cache";

/**
 * Safely calls Next.js revalidatePath without throwing errors
 * when executed outside an active HTTP request context (e.g. scripts, background jobs, tests).
 */
export function safeRevalidate(path: string, type?: "page" | "layout"): void {
  try {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
  } catch {
    // In dev / outside request context / standalone script, next/cache throws
  }
}
