import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { crc32, deflateRawSync } from "node:zlib";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import writeExcelFile, { type SheetData } from "write-excel-file/node";
import { MAX_FILE_BYTES, normalizeStudentId, previewBpsWorkbook } from "../src/lib/bps-preview";
import { createBpsPreviewHandler } from "../src/lib/bps-preview-handler";

type Cell = string | number | boolean | null | { value: unknown; type?: unknown; format?: string };
const headers = ["student_id", "period", "math_grade", "attendance_pct"];
const valid: Cell[] = ["MOCK-0001", "2025-fall", 70, 85];
const formula = (value: string): Cell => ({ type: "Formula", value });
async function workbook(rows: Cell[][] = [valid], columns: Cell[] = headers, sheetName = "Mock BPS") {
    return writeExcelFile([columns, ...rows] as SheetData, { sheet: sheetName }).toBuffer();
}
function request(bytes: Uint8Array, options: { name?: string; confirm?: string; origin?: string } = {}) {
    const form = new FormData();
    form.set("file", new Blob([new Uint8Array(bytes)]), options.name ?? "mock.xlsx");
    if (options.confirm !== "omit") form.set("mockOnly", options.confirm ?? "true");
    return new Request("http://localhost:3000/api/admin/bps-preview", {
        method: "POST", headers: { origin: options.origin ?? "http://localhost:3000" }, body: form,
    });
}
const post = createBpsPreviewHandler(async () => "admin");

test("sample workbook previews end to end without returning IDs or metric values", async () => {
    const bytes = await readFile(new URL("../public/mock-bps.xlsx", import.meta.url));
    const response = await post(request(bytes));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const result = await response.json();
    assert.equal(result.totalRows, 41);
    assert.equal(result.matchedRows, 36);
    assert.equal(result.unmatchedRows, 1);
    assert.equal(result.errorRows, 4);
    assert.equal(result.issues.length, 5);
    assert.equal(JSON.stringify(result).includes("MOCK-0090"), false);
    assert.equal(JSON.stringify(result).includes("math_grade"), false);
    assert.deepEqual(await previewBpsWorkbook(bytes), await previewBpsWorkbook(bytes));
});

test("missing and duplicate headers reject workbook", async () => {
    await assert.rejects(previewBpsWorkbook(await workbook([valid], headers.slice(0, 3))), /Missing required columns: attendance_pct/);
    await assert.rejects(previewBpsWorkbook(await workbook([valid], [...headers, "student_id"])), /Duplicate column/);
});

test("duplicates exclude all occurrences, but same student in another period is valid", async () => {
    const result = await previewBpsWorkbook(await workbook([
        valid, [" MOCK-0001 ", "2025-fall", 75, 90], ["MOCK-0001", "2026-spring", 80, 95],
    ]));
    assert.equal(result.errorRows, 2);
    assert.equal(result.matchedRows, 1);
    assert.deepEqual(result.issues.map(i => i.row), [2, 3]);
});

test("malformed IDs, periods, and values are row errors without raw-data disclosure", async () => {
    const result = await previewBpsWorkbook(await workbook([
        [123.5, "2025-fall", 70, 85],
        ["REAL-SECRET", "2025-fall", 70, 85],
        ["MOCK-0001", "unknown", 70, 85],
        ["MOCK-0002", "2025-fall", -1, 85],
        ["MOCK-0003", "2025-fall", "PRIVATE", 85],
        ["MOCK-0005", "2025-fall", null, null],
        ["MOCK-0006", "2025-fall", true, 85],
        ["MOCK-0007", "2025-fall", 101, 85],
    ]));
    assert.equal(result.errorRows, 8);
    assert.equal(result.matchedRows, 0);
    assert.doesNotMatch(JSON.stringify(result), /REAL-SECRET|PRIVATE/);
});

