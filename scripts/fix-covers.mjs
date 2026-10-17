#!/usr/bin/env node
/**
 * fix-covers.mjs — найти настоящую обложку для игр, у которых её нет или она битая.
 *
 * Запуск:
 *   node scripts/fix-covers.mjs           — найти, проверить, записать src/data/steam-overrides.json
 *   node scripts/fix-covers.mjs --dry     — только показать, ничего не писать
 *
 * Как ищем:
 *   1. storesearch по названию — берём ТОЛЬКО точное совпадение (без Demo/Soundtrack/DLC).
 *   2. appdetails по appId — сверяем название ещё раз и берём header_image оттуда.
 *      Новые игры Steam больше не отдают /steam/apps/<id>/header.jpg (404), а header_image
 *      из appdetails содержит хеш каталога и работает.
 *   3. Проверяем, что адрес отвечает 200.
 *
 * Результат — «slug → { appId, image }». Файл главнее таблицы: применяется последним шагом синка.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const GAMES = path.join(ROOT, 'src', 'data', 'games.json');
const OUT = path.join(ROOT, 'src', 'data', 'steam-overrides.json');
const DRY = process.argv.includes('--dry');
const UA = { 'User-Agent': 'Mozilla/5.0' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[®™©]/g, '')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim();

async function status(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: UA });
    return res.status;
  } catch {
    return 0;
  }
}

async function search(title) {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=us`;
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.items || []).map((it) => ({ id: String(it.id), name: it.name }));
  } catch {
    return [];
  }
}

async function details(appId) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=us`;
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return null;
    const json = await res.json();
    const entry = json[appId];
    if (!entry || !entry.success) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function main() {
  const games = JSON.parse(fs.readFileSync(GAMES, 'utf8'));
  const overrides = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

  const need = [];
  for (const g of games) {
    if (overrides[g.slug]) continue;
    if (!g.image) {
      need.push(g);
      continue;
    }
    const code = await status(g.image);
    if (code !== 200) need.push(g);
  }

  console.log(`Игр без рабочей обложки: ${need.length} из ${games.length}`);

  let found = 0;
  const unmatched = [];

  for (const g of need) {
    // Ищем по полному названию; если пусто — по части до двоеточия/тире
    // («Turnbound - Доска Забвения» → «Turnbound»).
    let items = await search(g.title);
    if (!items.length) {
      const short = g.title.split(/[:–—]| - /)[0].trim();
      if (short && short !== g.title) items = await search(short);
    }
    const nTitle = norm(g.title);
    // Отбрасываем дополнения и демо: у них своя обложка и свой appId.
    const cands = items.filter((it) => !/demo|soundtrack|supporter|artbook|\bost\b|\bdlc\b/i.test(it.name));
    // Точное совпадение, иначе — название, начинающееся с нашего (берём самое короткое:
    // «Combolands» → «Combolands: Roguelike Citybuilder», а не наоборот), иначе — наоборот,
    // когда в таблице есть подзаголовок («Turnbound - Доска Забвения» → «Turnbound»),
    // иначе — те же слова в другом порядке («Plinbo: Plinko Roguelike» → «Plinbo: Roguelike Plinko»).
    const tokens = (s) => norm(s).split(' ').sort().join(' ');
    const exact = cands.find((it) => norm(it.name) === nTitle);
    const prefix = cands
      .filter((it) => norm(it.name).startsWith(nTitle + ' '))
      .sort((a, b) => a.name.length - b.name.length)[0];
    const suffix = cands
      .filter((it) => nTitle.startsWith(norm(it.name) + ' '))
      .sort((a, b) => b.name.length - a.name.length)[0];
    const sameWords = cands.find((it) => tokens(it.name) === tokens(g.title));
    const pick = exact || prefix || suffix || sameWords;
    if (!pick) {
      unmatched.push(g.title);
      await sleep(900);
      continue;
    }
    const data = await details(pick.id);
    await sleep(900);
    const nName = data ? norm(data.name) : '';
    const nameOk =
      data &&
      (nName === nTitle ||
        nName.startsWith(nTitle + ' ') ||
        nTitle.startsWith(nName + ' ') ||
        tokens(data.name) === tokens(g.title));
    if (!data || data.type !== 'game' || !nameOk) {
      unmatched.push(`${g.title} (appId ${pick.id}: ${data ? data.type + '/' + data.name : 'нет данных'})`);
      continue;
    }
    const image = data.header_image;
    const code = image ? await status(image) : 0;
    if (code !== 200) {
      unmatched.push(`${g.title} (appId ${pick.id}: header ${code})`);
      continue;
    }
    overrides[g.slug] = { appId: pick.id, image };
    found += 1;
    console.log(`  ✔ ${g.title} → ${pick.id}`);
  }

  console.log(`Найдено: ${found}`);
  if (unmatched.length) {
    console.log(`Без пары (${unmatched.length}):`);
    for (const u of unmatched) console.log('  – ' + u);
  }

  if (DRY) {
    console.log('--dry: файл не записан');
    return;
  }
  fs.writeFileSync(OUT, JSON.stringify(overrides, null, 1) + '\n');
  console.log(`Записано: ${path.relative(ROOT, OUT)} (${Object.keys(overrides).length} записей)`);
}

main().catch((e) => {
  console.error('упало:', e);
  process.exit(1);
});
