import { describe, test, expect } from "vitest";
import { parseYouTubeUrl } from "../youtube.js";

describe("parseYouTubeUrl", () => {
  test("watch?v=", () => {
    const r = parseYouTubeUrl("https://www.youtube.com/watch?v=weNMMqOxiiw");
    expect(r.videoId).toBe("weNMMqOxiiw");
    expect(r.embedUrl).toBe("https://www.youtube.com/embed/weNMMqOxiiw");
  });
  test("плейлист → videoseries", () => {
    const r = parseYouTubeUrl(
      "https://www.youtube.com/playlist?list=PL5RpA6jmZ9UlnSiZ_4PBTuBCuf6XtWgk2"
    );
    expect(r.playlistId).toBe("PL5RpA6jmZ9UlnSiZ_4PBTuBCuf6XtWgk2");
    expect(r.embedUrl).toContain("videoseries");
  });
  test("youtu.be", () => {
    expect(parseYouTubeUrl("https://youtu.be/abcdefghijk").videoId).toBe(
      "abcdefghijk"
    );
  });
  test("не-YouTube → null", () => {
    expect(parseYouTubeUrl("https://twitch.tv/tiankami")).toBeNull();
    expect(parseYouTubeUrl("сылка на плейлист")).toBeNull();
  });
});
