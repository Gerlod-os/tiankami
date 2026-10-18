#!/usr/bin/env node
/**
 * check-links.mjs — гейт внутренних ссылок по собранному сайту.
 *
 * Запуск: npm run test:links
 * Читает все HTML в dist/, вытаскивает href, проверяет, что файл на диске есть.
 * Внешние адреса, mailto:, tel:, javascript: и #-якоря пропускаются.
 *
 * Почему гейт, а не глаза: пререндер пишет 471 страницу, ссылки собираются из данных.
 * Опечатка в слаге даёт 404, который видно только руками.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('dist');
const BASE = '/tiankami';

if (!fs.existsSync(ROOT)) {
  console.error('✖ нет папки dist — сначала сборка');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const HREF = /href\s*=\s*"([^"]+)"/g;
const files = walk(ROOT);
const problems = [];
let checked = 0;

const exists = (p) => fs.existsSync(p);

function resolveTarget(href) {
  // отрезаем якорь и запрос
  let clean = href.split('#')[0].split('?')[0];
  if (!clean) return null; // чистый якорь
  if (!clean.startsWith('/')) return null; // относительные не проверяем: их в шаблонах нет
  if (!clean.startsWith(BASE + '/') && clean !== BASE && clean !== BASE + '/') return null;
  let rel = clean.slice(BASE.length);
  if (rel === '' || rel === '/') rel = '/index.html';
  const abs = path.join(ROOT, decodeURIComponent(rel));
  if (rel.endsWith('/')) return path.join(abs, 'index.html');
  if (path.extname(abs)) return abs;
  return [abs, abs + '.html', path.join(abs, 'index.html')];
}

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = HREF.exec(html))) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    const target = resolveTarget(href);
    if (!target) continue;
    checked++;
    const list = Array.isArray(target) ? target : [target];
    if (!list.some(exists)) {
      problems.push({ file: path.relative(ROOT, file), href });
    }
  }
}

const uniq = [...new Map(problems.map((p) => [p.file + '|' + p.href, p])).values()];

console.log(`Проверено HTML: ${files.length}, внутренних ссылок: ${checked}, битых: ${uniq.length}`);
if (uniq.length) {
  for (const p of uniq.slice(0, 40)) console.log(`  ✖ ${p.file} → ${p.href}`);
  if (uniq.length > 40) console.log(`  … ещё ${uniq.length - 40}`);
  process.exit(1);
}
console.log('✔ битых внутренних ссылок нет');
