import { Svg, Path, Circle, Line, Text, G } from "@react-pdf/renderer";
import * as d3 from "d3";
import type { LineDatum } from "./line-chart";

export type LineChartPdfProps = {
    data: LineDatum[];
    width?: number;
    height?: number;
    lineColor?: string;
    xLabel?: string;
    yLabel?: string;
};

export function LineChartPdf({
    data,
    width = 420,
    height = 420,
    lineColor = "#D28A93",
    xLabel,
    yLabel,
}: LineChartPdfProps) {
    if (!data.length) return null;

    const margin = {
        top: 10,
        right: 10,
        bottom: xLabel ? 60 : 50,
        left: yLabel ? 50 : 40,
    };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3
        .scalePoint()
        .domain(data.map((d) => d.label))
        .range([0, innerWidth])
        .padding(0.5);

    const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) || 0])
        .nice()
        .range([innerHeight, 0]);

    const yTicks = y.ticks(5);

    const lineGenerator = d3
        .line<LineDatum>()
        .x((d) => x(d.label) ?? 0)
        .y((d) => y(d.value))
        .curve(d3.curveMonotoneX);

    const pathData = lineGenerator(data) ?? "";

    function truncateLabel(label: string, maxChars: number): string {
        return label.length > maxChars ? label.slice(0, maxChars - 1) + "…" : label;
    }

    return (
        <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
            <G transform={`translate(${margin.left}, ${margin.top})`}>
                {/* Y Grid */}
                {yTicks.slice(0, -1).map((tick) => (
                    <Line
                        key={`ygrid-${tick}`}
                        x1={0}
                        x2={innerWidth}
                        y1={y(tick)}
                        y2={y(tick)}
                        stroke="#E6E7EB"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                    />
                ))}

                {/* X Grid */}
                {data.map((d, i) => (
                    <Line
                        key={`xgrid-${i}`}
                        x1={x(d.label) ?? 0}
                        x2={x(d.label) ?? 0}
                        y1={0}
                        y2={innerHeight}
                        stroke="#E6E7EB"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Top border */}
                <Line
                    x1={0}
                    x2={innerWidth}
                    y1={0}
                    y2={0}
                    stroke="#E6E7EB"
                    strokeDasharray="4 4"
                />

                {/* Right border */}
                <Line
                    x1={innerWidth}
                    x2={innerWidth}
                    y1={0}
                    y2={innerHeight}
                    stroke="#E6E7EB"
                    strokeDasharray="4 4"
                />

                {/* Line Path */}
                <Path
                    d={pathData}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={2}
                />

                {/* Dots */}
                {data.map((d) => (
                    <Circle
                        key={d.label}
                        cx={x(d.label) ?? 0}
                        cy={y(d.value)}
                        r={4}
                        fill={lineColor}
                    />
                ))}

                {/* X Axis Line */}
                <Line
                    x1={0}
                    x2={innerWidth}
                    y1={innerHeight}
                    y2={innerHeight}
                    stroke="black"
                />

                {/* Y Axis Line */}
                <Line x1={0} x2={0} y1={0} y2={innerHeight} stroke="black" />

                {/* X Tick Labels */}
                {data.map((d) => (
                    <Text
                        key={`xlabel-${d.label}`}
                        x={x(d.label) ?? 0}
                        y={innerHeight + 15}
                        style={{ fontSize: 12 }}
                        textAnchor="middle"
                    >
                        {truncateLabel(d.label, Math.floor(x.step() / 5.5))}
                    </Text>
                ))}

                {/* Y Tick Labels */}
                {yTicks.map((tick) => (
                    <Text
                        key={`ytick-${tick}`}
                        x={-8}
                        y={y(tick)}
                        style={{ fontSize: 12 }}
                        textAnchor="end"
                    >
                        {tick}
                    </Text>
                ))}

                {/* X Axis Label */}
                {xLabel && (
                    <Text
                        x={innerWidth / 2}
                        y={innerHeight + 45}
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
            </G>
        </Svg>
    );
}
