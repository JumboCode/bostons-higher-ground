import type { StoredChart } from "@/lib/generateChart";

type SerializedFilterState = {
    selectedLocations?: unknown;
    selectedSchools?: unknown;
};

function formatList(value: unknown, emptyLabel: string) {
    if (!Array.isArray(value) || value.length === 0) return emptyLabel;
    const items = value.filter((item): item is string => typeof item === "string");
    return items.length ? items.join(", ") : emptyLabel;
}

export function formatChartFilterLines(filters: StoredChart["filters"]): string[] {
    if (!filters) {
        return ["Cities: All Cities", "Schools: All Schools"];
    }

    try {
        const parsed = JSON.parse(filters) as SerializedFilterState;

        if (!parsed || typeof parsed !== "object") {
            return [`Applied filters: ${filters}`];
        }

        return [
            `Cities: ${formatList(parsed.selectedLocations, "All Cities")}`,
            `Schools: ${formatList(parsed.selectedSchools, "All Schools")}`,
        ];
    } catch {
        return [`Applied filters: ${filters}`];
    }
}
