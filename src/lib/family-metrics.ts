type FamilyRecord = {
    familyId?: string;
    intakeDate: string | null;
    dateHoused: string | null;
    currentStatus?: string | null;
    sourceOfHousing?: string | null;
};

/** Per-family values that must come from a single source record. */
export type FamilyOutcome = {
    /** Days from intake to housing, both taken from the same record (the
     * earliest housing with a valid intake on or before it). Never mixes two
     * intake episodes, so it cannot be negative. null when no record has both. */
    daysToHouse: number | null;
    /** Source of housing from the family's housed record, even if the family's
     * latest record is a newer intake that is not housed. */
    housedSource: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

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
 * Values that only make sense within one record (wait time, housing source)
 * are computed per record and returned separately in FamilyOutcome.
 */
export function canonicalFamilies<T extends FamilyRecord>(
    records: readonly T[]
): (T & FamilyOutcome)[] {
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
    // Earliest housing first; undated housing last; ties deterministic.
    const byHousingDate = (a: T, b: T) =>
        (calendarDate(a.dateHoused) ?? "9999").localeCompare(
            calendarDate(b.dateHoused) ?? "9999"
        ) || tieKey(a).localeCompare(tieKey(b));

    return [...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([familyId, rows]) => {
            const latest = [...rows].sort(
                (a, b) =>
                    (calendarDate(b.intakeDate) ?? "").localeCompare(
                        calendarDate(a.intakeDate) ?? ""
                    ) || tieKey(a).localeCompare(tieKey(b))
            )[0];
            const waited = [...rows].sort(byHousingDate).find((row) => {
                const intake = calendarDate(row.intakeDate);
                const housed = calendarDate(row.dateHoused);
                return intake !== null && housed !== null && housed >= intake;
            });
            const housedRecord = [...rows]
                .sort(byHousingDate)
                .find((row) => row.currentStatus === "housed" && row.sourceOfHousing);
            return {
                ...latest,
                familyId,
                intakeDate: earliest(rows, "intakeDate"),
                dateHoused: earliest(rows, "dateHoused"),
                daysToHouse: waited
                    ? (Date.parse(`${waited.dateHoused}T00:00:00Z`) -
                          Date.parse(`${waited.intakeDate}T00:00:00Z`)) /
                      DAY_MS
                    : null,
                housedSource: housedRecord?.sourceOfHousing ?? null,
            };
        });
}