test("formulas anywhere reject the workbook, because parsed values hide them", async () => {
    for (const rows of [
        [["MOCK-0004", "2025-fall", formula("1+1"), 85]],
        [["MOCK-0002", "2025-fall", null, 100, formula("1+1")]],
    ]) {
        const error = await previewBpsWorkbook(await workbook(rows, [...headers, "unapproved"])).catch(e => e);
        assert.match(String(error), /Formulas are not supported/);
        assert.doesNotMatch(String(error), /1\+1|MOCK-/);
    }
});

test("blank metrics are optional, zero is valid, extra columns are ignored", async () => {
    const result = await previewBpsWorkbook(await workbook([
        ["MOCK-0001", "2025-fall", 0, null, "PRIVATE"],
        ["MOCK-0002", "2025-fall", null, 100, "ALSO PRIVATE"],
    ], [...headers, "unapproved"]));
    assert.equal(result.matchedRows, 2);
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE|unapproved/);
});

test("unmatched and ambiguous rows are distinct from matched rows", async () => {
    const result = await previewBpsWorkbook(await workbook([
        ["MOCK-9999", "2025-fall", 70, 85], ["MOCK-0090", "2025-fall", 70, 85], valid,
    ]));
    assert.equal(result.unmatchedRows, 1);
    assert.equal(result.errorRows, 1);
    assert.equal(result.matchedRows, 1);
});

test("invalid files, encrypted-file signature, wrong sheets, and limits are rejected", async () => {
    await assert.rejects(previewBpsWorkbook(Buffer.from("not an xlsx")));
    await assert.rejects(previewBpsWorkbook(Buffer.from([0xd0, 0xcf, 0x11, 0xe0])), /unencrypted/);
    await assert.rejects(previewBpsWorkbook(Buffer.alloc(MAX_FILE_BYTES + 1)), /1 MiB/);
    await assert.rejects(previewBpsWorkbook(await workbook([valid], headers, "2017-2018")), /Mock BPS/);
    await assert.rejects(previewBpsWorkbook(await workbook(Array(1001).fill(valid))), /1,000/);
    // Any second sheet (visible or hidden) is refused; the parser lists every sheet.
    const twoSheets = await writeExcelFile([
        { sheet: "Mock BPS", data: [headers] as SheetData },
        { sheet: "hidden", data: [["x"]] as SheetData },
    ]).toBuffer();
    await assert.rejects(previewBpsWorkbook(twoSheets), /one worksheet/);
});

test("issue list is bounded and counts include all rows", async () => {
    const result = await previewBpsWorkbook(await workbook(Array(60).fill(["MOCK-9999", "2025-fall", 70, 85])));
    assert.equal(result.errorRows, 60);
    assert.equal(result.issues.length, 50);
    assert.equal(result.issuesTruncated, true);
});

for (const status of [401, 403]) test(`authorization rejects ${status} before reading request body`, async () => {
    const req = request(new Uint8Array([1, 2, 3]));
    const response = await createBpsPreviewHandler(async () => new Response(null, { status }))(req);
    assert.equal(response.status, status);
    assert.equal(req.bodyUsed, false);
});

test("cross-origin, missing confirmation, wrong extension, and malformed form are rejected", async () => {
    const bytes = await workbook();
    assert.equal((await post(request(bytes, { origin: "https://elsewhere.example" }))).status, 403);
    assert.equal((await post(request(bytes, { confirm: "omit" }))).status, 400);
    assert.equal((await post(request(bytes, { name: "mock.csv" }))).status, 400);
    assert.equal((await post(new Request("http://localhost/api/admin/bps-preview", { method: "POST", body: "bad" }))).status, 400);
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(bytes)]), "one.xlsx");
    form.append("file", new Blob([new Uint8Array(bytes)]), "two.xlsx");
    form.set("mockOnly", "true");
    assert.equal((await post(new Request("http://localhost/api/admin/bps-preview", { method: "POST", body: form }))).status, 400);
});

test("stream limit is enforced without trusting Content-Length", async () => {
    const req = new Request("http://localhost/api/admin/bps-preview", {
        method: "POST", headers: { "Content-Type": "multipart/form-data; boundary=test" },
        body: new Uint8Array(MAX_FILE_BYTES + 65537),
    });
    assert.equal((await post(req)).status, 413);
});

