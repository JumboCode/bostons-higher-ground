import { Svg, Rect, Line, Text, G } from "@react-pdf/renderer";
import * as d3 from "d3";
import type { HorizontalBarDatum } from "./horizontal-bar-chart";
import { CHART_COLORS, chartTheme } from "@/lib/chart-theme";

export type HorizontalBarChartPdfProps = {
    data: HorizontalBarDatum[];
    width?: number;
    height?: number;
    colors?: string[];
    xLabel?: string;
    yLabel?: string;
};

const DEFAULT_COLORS = CHART_COLORS;
const MAX_PDF_HEIGHT = 520;

function getSeriesKeys(data: HorizontalBarDatum[]) {
    return Array.from(
        new Set(data.flatMap((d) => d.series.map((s) => s.label)))
    );
}

function getLegendSpace(seriesKeys: string[]) {
    return seriesKeys.length > 1 ? 60 : 0;
}

function getMargins(
    xLabel: string | undefined,
    yLabel: string | undefined,
    legendSpace: number
) {
    return {
        top: 20,
        right: 40,
        bottom: (xLabel ? 70 : 50) + legendSpace,
        left: yLabel ? 120 : 100,
    };
}

function truncateLabel(label: string, maxChars: number): string {
    return label.length > maxChars ? label.slice(0, maxChars - 1) + "…" : label;
}

export function computeHorizontalBarChartPdfHeight(
    data: HorizontalBarDatum[],
    xLabel?: string,
    yLabel?: string
): number {
    if (!data.length) return 260;

    const seriesKeys = getSeriesKeys(data);
    const legendSpace = getLegendSpace(seriesKeys);
    const margins = getMargins(xLabel, yLabel, legendSpace);
    const minBandHeight = data.length > 12 ? 18 : 24;
    const innerHeight = Math.ceil((data.length * minBandHeight) / 0.65);
    const naturalHeight = innerHeight + margins.top + margins.bottom;

    return Math.max(260, Math.min(naturalHeight, MAX_PDF_HEIGHT));
}

export function HorizontalBarChartPdf({
    data,
    width = 420,
    height,
    colors = DEFAULT_COLORS,
    xLabel,
    yLabel,
}: HorizontalBarChartPdfProps) {
    if (!data.length) return null;

    const seriesKeys = getSeriesKeys(data);

    const seriesCount = Math.max(seriesKeys.length, 1);
    const legendSpace = getLegendSpace(seriesKeys);

    const computedHeight =
        height ?? computeHorizontalBarChartPdfHeight(data, xLabel, yLabel);

    const margin = getMargins(xLabel, yLabel, legendSpace);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = computedHeight - margin.top - margin.bottom;

    const y = d3
        .scaleBand()
        .domain(data.map((d) => d.category))
        .range([0, innerHeight])
        .padding(0.35);

    const maxValue =
        d3.max(data, (d) => d3.max(d.series, (s) => s.value) ?? 0) ?? 0;

    const x = d3
        .scaleLinear()
        .domain([0, Math.max(maxValue, 1)])
        .nice()
        .range([0, innerWidth]);

    const xTicks = x.ticks(5);

    const barHeight =
        (y.bandwidth() || innerHeight / data.length) / seriesCount;

    // max chars for y labels based on left margin space, ~5.5px per char at fontSize 10
    const maxLabelChars = Math.floor((margin.left - 15) / 5.5);

    const bandHeight = y.bandwidth();
    const labelInterval =
        bandHeight < 18 ? Math.max(1, Math.ceil(18 / bandHeight)) : 1;

    return (
        <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${computedHeight}`}
        >
            <G transform={`translate(${margin.left}, ${margin.top})`}>
                {/* Vertical Grid Lines */}
                {xTicks.map((tick) => (
                    <Line
                        key={`grid-${tick}`}
                        x1={x(tick)}
                        x2={x(tick)}
                        y1={0}
                        y2={innerHeight}
                        stroke={chartTheme.gridColor}
                        strokeDasharray="4 4"
                        strokeWidth={1}
                    />
                ))}

                {/* Bars */}
                {seriesKeys.map((seriesKey, seriesIndex) =>
                    data.map((d, i) => {
                        const value =
                            d.series.find((s) => s.label === seriesKey)
                                ?.value ?? 0;
                        const fillColor =
                            d.series.find((s) => s.label === seriesKey)
                                ?.color ?? colors[seriesIndex % colors.length];

                        return (
                            <Rect
                                key={`${seriesKey}-${i}`}
                                x={0}
                                y={
                                    (y(d.category) ?? 0) +
                                    seriesIndex * barHeight
                                }
                                width={x(value)}
                                height={barHeight - 3}
                                fill={fillColor}
                                rx={3}
                            />
                        );
                    })
                )}

                {/* Y Axis Line */}
                <Line
                    x1={0}
                    x2={0}
                    y1={0}
                    y2={innerHeight}
                    stroke={chartTheme.axisColor}
                    strokeWidth={1}
                />

                {/* X Axis Line */}
                <Line
                    x1={0}
                    x2={innerWidth}
                    y1={innerHeight}
                    y2={innerHeight}
                    stroke={chartTheme.axisColor}
                    strokeWidth={1}
                />

                {/* Category Labels (Y Axis) */}
                {data.map((d, i) =>
                    i % labelInterval === 0 ? (
                        <Text
                            key={`ylabel-${d.category}`}
                            x={-10}
                            y={(y(d.category) ?? 0) + y.bandwidth() / 2}
                            style={{ fontSize: 12 }}
                            textAnchor="end"
                        >
                            {truncateLabel(d.category, maxLabelChars)}
                        </Text>
                    ) : null
                )}

                {/* X Tick Labels */}
                {xTicks.map((tick) => (
                    <Text
                        key={`xtick-${tick}`}
                        x={x(tick)}
                        y={innerHeight + 15}
                        style={{ fontSize: 12 }}
                        textAnchor="middle"
                    >
                        {tick}
                    </Text>
                ))}

                {/* X Axis Label */}
                {xLabel && (
                    <Text
                        x={innerWidth / 2}
                        y={innerHeight + 40}
                        style={{ fontSize: 14 }}
                        textAnchor="middle"
                    >
                        {xLabel}
                    </Text>
                )}

                {/* Y Axis Label */}
                {yLabel && (
                    <G
                        transform={`translate(${-(margin.left * 0.6)}, ${innerHeight / 2}) rotate(-90)`}
                    >
                        <Text
                            x={0}
                            y={0}
                            style={{ fontSize: 14 }}
                            textAnchor="middle"
                        >
                            {yLabel}
                        </Text>
                    </G>
                )}

                {/* Legend */}
                {seriesKeys.length > 1 && (
                    <G
                        transform={`translate(${innerWidth / 2 - 80}, ${innerHeight + 60})`}
                    >
                        {seriesKeys.map((key, index) => (
                            <G
                                key={key}
                                transform={`translate(${index * 120}, 0)`}
                            >
                                <Rect
                                    x={0}
                                    y={0}
                                    width={14}
                                    height={14}
                                    fill={colors[index % colors.length]}
                                    rx={3}
                                />
                                <Text x={20} y={11} style={{ fontSize: 12 }}>
                                    {key}
                                </Text>
                            </G>
                        ))}
                    </G>
                )}
            </G>
        </Svg>
    );
}
