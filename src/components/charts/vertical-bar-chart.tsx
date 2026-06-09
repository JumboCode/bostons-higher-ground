"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Label,
    XAxis,
    YAxis,
} from "recharts";

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { chartTheme } from "@/lib/chart-theme";
import type { VerticalBarDatum } from "@/lib/chart-types";
import { cn } from "@/lib/utils";

export type { VerticalBarDatum } from "@/lib/chart-types";

export type VerticalBarChartProps = {
    data: VerticalBarDatum[];
    width?: number;
    height?: number;
    barColor?: string;
    xLabel?: string;
    yLabel?: string;
    className?: string;
};

function truncateLabel(label: string) {
    return label.length > 16 ? `${label.slice(0, 15)}...` : label;
}

export function VerticalBarChart({
    data,
    width,
    height = 420,
    barColor = chartTheme.primaryColor,
    xLabel,
    yLabel,
    className,
}: VerticalBarChartProps) {
    const config = {
        value: {
            label: yLabel || "Value",
            color: barColor,
        },
    } satisfies ChartConfig;

    return (
        <ChartContainer
            config={config}
            className={cn("w-full max-w-[900px]", className)}
            style={{
                height,
                maxWidth: width,
            }}
        >
            <BarChart
                accessibilityLayer
                data={data}
                margin={{ top: 10, right: 10, bottom: xLabel ? 48 : 20, left: yLabel ? 8 : 0 }}
            >
                <CartesianGrid
                    stroke={chartTheme.gridColor}
                    strokeDasharray="4 4"
                    vertical
                />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: chartTheme.axisColor }}
                    tickMargin={8}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={64}
                    tickFormatter={truncateLabel}
                >
                    {xLabel && (
                        <Label
                            value={xLabel}
                            position="insideBottom"
                            offset={-36}
                            fill={chartTheme.labelColor}
                            fontSize={chartTheme.labelFontSize}
                        />
                    )}
                </XAxis>
                <YAxis
                    tickLine={false}
                    axisLine={{ stroke: chartTheme.axisColor }}
                    tickMargin={8}
                    allowDecimals={false}
                >
                    {yLabel && (
                        <Label
                            value={yLabel}
                            angle={-90}
                            position="insideLeft"
                            fill={chartTheme.labelColor}
                            fontSize={chartTheme.labelFontSize}
                            style={{ textAnchor: "middle" }}
                        />
                    )}
                </YAxis>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[chartTheme.barRadius, chartTheme.barRadius, 0, 0]}
                />
            </BarChart>
        </ChartContainer>
    );
}
