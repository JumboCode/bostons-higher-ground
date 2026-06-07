"use client";

import { useMemo } from "react";
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
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { CHART_COLORS, chartTheme } from "@/lib/chart-theme";
import type { HorizontalBarDatum } from "@/lib/chart-types";
import { cn } from "@/lib/utils";

export type { HorizontalBarDatum, HorizontalSeriesDatum } from "@/lib/chart-types";

export type HorizontalBarChartProps = {
    data: HorizontalBarDatum[];
    width?: number;
    height?: number;
    colors?: string[];
    xLabel?: string;
    yLabel?: string;
    className?: string;
};

type RechartsHorizontalDatum = {
    category: string;
} & Record<string, string | number>;

function toSeriesKey(label: string, index: number) {
    return `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "series"}-${index}`;
}

function truncateLabel(label: string) {
    return label.length > 22 ? `${label.slice(0, 21)}...` : label;
}

export function HorizontalBarChart({
    data,
    width,
    height,
    colors = CHART_COLORS,
    xLabel,
    yLabel,
    className,
}: HorizontalBarChartProps) {
    const { chartData, seriesEntries, config } = useMemo(() => {
        const labels = Array.from(
            new Set(data.flatMap((datum) => datum.series.map((series) => series.label)))
        );
        const entries = labels.map((label, index) => ({
            key: toSeriesKey(label, index),
            label,
        }));

        const flattenedData = data.map((datum) => {
            const row: RechartsHorizontalDatum = { category: datum.category };
            datum.series.forEach((series) => {
                const entry = entries.find((item) => item.label === series.label);
                if (entry) row[entry.key] = series.value;
            });
            return row;
        });

        const chartConfig = entries.reduce<ChartConfig>((acc, entry, index) => {
            acc[entry.key] = {
                label: entry.label,
                color:
                    data
                        .flatMap((datum) => datum.series)
                        .find((series) => series.label === entry.label)?.color ||
                    colors[index % colors.length],
            };
            return acc;
        }, {});

        return {
            chartData: flattenedData,
            seriesEntries: entries,
            config: chartConfig,
        };
    }, [colors, data]);

    const computedHeight =
        height ?? Math.max(300, data.length * 38 + 118 + (seriesEntries.length > 1 ? 24 : 0));
    const yAxisWidth = Math.min(
        yLabel ? 210 : 180,
        Math.max(yLabel ? 132 : 104, Math.max(...data.map((datum) => datum.category.length), 0) * 6)
    );

    return (
        <ChartContainer
            config={config}
            className={cn("h-auto w-full max-w-[900px]", className)}
            style={{
                height: computedHeight,
                maxWidth: width,
            }}
        >
            <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, bottom: xLabel ? 56 : 30, left: yLabel ? 24 : 0 }}
                barGap={3}
            >
                <CartesianGrid
                    stroke={chartTheme.gridColor}
                    strokeDasharray="4 4"
                    horizontal={false}
                />
                <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={{ stroke: chartTheme.axisColor }}
                    tickMargin={8}
                    allowDecimals={false}
                >
                    {xLabel && (
                        <Label
                            value={xLabel}
                            position="insideBottom"
                            offset={-34}
                            fill={chartTheme.labelColor}
                            fontSize={chartTheme.labelFontSize}
                        />
                    )}
                </XAxis>
                <YAxis
                    type="category"
                    dataKey="category"
                    width={yAxisWidth}
                    tickLine={false}
                    axisLine={{ stroke: chartTheme.axisColor }}
                    tickMargin={8}
                    tickFormatter={truncateLabel}
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
                {seriesEntries.map((entry) => (
                    <Bar
                        key={entry.key}
                        dataKey={entry.key}
                        fill={`var(--color-${entry.key})`}
                        radius={[0, chartTheme.barRadius, chartTheme.barRadius, 0]}
                    />
                ))}
                {seriesEntries.length > 1 && (
                    <ChartLegend
                        verticalAlign="bottom"
                        content={<ChartLegendContent />}
                    />
                )}
            </BarChart>
        </ChartContainer>
    );
}
