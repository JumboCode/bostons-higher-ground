type FamilyRecord = {
    familyId?: string;
    intakeDate: string | null;
    dateHoused: string | null;
};

function calendarDate(value: string | null): string | null {
    if (
        !value ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value.startsWith("0000-")
    )
        return null;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
        ? value
        : null;
}

/** One record per trimmed Family ID, before filtering. Raw source rows stay intact.
 * Earliest intake/housing represent first enrollment/outcome. Categories come
 * from the latest intake; ties use field values, not sync-generated serial IDs.
 */
export function canonicalFamilies<T extends FamilyRecord>(
    records: readonly T[]
): T[] {
    const groups = new Map<string, T[]>();
    for (const record of records) {
        const family = record.familyId?.trim();
        if (!family) continue;
        const group = groups.get(family) ?? [];
        group.push(record);
        groups.set(family, group);
    }
    const earliest = (rows: T[], field: "intakeDate" | "dateHoused") =>
        rows
            .map((row) => calendarDate(row[field]))
            .filter((value): value is string => value !== null)
            .sort()[0] ?? null;
    const tieKey = (row: T) =>
        JSON.stringify(
            Object.entries(row)
                .filter(([key]) => key !== "id")
                .sort(([a], [b]) => a.localeCompare(b))
        );
    return [...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([familyId, rows]) => {
            const latest = [...rows].sort(
                (a, b) =>
                    (calendarDate(b.intakeDate) ?? "").localeCompare(
                        calendarDate(a.intakeDate) ?? ""
                    ) || tieKey(a).localeCompare(tieKey(b))
            )[0];
            return {
                ...latest,
                familyId,
                intakeDate: earliest(rows, "intakeDate"),
                dateHoused: earliest(rows, "dateHoused"),
            };
        });
}
