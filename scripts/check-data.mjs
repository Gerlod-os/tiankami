// Гейт данных: то, что приехало из таблицы, обязано быть в известном формате.
// Проверяет src/data/*.json и падает (код 1), если поле-ссылка — не адрес,
// дата — не «дд.мм.гггг», а appId — не число. Запуск: npm run test:data
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, "..", "src", "data");

const isUrl = (v) => /^https?:\/\//i.test(String(v).trim());
const isRuDate = (v) => /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(String(v).trim());
const isDigits = (v) => /^\d+$/.test(String(v).trim());

const read = (name) => JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
const problems = [];
const note = (file, where, field, value, expected) =>
  problems.push(`${file} · ${where} · ${field} = ${JSON.stringify(value)} (ожидалось ${expected})`);

const games = read("games.json");
for (const g of games) {
  const who = `${g.slug || "?"} («${g.title || "?"}»)`;
  for (const field of ["image", "steamUrl", "youtube", "miVideo"]) {
    const v = String(g[field] || "").trim();
    if (v && !isUrl(v)) note("games.json", who, field, v, "адрес http(s) или пусто");
  }
  if (String(g.steamAppId || "").trim() && !isDigits(g.steamAppId)) {
    note("games.json", who, "steamAppId", g.steamAppId, "число или пусто");
  }
  for (const field of ["releaseDate", "playedDate"]) {
    const v = String(g[field] || "").trim();
    if (v && !isRuDate(v)) note("games.json", who, field, v, "дд.мм.гггг");
  }
}

const schedule = read("schedule.json");
for (const s of schedule) {
  if (!isRuDate(s.date)) note("schedule.json", s.game || "?", "date", s.date, "дд.мм.гггг");
  const link = String(s.streamLink || "").trim();
  if (link && !isUrl(link)) note("schedule.json", s.game || "?", "streamLink", link, "адрес или пусто");
}

const collections = read("collections.json");
for (const c of collections) {
  if (!c.slug || !c.name) note("collections.json", c.name || "?", "slug/name", "", "непустые");
}

if (problems.length) {
  console.error(`✖ Нарушений формата в данных: ${problems.length}`);
  for (const p of problems.slice(0, 25)) console.error("  •", p);
  if (problems.length > 25) console.error(`  … ещё ${problems.length - 25}`);
  process.exit(1);
}

const noYoutube = games.filter((g) => !g.youtube).length;
// Правило то же, что в src/utils/normalize.js→hasMI(): только «TRUE».
const noMi = games.filter((g) => /^true$/i.test(String(g.hasMI)) && !isUrl(g.miVideo)).length;

console.log(
  `✔ Данные в формате: игр ${games.length}, подборок ${collections.length}, стримов ${schedule.length}`
);
if (noYoutube) {
  console.log(`  ⓘ без ссылки на YouTube: ${noYoutube} — заполняется в таблице, колонка R`);
}
if (noMi) {
  console.log(`  ⓘ отмечено «Проводил МИ», но ссылки на выпуск нет: ${noMi}`);
}
