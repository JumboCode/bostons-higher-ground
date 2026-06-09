"use client";

import type { GeneratedChartModel } from "@/lib/chart-definitions";

import { DonutChart } from "./donut-chart";
import { HorizontalBarChart } from "./horizontal-bar-chart";
import { LineChart } from "./line-chart";
import { VerticalBarChart } from "./vertical-bar-chart";

export function ChartRenderer({
    model,
    width,
    height,
    className,
}: {
    model: GeneratedChartModel;
    width?: number;
    height?: number;
    className?: string;
}) {
    switch (model.type) {
        case "vertical-bar":
            return (
                <VerticalBarChart
                    data={model.data}
                    xLabel={model.xLabel}
                    yLabel={model.yLabel}
                    width={width}
                    height={height}
                    className={className}
                />
            );
        case "line":
            return (
                <LineChart
                    data={model.data}
                    xLabel={model.xLabel}
                    yLabel={model.yLabel}
                    width={width}
                    height={height}
                    className={className}
                />
            );
        case "horizontal-bar":
            return (
                <HorizontalBarChart
                    data={model.data}
                    xLabel={model.xLabel}
                    yLabel={model.yLabel}
                    width={width}
                    height={height}
                    className={className}
                />
            );
        case "donut":
            return (
                <DonutChart
                    data={model.data}
                    centerLabel={model.centerLabel}
                    width={width}
                    height={height}
                    className={className}
                />
            );
    }
}
