"use client";

import { useCallback, useEffect, useRef } from "react";
import {
    d3,
    computeInnerDimensions,
    DEFAULT_FONT,
    DEFAULT_GRID,
    DEFAULT_TEXT,
    type Margin,
} from "./chart-base";

export type LineDatum = { label: string; value: number };

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
    height,
    lineColor = "#D28A93",
    xLabel,
    yLabel,
    className,
}: LineChartProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);

    const render = useCallback(() => {
        if (!svgRef.current) return;
        const svgEl = svgRef.current;
        const svg = d3.select(svgEl);
        svg.selectAll("*").remove();
        if (!data.length) return;

        const targetHeight = height ?? 420;
        const margin: Margin = {
            top: 10,
            right: 10,
            bottom: xLabel ? 60 : 50,
            left: yLabel ? 65 : 55,
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

        const yGrid = chart.append("g").call(
            d3
                .axisLeft(y)
                .tickSize(-innerWidth)
                .tickFormat(() => "")
        );
        yGrid.select(".domain").remove();
        yGrid
            .selectAll("line")
            .attr("stroke", DEFAULT_GRID)
            .attr("stroke-dasharray", "4 4")
            .attr("stroke-width", 1);
        yGrid.select("line:last-of-type").remove();

        const xGrid = chart
            .append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(
                d3
                    .axisBottom(x)
                    .tickSize(-innerHeight)
                    .tickFormat(() => "")
            );
        xGrid.select(".domain").remove();
        xGrid
            .selectAll("line")
            .attr("stroke", DEFAULT_GRID)
            .attr("stroke-dasharray", "4 4")
            .attr("stroke-width", 1);
        xGrid.select("line:first-of-type").remove();

        const lineGenerator = d3
            .line<LineDatum>()
            .x((d) => x(d.label) ?? 0)
            .y((d) => y(d.value))
            .curve(d3.curveMonotoneX);

        chart
            .append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", lineColor)
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);

        chart
            .selectAll(".dot")
            .data(data)
            .join("circle")
            .attr("class", "dot")
            .attr("cx", (d) => x(d.label) ?? 0)
            .attr("cy", (d) => y(d.value))
            .attr("r", 4)
            .attr("fill", lineColor);

        const xAxis = chart
            .append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(x));
        xAxis
            .selectAll("text")
            .style("font-size", "12px")
            .style("font-family", DEFAULT_FONT)
            .style("fill", DEFAULT_TEXT);
        xAxis.select(".domain").attr("stroke", "black").attr("stroke-width", 1);

        const yAxis = chart.append("g").call(d3.axisLeft(y));
        yAxis
            .selectAll("text")
            .style("font-size", "12px")
            .style("font-family", DEFAULT_FONT)
            .style("fill", DEFAULT_TEXT);
        yAxis.select(".domain").attr("stroke", "black").attr("stroke-width", 1);

        chart
            .append("line")
            .attr("x1", 0)
            .attr("x2", innerWidth)
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", DEFAULT_GRID)
            .attr("stroke-dasharray", "4 4")
            .attr("stroke-width", 1);

        chart
            .append("line")
            .attr("x1", innerWidth)
            .attr("x2", innerWidth)
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", DEFAULT_GRID)
            .attr("stroke-dasharray", "4 4")
            .attr("stroke-width", 1);

        if (xLabel) {
            chart
                .append("text")
                .attr(
                    "transform",
                    `translate(${innerWidth / 2}, ${innerHeight + (xLabel ? 48 : 32)})`
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
                    `translate(${-margin.left + 10}, ${innerHeight / 2}) rotate(-90)`
                )
                .style("text-anchor", "middle")
                .style("font-family", DEFAULT_FONT)
                .style("font-size", "14px")
                .style("fill", "#4A5565")
                .text(yLabel);
        }
    }, [data, width, height, lineColor, xLabel, yLabel]);

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
            className={className ?? "w-full max-w-[900px] h-[420px]"}
            role="img"
        />
    );
}
