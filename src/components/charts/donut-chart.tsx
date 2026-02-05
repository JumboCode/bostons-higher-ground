"use client";

import { useCallback, useEffect, useRef } from "react";
import { d3, DEFAULT_COLORS, DEFAULT_FONT } from "./chart-base";

export type DonutDatum = { label: string; value: number; color?: string };

export type DonutChartProps = {
    data: DonutDatum[];
    width?: number;
    height?: number;
    colors?: string[];
    centerLabel?: string;
    className?: string;
};

export function DonutChart({
    data,
    width,
    height,
    colors = DEFAULT_COLORS,
    centerLabel = "Total",
    className,
}: DonutChartProps) {
    const svgRef = useRef<SVGSVGElement | null>(null);

    const render = useCallback(() => {
        if (!svgRef.current) return;
        const svgEl = svgRef.current;
        const svg = d3.select(svgEl);
        svg.selectAll("*").remove();
        if (!data.length) return;

        const outerWidth = width ?? (svgEl.clientWidth || 640);
        const legendSpace = 100;
        const contentHeight = height ?? (svgEl.clientHeight || 420);
        const outerHeight = contentHeight + legendSpace;
        const margin = 40;
        const radius = Math.min(outerWidth, contentHeight) / 2 - margin;
        const innerRadius = radius * 0.6;

        const chart = svg
            .attr("width", outerWidth)
            .attr("height", outerHeight)
            .append("g")
            .attr(
                "transform",
                `translate(${outerWidth / 2},${outerHeight / 2 - 20})`
            );

        const total = data.reduce((sum, d) => sum + d.value, 0);

        const palette = colors.length ? colors : DEFAULT_COLORS;

        const pie = d3
            .pie<DonutDatum>()
            .value((d) => d.value)
            .sort(null);
        const arc = d3
            .arc<d3.PieArcDatum<DonutDatum>>()
            .innerRadius(innerRadius)
            .outerRadius(radius);

        const arcs = chart
            .selectAll(".arc")
            .data(pie(data))
            .join("g")
            .attr("class", "arc");

        arcs.append("path")
            .attr("d", arc)
            .attr(
                "fill",
                (d, index) => d.data.color ?? palette[index % palette.length]
            )
            .attr("stroke", "white")
            .attr("stroke-width", 2);

        arcs.append("text")
            .attr("transform", (d) => {
                const pos = arc.centroid(d);
                return `translate(${pos[0]}, ${pos[1]})`;
            })
            .attr("text-anchor", "middle")
            .style("font-family", DEFAULT_FONT)
            .style("font-size", "14px")
            .style("font-weight", "600")
            .style("fill", "white")
            .text((d) => {
                const pct = total === 0 ? 0 : (d.data.value / total) * 100;
                return pct >= 5 ? `${Math.round(pct)}%` : "";
            });

        const centerText = chart.append("g");
        centerText
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.5em")
            .style("font-family", "Poppins")
            .style("font-size", "28px")
            .style("font-weight", "700")
            .style("fill", "#374151")
            .text(total);

        centerText
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "1.2em")
            .style("font-family", DEFAULT_FONT)
            .style("font-size", "14px")
            .style("fill", "#767676")
            .text(centerLabel);

        const legend = svg
            .append("g")
            .attr(
                "transform",
                `translate(${outerWidth / 2 - 150}, ${outerHeight - 80})`
            );

        const legendItems = legend
            .selectAll(".legend-item")
            .data(data)
            .join("g")
            .attr("class", "legend-item")
            .attr(
                "transform",
                (d, i) =>
                    `translate(${(i % 3) * 120}, ${Math.floor(i / 3) * 25})`
            );

        legendItems
            .append("rect")
            .attr("width", 14)
            .attr("height", 14)
            .attr("rx", 3)
            .attr(
                "fill",
                (d, index) => d.color ?? palette[index % palette.length]
            );

        legendItems
            .append("text")
            .attr("x", 20)
            .attr("y", 11)
            .style("font-family", DEFAULT_FONT)
            .style("font-size", "11px")
            .style("fill", "#4A5565")
            .text((d) =>
                d.label.length > 15 ? `${d.label.substring(0, 15)}...` : d.label
            );
    }, [data, width, height, colors, centerLabel]);

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
            className={className ?? "w-full max-w-[900px] h-[520px]"}
            style={{ overflow: "visible" }}
            role="img"
        />
    );
}
