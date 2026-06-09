import React from "react";

import { getAllData } from "@/lib/getAllData";
import { getEducationData } from "@/lib/getEducationData";
import {
    buildChartModel,
    chartRegistry,
    isChartKey,
    type ChartFilters,
    type ChartKey,
    type ChartDataSource,
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

function parseFilters(filters: string | null): Partial<ChartFilters> {
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
        } as Partial<ChartFilters>;
    } catch {
        return {};
    }
}

export async function generateChartModel(
    stored: StoredChart
): Promise<GeneratedChartModel | null> {
    if (!isChartKey(stored.chartType)) return null;

    const chartKey = stored.chartType as ChartKey;
    const [housing, education] = await Promise.all([
        getAllData() as Promise<HousingChartRecord[]>,
        getEducationData(),
    ]);
    const data: ChartDataSource = {
        housing,
        grades: education.grades,
        students: education.students,
        attendance: education.attendance,
    };
    const filters = parseFilters(stored.filters);
    return buildChartModel(chartKey, data, filters);
}

export async function generateChart(stored: StoredChart, isForPdf = false) {
    const model = await generateChartModel(stored);
    if (!model) return null;

    const pdfChartSize = { width: 520, height: 260 };

    if (isForPdf) {
        switch (model.type) {
            case "vertical-bar":
                return React.createElement(VerticalBarChartPdf, {
                    ...pdfChartSize,
                    data: model.data,
                    xLabel: model.xLabel,
                    yLabel: model.yLabel,
                });
            case "line":
                return React.createElement(LineChartPdf, {
                    ...pdfChartSize,
                    data: model.data,
                    xLabel: model.xLabel,
                    yLabel: model.yLabel,
                });
            case "horizontal-bar":
                return React.createElement(HorizontalBarChartPdf, {
                    ...pdfChartSize,
                    data: model.data,
                    xLabel: model.xLabel,
                    yLabel: model.yLabel,
                });
            case "donut":
                return React.createElement(DonutChartPdf, {
                    width: pdfChartSize.width,
                    data: model.data,
                    centerLabel: model.centerLabel,
                });
        }
    }

    return React.createElement(ChartRenderer, { model });
}
