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

type CitySchoolDataPoint = {
    city: string;
    schoolCount: number;
};

function processData(records: HousingRecord[]): CitySchoolDataPoint[] {
    const citySchoolsMap = new Map<string, Set<string>>();

    records.forEach((record) => {
        if (!record.city || !record.school) return;

        if (!citySchoolsMap.has(record.city)) {
            citySchoolsMap.set(record.city, new Set());
        }

        citySchoolsMap.get(record.city)!.add(record.school);
    });

    const data: CitySchoolDataPoint[] = Array.from(citySchoolsMap.entries())
        .map(([city, schools]) => ({
            city,
            schoolCount: schools.size,
        }))
        .sort((a, b) => b.schoolCount - a.schoolCount);

    return data;
}

function drawBarChart(svgElement: SVGSVGElement, data: CitySchoolDataPoint[]) {
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 80, bottom: 80, left: 140 };

    const width = svgElement.clientWidth - margin.left - margin.right;
    const height = svgElement.clientHeight - margin.top - margin.bottom;

    const chart = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Dynamic padding based on number of data points
    const padding = data.length <= 3 ? 0.5 : data.length <= 5 ? 0.4 : 0.3;

    const y = d3
        .scaleBand()
        .domain(data.map((d) => d.city))
        .range([0, height])
        .padding(padding);

    const maxValue = d3.max(data, (d) => d.schoolCount) || 0;
    const x = d3
        .scaleLinear()
        .domain([0, Math.max(maxValue + 2, 10)])
        .nice()
        .range([0, width]);

    // Grid lines
    chart
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(
            d3
                .axisBottom(x)
                .ticks(5)
                .tickSize(-height)
                .tickFormat(() => "")
        )
        .selectAll("line")
        .attr("stroke", "#E5E7EB");

    // Bars
    chart
        .selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("y", (d) => y(d.city)!)
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", (d) => x(d.schoolCount))
        .attr("fill", "#8B5CF6")
        .attr("rx", 4);

    // Y-axis (cities)
    chart
        .append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .style("font-family", "Poppins")
        .style("font-size", "12px")
        .style("fill", "#767676");

    // X-axis (school counts)
    chart
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickSize(0))
        .selectAll("text")
        .style("font-family", "Manrope")
        .style("font-size", "12px")
        .style("fill", "#767676");

    // X-axis label
    chart
        .append("text")
        .attr("transform", `translate(${width / 2}, ${height + 50})`)
        .style("text-anchor", "middle")
        .style("font-family", "Manrope")
        .style("font-size", "14px")
        .style("fill", "#4A5565")
        .text("# of Schools");

    // Y-axis label
    chart
        .append("text")
        .attr("transform", `translate(-90, ${height / 2}) rotate(-90)`)
        .style("text-anchor", "middle")
        .style("font-family", "Manrope")
        .style("font-size", "14px")
        .style("fill", "#4A5565")
        .text("City");
}

export default function SchoolsByCityChart({
    data,
}: {
    data: HousingRecord[];
}) {
    const chartRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (chartRef.current && data.length > 0) {
            const processedData = processData(data);
            drawBarChart(chartRef.current, processedData);
        }
    }, [data]);

    useEffect(() => {
        const handleResize = () => {
            if (chartRef.current && data.length > 0) {
                const processedData = processData(data);
                drawBarChart(chartRef.current, processedData);
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
