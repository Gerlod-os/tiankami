import { describe, test, expect } from "vitest";
import {
  normalizeStatus,
  buildColIndex,
  normalizeGameRow,
  normalizeGames,
  normalizeCollections,
  isUrl,
  extractSteamAppId,
  extractUrlFromCell,
  extractLinksFromCopyRow,
  steamHeaderUrl,
  steamCoverUrl,
  getGameMetadata,
  parseNum,
  hasMI,
} from "../normalize.js";

describe("normalizeStatus", () => {
  test("«жду релиз» → «Жду релиза»", () => {
    expect(normalizeStatus("жду релиз")).toBe("Жду релиза");
  });
  test("«жду» → «Жду релиза»", () => {
    expect(normalizeStatus("жду")).toBe("Жду релиза");
  });
  test("«дропнуто» → «Дропнуто»", () => {
    expect(normalizeStatus("дропнуто")).toBe("Дропнуто");
  });
  test("произвольный статус — с заглавной", () => {
    expect(normalizeStatus("в закромах")).toBe("В закромах");
  });
  test("эталонные значения не меняются", () => {
    expect(normalizeStatus("Пройдено")).toBe("Пройдено");
  });
  test("пусто → пустая строка", () => {
    expect(normalizeStatus("")).toBe("");
  });
});

describe("buildColIndex", () => {
  const header = ["", "Название", "", "Жанр", "Статус"];
  test("merged-заголовок: данные правее заголовка", () => {
    const idx = buildColIndex(header, ["", "", "Игра", "Экшен", "Пройдено"]);
    expect(idx.title).toBe(2);
  });
  test("картинка = titleIdx-2 при сдвиге", () => {
    const idx = buildColIndex(header, ["", "", "Игра", "Экшен", "Пройдено"]);
    expect(idx.image).toBe(0);
  });
  test("эвристика без заголовка «Название»: пропускает URL", () => {
    const idx = buildColIndex(
      ["", "", ""],
      ["=IMAGE(x)", "https://store.steampowered.com/app/1", "Игра"]
    );
    expect(idx.title).toBe(2);
  });
  test("fallback при пустых строках", () => {
    const idx = buildColIndex([], []);
    expect(idx.title).toBe(2);
    expect(idx.genre).toBe(-1);
  });
});

describe("normalizeGameRow", () => {
  test("триммит поля и отбрасывает строки без названия", () => {
    const colIndex = { title: 0, image: -1, genre: 1, status: 2 };
    expect(normalizeGameRow(["", "Экшен", "пройдено"], colIndex)).toBeNull();
    const g = normalizeGameRow(["  Игра  ", " Экшен ", "пройдено"], colIndex);
    expect(g.title).toBe("Игра");
    expect(g.status).toBe("Пройдено");
  });
});

