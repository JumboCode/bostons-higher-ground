"use client";

import { type FilterSummary } from "@/app/reports/housing/housing-client";

export default function formatTitle(filters: FilterSummary, title: string) {
    const today = new Date();
    if (
        filters.timeframe === "custom" &&
        filters.customRange?.from &&
        filters.customRange?.to
    ) {
        return title + " Between " + `${filters.customRange.from.toLocaleDateString()} and ${filters.customRange.to.toLocaleDateString()}`;
    }
    else if (filters.fiscalYear) {
        return title + " in " + `${filters.fiscalYear}`;
    }
    else if (filters.timeframe == "allTime") {
        return title + " Over Time";
    }
    else if (filters.timeframe == "thisMonth") {
        return title + " in " + `${today.toLocaleString('en-US', {month: 'long'})}`;
    }
    else if (filters.timeframe == "lastMonth") {
        const last_month = new Date(today.setDate(0))
        return title + " in " + `${last_month.toLocaleString('en-US', {month: 'long'})}`;
    }
    else if (filters.timeframe == "thisFY") {
        if (today.getMonth() >= 9) {
            return title + " in " + `${today.getFullYear() + 1 }`;
        }
        else {
            return title + " in " + `${today.getFullYear()}`;
        }
    }
    else {
        return title;
    }
}

export function formattedFilters(filters: FilterSummary) {
    const parts: string[] = [];
    if (
        filters.timeframe === "custom" &&
        filters.customRange?.from &&
        filters.customRange?.to
    ) {
        parts.push(
            `${filters.customRange.from.toLocaleDateString()} - ${filters.customRange.to.toLocaleDateString()}`
        );
    } else {
        parts.push(filters.timeframe);
    }
    if (filters.selectedSchools.length) {
        parts.push(`${filters.selectedSchools.length} schools`);
    }
    if (filters.selectedLocations.length) {
        parts.push(`${filters.selectedLocations.length} locations`);
    }
    return parts.join(" • ");
}


