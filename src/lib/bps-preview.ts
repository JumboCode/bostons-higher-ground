import readExcelFile from "read-excel-file/node";
import { fromBuffer } from "yauzl";
import { zipSync } from "fflate";

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

const MAX_COLUMNS = 30;
const MAX_TAGS_PER_PART = 200_000;
const MAX_ATTRIBUTES_PER_TAG = 100;
// Element name after "<" or "</", with an optional namespace prefix (e.g. x:c).
const TAG_NAME = /^(\/?)(?:[A-Za-z_][\w.-]*:)?([A-Za-z_][\w.-]*)/;
// r="AD5" on a <c> or r="5" on a <row>, within a single (bounded) tag.
const REF_ATTRIBUTE = /\sr\s*=\s*(["'])([A-Za-z]*)(\d+)\1/;
const FORMULA_MESSAGE = "Formulas are not supported. Copy the cells and paste them as values, then upload again.";
const LIMITS_MESSAGE = `Keep data within the first ${MAX_ROWS.toLocaleString("en-US")} rows below the header and the first ${MAX_COLUMNS} columns.`;

function columnNumber(letters: string) {
    let n = 0;
    for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n;
}

/** Inspect every part's cell data before parsing. read-excel-file returns a
 * formula's cached result (or empty when none is cached), so formulas must be
 * found here. It reads every <c> cell in a sheet document, even outside
 * <sheetData>, so any <f> inside any cell is refused; formulas outside cells
 * (e.g. <xm:f> in a data-validation list under <extLst>) are not cell values.
 * Sparse references far beyond the limits are refused because the parser would
 * otherwise allocate every row/column up to them.
 *
 * A single linear pass (no backtracking regexes over the whole part, which a
 * crafted 8 MiB part could make quadratic). Comments, CDATA and processing
 * instructions are skipped as an XML parser would, tag ends respect quoted
 * attribute values, and anything left unterminated rejects the workbook.
 */
function inspectCellData(xml: string) {
    const malformed = () => new PreviewError("Workbook is invalid, encrypted, or exceeds the preview limits.");
    let inCell = false;
    let cells = 0;
    let rows = 0;
    let tags = 0;
    let i = 0;
    while ((i = xml.indexOf("<", i)) !== -1) {
        const skipTo = (opener: string, closer: string) => {
            const end = xml.indexOf(closer, i + opener.length);
            if (end === -1) throw malformed();
            return end + closer.length;
        };
        if (xml.startsWith("<!--", i)) { i = skipTo("<!--", "-->"); continue; }
        if (xml.startsWith("<![CDATA[", i)) { i = skipTo("<![CDATA[", "]]>"); continue; }
        if (xml.startsWith("<?", i)) { i = skipTo("<?", "?>"); continue; }
        // Find the tag's closing ">" outside quoted attribute values. "<" is never
        // legal inside a tag or attribute value; refusing it here also keeps
        // malformed input away from the parser, which is very slow on it.
        // The parser slows down sharply on tags with very many attributes and on
        // millions of elements, so both are capped far above real workbooks (a full
        // 1,000 x 30 sheet is ~60k tags; real tags have well under 30 attributes).
        if (++tags > MAX_TAGS_PER_PART) throw malformed();
        let end = i + 1;
        let quote = "";
        let attributes = 0;
        for (; end < xml.length; end++) {
            const ch = xml[end];
            if (ch === "<") throw malformed();
            if (quote) { if (ch === quote) quote = ""; }
            else if (ch === '"' || ch === "'") quote = ch;
            else if (ch === "=" && ++attributes > MAX_ATTRIBUTES_PER_TAG) throw malformed();
            else if (ch === ">") break;
        }
        if (end >= xml.length) throw malformed();
        const tag = xml.slice(i + 1, end);
        i = end + 1;
        const name = TAG_NAME.exec(tag);
        if (!name) continue; // <!DOCTYPE ...> and similar declarations.
        const [, closing, local] = name;
        if (local === "c" || local === "row") {
            if (closing) { if (local === "c") inCell = false; continue; }
            // Cells cannot nest, and no valid preview sheet needs more cells or
            // rows than the row/column limits allow (plus the header row).
            if (local === "c" && (inCell || ++cells > (MAX_ROWS + 1) * MAX_COLUMNS)) throw malformed();
            if (local === "row" && ++rows > MAX_ROWS + 1) throw new PreviewError(LIMITS_MESSAGE);
            const ref = REF_ATTRIBUTE.exec(tag);
            if (ref && (Number(ref[3]) > MAX_ROWS + 1 || columnNumber(ref[2]) > MAX_COLUMNS))
                throw new PreviewError(LIMITS_MESSAGE);
            if (local === "c") inCell = !tag.endsWith("/");
        } else if (local === "f" && !closing && inCell) {
            throw new PreviewError(FORMULA_MESSAGE);
        }
    }
}

/** Decompress every entry once with yauzl (bounding entries and real inflated
 * bytes), inspect them, and return a freshly packed archive of exactly those
 * bytes. The parser unzips with a different library that reads local headers
 * rather than the central directory; repacking means it can only ever see the
 * entries that were checked here, never hidden or renamed ones.
 */
async function extractCheckedArchive(buffer: Buffer): Promise<Buffer> {
    if (!buffer.length || buffer.length > MAX_FILE_BYTES)
        throw new PreviewError("Choose an .xlsx file no larger than 1 MiB.");
    const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
        fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error, zip) => {
            if (error || !zip) return reject(new PreviewError("Use an unencrypted, valid .xlsx mock workbook."));
            let bytes = 0;
            let declared = 0;
            let entries = 0;
            let finished = false;
            const files: Record<string, Uint8Array> = {};
            const fail = (failure: unknown = null) => {
                if (finished) return;
                finished = true;
                zip.close();
                reject(failure instanceof PreviewError ? failure
                    : new PreviewError("Workbook is invalid, encrypted, or exceeds the preview limits."));
            };
            zip.on("error", () => fail());
            zip.on("entry", entry => {
                declared += entry.uncompressedSize;
                if (++entries > 100 || declared > MAX_EXPANDED_BYTES ||
                    (entry.generalPurposeBitFlag & 1) || Object.hasOwn(files, entry.fileName) ||
                    /vbaProject|externalLinks/i.test(entry.fileName)) return fail();
                if (entry.fileName.endsWith("/")) return zip.readEntry(); // Directory entry.
                zip.openReadStream(entry, (streamError, stream) => {
                    if (streamError || !stream) return fail();
                    const chunks: Buffer[] = [];
                    stream.on("error", () => fail());
                    stream.on("data", (chunk: Buffer) => {
                        bytes += chunk.length;
                        if (bytes > MAX_EXPANDED_BYTES) { stream.destroy(); return fail(); }
                        chunks.push(chunk);
                    });
                    stream.on("end", () => {
                        if (finished) return;
                        const data = Buffer.concat(chunks);
                        const text = data.toString("utf8");
                        // The parser only needs XML parts. Non-XML parts (images,
                        // thumbnails) are left out of the repacked archive rather than
                        // scanned; a sheet disguised as one is then simply not found.
                        // (\s also matches a leading byte-order mark.)
                        if (/^\s*</.test(text)) {
                            try { inspectCellData(text); } catch (e) { return fail(e); }
                            files[entry.fileName] = data;
                        }
                        zip.readEntry();
                    });
                });
            });
            zip.on("end", () => {
                if (finished) return;
                if (!Object.hasOwn(files, "xl/workbook.xml")) return fail();
                finished = true;
                zip.close();
                resolve(files);
            });
            zip.readEntry();
        });
    });
    // Stored (level 0): the contents are already bounded to 8 MiB in total.
    return Buffer.from(zipSync(files, { level: 0 }));
}

