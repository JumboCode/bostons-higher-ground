import React from "react";

import { filterRecords } from "@/lib/applyFilters";
import { getAllData } from "@/lib/getAllData";
import type { FilterState } from "@/lib/filterStore";
import {
    buildChartModel,
    chartRegistry,
    isChartKey,
    type ChartKey,
    type GeneratedChartModel,
    type HousingChartRecord,
} from "@/lib/chart-definitions";
import {
    ChartRenderer,
    DonutChartPdf,
    HorizontalBarChartPdf,
    LineChartPdf,
    VerticalBarChartPdf,
} from "@/components/charts";

export { chartRegistry, type GeneratedChartModel };

// Represents the shape stored in in_progress_reports.charts
export type StoredChart = {
    title: string;
    chartType: string;
    filters: string | null;
};

function parseFilters(filters: string | null): Partial<FilterState> {
    if (!filters) return {};

    try {
        const parsed = JSON.parse(filters) as Record<string, unknown>;
        const selectedLocations = Array.isArray(parsed.selectedLocations)
            ? (parsed.selectedLocations as string[])
            : [];
        const selectedSchools = Array.isArray(parsed.selectedSchools)
            ? (parsed.selectedSchools as string[])
            : [];
        const timeframe =
            typeof parsed.timeframe === "string" ? parsed.timeframe : "allTime";
        const fiscalYear =
            typeof parsed.fiscalYear === "number"
                ? parsed.fiscalYear
                : undefined;
        const customRange = parsed.customRange as
            | { from?: string; to?: string }
            | undefined;

        return {
            selectedLocations,
            selectedSchools,
            timeframe,
            fiscalYear,
            customRange:
                customRange?.from && customRange?.to
                    ? {
                          from: new Date(customRange.from),
                          to: new Date(customRange.to),
                      }
                    : undefined,
        } as Partial<FilterState>;
    } catch {
        return {};
    }
}

function getFilteredRecords(
    data: HousingChartRecord[],
    stored: StoredChart
): HousingChartRecord[] {
    const filters = parseFilters(stored.filters);
    return filterRecords(data, {
        selectedLocations: filters.selectedLocations ?? [],
        selectedSchools: filters.selectedSchools ?? [],
        timeframe: (filters.timeframe as FilterState["timeframe"]) ?? "allTime",
        fiscalYear: filters.fiscalYear,
        customRange: filters.customRange,
    }) as HousingChartRecord[];
}

export async function generateChartModel(
    stored: StoredChart
): Promise<GeneratedChartModel | null> {
    if (!isChartKey(stored.chartType)) return null;

    const chartKey = stored.chartType as ChartKey;
    const data = (await getAllData()) as HousingChartRecord[];
    const filteredRecords = getFilteredRecords(data, stored);
    return buildChartModel(chartKey, filteredRecords);
}

export async function generateChart(stored: StoredChart, isForPdf = false) {
    const model = await generateChartModel(stored);
    if (!model) return null;

    if (isForPdf) {
        switch (model.type) {
            case "vertical-bar":
                return React.createElement(VerticalBarChartPdf, {
                    data: model.data,
                    xLabel: model.xLabel,
                    yLabel: model.yLabel,
                });
            case "line":
                return React.createElement(LineChartPdf, {
                    data: model.data,
                    xLabel: model.xLabel,
                    yLabel: model.yLabel,
                });
            case "horizontal-bar":
                return React.createElement(HorizontalBarChartPdf, {
                    data: model.data,
                    xLabel: model.xLabel,
                    yLabel: model.yLabel,
                });
            case "donut":
                return React.createElement(DonutChartPdf, {
                    data: model.data,
                    centerLabel: model.centerLabel,
                });
        }
    }

    return React.createElement(ChartRenderer, { model });
}
