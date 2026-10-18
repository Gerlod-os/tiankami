import { describe, test, expect } from "vitest";
import { fillYouTubeFromPlaylists, playlistsByTitle, playlistUrl } from "../playlists.js";

const playlists = [
  { id: "PL1", title: "Hades" },
  { id: "PL2", title: "Sultan's Game" },
  { id: "PL3", title: "RGG Land Осень 2026" },
];

const games = [
  { title: "Hades", youtube: "https://www.youtube.com/playlist?list=PLold" },
  { title: "Slay the Spire", youtube: "" },
  { title: "Sultan's Game", youtube: "" },
  { title: "RGG Land", youtube: "" },
];

describe("playlistsByTitle", () => {
  test("нормализует названия: регистр, пробелы, апострофы", () => {
    const map = playlistsByTitle(playlists);
    expect(map.get("sultansgame")).toBe("https://www.youtube.com/playlist?list=PL2");
    expect(map.get("hades")).toBeTruthy();
  });
  test("ссылка складывается из id", () => {
    expect(playlistUrl("PLx")).toBe("https://www.youtube.com/playlist?list=PLx");
  });
});

describe("fillYouTubeFromPlaylists", () => {
  test("ставит ссылку только играм без своей", () => {
    const { games: out, filled } = fillYouTubeFromPlaylists(games, playlists);
    expect(out.find((g) => g.title === "Sultan's Game").youtube).toBe("https://www.youtube.com/playlist?list=PL2");
    expect(out.find((g) => g.title === "Slay the Spire").youtube).toBe("");
    expect(filled).toEqual(["Sultan's Game"]);
  });

  test("не переписывает ссылку из таблицы", () => {
    const { games: out } = fillYouTubeFromPlaylists(games, playlists);
    expect(out.find((g) => g.title === "Hades").youtube).toBe("https://www.youtube.com/playlist?list=PLold");
  });

  test("плейлист с припиской не считается тем же названием", () => {
    const { games: out } = fillYouTubeFromPlaylists(games, playlists);
    expect(out.find((g) => g.title === "RGG Land").youtube).toBe("");
  });

  test("пустой список плейлистов ничего не меняет", () => {
    const { games: out, filled } = fillYouTubeFromPlaylists(games, []);
    expect(filled).toEqual([]);
    expect(out).toEqual(games);
  });
});
