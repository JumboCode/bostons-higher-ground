export type BaselineValue = { startingValue: number; asOfDate: string };
export const FAMILIES_HOUSED = "families_housed";
export function bostonToday(now = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);
}
function validDate(value: unknown): value is string {
    if (
        typeof value !== "string" ||
        value.startsWith("0000-") ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    )
        return false;
    const date = new Date(`${value}T00:00:00Z`);
    return (
        Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}
export function validateBaseline(
    input: unknown,
    today = bostonToday()
): BaselineValue {
    if (!input || typeof input !== "object")
        throw new Error("Enter a starting value and as-of date.");
    const { startingValue, asOfDate } = input as Partial<BaselineValue>;
    if (
        typeof startingValue !== "number" ||
        !Number.isInteger(startingValue) ||
        startingValue < 0 ||
        startingValue > 2147483647
    ) {
        throw new Error(
            "Starting value must be a whole number between 0 and 2,147,483,647."
        );
    }
    if (!validDate(asOfDate) || asOfDate > today)
        throw new Error("Choose a valid as-of date no later than today.");
    return { startingValue, asOfDate };
}
export function calculateHousedTotal(
    records: { familyId: string; dateHoused: string | null }[],
    baseline: BaselineValue,
    today = bostonToday()
) {
    const firstHoused = new Map<string, string>();
    for (const record of records) {
        const family = record.familyId.trim();
        if (
            !family ||
            !validDate(record.dateHoused) ||
            record.dateHoused > today
        )
            continue;
        const previous = firstHoused.get(family);
        if (!previous || record.dateHoused < previous)
            firstHoused.set(family, record.dateHoused);
    }
    const additions = [...firstHoused.values()].filter(
        (date) => date > baseline.asOfDate
    ).length;
    return { additions, total: baseline.startingValue + additions };
}

// Default until an admin saves a baseline.
export function provisionalBaseline(
    records: { intakeDate: string | null }[],
    today = bostonToday()
): BaselineValue | null {
    const dates = records
        .map((record) => record.intakeDate)
        .filter((date): date is string => validDate(date) && date <= today)
        .sort();
    if (!dates.length) return null;
    const cutoff = new Date(`${dates[0]}T00:00:00Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - 1);
    const asOfDate = cutoff.toISOString().slice(0, 10);
    return validDate(asOfDate) ? { startingValue: 0, asOfDate } : null;
}
