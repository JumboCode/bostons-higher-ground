import readExcelFile from "read-excel-file/node";
import { fromBuffer } from "yauzl";

// Narrowed with typeof checks below; the parser's own cell typings vary by version.
type CellValue = unknown;

export const MAX_FILE_BYTES = 1024 * 1024;
const MAX_EXPANDED_BYTES = 8 * 1024 * 1024;
const MAX_ROWS = 1000;
const HEADERS = ["student_id", "period", "math_grade", "attendance_pct"];
const PERIODS = new Set(["2025-fall", "2026-spring"]);

export class PreviewError extends Error {}

/** Preserve text IDs verbatim except outer whitespace. Numeric Excel cells
 * are usable when they are whole, nonnegative, and within Excel's 15-digit
 * precision. Never infer missing leading zeros from number formatting.
 */
export function normalizeStudentId(value: unknown): string | null {
    if (typeof value === "number") {
        return Number.isSafeInteger(value) && value >= 0 && value <= 999_999_999_999_999
            ? String(value) : null;
    }
    if (typeof value === "string") {
        const text = value.trim();
        return /^(?:MOCK-\d{4}|\d+)$/.test(text) ? text : null;
    }
    return null;
}
export type PreviewIssue = { row: number; reason: string };
export type BpsPreview = {
    mockOnly: true;
    totalRows: number;
    matchedRows: number;
    unmatchedRows: number;
    errorRows: number;
    issues: PreviewIssue[];
    issuesTruncated: boolean;
};

// These are synthetic directory entries, not Salesforce records.
const mockMatches = new Map([
    ["1001", 1] as [string, number], // Synthetic numeric-ID test student.
    ...Array.from({ length: 18 }, (_, i): [string, number] => [
        `MOCK-${String(i + 1).padStart(4, "0")}`, 1,
    ]),
    ["MOCK-0090", 2] as [string, number],
    ["MOCK-0091", 1] as [string, number],
    ["MOCK-0092", 1] as [string, number],
]);

// Worksheet parts, and a formula element (<f>, optionally namespace-prefixed).
const WORKSHEET_PART = /^xl\/worksheets\/[^/]+\.xml$/i;
const FORMULA_ELEMENT = /<(?:[A-Za-z_][\w.-]*:)?f[\s/>]/;

/** Bound both ZIP metadata and actual inflated bytes before the parser loads XML.
 * Also rejects formulas: read-excel-file returns a formula's cached result (or
 * empty when none is cached), so they cannot be detected after parsing.
 */
async function validateArchive(buffer: Buffer): Promise<void> {
    if (!buffer.length || buffer.length > MAX_FILE_BYTES)
        throw new PreviewError("Choose an .xlsx file no larger than 1 MiB.");
    await new Promise<void>((resolve, reject) => {
        fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error, zip) => {
            if (error || !zip) return reject(new PreviewError("Use an unencrypted, valid .xlsx mock workbook."));
            let bytes = 0;
            let declared = 0;
            let entries = 0;
            let finished = false;
            const names = new Set<string>();
            const fail = (message = "Workbook is invalid, encrypted, or exceeds the preview limits.") => {
                if (finished) return;
                finished = true;
                zip.close();
                reject(new PreviewError(message));
            };
            zip.on("error", () => fail());
            zip.on("entry", entry => {
                declared += entry.uncompressedSize;
                if (++entries > 100 || declared > MAX_EXPANDED_BYTES ||
                    (entry.generalPurposeBitFlag & 1) || names.has(entry.fileName) ||
                    /vbaProject|externalLinks/i.test(entry.fileName)) return fail();
                names.add(entry.fileName);
                const worksheet = WORKSHEET_PART.test(entry.fileName);
                let tail = "";
                zip.openReadStream(entry, (streamError, stream) => {
                    if (streamError || !stream) return fail();
                    stream.on("error", () => fail());
                    stream.on("data", (chunk: Buffer) => {
                        bytes += chunk.length;
                        if (bytes > MAX_EXPANDED_BYTES) { stream.destroy(); return fail(); }
                        if (!worksheet) return;
                        // Carry a short tail so a tag split across chunks is still seen.
                        const text = tail + chunk.toString("utf8");
                        if (FORMULA_ELEMENT.test(text)) {
                            stream.destroy();
                            return fail("Formulas are not supported. Copy the cells and paste them as values, then upload again.");
                        }
                        tail = text.slice(-64);
                    });
                    stream.on("end", () => { if (!finished) zip.readEntry(); });
                });
            });
            zip.on("end", () => {
                if (finished) return;
                if (!names.has("xl/workbook.xml")) return fail();
                finished = true;
                zip.close();
                resolve();
            });
            zip.readEntry();
        });
    });
}

