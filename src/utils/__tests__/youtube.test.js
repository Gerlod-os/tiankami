import { describe, test, expect } from "vitest";
import { parseYouTubeUrl, posterVideoId } from "../youtube.js";
import posters from "../../data/youtube-posters.json";

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

describe("posterVideoId", () => {
  const knownPlaylist = Object.keys(posters)[0];

  test("у ролика — его же ID", () => {
    expect(posterVideoId("https://www.youtube.com/watch?v=weNMMqOxiiw")).toBe(
      "weNMMqOxiiw"
    );
  });

  test("у плейлиста — ID первого ролика из карты", () => {
    expect(knownPlaylist).toBeTruthy();
    expect(
      posterVideoId(
        `https://www.youtube.com/playlist?list=${knownPlaylist}`
      )
    ).toBe(posters[knownPlaylist]);
  });

  test("плейлист без кадра в карте → null, а не обложка", () => {
    expect(
      posterVideoId("https://www.youtube.com/playlist?list=PL000000000000000000")
    ).toBeNull();
  });

  test("не-YouTube → null", () => {
    expect(posterVideoId("https://twitch.tv/tiankami")).toBeNull();
    expect(posterVideoId("")).toBeNull();
  });
});