export async function previewBpsWorkbook(buffer: Buffer): Promise<BpsPreview> {
    const checked = await extractCheckedArchive(buffer);
    let sheets: { sheet: string; data: readonly (readonly CellValue[])[] }[];
    try {
        // trim: false keeps cell text exactly as stored; IDs are trimmed by normalizeStudentId.
        sheets = await readExcelFile(checked, { trim: false });
    } catch {
        throw new PreviewError("Could not parse the mock workbook. Use an unencrypted .xlsx file.");
    }
    if (sheets.length !== 1 || sheets[0].sheet !== "Mock BPS")
        throw new PreviewError('Use one worksheet named "Mock BPS". Real BPS workbooks are not supported yet.');
    // data[i] is Excel row i + 1; blank rows in the middle are kept, trailing ones dropped.
    const data = sheets[0].data;
    // Backstop for cells without r= references, which the pre-scan cannot see.
    if (data.length > MAX_ROWS + 1 || data.some(row => row.length > MAX_COLUMNS))
        throw new PreviewError(LIMITS_MESSAGE);
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
        // Whitespace-only cells count as blank, so a row of spaces is skipped.
        if (index === 0 || cells.every(value => value === null || (typeof value === "string" && !value.trim()))) return;
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
            issue(row, "Supply at least one numeric metric from 0 to 100."); continue;
        }
        const matches = mockMatches.get(id) ?? 0;
        if (!matches) { issue(row, "No matching student in the mock directory.", true); continue; }
        if (matches > 1) { issue(row, "Ambiguous ID: multiple mock students match."); continue; }
        result.matchedRows++;
    }
    return result;
}