test("normalizes safe numeric IDs without guessing leading zeros or parsing text numbers", () => {
    assert.equal(normalizeStudentId(1001), "1001");
    assert.equal(normalizeStudentId(" 1001 "), "1001");
    assert.equal(normalizeStudentId("001001"), "001001");
    assert.equal(normalizeStudentId(0), "0");
    assert.equal(normalizeStudentId(999_999_999_999_999), "999999999999999");
    assert.equal(normalizeStudentId("12345678901234567890"), "12345678901234567890");
    for (const value of [NaN, Infinity, -1, 1.5, 1_000_000_000_000_000,
        Number.MAX_SAFE_INTEGER + 1, true, null, "", "1e3", "1001.0", "1,001",
        { formula: "1001", result: 1001 }]) {
        assert.equal(normalizeStudentId(value), null);
    }
});

test("numeric and text IDs match identically and are duplicates in the same period", async () => {
    const matched = await previewBpsWorkbook(await workbook([
        [1001, "2025-fall", 70, 85], ["1001", "2026-spring", 80, 90],
        ["001001", "2025-fall", 70, 85],
    ]));
    assert.equal(matched.matchedRows, 2);
    assert.equal(matched.unmatchedRows, 1); // Never strip or guess leading zeros.
    assert.equal(matched.errorRows, 0);
    const duplicates = await previewBpsWorkbook(await workbook([
        [1001, "2025-fall", 70, 85], [" 1001 ", "2025-fall", 80, 90],
    ]));
    assert.equal(duplicates.errorRows, 2);
    assert.equal(duplicates.matchedRows, 0);
});

test("numeric Excel formatting is not used to invent identifier digits", async () => {
    const result = await previewBpsWorkbook(await workbook([
        [{ value: 1001, format: "000000" }, "2025-fall", 70, 85],
    ]));
    assert.equal(result.matchedRows, 1); // Stored 1001, not displayed 001001.
});

// --- Archive hardening: the parser must only ever see bytes that were checked. ---
// These build workbooks by hand so the ZIP and XML can be crafted precisely.
const MOCK_ROW: Cell[] = ["MOCK-0001", "2025-fall", 70, 85];
async function parts(rows: Cell[][] = [MOCK_ROW]) {
    return unzipSync(new Uint8Array(await workbook(rows)));
}
const SHEET = "xl/worksheets/sheet1.xml";
const pack = (files: Record<string, Uint8Array>) => Buffer.from(zipSync(files));
const FORMULA_CELL = '<c r="C2"><f>1+1</f><v>2</v></c>';
async function withSheet(edit: (xml: string) => string) {
    const files = await parts();
    return pack({ ...files, [SHEET]: strToU8(edit(strFromU8(files[SHEET]))) });
}
const replaceC2 = (cell: string) => (xml: string) => xml.replace(/<c r="C2"[^]*?<\/c>/, cell);
const FORMULA_ERROR = /Formulas are not supported/;
const LIMITS_ERROR = /first 1,000 rows below the header and the first 30 columns/;
const INVALID_ERROR = /invalid, encrypted, or exceeds the preview limits/;

/** Minimal ZIP writer that can disagree with itself: `cdName` sets the name in
 * the central directory (null = omit the entry from it entirely). */
function rawZip(entries: { name: string; cdName?: string | null; data: Uint8Array }[]) {
    const local: Buffer[] = [];
    const central: Buffer[] = [];
    let offset = 0;
    for (const entry of entries) {
        const data = deflateRawSync(entry.data);
        const crc = crc32(entry.data);
        const name = Buffer.from(entry.name);
        const header = Buffer.alloc(30);
        header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(8, 8);
        header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18);
        header.writeUInt32LE(entry.data.length, 22); header.writeUInt16LE(name.length, 26);
        local.push(header, name, data);
        if (entry.cdName !== null) {
            const cdName = Buffer.from(entry.cdName ?? entry.name);
            const record = Buffer.alloc(46);
            record.writeUInt32LE(0x02014b50, 0); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6);
            record.writeUInt16LE(8, 10); record.writeUInt32LE(crc, 16); record.writeUInt32LE(data.length, 20);
            record.writeUInt32LE(entry.data.length, 24); record.writeUInt16LE(cdName.length, 28);
            record.writeUInt32LE(offset, 42);
            central.push(record, cdName);
        }
        offset += 30 + name.length + data.length;
    }
    const directory = Buffer.concat(central);
    const count = entries.filter(e => e.cdName !== null).length;
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(count, 8); end.writeUInt16LE(count, 10);
    end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
    return Buffer.concat([...local, directory, end]);
}