describe("normalizeGames", () => {
  const rows = [
    ["", "Название", "", "Жанр", "Статус", "Оценка (?/10)"],
    ["", "Б игра", "", "Экшен", "пройдено", "7"],
    ["", "А игра", "", "Вампирлайк", "в процессе", "8"],
    ["", "", "", "", "", ""],
    ["", "А игра", "", "Экшен", "обзор", "5"],
  ];
  test("строки без названия пропускаются", () => {
    expect(normalizeGames(rows)).toHaveLength(3);
  });
  test("сортировка по названию (ru)", () => {
    const g = normalizeGames(rows);
    expect(g[0].title).toBe("А игра");
  });
  test("дубли получают уникальные слаги", () => {
    const g = normalizeGames(rows);
    const slugs = g.map((x) => x.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain("а-игра-2");
  });
  test("статусы нормализованы", () => {
    const g = normalizeGames(rows);
    expect(g.map((x) => x.status)).toContain("Пройдено");
  });
});

describe("normalizeCollections (построчный парсер)", () => {
  const rows = [
    ["ЗОЛОТОЙ СПИСОК", "", "", "", "", "", "Топ Карточных", "", "", "", "", ""],
    ["Без рейтинга. Легенды", "", "", "", "", "", "Топ карт", "", "", "", "", ""],
    ["Hades", "", "1", "", "", "", "Balatro", "", "1", "", "", ""],
    ["Against the Storm", "", "2", "", "", "", "Slay the Spire", "", "2", "", "", ""],
  ];
  test("имена и описания под заголовком", () => {
    const c = normalizeCollections(rows);
    expect(c).toHaveLength(2);
    expect(c[0].description).toBe("Без рейтинга. Легенды");
  });
  test("ЗОЛОТОЙ СПИСОК без рангов", () => {
    const c = normalizeCollections(rows);
    expect(c[0].games.every((g) => g.rank === "")).toBe(true);
  });
  test("ранги читались правее игры", () => {
    const c = normalizeCollections(rows);
    expect(c[1].games[0].rank).toBe("1");
  });
  test("игры из «гуляющих» колонок окна", () => {
    const c = normalizeCollections(rows);
    expect(c[1].games.map((g) => g.name)).toEqual([
      "Balatro",
      "Slay the Spire",
    ]);
  });
});

describe("ссылки", () => {
  test("isUrl различает http и текст", () => {
    expect(isUrl("https://a.b")).toBe(true);
    expect(isUrl("сылка на плейлист")).toBe(false);
  });
  test("extractSteamAppId", () => {
    expect(
      extractSteamAppId("https://store.steampowered.com/app/1966900/20_Minutes/")
    ).toBe("1966900");
  });
  test("extractUrlFromCell: =HYPERLINK", () => {
    expect(
      extractUrlFromCell('=HYPERLINK("https://x.y/z"; "текст")')
    ).toBe("https://x.y/z");
  });
  test("extractUrlFromCell: голый URL", () => {
    expect(extractUrlFromCell("https://youtu.be/abc")).toBe("https://youtu.be/abc");
    expect(extractUrlFromCell("Ссылка на выпуск")).toBeNull();
  });
  test("extractLinksFromCopyRow: колонки U/V/W", () => {
    const row = Array.from({ length: 21 }, () => "");
    row[0] = "Игра";
    row[18] = '=HYPERLINK("https://store.steampowered.com/app/42/"; "Игра")';
    row[19] = "https://youtube.com/playlist?list=X";
    const got = extractLinksFromCopyRow(row);
    expect(got.entry.steamAppId).toBe("42");
    expect(got.entry.youtube).toContain("playlist");
  });
  test("CDN-обложки Steam без API", () => {
    expect(steamHeaderUrl("7")).toBe(
      "https://cdn.cloudflare.steamstatic.com/steam/apps/7/header.jpg"
    );
    expect(steamCoverUrl("7")).toContain("library_600x900");
  });
});

describe("метаданные и числа", () => {
  test("getGameMetadata: жанры и годы", () => {
    const m = getGameMetadata([
      { genre: "Экшен, Роглайт", releaseDate: "2024-01-01" },
      { genre: "Экшен", releaseDate: "12.05.2021" },
    ]);
    expect(m.genres).toEqual(["Роглайт", "Экшен"]);
    expect(m.years).toEqual(["2021", "2024"]);
  });
  test("parseNum с запятой", () => {
    expect(parseNum("7,5")).toBe(7.5);
    expect(parseNum("")).toBe(0);
  });
  test("hasMI: TRUE и URL", () => {
    expect(hasMI({ hasMI: "TRUE" })).toBe(true);
    expect(hasMI({ hasMI: "FALSE", miVideo: "https://youtu.be/x" })).toBe(true);
    expect(hasMI({ hasMI: "FALSE" })).toBe(false);
  });
});

describe("normalizeGames: ссылки YouTube и МИ", () => {
  const header = ["", "Название", "", "Жанр", "YouTube прохождение", "Выпуск МИ"];
  const make = (yt, mi) => normalizeGames([header, ["", "Игра", "", "Экшен", yt, mi]])[0];

  test("текст вместо адреса не попадает в данные", () => {
    const g = make("Ссылка на плейлист", "Ссылка на выпуск");
    expect(g.youtube).toBe("");
    expect(g.miVideo).toBe("");
  });

  test("настоящий адрес сохраняется", () => {
    const url = "https://www.youtube.com/playlist?list=PL5RpA6jmZ9UmdjS9twE96MLxYWbqfInWP";
    expect(make(url, "https://youtu.be/2RMUZTt3b8M").youtube).toBe(url);
    expect(make(url, "https://youtu.be/2RMUZTt3b8M").miVideo).toBe("https://youtu.be/2RMUZTt3b8M");
  });

  test("формула =HYPERLINK разворачивается в адрес", () => {
    const g = make('=HYPERLINK("https://youtu.be/abc12345678";"Ссылка на плейлист")', "");
    expect(g.youtube).toBe("https://youtu.be/abc12345678");
  });

  test("пустая ячейка остаётся пустой", () => {
    const g = make("", "");
    expect(g.youtube).toBe("");
    expect(g.miVideo).toBe("");
  });
});
