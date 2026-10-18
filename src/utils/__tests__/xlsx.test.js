import { describe, test, expect } from "vitest";
import { deflateRawSync } from "node:zlib";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readZipEntries, linksFromSheetXlsx } from "../xlsx.js";

// Минимальный сборщик zip: нужен, чтобы тест не зависел от файла в /tmp.
function makeZip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const [name, content] of files) {
    const nameBuf = Buffer.from(name, "utf8");
    const comp = deflateRawSync(Buffer.from(content, "utf8"));
    const crc = 0; // разбор CRC не проверяет
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, comp);
    central.push({ nameBuf, offset, comp: comp.length, raw: content.length, crc });
    offset += local.length + nameBuf.length + comp.length;
  }
  const cdStart = offset;
  for (const c of central) {
    const h = Buffer.alloc(46);
    h.writeUInt32LE(0x02014b50, 0);
    h.writeUInt16LE(20, 4);
    h.writeUInt16LE(20, 6);
    h.writeUInt16LE(0, 8);
    h.writeUInt16LE(8, 10);
    h.writeUInt32LE(c.crc, 16);
    h.writeUInt32LE(c.comp, 20);
    h.writeUInt32LE(c.raw, 24);
    h.writeUInt16LE(c.nameBuf.length, 28);
    h.writeUInt32LE(c.offset, 42);
    chunks.push(h, c.nameBuf);
    offset += h.length + c.nameBuf.length;
  }
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(central.length, 8);
  eocd.writeUInt16LE(central.length, 10);
  eocd.writeUInt32LE(offset - cdStart, 12);
  eocd.writeUInt32LE(cdStart, 16);
  chunks.push(eocd);
  return Buffer.concat(chunks);
}

const SHEET = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet><sheetData>
<row r="1"><c r="B1" t="s"><v>0</v></c><c r="C1"/></row>
<row r="2"><c r="C2" t="s"><v>2</v></c><hyperlink r:id="rId1" ref="C2"/><hyperlink r:id="rId2" ref="R2"/></row>
<row r="3"><c r="C3" t="s"><v>3</v></c><hyperlink r:id="rId1" ref="C3"/></row>
</sheetData><hyperlinks/></worksheet>`;

const workbook = `<?xml version="1.0"?><workbook><sheets>
<sheet name="Не тот" sheetId="1" r:id="rId1"/><sheet name="Все рогалики" sheetId="2" r:id="rId2"/>
</sheets></workbook>`;

const wbRels = `<?xml version="1.0"?><Relationships>
<Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/>
</Relationships>`;

const sheetRels = `<?xml version="1.0"?><Relationships>
<Relationship Id="rId1" Target="https://store.steampowered.com/app/2229940/" TargetMode="External"/>
<Relationship Id="rId2" Target="https://www.youtube.com/playlist?list=PL5RpA6" TargetMode="External"/>
</Relationships>`;

const shared = `<?xml version="1.0"?><sst><si><t>Название</t></si><si><t>Col C</t></si><si><t>REDACTED</t></si><si><t>20 Minutes Till Dawn</t></si></sst>`;

function fixture() {
  return makeZip([
    ["xl/workbook.xml", workbook],
    ["xl/_rels/workbook.xml.rels", wbRels],
    ["xl/sharedStrings.xml", shared],
    ["xl/worksheets/sheet1.xml", "<worksheet/>"],
    ["xl/worksheets/sheet2.xml", SHEET],
    ["xl/worksheets/_rels/sheet2.xml.rels", sheetRels],
  ]);
}

describe("readZipEntries", () => {
  test("читает все записи и распаковывает их", () => {
    const zip = fixture();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tk-zip-"));
    const file = path.join(dir, "t.xlsx");
    fs.writeFileSync(file, zip);
    const entries = readZipEntries(fs.readFileSync(file));
    expect([...entries.keys()].sort()).toContain("xl/worksheets/sheet2.xml");
    expect(entries.get("xl/worksheets/sheet2.xml").toString()).toContain("sheetData");
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("linksFromSheetXlsx", () => {
  test("собирает ссылки по названию из нужного листа", () => {
    const map = linksFromSheetXlsx(fixture(), "Все рогалики");
    expect([...map.keys()].sort()).toEqual(["20 minutes till dawn", "redacted"]);
    expect(map.get("redacted").steam).toBe("https://store.steampowered.com/app/2229940/");
    expect(map.get("redacted").youtube).toBe("https://www.youtube.com/playlist?list=PL5RpA6");
    expect(map.get("redacted").mi).toBe("");
    expect(map.get("20 minutes till dawn").youtube).toBe("");
  });

  test("нет такого листа — пусто", () => {
    expect(linksFromSheetXlsx(fixture(), "Расписание").size).toBe(0);
  });
});
