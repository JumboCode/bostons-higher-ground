"use client";

import { type FilterSummary } from "@/app/reports/housing/housing-client";

function formatMonthYear(date: Date) {
    return date.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
    });
}

function getFiscalYear(filters: FilterSummary) {
    if (filters.fiscalYear) return filters.fiscalYear;

    const today = new Date();
    return today.getMonth() >= 6 ? today.getFullYear() + 1 : today.getFullYear();
}

function getDateFilterLabel(filters: FilterSummary) {
    const today = new Date();

    if (
        filters.timeframe === "custom" &&
        filters.customRange?.from &&
        filters.customRange?.to
    ) {
        return `${formatMonthYear(filters.customRange.from)} - ${formatMonthYear(filters.customRange.to)}`;
    }

    if (filters.timeframe === "thisFY" || filters.fiscalYear) {
        return `FY${getFiscalYear(filters)}`;
    }

    if (filters.timeframe === "thisMonth") {
        return formatMonthYear(today);
    }

    if (filters.timeframe === "lastMonth") {
        return formatMonthYear(new Date(today.getFullYear(), today.getMonth() - 1, 1));
    }

    return null;
}

export default function formatTitle(filters: FilterSummary, title: string) {
    const dateLabel = getDateFilterLabel(filters);
    return dateLabel ? `${title}: ${dateLabel}` : title;
}

export function formattedFilters(filters: FilterSummary) {
    const parts: string[] = [];
    if (filters.selectedSchools.length) {
        parts.push(`${filters.selectedSchools.length} schools`);
    }
    if (filters.selectedLocations.length) {
        parts.push(`${filters.selectedLocations.length} locations`);
    }
    return parts.join(" • ");
}
