"use client";

import { Cell, Label, Pie, PieChart } from "recharts";

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { CHART_COLORS } from "@/lib/chart-theme";
import type { DonutDatum } from "@/lib/chart-types";
import { cn } from "@/lib/utils";

export type { DonutDatum } from "@/lib/chart-types";

export type DonutChartProps = {
    data: DonutDatum[];
    width?: number;
    height?: number;
    colors?: string[];
    centerLabel?: string;
    className?: string;
};

type PieLabelProps = {
    percent?: number;
};

type PieCenterViewBox = {
    cx?: number;
    cy?: number;
};

function toSliceKey(label: string, index: number) {
    return `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "slice"}-${index}`;
}

export function DonutChart({
    data,
    width,
    height = 420,
    colors = CHART_COLORS,
    centerLabel = "Total",
    className,
}: DonutChartProps) {
    const chartData = data.map((datum, index) => ({
        ...datum,
        chartKey: toSliceKey(datum.label, index),
    }));
    const total = chartData.reduce((sum, datum) => sum + datum.value, 0);
    const config = chartData.reduce<ChartConfig>((acc, datum, index) => {
        acc[datum.chartKey] = {
            label: datum.label,
            color: datum.color ?? colors[index % colors.length],
        };
        return acc;
    }, {});

    return (
        <div className={cn("w-full max-w-[900px]", className)} style={{ maxWidth: width }}>
            <ChartContainer
                config={config}
                className="mx-auto w-full"
                style={{ height }}
            >
                <PieChart accessibilityLayer>
                    <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="chartKey" />} />
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="label"
                        innerRadius="58%"
                        outerRadius="82%"
                        strokeWidth={2}
                        labelLine={false}
                        label={({ percent }: PieLabelProps) => {
                            const pct = (percent ?? 0) * 100;
                            return pct >= 5 ? `${Math.round(pct)}%` : "";
                        }}
                    >
                        {chartData.map((datum, index) => (
                            <Cell
                                key={datum.chartKey}
                                fill={datum.color ?? colors[index % colors.length]}
                            />
                        ))}
                        <Label
                            content={({ viewBox }) => {
                                const box = viewBox as PieCenterViewBox | undefined;
                                if (!box?.cx || !box.cy) return null;

                                return (
                                    <text
                                        x={box.cx}
                                        y={box.cy}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        <tspan
                                            x={box.cx}
                                            y={box.cy - 8}
                                            className="fill-foreground text-3xl font-bold"
                                        >
                                            {total}
                                        </tspan>
                                        <tspan
                                            x={box.cx}
                                            y={box.cy + 18}
                                            className="fill-muted-foreground text-sm"
                                        >
                                            {centerLabel}
                                        </tspan>
                                    </text>
                                );
                            }}
                        />
                    </Pie>
                </PieChart>
            </ChartContainer>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4">
                {data.map((datum, index) => (
                    <div
                        key={datum.label}
                        className="flex items-center gap-2 text-xs text-[#4A5565]"
                    >
                        <span
                            className="h-3.5 w-3.5 rounded-[3px]"
                            style={{ backgroundColor: datum.color ?? colors[index % colors.length] }}
                        />
                        <span>{datum.label.length > 18 ? `${datum.label.slice(0, 17)}...` : datum.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
