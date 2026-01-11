"use client";

import { useCallback, useEffect, useRef } from "react";
import {
    d3,
    computeInnerDimensions,
    DEFAULT_COLORS,
    DEFAULT_FONT,
    DEFAULT_GRID,
    DEFAULT_TEXT,
    type Margin,
} from "./chart-base";

export type HorizontalSeriesDatum = {
    label: string;
    value: number;
    color?: string;
};
export type HorizontalBarDatum = {
    category: string;
    series: HorizontalSeriesDatum[];
};

export type HorizontalBarChartProps = {
    data: HorizontalBarDatum[];
    width?: number;
    height?: number;
    colors?: string[];
    xLabel?: string;
    yLabel?: string;
    className?: string;
};

export function HorizontalBarChart({
    data,
    width,
    height,
    colors = DEFAULT_COLORS,
    xLabel,
    yLabel,
    className,
}: HorizontalBarChartProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);

    const render = useCallback(() => {
        if (!svgRef.current) return;
        const svgEl = svgRef.current;
        const svg = d3.select(svgEl);
        svg.selectAll("*").remove();
        if (!data.length) return;

        const seriesKeys = Array.from(
            new Set(data.flatMap((d) => d.series.map((s) => s.label)))
        );
        const seriesCount = Math.max(seriesKeys.length, 1);
        const legendSpace = seriesKeys.length > 1 ? 60 : 0;

        const targetHeight =
            height ?? Math.max(360, data.length * 52 + 120 + legendSpace);
        const margin: Margin = {
            top: 20,
            right: 80,
            bottom: (xLabel ? 70 : 50) + legendSpace,
            left: yLabel ? 160 : 140,
        };
        const {
            width: innerWidth,
            height: innerHeight,
            outerWidth,
            outerHeight,
        } = computeInnerDimensions(svgEl, width, targetHeight, margin);

        const chart = svg
            .attr("width", outerWidth)
            .attr("height", outerHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const y = d3
            .scaleBand()
            .domain(data.map((d) => d.category))
            .range([0, innerHeight])
            .padding(0.35);

        const maxValue =
            d3.max(data, (d) => d3.max(d.series, (s) => s.value) || 0) || 0;
        const x = d3
            .scaleLinear()
            .domain([0, Math.max(maxValue, 1)])
            .nice()
            .range([0, innerWidth]);

        chart
            .append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(
                d3
                    .axisBottom(x)
                    .ticks(5)
                    .tickSize(-innerHeight)
                    .tickFormat(() => "")
            )
            .selectAll("line")
            .attr("stroke", DEFAULT_GRID)
            .attr("stroke-dasharray", "4 4");

        const barHeight =
            (y.bandwidth() || innerHeight / data.length) / seriesCount;

        seriesKeys.forEach((seriesKey, seriesIndex) => {
            chart
                .selectAll(`.bar-${seriesKey}`)
                .data(data)
                .join("rect")
                .attr("class", `bar-${seriesKey}`)
                .attr(
                    "y",
                    (d) => (y(d.category) ?? 0) + seriesIndex * barHeight
                )
                .attr("x", 0)
                .attr("height", barHeight - 3)
                .attr("width", (d) => {
                    const value =
                        d.series.find((s) => s.label === seriesKey)?.value ?? 0;
                    return x(value);
                })
                .attr(
                    "fill",
                    (d) =>
                        d.series.find((s) => s.label === seriesKey)?.color ||
                        colors[seriesIndex % colors.length]
                )
                .attr("rx", 3);
        });

        chart
            .append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .selectAll("text")
            .style("font-family", DEFAULT_FONT)
            .style("font-size", "12px")
            .style("fill", "#767676");

        chart
            .append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).ticks(5).tickSize(0))
            .selectAll("text")
            .style("font-family", DEFAULT_FONT)
            .style("font-size", "12px")
            .style("fill", "#767676");

        if (xLabel) {
            chart
                .append("text")
                .attr(
                    "transform",
                    `translate(${innerWidth / 2}, ${innerHeight + (xLabel ? 52 : 36)})`
                )
                .style("text-anchor", "middle")
                .style("font-family", DEFAULT_FONT)
                .style("font-size", "14px")
                .style("fill", "#4A5565")
                .text(xLabel);
        }

        if (yLabel) {
            chart
                .append("text")
                .attr(
                    "transform",
                    `translate(${-margin.left + 20}, ${innerHeight / 2}) rotate(-90)`
                )
                .style("text-anchor", "middle")
                .style("font-family", DEFAULT_FONT)
                .style("font-size", "14px")
                .style("fill", "#4A5565")
                .text(yLabel);
        }

        if (seriesKeys.length > 1) {
            const legend = chart
                .append("g")
                .attr(
                    "transform",
                    `translate(${innerWidth / 2 - 80}, ${innerHeight + 60})`
                )
                .attr("class", "legend");

            seriesKeys.forEach((key, index) => {
                const item = legend
                    .append("g")
                    .attr("transform", `translate(${index * 120}, 0)`);

                item.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", 14)
                    .attr("height", 14)
                    .attr("fill", colors[index % colors.length])
                    .attr("rx", 3);

                item.append("text")
                    .attr("x", 20)
                    .attr("y", 11)
                    .text(key)
                    .style("font-family", DEFAULT_FONT)
                    .style("font-size", "12px")
                    .style("fill", "#4A5565");
            });
        }
    }, [data, width, height, colors, xLabel, yLabel]);

    useEffect(() => {
        render();
    }, [render]);

    useEffect(() => {
        const handleResize = () => render();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [render]);

    return (
        <svg
            ref={svgRef}
            className={className ?? "w-full max-w-[900px]"}
            style={{ overflow: "visible" }}
            role="img"
        />
    );
}
