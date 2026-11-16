// Generates synthetic test input only. Never reads source/student files.
import ExcelJS from "exceljs";
import { fileURLToPath } from "node:url";

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("Mock BPS");
sheet.addRow(["student_id", "period", "math_grade", "attendance_pct", "ignored_note"]);
for (let i = 1; i <= 18; i++) {
    const id = `MOCK-${String(i).padStart(4, "0")}`;
    const group = Math.floor((i - 1) / 6);
    sheet.addRow([id, "2025-fall", 70 + (i - 1) % 6, 85, "SYNTHETIC ONLY"]);
    sheet.addRow([id, "2026-spring", 70 + (i - 1) % 6 + [8, 6, 3][group], 85 + [6, 4, 2][group], "SYNTHETIC ONLY"]);
}
sheet.addRow(["MOCK-9999", "2025-fall", 70, 85, "unmatched"]);
sheet.addRow(["MOCK-0090", "2025-fall", 70, 85, "ambiguous"]);
sheet.addRow(["MOCK-0091", "2025-fall", 70, 85, "duplicate"]);
sheet.addRow(["MOCK-0091", "2025-fall", 75, 85, "duplicate"]);
sheet.addRow(["MOCK-0092", "2025-fall", 101, 85, "invalid"]);
sheet.columns.forEach(column => { column.width = 23; });
sheet.getRow(1).font = { bold: true };
sheet.views = [{ state: "frozen", ySplit: 1 }];
await workbook.xlsx.writeFile(fileURLToPath(new URL("../public/mock-bps.xlsx", import.meta.url)));
console.log("Created public/mock-bps.xlsx with 41 synthetic rows.");
