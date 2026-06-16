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
    computeHorizontalBarChartPdfHeight,
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

const PDF_CHART_WIDTH = 520;

export type PdfChart = {
    node: React.ReactElement | null;
    height: number;
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

function computePdfChartHeight(model: GeneratedChartModel): number {
    switch (model.type) {
        case "horizontal-bar":
            return computeHorizontalBarChartPdfHeight(
                model.data,
                model.xLabel,
                model.yLabel
            );
        case "vertical-bar":
        case "line":
            return 260;
        case "donut":
            return 420;
    }
}

function buildPdfChartNode(
    model: GeneratedChartModel,
    height: number
): React.ReactElement | null {
    switch (model.type) {
        case "vertical-bar":
            return React.createElement(VerticalBarChartPdf, {
                width: PDF_CHART_WIDTH,
                height,
                data: model.data,
                xLabel: model.xLabel,
                yLabel: model.yLabel,
            });
        case "line":
            return React.createElement(LineChartPdf, {
                width: PDF_CHART_WIDTH,
                height,
                data: model.data,
                xLabel: model.xLabel,
                yLabel: model.yLabel,
            });
        case "horizontal-bar":
            return React.createElement(HorizontalBarChartPdf, {
                width: PDF_CHART_WIDTH,
                height,
                data: model.data,
                xLabel: model.xLabel,
                yLabel: model.yLabel,
            });
        case "donut":
            return React.createElement(DonutChartPdf, {
                width: PDF_CHART_WIDTH,
                height,
                data: model.data,
                centerLabel: model.centerLabel,
            });
    }
}

export async function generatePdfChart(stored: StoredChart): Promise<PdfChart> {
    const model = await generateChartModel(stored);
    if (!model) {
        return { node: null, height: 260 };
    }

    const height = computePdfChartHeight(model);
    return { node: buildPdfChartNode(model, height), height };
}

export async function generateChart(stored: StoredChart, isForPdf = false) {
    if (isForPdf) {
        const pdfChart = await generatePdfChart(stored);
        return pdfChart.node;
    }

    const model = await generateChartModel(stored);
    if (!model) return null;

    return React.createElement(ChartRenderer, { model });
}
