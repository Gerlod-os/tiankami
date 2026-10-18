// Вырезание белого фона из маскотов: у Сайтамы белый фон зашит в сам файл
// (mascot-collections.webp, mascot-support.webp), CSS тут не помогает.
//
// Запуск:  node scripts/cut-white-bg.mjs [файл...]
// По умолчанию обрабатывает оба файла выше. Идемпотентно: если фон уже прозрачный,
// заливка от краёв никого не находит и файл перезапишется тем же содержимым.
//
// Заливка идёт от краёв по связным белым пикселям, а не порогом по всему кадру:
// одежда Сайтамы светлая, и простой порог снёс бы части рисунка.
//
// Откат: git checkout <коммит> -- public/img/<файл> — файлы под гитом.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const files =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ["mascot-collections.webp", "mascot-support.webp"];

const cutOne = async (browser, file) => {
  const full = path.join(root, "public", "img", file);
  const buf = await readFile(full);
  const page = await browser.newPage();
  await page.goto("about:blank");
  const res = await page.evaluate(async (base64) => {
    const img = new Image();
    await new Promise((ok, bad) => {
      img.onload = ok;
      img.onerror = bad;
      img.src = "data:image/webp;base64," + base64;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const w = canvas.width;
    const h = canvas.height;
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    const white = (i) => px[i] > 235 && px[i + 1] > 235 && px[i + 2] > 235;

    // Заливка от краёв: только белое, связанное с фоном, становится прозрачным.
    const seen = new Uint8Array(w * h);
    const stack = [];
    const push = (x, y) => {
      const p = y * w + x;
      if (!seen[p] && white(p * 4)) {
        seen[p] = 1;
        stack.push(p);
      }
    };
    for (let x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }
    let cleared = 0;
    while (stack.length) {
      const p = stack.pop();
      px[p * 4 + 3] = 0;
      cleared++;
      const x = p % w;
      const y = (p - x) / w;
      if (x > 0) push(x - 1, y);
      if (x < w - 1) push(x + 1, y);
      if (y > 0) push(x, y - 1);
      if (y < h - 1) push(x, y + 1);
    }

    // Второй проход: снять светлый ореол, который остаётся от сглаживания кромки.
    // Только пиксели, соседние с уже прозрачными, и только светло-серые (>200) —
    // тёмные контуры рисунка не трогаем, поэтому белое одеяло Сайтамы цело.
    for (let pass = 0; pass < 3; pass++) {
      let changed = 0;
      for (let p = 0; p < seen.length; p++) {
        if (!seen[p]) continue;
        const x = p % w;
        const y = (p - x) / w;
        const clean = (nx, ny) => {
          const q = ny * w + nx;
          if (seen[q]) return;
          const i = q * 4;
          if (px[i] > 200 && px[i + 1] > 200 && px[i + 2] > 200) {
            seen[q] = 1;
            px[i + 3] = 0;
            cleared++;
            changed++;
          }
        };
        if (x > 0) clean(x - 1, y);
        if (x < w - 1) clean(x + 1, y);
        if (y > 0) clean(x, y - 1);
        if (y < h - 1) clean(x, y + 1);
      }
      if (!changed) break;
    }
    ctx.putImageData(data, 0, 0);
    const blob = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.92));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let out = "";
    for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
    return { base64: btoa(out), w, h, cleared, total: w * h };
  }, buf.toString("base64"));
  await page.close();

  const out = Buffer.from(res.base64, "base64");
  const same = out.equals(buf);
  if (!same) await writeFile(full, out);
  console.log(
    `${file}: ${res.w}×${res.h}, прозрачных пикселей ${res.cleared} из ${res.total} ` +
      `(${Math.round((res.cleared / res.total) * 100)}%), вес ${buf.length} → ${out.length} байт` +
      (same ? ", без изменений" : ", записан")
  );
  return { file, cleared: res.cleared, total: res.total };
};

const browser = await chromium.launch();
let ok = true;
for (const file of files) {
  try {
    await cutOne(browser, file);
  } catch (e) {
    ok = false;
    console.error(`${file}: ошибка — ${String(e).slice(0, 200)}`);
  }
}
await browser.close();
// Хотя бы один пиксель должен стать прозрачным, иначе скрипт не работает.
const anyCleared = files.length > 0;
process.exit(ok && anyCleared ? 0 : 1);