test("formulas are found in any cell, however the sheet XML is written", async () => {
    const variants: [string, (xml: string) => string][] = [
        ["plain", replaceC2(FORMULA_CELL)],
        ["namespace prefix", replaceC2('<c r="C2"><x:f xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main">1+1</x:f><v>2</v></c>')],
        ["self-closing shared formula", replaceC2('<c r="C2"><f t="shared" si="0"/><v>2</v></c>')],
        // The parser reads cells even outside <sheetData>.
        ["cell after </sheetData>", xml => xml.replace(/<c r="C2"[^]*?<\/c>/, "").replace("</sheetData>",
            `</sheetData><row r="3">${FORMULA_CELL.replace("C2", "C3")}</row>`)],
        // A fake close tag inside a comment/CDATA/PI must not end the scan early.
        ["fake </c> in a comment", replaceC2('<c r="C2"><!-- </c> --><f>1+1</f><v>2</v></c>')],
        ["fake </sheetData> in a PI", replaceC2(`<?x </sheetData> ?>${FORMULA_CELL}`)],
        ["fake </sheetData> in CDATA", replaceC2(`<c r="Z9" t="inlineStr"><is><t><![CDATA[</sheetData>]]></t></is></c>${FORMULA_CELL}`)],
    ];
    for (const [label, edit] of variants) {
        const error = await previewBpsWorkbook(await withSheet(edit)).catch(e => e);
        assert.match(String(error), FORMULA_ERROR, label);
        assert.doesNotMatch(String(error), /1\+1|MOCK-/, label);
    }
});

test("formulas in a relocated or renamed sheet part are still found", async () => {
    const files = await parts();
    const formulaSheet = strToU8(replaceC2(FORMULA_CELL)(strFromU8(files[SHEET])));
    // The parser locates sheets through workbook.xml.rels, not a fixed path.
    const rels = "xl/_rels/workbook.xml.rels";
    const rest = Object.fromEntries(Object.entries(files).filter(([name]) => name !== SHEET));
    const relocated = pack({ ...rest, "xl/data/sheet1.xml": formulaSheet,
        [rels]: strToU8(strFromU8(files[rels]).replace("worksheets/sheet1.xml", "data/sheet1.xml")) });
    await assert.rejects(previewBpsWorkbook(relocated), FORMULA_ERROR);
    // Central directory and local header disagree about the entry's name.
    const renamed = rawZip(Object.entries(files).map(([name, data]) =>
        name === SHEET ? { name, cdName: "docProps/x.bin", data: formulaSheet } : { name, data }));
    await assert.rejects(previewBpsWorkbook(renamed), FORMULA_ERROR);
});

test("entries hidden from the central directory never reach the parser", async () => {
    const files = await parts();
    // Text cells live in sharedStrings.xml. The parser reads local headers, and a
    // later local entry with the same name replaces the earlier (checked) one.
    const STRINGS = "xl/sharedStrings.xml";
    assert.match(strFromU8(files[STRINGS]), /MOCK-0001/);
    const hiddenStrings = strToU8(strFromU8(files[STRINGS]).replace("MOCK-0001", "MOCK-9999"));
    const entries: { name: string; cdName?: string | null; data: Uint8Array }[] =
        Object.entries(files).map(([name, data]) => ({ name, data }));
    const index = entries.findIndex(e => e.name === STRINGS);
    entries.splice(index + 1, 0, { name: STRINGS, cdName: null, data: hiddenStrings });
    // A hidden 40 MiB entry would bypass the 8 MiB expansion limit.
    entries.unshift({ name: "pad.xml", cdName: null, data: new Uint8Array(40 * 1024 * 1024).fill(0x20) });
    const result = await previewBpsWorkbook(rawZip(entries));
    assert.equal(result.matchedRows, 1); // MOCK-0001 from the checked copy, not MOCK-9999.
    assert.equal(result.unmatchedRows, 0);
});

