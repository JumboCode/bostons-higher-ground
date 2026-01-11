import { type DateRange } from "react-day-picker";
import useFilters, { type FilterState, type Timeframe } from "./filterStore";

export type FilterableRecord = {
    intakeDate: string | null;
    dateHoused: string | null;
    city?: string | null;
    school?: string | null;
};

function inRange(date: Date, range: { start: Date; end: Date }) {
    return date >= range.start && date <= range.end;
}

function resolveDateRange(
    timeframe: Timeframe,
    fiscalYear?: number,
    customRange?: DateRange
) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
    );
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    switch (timeframe) {
        case "thisMonth":
            return { start: startOfMonth, end: today };
        case "lastMonth":
            return { start: startOfLastMonth, end: endOfLastMonth };
        case "thisFY": {
            const fy = fiscalYear ?? today.getFullYear();
            // Fiscal year assumed Jul 1 (prior year) - Jun 30 (fy)
            const start = new Date(fy - 1, 6, 1);
            const end = new Date(fy, 5, 30, 23, 59, 59, 999);
            return { start, end };
        }
        case "custom":
            if (customRange?.from && customRange?.to) {
                return { start: customRange.from, end: customRange.to };
            }
            return undefined;
        case "allTime":
        default:
            return undefined;
    }
}

export function filterRecords<T extends FilterableRecord>(
    records: T[],
    filters: Pick<
        FilterState,
        | "selectedLocations"
        | "selectedSchools"
        | "timeframe"
        | "fiscalYear"
        | "customRange"
    >
): T[] {
    const range = resolveDateRange(
        filters.timeframe,
        filters.fiscalYear,
        filters.customRange
    );

    return records.filter((record) => {
        if (
            filters.selectedLocations.length > 0 &&
            record.city &&
            !filters.selectedLocations.includes(record.city)
        ) {
            return false;
        }

        if (
            filters.selectedSchools.length > 0 &&
            record.school &&
            !filters.selectedSchools.includes(record.school)
        ) {
            return false;
        }

        if (range) {
            const dateStr = record.intakeDate ?? record.dateHoused;
            if (!dateStr) return false;
            const date = new Date(dateStr);
            if (!inRange(date, range)) return false;
        }

        return true;
    });
}

export { useFilters };
