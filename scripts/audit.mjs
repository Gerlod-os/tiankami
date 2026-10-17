#!/usr/bin/env node
/**
 * audit.mjs — замер страниц сайта одинаковыми числами: до правок и после.
 *
 * Запуск:
 *   npm run audit                 — снять замер, положить JSON в audit/, напечатать таблицу
 *   npm run audit -- --check      — то же + код 1, если нарушен порог (гейт приёмки)
 *   npm run audit -- --base http://localhost:4173/tiankami  — мерить другую сборку
 *
 * Что снимает: LCP, CLS, TTFB, вес, число запросов, ошибки консоли, упавшие запросы,
 * битые картинки, картинки без width/height, тап-таргеты меньше 32px, текст мельче 12px,
 * горизонтальное переполнение, число H1, title.
 *
 * Почему каждый прогон в новом контексте: кэш второго прогона даёт нули и занижает вес.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const hasFlag = (f) => args.includes(f);
const argValue = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

const BASE = argValue('--base', process.env.AUDIT_BASE || 'https://gerlod-os.github.io/tiankami');
const OUT_DIR = path.resolve('audit');
const CHECK = hasFlag('--check');

const PAGES = [
  ['/', 'home'],
  ['/catalog/', 'catalog'],
  ['/catalog/hades/', 'game'],
  ['/collections/', 'collections'],
  ['/collections/золотой-список/', 'collection'],
  ['/mi/', 'mi'],
  ['/schedule/', 'schedule'],
  ['/about/', 'about'],
];

const VIEWPORTS = [
  { width: 1440, height: 900, tag: 'desktop' },
  { width: 390, height: 844, tag: 'mobile' },
];

const THRESHOLDS = { lcp: 2500, cls: 0.1, brokenImages: 0, consoleErrors: 0, overflow: 0, smallTargets: 0 };

const INIT = () => {
  window.__audit = { lcp: 0, lcpEl: '', cls: 0 };
  try {
    new PerformanceObserver((list) => {
      list.getEntries().forEach((e) => {
        window.__audit.lcp = Math.round(e.startTime);
        window.__audit.lcpEl = e.element ? e.element.tagName : '';
      });
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      list.getEntries().forEach((e) => {
        if (!e.hadRecentInput) window.__audit.cls += e.value;
      });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {
    /* старый браузер — метрики останутся нулями, это видно в отчёте */
  }
};

const COLLECT = () => {
  const imgs = [...document.images];
  const interactive = [...document.querySelectorAll('a,button,input,select,textarea,[role="button"]')];
  const small = interactive
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { text: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) };
    })
    .filter((x) => x.h > 0 && (x.h < 32 || x.w < 32));

  let tiny = 0;
  document.querySelectorAll('body *').forEach((el) => {
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    if (parseFloat(cs.fontSize) < 12) tiny += 1;
  });

  return {
    title: document.title,
    h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim().slice(0, 60)),
    images: imgs.length,
    brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => (i.currentSrc || i.src).slice(0, 100)),
    imagesWithoutSize: imgs.filter((i) => !i.getAttribute('width') && !i.getAttribute('height')).length,
    smallTargets: small.length,
    smallTargetsSample: small.slice(0, 8),
    tinyText: tiny,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    domNodes: document.querySelectorAll('*').length,
  };
};

function gitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'unknown';
  }
}

function fmt(n, w = 6) {
  return String(n).padStart(w);
}

