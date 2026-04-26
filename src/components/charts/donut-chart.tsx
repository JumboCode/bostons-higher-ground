"use client";

import { useCallback, useEffect, useRef } from "react";
import { d3, DEFAULT_COLORS, DEFAULT_FONT } from "./chart-base";

export type DonutDatum = { label: string; value: number; color?: string };

export type DonutChartProps = {
    data: DonutDatum[];
    width?: number;
    height?: number;
    colors?: string[];
    className?: string;
};

export function DonutChart({
    data,
    width,
    height,
    colors = DEFAULT_COLORS,
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
        const contentHeight = height ?? (svgEl.clientHeight || 420);
        const maxLegendLabelLength =
            d3.max(data, (entry) => Math.min(entry.label.length, 18)) ?? 0;
        const legendItemWidth = Math.max(140, maxLegendLabelLength * 8 + 40);
        const legendColumns = Math.max(
            1,
            Math.min(
                data.length,
                Math.floor((outerWidth - 40) / legendItemWidth)
            )
        );
        const legendRows = Math.ceil(data.length / legendColumns);
        const legendRowHeight = 25;
        const legendHeight = legendRows * legendRowHeight;
        const legendSpace = legendHeight + 30;
        const outerHeight = contentHeight + legendSpace;
        const margin = 40;
        const radius = Math.min(outerWidth, contentHeight) / 2 - margin;
        const innerRadius = 0;

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

        // Replace the labelGroup block with this:

        const labelArc = d3
            .arc<d3.PieArcDatum<DonutDatum>>()
            .innerRadius(radius * 0.58) // push labels toward the outer half
            .outerRadius(radius * 0.58); // same value = labels sit on this ring

        const labelGroup = arcs
            .append("text")
            .attr("transform", (d) => {
                const pos = labelArc.centroid(d);
                return `translate(${pos[0]}, ${pos[1]})`;
            })
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle") // vertical centering
            .style("font-family", DEFAULT_FONT)
            .style("font-size", "15px")
            .style("font-weight", "500")
            .style("fill", "white")
            // Hide labels on slices too small to fit text
            .style("display", (d) => {
                const sliceAngle = d.endAngle - d.startAngle;
                return sliceAngle < 0.3 ? "none" : "inline";
            });

        labelGroup
            .append("tspan")
            .attr("x", 0)
            .attr("dy", "-0.1em")
            .text((d) => {
                const label = d.data.label;
                return label.length > 15
                    ? `${label.substring(0, 12)}...`
                    : label;
            });

        labelGroup
            .append("tspan")
            .attr("x", 0)
            .attr("dy", "1.2em")
            .text((d) => {
                const pct = total === 0 ? 0 : (d.data.value / total) * 100;
                return `${Math.round(pct)}%`;
            });

        const legend = svg
            .append("g")
            .attr(
                "transform",
                `translate(${(outerWidth - legendColumns * legendItemWidth) / 2}, ${outerHeight - legendSpace + 10})`
            );

        const legendItems = legend
            .selectAll(".legend-item")
            .data(data)
            .join("g")
            .attr("class", "legend-item")
            .attr(
                "transform",
                (d, i) =>
                    `translate(${(i % legendColumns) * legendItemWidth}, ${Math.floor(i / legendColumns) * legendRowHeight})`
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
            .text((d) => d.label);
    }, [data, width, height, colors]);

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
            className={className ?? "min-h-[520px] w-full max-w-[900px]"}
            role="img"
        />
    );
}
