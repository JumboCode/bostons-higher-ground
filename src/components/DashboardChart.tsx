"use client";

import { useMemo } from "react";

import { ChartRenderer } from "@/components/charts";
import {
    buildChartModel,
    type ChartFilters,
    type ChartKey,
    type GeneratedChartModel,
    type HousingChartRecord,
} from "@/lib/chart-definitions";

function hasChartData(model: GeneratedChartModel) {
    switch (model.type) {
        case "vertical-bar":
        case "line":
            return model.data.some((datum) => datum.value > 0);
        case "horizontal-bar":
            return model.data.some((datum) =>
                datum.series.some((series) => series.value > 0)
            );
        case "donut":
            return model.data.some((datum) => datum.value > 0);
    }
}

export default function DashboardChart({
    chartKey,
    records,
    filters,
}: {
    chartKey: ChartKey;
    records: HousingChartRecord[];
    filters?: Partial<ChartFilters>;
}) {
    const model = useMemo(
        () => buildChartModel(chartKey, records, filters),
        [chartKey, records, filters]
    );
    const hasData = hasChartData(model);

    return (
        <div className="relative">
            <ChartRenderer model={model} />
            {!hasData && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 pl-8">
                    <p className="text-lg font-semibold text-gray-600">
                        {model.emptyMessage}
                    </p>
                </div>
            )}
        </div>
    );
}
