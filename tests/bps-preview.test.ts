import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { MAX_FILE_BYTES, normalizeStudentId, previewBpsWorkbook } from "../src/lib/bps-preview";
import { createBpsPreviewHandler } from "../src/lib/bps-preview-handler";

const headers = ["student_id", "period", "math_grade", "attendance_pct"];
const valid = ["MOCK-0001", "2025-fall", 70, 85];
async function workbook(rows: unknown[][] = [valid], columns = headers, sheetName = "Mock BPS") {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet(sheetName);
    sheet.addRow(columns);
    for (const row of rows) sheet.addRow(row);
    return Buffer.from(await book.xlsx.writeBuffer());
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

test("malformed IDs, periods, values, and formulas are row errors without raw-data disclosure", async () => {
    const result = await previewBpsWorkbook(await workbook([
        [123.5, "2025-fall", 70, 85],
        ["REAL-SECRET", "2025-fall", 70, 85],
        ["MOCK-0001", "unknown", 70, 85],
        ["MOCK-0002", "2025-fall", -1, 85],
        ["MOCK-0003", "2025-fall", "PRIVATE", 85],
        ["MOCK-0004", "2025-fall", { formula: "1+1", result: 2 }, 85],
        ["MOCK-0005", "2025-fall", null, null],
        ["MOCK-0006", "2025-fall", true, 85],
        ["MOCK-0007", "2025-fall", 101, 85],
    ]));
    assert.equal(result.errorRows, 9);
    assert.equal(result.matchedRows, 0);
    assert.doesNotMatch(JSON.stringify(result), /REAL-SECRET|PRIVATE|1\+1/);
});

test("blank metrics are optional, zero is valid, extra columns are ignored", async () => {
    const result = await previewBpsWorkbook(await workbook([
        ["MOCK-0001", "2025-fall", 0, null, "PRIVATE"],
        ["MOCK-0002", "2025-fall", null, 100, { formula: "1+1" }],
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
    const book = new ExcelJS.Workbook();
    book.addWorksheet("Mock BPS").addRow(headers);
    book.addWorksheet("hidden").state = "veryHidden";
    await assert.rejects(previewBpsWorkbook(Buffer.from(await book.xlsx.writeBuffer())), /one worksheet/);
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
    form.append("file", new Blob([bytes]), "one.xlsx");
    form.append("file", new Blob([bytes]), "two.xlsx");
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
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("Mock BPS");
    sheet.addRow(headers);
    sheet.addRow([1001, "2025-fall", 70, 85]);
    sheet.getCell("A2").numFmt = "000000";
    const result = await previewBpsWorkbook(Buffer.from(await book.xlsx.writeBuffer()));
    assert.equal(result.matchedRows, 1); // Stored 1001, not displayed 001001.
});