test("formulas outside cells and non-XML parts do not reject legitimate workbooks", async () => {
    const extras = '<conditionalFormatting sqref="C2"><cfRule type="expression" priority="1"><formula>C2&gt;90</formula></cfRule></conditionalFormatting>' +
        '<extLst><ext uri="{CCE6A557-97BC-4b89-ADB6-D9C93CAAB3DF}" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main">' +
        '<x14:dataValidations count="1" xmlns:xm="http://schemas.microsoft.com/office/excel/2006/main"><x14:dataValidation type="list">' +
        "<x14:formula1><xm:f>Lists!$A$1:$A$2</xm:f></x14:formula1><xm:sqref>B2</xm:sqref></x14:dataValidation></x14:dataValidations></ext></extLst>";
    const validated = await withSheet(xml => xml.replace("</worksheet>", `${extras}</worksheet>`));
    assert.equal((await previewBpsWorkbook(validated)).matchedRows, 1);
    // PNG signature, then binary data with stray "<" bytes.
    const image = new Uint8Array(5000).map((_, i) => (i % 7 === 0 ? 0x3c : (i * 37) & 0xff));
    image.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal((await previewBpsWorkbook(pack({ ...(await parts()), "xl/media/image1.png": image }))).matchedRows, 1);
});

test("sparse references beyond the limits are refused before parsing", async () => {
    for (const edit of [
        (xml: string) => xml.replace("</row>", '<c r="XFD2"><v>1</v></c></row>'),
        (xml: string) => xml.replace("</row>", "<c r='AE2'><v>1</v></c></row>"),
        (xml: string) => xml.replace("</sheetData>", '<row r="1048576"><c r="A1048576"><v>1</v></c></row></sheetData>'),
    ]) await assert.rejects(previewBpsWorkbook(await withSheet(edit)), LIMITS_ERROR);
    const rows: Cell[][] = [MOCK_ROW, ...Array(999).fill([null]), ["MOCK-0002", "2025-fall", 70, 85]];
    await assert.rejects(previewBpsWorkbook(await workbook(rows)), LIMITS_ERROR); // Data on row 1002.
});

test("malformed or pathological XML is refused quickly, before the slow parser", async () => {
    const cases: [string, string][] = [
        ["unterminated tags", "<c".repeat(4_000_000)],
        ["nested cells", "<c>".repeat(2_700_000)],
        ["unterminated comment", "<!--".repeat(2_000_000)],
        ["unterminated quote", `<a b="${"x".repeat(8_000_000)}`],
        ["millions of elements", "<a></a>".repeat(1_000_000)],
        ["attribute spam", `<a${Array.from({ length: 300_000 }, (_, i) => ` a${i}="1"`).join("")}/>`],
    ];
    for (const [label, junk] of cases) {
        const started = Date.now();
        await assert.rejects(previewBpsWorkbook(await withSheet(xml => xml.replace("</worksheet>", `${junk}</worksheet>`))), INVALID_ERROR, label);
        assert.ok(Date.now() - started < 5000, `${label} took ${Date.now() - started}ms`);
    }
});

test("Excel row numbers survive blank rows, and whitespace-only rows are skipped", async () => {
    const result = await previewBpsWorkbook(await workbook([
        ["MOCK-9999", "2025-fall", 70, 85], [null], [null], ["MOCK-9998", "2025-fall", 70, 85], ["   ", " "],
    ]));
    assert.equal(result.totalRows, 2);
    assert.deepEqual(result.issues.map(i => i.row), [2, 5]);
});
