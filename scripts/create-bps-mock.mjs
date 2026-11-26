// Generates synthetic test input only. Never reads source/student files.
import writeExcelFile from "write-excel-file/node";
import { fileURLToPath } from "node:url";

const rows = [["student_id", "period", "math_grade", "attendance_pct", "ignored_note"]];
for (let i = 1; i <= 18; i++) {
    const id = `MOCK-${String(i).padStart(4, "0")}`;
    const group = Math.floor((i - 1) / 6);
    rows.push([id, "2025-fall", 70 + (i - 1) % 6, 85, "SYNTHETIC ONLY"]);
    rows.push([id, "2026-spring", 70 + (i - 1) % 6 + [8, 6, 3][group], 85 + [6, 4, 2][group], "SYNTHETIC ONLY"]);
}
rows.push(["MOCK-9999", "2025-fall", 70, 85, "unmatched"]);
rows.push(["MOCK-0090", "2025-fall", 70, 85, "ambiguous"]);
rows.push(["MOCK-0091", "2025-fall", 70, 85, "duplicate"]);
rows.push(["MOCK-0091", "2025-fall", 75, 85, "duplicate"]);
rows.push(["MOCK-0092", "2025-fall", 101, 85, "invalid"]);
rows[0] = rows[0].map(value => ({ value, fontWeight: "bold" }));

await writeExcelFile(rows, {
    sheet: "Mock BPS",
    columns: rows[0].map(() => ({ width: 23 })),
    stickyRowsCount: 1,
}).toFile(fileURLToPath(new URL("../public/mock-bps.xlsx", import.meta.url)));
console.log(`Created public/mock-bps.xlsx with ${rows.length - 1} synthetic rows.`);
