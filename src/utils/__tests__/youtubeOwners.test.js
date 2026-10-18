import { describe, test, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { markYoutubeOwners } from "../youtubeOwners.js";

const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), "yt-owners-"));
const json = (author) => ({ ok: true, json: async () => ({ author_name: author }) });

describe("markYoutubeOwners", () => {
  test("свой ролик — youtubeOwn true, ответ уходит в кэш", async () => {
    const cachePath = path.join(dir(), "owners.json");
    const games = [{ youtube: "https://youtu.be/aaaaaaaaaaa" }];
    const r = await markYoutubeOwners(games, {
      cachePath,
      channelName: "Tiankami",
      fetchImpl: async () => json("Tiankami"),
    });
    expect(games[0].youtubeOwn).toBe(true);
    expect(r.own).toBe(1);
    expect(JSON.parse(fs.readFileSync(cachePath, "utf8"))).toEqual({
      aaaaaaaaaaa: "match",
    });
  });

  test("чужой ролик — youtubeOwn false", async () => {
    const games = [{ youtube: "https://youtu.be/bbbbbbbbbbb" }];
    await markYoutubeOwners(games, {
      cachePath: path.join(dir(), "owners.json"),
      channelName: "Tiankami",
      fetchImpl: async () => json("Someone Else"),
    });
    expect(games[0].youtubeOwn).toBe(false);
  });

  test("второй прогон не ходит в сеть: берёт из кэша", async () => {
    const cachePath = path.join(dir(), "owners.json");
    fs.writeFileSync(cachePath, JSON.stringify({ ccccccccccc: "mismatch" }));
    let calls = 0;
    const games = [{ youtube: "https://youtu.be/ccccccccccc" }];
    const r = await markYoutubeOwners(games, {
      cachePath,
      channelName: "Tiankami",
      fetchImpl: async () => {
        calls += 1;
        return json("Tiankami");
      },
    });
    expect(calls).toBe(0);
    expect(games[0].youtubeOwn).toBe(false);
    expect(r.cached).toBe(1);
  });

  test("сервис молчит — флаг не ставится и в кэш не пишется", async () => {
    const cachePath = path.join(dir(), "owners.json");
    const games = [{ youtube: "https://youtu.be/ddddddddddd" }];
    const r = await markYoutubeOwners(games, {
      cachePath,
      channelName: "Tiankami",
      fetchImpl: async () => {
        throw new Error("network");
      },
    });
    expect(games[0].youtubeOwn).toBeUndefined();
    expect(r.unknown).toBe(1);
    expect(fs.existsSync(cachePath)).toBe(false);
  });

  test("имя канала с пробелом считается своим: «Tian Kami» = «Tiankami»", async () => {
    const games = [{ youtube: "https://youtu.be/eeeeeeeeeee" }];
    await markYoutubeOwners(games, {
      cachePath: path.join(dir(), "owners.json"),
      channelName: "Tiankami",
      fetchImpl: async () => json("Tian Kami"),
    });
    expect(games[0].youtubeOwn).toBe(true);
  });

  test("плейлист не проверяем: noembed его не разбирает, лишний запрос не нужен", async () => {
    let calls = 0;
    const games = [
      { youtube: "https://www.youtube.com/playlist?list=PL5RpA6jmZ9UlnSiZ_4PBTuBCuf6XtWgk2" },
    ];
    const r = await markYoutubeOwners(games, {
      cachePath: path.join(dir(), "owners.json"),
      fetchImpl: async () => {
        calls += 1;
        return json("Tiankami");
      },
    });
    expect(calls).toBe(0);
    expect(r.checked).toBe(0);
    expect(games[0].youtubeOwn).toBeUndefined();
  });

  test("не-YouTube и пустые ссылки пропускаются", async () => {
    const games = [
      { youtube: "" },
      { youtube: "Ссылка на плейлист" },
      {},
    ];
    const r = await markYoutubeOwners(games, {
      cachePath: path.join(dir(), "owners.json"),
      fetchImpl: async () => json("Tiankami"),
    });
    expect(r.checked).toBe(0);
    expect(games.every((g) => g.youtubeOwn === undefined)).toBe(true);
  });
});
