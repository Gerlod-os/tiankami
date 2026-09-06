// Обёртка над checkYouTubeAuthor с гарантированным результатом
import { checkYouTubeAuthor } from "./youtube";

export async function checkYouTubeUrlSafe(url) {
  try {
    return await checkYouTubeAuthor(url);
  } catch {
    return "unknown";
  }
}
