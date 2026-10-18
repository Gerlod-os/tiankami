// Разбор выгрузки Google Таблицы в xlsx: читатель zip + доставание гиперссылок.
// Нужен, чтобы забирать ссылки YouTube/MI/Steam без ключа Sheets API: выгрузка
// публичная, а в TSV ячейка с гиперссылкой приходит plain text («Ссылка на плейлист»).
import { inflateRawSync } from "node:zlib";

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;

/** Все записи zip как Map<имя, Buffer>. Файл целиком в памяти — 25 МБ терпимо. */
export function readZipEntries(buffer) {
  const out = new Map();
  // Конец центрального каталога ищем с хвоста: комментарий может быть любой длины.
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("не zip: нет конца центрального каталога");

  const count = buffer.readUInt16LE(eocd + 10);
  let ptr = buffer.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(ptr) !== SIG_CENTRAL) break;
    const method = buffer.readUInt16LE(ptr + 10);
    const compSize = buffer.readUInt32LE(ptr + 20);
    const nameLen = buffer.readUInt16LE(ptr + 28);
    const extraLen = buffer.readUInt16LE(ptr + 30);
    const commentLen = buffer.readUInt16LE(ptr + 32);
    const localOffset = buffer.readUInt32LE(ptr + 42);
    const name = buffer.toString("utf8", ptr + 46, ptr + 46 + nameLen);

    // Переходим к локальному заголовку: у него своя длина имени и доп. поля.
    if (buffer.readUInt32LE(localOffset) !== SIG_LOCAL) {
      ptr += 46 + nameLen + extraLen + commentLen;
      continue;
    }
    const lNameLen = buffer.readUInt16LE(localOffset + 26);
    const lExtraLen = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + lNameLen + lExtraLen;
    const raw = buffer.subarray(start, start + compSize);
    out.set(name, method === 0 ? raw : inflateRawSync(raw));
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

const unescapeXml = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");

/**
 * Ссылки листа: «название игры в нижнем регистре» → { steam, youtube, mi }.
 * В листе «Все рогалики» колонка C — название (+ссылка Steam), R — YouTube, T — выпуск МИ.
 */
export function linksFromSheetXlsx(buffer, sheetName) {
  const files = readZipEntries(buffer);
  const str = (n) => (files.get(n) ? files.get(n).toString("utf8") : "");

  // Имя листа → файл листа
  const wbRels = {};
  for (const m of str("xl/_rels/workbook.xml.rels").matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /Id="([^"]+)"/.exec(m[0]);
    const target = /Target="([^"]+)"/.exec(m[0]);
    if (id && target) wbRels[id[1]] = target[1];
  }
  let sheetFile = null;
  for (const m of str("xl/workbook.xml").matchAll(/<sheet\b[^>]*\/?>/g)) {
    const name = /name="([^"]+)"/.exec(m[0]);
    const rid = /r:id="([^"]+)"/.exec(m[0]);
    if (name && rid && name[1] === sheetName) {
      const target = wbRels[rid[1]];
      // Target бывает «worksheets/sheet2.xml» (относительно xl/) или «/xl/worksheets/sheet2.xml».
      if (target) sheetFile = target.startsWith("xl/") ? target : "xl/" + target.replace(/^\/+/, "");
      break;
    }
  }
  if (!sheetFile) return new Map();

  const shared = [];
  for (const m of str("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    shared.push(unescapeXml(m[1].replace(/<[^>]+>/g, "")));
  }

  const sheet = str(sheetFile);
  const relsName = "xl/worksheets/_rels/" + sheetFile.split("/").pop() + ".rels";
  const targets = {};
  for (const m of str(relsName).matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /Id="([^"]+)"/.exec(m[0]);
    const target = /Target="([^"]+)"/.exec(m[0]);
    if (id && target && /TargetMode="External"/.test(m[0])) targets[id[1]] = unescapeXml(target[1]);
  }

  // Гиперссылки: rId → адрес, ref → ячейка
  const byCell = new Map();
  for (const m of sheet.matchAll(/<hyperlink\b[^>]*\/?>/g)) {
    const rid = /r:id="([^"]+)"/.exec(m[0]);
    const ref = /ref="([^"]+)"/.exec(m[0]);
    if (rid && ref && targets[rid[1]]) byCell.set(ref[1], targets[rid[1]]);
  }

  const out = new Map();
  // [^/>] перед «>» — иначе самозакрывающаяся пустая ячейка (<c r="C1"/>) заставит
  // регулярку проглотить ячейку следующей строки.
  for (const m of sheet.matchAll(/<c r="C(\d+)"([^>]*[^/>])?>([\s\S]*?)<\/c>/g)) {
    const attrs = m[2];
    const v = /<v>([\s\S]*?)<\/v>/.exec(m[3]);
    if (!v) continue;
    const value = /t="s"/.test(attrs) ? shared[Number(v[1])] || "" : unescapeXml(v[1]);
    const title = String(value).trim().toLowerCase();
    if (!title) continue;
    const row = m[1];
    out.set(title, {
      steam: byCell.get("C" + row) || "",
      youtube: byCell.get("R" + row) || "",
      mi: byCell.get("T" + row) || "",
    });
  }
  return out;
}
