import type { StoredChart } from "@/lib/generateChart";

type SerializedDateRange = {
    from?: string | Date;
    to?: string | Date;
};

type SerializedFilterState = {
    selectedLocations?: unknown;
    selectedSchools?: unknown;
    timeframe?: unknown;
    fiscalYear?: unknown;
    customRange?: SerializedDateRange;
};

function formatDate(value: string | Date | undefined) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US");
}

function formatTimeframe(filters: SerializedFilterState) {
    if (
        filters.timeframe === "custom" &&
        filters.customRange?.from &&
        filters.customRange?.to
    ) {
        const from = formatDate(filters.customRange.from);
        const to = formatDate(filters.customRange.to);
        if (from && to) return `${from} - ${to}`;
    }

    if (filters.fiscalYear && typeof filters.fiscalYear === "number") {
        return `Fiscal year ${filters.fiscalYear}`;
    }

    switch (filters.timeframe) {
        case "thisMonth":
            return "This month";
        case "lastMonth":
            return "Last month";
        case "thisFY":
            return "This fiscal year";
        case "allTime":
        case undefined:
            return "All Time";
        default:
            return typeof filters.timeframe === "string"
                ? filters.timeframe
                : "All time";
    }
}

function formatList(value: unknown, emptyLabel: string) {
    if (!Array.isArray(value) || value.length === 0) return emptyLabel;
    const items = value.filter((item): item is string => typeof item === "string");
    return items.length ? items.join(", ") : emptyLabel;
}

export function formatChartFilterLines(filters: StoredChart["filters"]): string[] {
    if (!filters) {
        return ["Timeframe: All Time, Cities: All Cities, Schools: All Schools"];
    }

    try {
        const parsed = JSON.parse(filters) as SerializedFilterState;

        if (!parsed || typeof parsed !== "object") {
            return [`Applied filters: ${filters}`];
        }

        return [
            [
                `Timeframe: ${formatTimeframe(parsed)}`,
                `Cities: ${formatList(parsed.selectedLocations, "All Cities")}`,
                `Schools: ${formatList(parsed.selectedSchools, "All Schools")}`,
            ].join(", "),
        ];
    } catch {
        return [`Applied filters: ${filters}`];
    }
}
