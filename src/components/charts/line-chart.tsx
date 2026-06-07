"use client";

import {
    CartesianGrid,
    Label,
    Line,
    LineChart as RechartsLineChart,
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
import type { LineDatum } from "@/lib/chart-types";
import { cn } from "@/lib/utils";

export type { LineDatum } from "@/lib/chart-types";

export type LineChartProps = {
    data: LineDatum[];
    width?: number;
    height?: number;
    lineColor?: string;
    xLabel?: string;
    yLabel?: string;
    className?: string;
};

export function LineChart({
    data,
    width,
    height = 420,
    lineColor = chartTheme.primaryColor,
    xLabel,
    yLabel,
    className,
}: LineChartProps) {
    const config = {
        value: {
            label: yLabel || "Value",
            color: lineColor,
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
            <RechartsLineChart
                accessibilityLayer
                data={data}
                margin={{ top: 10, right: 10, bottom: xLabel ? 34 : 14, left: yLabel ? 8 : 0 }}
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
                >
                    {xLabel && (
                        <Label
                            value={xLabel}
                            position="insideBottom"
                            offset={-20}
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
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-value)", r: 4 }}
                    activeDot={{ r: 5 }}
                />
            </RechartsLineChart>
        </ChartContainer>
    );
}
