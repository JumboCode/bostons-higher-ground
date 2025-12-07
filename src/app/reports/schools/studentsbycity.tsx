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

type CityStudentDataPoint = {
    city: string;
    totalStudents: number;
};

function processData(records: HousingRecord[]): CityStudentDataPoint[] {
    const cityStudentsMap = new Map<string, number>();

    records.forEach((record) => {
        if (!record.city || !record.studentCount) return;

        const currentTotal = cityStudentsMap.get(record.city) || 0;
        cityStudentsMap.set(record.city, currentTotal + record.studentCount);
    });

    const data: CityStudentDataPoint[] = Array.from(cityStudentsMap.entries())
        .map(([city, totalStudents]) => ({
            city,
            totalStudents,
        }))
        .sort((a, b) => b.totalStudents - a.totalStudents);

    return data;
}

function drawBarChart(svgElement: SVGSVGElement, data: CityStudentDataPoint[]) {
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

    const maxValue = d3.max(data, (d) => d.totalStudents) || 0;
    const x = d3
        .scaleLinear()
        .domain([0, Math.max(maxValue + 10, 50)])
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

    // Bars with gradient effect
    chart
        .selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("y", (d) => y(d.city)!)
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", (d) => x(d.totalStudents))
        .attr("fill", "#3B82F6")
        .attr("rx", 4);

    // Y-axis (cities)
    chart
        .append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .style("font-family", "Poppins")
        .style("font-size", "12px")
        .style("fill", "#767676");

    // X-axis (student counts)
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
        .text("# of Students");

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

export default function StudentsByCityChart({
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