async function main() {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const results = [];

  for (const [pagePath, name] of PAGES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        bypassCSP: true,
      });
      const page = await context.newPage();
      const consoleErrors = [];
      const failedRequests = [];
      let requests = 0;
      let bytes = 0;

      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        const text = m.text();
        // Шум чужого кода: YouTube-плеер ругается на политику compute-pressure.
        // Это не ошибка сайта, но в отчёте она выглядела бы как наша.
        if (/compute-pressure/i.test(text)) return;
        consoleErrors.push(text.slice(0, 160));
      });
      page.on('requestfailed', (r) => failedRequests.push(`${r.url().slice(0, 110)} :: ${(r.failure() || {}).errorText || ''}`));
      page.on('response', (r) => {
        requests += 1;
        bytes += Number(r.headers()['content-length'] || 0);
        if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url().slice(0, 110)}`);
      });

      await page.addInitScript(INIT);
      const started = Date.now();
      let navError = '';
      let loadTimedOut = false;
      try {
        await page.goto(BASE + encodeURI(pagePath), { waitUntil: 'load', timeout: 20000 });
      } catch (e) {
        // Страница может не дождаться 'load': сторонний скрипт (плеер YouTube)
        // не догружается в окружении без доступа к нему. Это не поломка сайта —
        // печатаем отдельным флагом и меряем дальше по 'domcontentloaded'.
        navError = String(e).slice(0, 200);
        loadTimedOut = true;
        try {
          await page.goto(BASE + encodeURI(pagePath), { waitUntil: 'domcontentloaded', timeout: 20000 });
        } catch (e2) {
          navError = String(e2).slice(0, 200);
        }
      }
      await page.waitForTimeout(2500);

      const vitals = await page.evaluate(() => window.__audit);
      const dom = await page.evaluate(COLLECT);
      const nav = await page.evaluate(() => {
        const n = performance.getEntriesByType('navigation')[0] || {};
        const fcp = performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint');
        return {
          ttfb: Math.round(n.responseStart || 0),
          load: Math.round(n.loadEventEnd || 0),
          fcp: fcp ? Math.round(fcp.startTime) : 0,
        };
      });

      results.push({
        page: pagePath,
        name,
        viewport: vp.tag,
        loadTimedOut,
        ms: Date.now() - started,
        lcp: vitals.lcp || null,
        lcpMissing: !vitals.lcp,
        lcpEl: vitals.lcpEl,
        cls: Math.round(vitals.cls * 1000) / 1000,
        ttfb: nav.ttfb,
        fcp: nav.fcp,
        load: nav.load,
        requests,
        kb: Math.round(bytes / 1024),
        consoleErrors: [...new Set(consoleErrors)],
        failedRequests: [...new Set(failedRequests)],
        ...dom,
        navError,
      });

      await context.close();
      process.stdout.write('.');
    }
  }

  await browser.close();
  process.stdout.write('\n');

  const report = {
    ts: new Date().toISOString(),
    base: BASE,
    git: gitSha(),
    viewports: VIEWPORTS,
    thresholds: THRESHOLDS,
    results,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outFile = argValue('--out', path.join(OUT_DIR, `audit-${stamp}.json`));
  fs.writeFileSync(outFile, JSON.stringify(report, null, 1));

  console.log('');
  console.log('страница        вид      LCP   CLS   КБ  запр  битых  безразм  мелких  ошибок  переп');
  for (const r of results) {
    const lcpText = r.lcp === null ? 'н/д' : String(r.lcp);
    console.log(
      r.name.padEnd(14) +
        r.viewport.padEnd(9) +
        lcpText.padStart(6) +
        fmt(r.cls) +
        fmt(r.kb) +
        fmt(r.requests) +
        fmt(r.brokenImages.length, 7) +
        fmt(r.imagesWithoutSize, 9) +
        fmt(r.smallTargets, 8) +
        fmt(r.consoleErrors.length, 8) +
        fmt(r.overflow, 6),
    );
  }
  const noLcp = results.filter((r) => r.lcpMissing).map((r) => `${r.name}/${r.viewport}`);
  if (noLcp.length) {
    console.log('');
    console.log('LCP не измерен (браузер не выдал ни одной записи): ' + noLcp.join(', '));
    console.log('для этих страниц смотреть FCP и вес — LCP считать нечем, и это не «хорошо»');
  }
  const timedOut = results.filter((r) => r.loadTimedOut).map((r) => `${r.name}/${r.viewport}`);
  if (timedOut.length) {
    console.log('');
    console.log('страница не дождалась события load (сторонний скрипт не догрузился): ' + timedOut.join(', '));
    console.log('вес на этих страницах — неполный, остальные метрики верны');
  }

  const violations = [];
  for (const r of results) {
    if (r.lcpMissing) violations.push(`${r.name}/${r.viewport}: LCP не измерен (FCP ${r.fcp} мс) — нужен разбор`);
    if (r.lcp !== null && r.lcp > THRESHOLDS.lcp) violations.push(`${r.name}/${r.viewport}: LCP ${r.lcp} мс > ${THRESHOLDS.lcp}`);
    if (r.cls > THRESHOLDS.cls) violations.push(`${r.name}/${r.viewport}: CLS ${r.cls} > ${THRESHOLDS.cls}`);
    if (r.brokenImages.length > THRESHOLDS.brokenImages) violations.push(`${r.name}/${r.viewport}: битых картинок ${r.brokenImages.length}`);
    if (r.consoleErrors.length > THRESHOLDS.consoleErrors) violations.push(`${r.name}/${r.viewport}: ошибок консоли ${r.consoleErrors.length}`);
    if (r.overflow > THRESHOLDS.overflow) violations.push(`${r.name}/${r.viewport}: переполнение ${r.overflow}px`);
    if (r.smallTargets > THRESHOLDS.smallTargets) violations.push(`${r.name}/${r.viewport}: мелких тап-таргетов ${r.smallTargets}`);
    if (r.navError) violations.push(`${r.name}/${r.viewport}: страница не открылась — ${r.navError}`);
  }

  console.log('');
  console.log(`отчёт: ${path.relative(process.cwd(), outFile)}`);
  if (!violations.length) {
    console.log('пороговые проверки: чисто');
    return 0;
  }
  console.log(`пороговые проверки: нарушено ${violations.length}`);
  for (const v of violations.slice(0, 25)) console.log('  - ' + v);
  if (violations.length > 25) console.log(`  … ещё ${violations.length - 25}`);
  return CHECK ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error('аудит упал:', e);
    process.exit(2);
  });
