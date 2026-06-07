"use client";

import { useMemo } from "react";

import { ChartRenderer } from "@/components/charts";
import {
    buildChartModel,
    type ChartKey,
    type HousingChartRecord,
} from "@/lib/chart-definitions";

export default function DashboardChart({
    chartKey,
    records,
}: {
    chartKey: ChartKey;
    records: HousingChartRecord[];
}) {
    const model = useMemo(
        () => buildChartModel(chartKey, records),
        [chartKey, records]
    );

    return (
        <div className="relative">
            <ChartRenderer model={model} />
            {records.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 pl-8">
                    <p className="text-lg font-semibold text-gray-600">
                        {model.emptyMessage}
                    </p>
                </div>
            )}
        </div>
    );
}
