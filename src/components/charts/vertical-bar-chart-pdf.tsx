import { Svg, Rect, Line, Text, G } from "@react-pdf/renderer";
import * as d3 from "d3";

type Datum = {
    label: string;
    value: number;
};

export function VerticalBarChartPdf({
    data,
    width = 420,
    height = 420,
    barColor = "#D28A93",
    xLabel,
    yLabel,
}: {
    data: Datum[];
    width?: number;
    height?: number;
    barColor?: string;
    xLabel?: string;
    yLabel?: string;
}) {
    const preliminaryMargin = { top: 20, right: 20, bottom: 100, left: 50 };
    const preliminaryInnerWidth = width - preliminaryMargin.left - preliminaryMargin.right;

    const x = d3
        .scaleBand()
        .domain(data.map((d) => d.label))
        .range([0, preliminaryInnerWidth])
        .padding(0.25);

    const maxLabelChars = Math.max(Math.floor(x.bandwidth() / 3), 10); // min 10 chars

    const margin = { top: 20, right: 20, bottom: 80, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const longestTruncatedLabel = Math.max(...data.map((d) => truncateLabel(d.label, maxLabelChars).length));
    const labelHeight = longestTruncatedLabel * 5; // ~5px per char at 12px font, rotated 45°

    x.range([0, innerWidth]);

    const maxY = d3.max(data, (d) => d.value) ?? 0;
    const y = d3
        .scaleLinear()
        .domain([0, maxY === 0 ? 1 : maxY])
        .nice()
        .range([innerHeight, 0]);

    const yTicks = y.ticks(5);

    function truncateLabel(label: string, maxChars: number): string {
        return label.length > maxChars ? label.slice(0, maxChars - 1) + "…" : label;
    }

    return (
        <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
            <G transform={`translate(${margin.left}, ${margin.top})`}>
                {yTicks.map((tick) => (
                    <Line
                        key={`grid-${tick}`}
                        x1={0}
                        x2={innerWidth}
                        y1={y(tick)}
                        y2={y(tick)}
                        stroke="#E6E7EB"
                        strokeWidth={1}
                    />
                ))}

                {data.map((d) => (
                    <Rect
                        key={d.label}
                        x={x(d.label)!}
                        y={y(d.value)}
                        width={x.bandwidth()}
                        height={innerHeight - y(d.value)}
                        fill={barColor}
                        rx={4}
                    />
                ))}

                <Line
                    x1={0}
                    x2={innerWidth}
                    y1={innerHeight}
                    y2={innerHeight}
                    stroke="#555555"
                    strokeWidth={1}
                />
                <Line
                    x1={0}
                    x2={0}
                    y1={0}
                    y2={innerHeight}
                    stroke="#555555"
                    strokeWidth={1}
                />

                {data.map((d) => (
                    <G
                        key={`xlabel-${d.label}`}
                        transform={`translate(${x(d.label)! + x.bandwidth() / 2}, ${innerHeight + 10}) rotate(-45)`}
                    >
                        <Text
                            style={{ fontSize: 12 }}
                            textAnchor="end"
                        >
                            {truncateLabel(d.label, maxLabelChars)}
                        </Text>
                    </G>
                ))}

                {yTicks.map((tick) => (
                    <Text
                        key={`ytick-${tick}`}
                        x={-10}
                        y={y(tick)}
                        style={{ fontSize: 12 }}
                        textAnchor="end"
                        dominantBaseline="middle"
                    >
                        {tick}
                    </Text>
                ))}

                {xLabel && (
                    <Text
                        x={innerWidth / 2}
                        y={innerHeight + labelHeight + 20}
                        style={{ fontSize: 14 }}
                        textAnchor="middle"
                    >
                        {xLabel}
                    </Text>
                )}

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
            </G>
        </Svg>
    );
}