export async function previewBpsWorkbook(buffer: Buffer): Promise<BpsPreview> {
    await validateArchive(buffer);
    let sheets: { sheet: string; data: readonly (readonly CellValue[])[] }[];
    try {
        // trim: false keeps cell text exactly as stored; IDs are trimmed by normalizeStudentId.
        sheets = await readExcelFile(buffer, { trim: false });
    } catch {
        throw new PreviewError("Could not parse the mock workbook. Use an unencrypted .xlsx file.");
    }
    if (sheets.length !== 1 || sheets[0].sheet !== "Mock BPS")
        throw new PreviewError('Use one worksheet named "Mock BPS". Real BPS workbooks are not supported yet.');
    // data[i] is Excel row i + 1; blank rows in the middle are kept, trailing ones dropped.
    const data = sheets[0].data;
    if (data.length > MAX_ROWS + 1 || data.some(row => row.length > 30))
        throw new PreviewError("Preview supports at most 1,000 data rows and 30 columns.");
    const header = [...(data[0] ?? [])];
    while (header.length && (header.at(-1) === null || header.at(-1) === "")) header.pop();
    const names = header.map(value => {
        if (typeof value !== "string" || !value.trim())
            throw new PreviewError("Every column needs a plain-text header.");
        return value.trim();
    });
    if (new Set(names).size !== names.length) throw new PreviewError("Duplicate column headers.");
    const missing = HEADERS.filter(name => !names.includes(name));
    if (missing.length) throw new PreviewError(`Missing required columns: ${missing.join(", ")}.`);

    const rows: { row: number; values: CellValue[] }[] = [];
    data.forEach((cells, index) => {
        if (index === 0 || cells.every(value => value === null || value === "")) return;
        rows.push({ row: index + 1, values: HEADERS.map(name => cells[names.indexOf(name)] ?? null) });
    });
    // Count before validating metric values: conflicting duplicates are all errors.
    const keys = new Map<string, number>();
    for (const { values: [rawId, period] } of rows) {
        const id = normalizeStudentId(rawId);
        if (id !== null && typeof period === "string") {
            const key = JSON.stringify([id, period]);
            keys.set(key, (keys.get(key) ?? 0) + 1);
        }
    }
    const result: BpsPreview = {
        mockOnly: true, totalRows: rows.length, matchedRows: 0, unmatchedRows: 0,
        errorRows: 0, issues: [], issuesTruncated: false,
    };
    const issue = (row: number, reason: string, unmatched = false) => {
        if (unmatched) result.unmatchedRows++;
        else result.errorRows++;
        if (result.issues.length < 50) result.issues.push({ row, reason });
        else result.issuesTruncated = true;
    };
    for (const { row, values: [rawId, period, grade, attendance] } of rows) {
        const id = normalizeStudentId(rawId);
        if (id === null) {
            issue(row, "Use a mock text ID or a nonnegative whole-number ID with at most 15 digits."); continue;
        }
        if (typeof period !== "string" || !PERIODS.has(period)) {
            issue(row, "Period must be 2025-fall or 2026-spring."); continue;
        }
        if (keys.get(JSON.stringify([id, period]))! > 1) {
            issue(row, "Duplicate student ID and period; all occurrences are excluded."); continue;
        }
        const metrics = [grade, attendance];
        const present = metrics.filter(v => v !== null && v !== "");
        if (!present.length || present.some(v => typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100)) {
            issue(row, "Supply at least one numeric metric from 0 to 100; formulas and errors are not allowed."); continue;
        }
        const matches = mockMatches.get(id) ?? 0;
        if (!matches) { issue(row, "No matching student in the mock directory.", true); continue; }
        if (matches > 1) { issue(row, "Ambiguous ID: multiple mock students match."); continue; }
        result.matchedRows++;
    }
    return result;
}
