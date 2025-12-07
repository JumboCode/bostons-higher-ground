"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";

type HousingRecord = {
    id: number;
    familyId: string;
    intakeDate: string | null;
    dateHoused: string | null;
    currentStatus: string | null;
    sourceOfHousing: string | null;
    city: string | null;
    zipCode: string | null;
    school: string | null;
    schoolId: string | null;
    studentCount: number | null;
    intakeMonth?: number | null;
    housedMonth?: number | null;
};

type HousingSourceDataPoint = {
    source: string;
    count: number;
    percentage: number;
};

function processData(records: HousingRecord[]): HousingSourceDataPoint[] {
    const sourceMap = new Map<string, number>();
    let total = 0;

    records.forEach((record) => {
        // Only count housed families
        if (record.currentStatus !== "housed" || !record.sourceOfHousing)
            return;

        const source = record.sourceOfHousing;
        const currentCount = sourceMap.get(source) || 0;
        sourceMap.set(source, currentCount + 1);
        total++;
    });

    const data: HousingSourceDataPoint[] = Array.from(sourceMap.entries())
        .map(([source, count]) => ({
            source,
            count,
            percentage: (count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);

    return data;
}

function drawDonutChart(
    svgElement: SVGSVGElement,
    data: HousingSourceDataPoint[]
) {
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const width = svgElement.clientWidth;
    const height = svgElement.clientHeight;
    const margin = 40;

    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.6;

    const chart = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2 - 20})`);

    // Color scale
    const colorScale = d3
        .scaleOrdinal<string>()
        .domain(data.map((d) => d.source))
        .range([
            "#10B981",
            "#3B82F6",
            "#F59E0B",
            "#EF4444",
            "#8B5CF6",
            "#EC4899",
        ]);

    // Create pie generator
    const pie = d3
        .pie<HousingSourceDataPoint>()
        .value((d) => d.count)
        .sort(null);

    // Create arc generator
    const arc = d3
        .arc<d3.PieArcDatum<HousingSourceDataPoint>>()
        .innerRadius(innerRadius)
        .outerRadius(radius);

    // Draw arcs
    const arcs = chart
        .selectAll(".arc")
        .data(pie(data))
        .join("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", (d) => colorScale(d.data.source))
        .attr("stroke", "white")
        .attr("stroke-width", 2);

    // Add percentage labels on the arcs
    arcs.append("text")
        .attr("transform", (d) => {
            const pos = arc.centroid(d);
            return `translate(${pos[0]}, ${pos[1]})`;
        })
        .attr("text-anchor", "middle")
        .style("font-family", "Manrope")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .style("fill", "white")
        .text((d) =>
            d.data.percentage >= 5 ? `${Math.round(d.data.percentage)}%` : ""
        );

    // Add center text
    const centerText = chart.append("g");

    centerText
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.5em")
        .style("font-family", "Poppins")
        .style("font-size", "28px")
        .style("font-weight", "700")
        .style("fill", "#374151")
        .text(data.reduce((sum, d) => sum + d.count, 0));

    centerText
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1.2em")
        .style("font-family", "Manrope")
        .style("font-size", "14px")
        .style("fill", "#767676")
        .text("Total Housed");

    // Legend
    const legend = svg
        .append("g")
        .attr("transform", `translate(${width / 2 - 150}, ${height - 80})`);

    const legendItems = legend
        .selectAll(".legend-item")
        .data(data)
        .join("g")
        .attr("class", "legend-item")
        .attr(
            "transform",
            (d, i) => `translate(${(i % 3) * 120}, ${Math.floor(i / 3) * 25})`
        );

    legendItems
        .append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("rx", 3)
        .attr("fill", (d) => colorScale(d.source));

    legendItems
        .append("text")
        .attr("x", 20)
        .attr("y", 11)
        .style("font-family", "Manrope")
        .style("font-size", "11px")
        .style("fill", "#4A5565")
        .text((d) => {
            const maxLength = 15;
            return d.source.length > maxLength
                ? d.source.substring(0, maxLength) + "..."
                : d.source;
        });
}

export default function HousingSourceChart({
    data,
}: {
    data: HousingRecord[];
}) {
    const chartRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (chartRef.current && data.length > 0) {
            const processedData = processData(data);
            if (processedData.length > 0) {
                drawDonutChart(chartRef.current, processedData);
            }
        }
    }, [data]);

    useEffect(() => {
        const handleResize = () => {
            if (chartRef.current && data.length > 0) {
                const processedData = processData(data);
                if (processedData.length > 0) {
                    drawDonutChart(chartRef.current, processedData);
                }
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [data]);

    return (
        <div className="relative">
            <svg ref={chartRef} className="w-full h-[500px]"></svg>
        </div>
    );
}
