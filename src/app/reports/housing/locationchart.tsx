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

type LocationDataPoint = {
    location: string;
    activeCount: number;
    housedCount: number;
};

function processData(records: HousingRecord[]): LocationDataPoint[] {
    const locationMap = new Map<string, { active: number; housed: number }>();

    records.forEach((record) => {
        if (!record.city) return;

        const location = record.city;
        if (!locationMap.has(location)) {
            locationMap.set(location, { active: 0, housed: 0 });
        }

        const counts = locationMap.get(location)!;
        if (record.currentStatus === "active") {
            counts.active++;
        } else if (record.currentStatus === "housed") {
            counts.housed++;
        }
    });

    const data: LocationDataPoint[] = Array.from(locationMap.entries())
        .map(([location, counts]) => ({
            location,
            activeCount: counts.active,
            housedCount: counts.housed,
        }))
        .sort(
            (a, b) =>
                b.activeCount + b.housedCount - (a.activeCount + a.housedCount)
        );

    return data;
}

function drawHorizontalBarChart(
    svgElement: SVGSVGElement,
    data: LocationDataPoint[]
) {
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

    const y = d3
        .scaleBand()
        .domain(data.map((d) => d.location))
        .range([0, height])
        .padding(0.35);

    const maxValue =
        d3.max(data, (d) => Math.max(d.activeCount, d.housedCount)) || 0;
    const x = d3
        .scaleLinear()
        .domain([0, Math.max(maxValue, 50)])
        .nice()
        .range([0, width]);

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

    chart
        .selectAll(".bar-housed")
        .data(data)
        .join("rect")
        .attr("y", (d) => y(d.location)!)
        .attr("x", 0)
        .attr("height", y.bandwidth() / 2 - 3)
        .attr("width", (d) => x(d.housedCount))
        .attr("fill", "#20B2AA")
        .attr("rx", 3);

    chart
        .selectAll(".bar-active")
        .data(data)
        .join("rect")
        .attr("y", (d) => y(d.location)! + y.bandwidth() / 2)
        .attr("x", 0)
        .attr("height", y.bandwidth() / 2 - 3)
        .attr("width", (d) => x(d.activeCount))
        .attr("fill", "#F4A6B0")
        .attr("rx", 3);

    chart
        .append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .style("font-family", "Poppins")
        .style("font-size", "12px")
        .style("fill", "#767676");

    chart
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickSize(0))
        .selectAll("text")
        .style("font-family", "Manrope")
        .style("font-size", "12px")
        .style("fill", "#767676");

    chart
        .append("text")
        .attr("transform", `translate(${width / 2}, ${height + 50})`)
        .style("text-anchor", "middle")
        .style("font-family", "Manrope")
        .style("font-size", "14px")
        .style("fill", "#4A5565")
        .text("# of Families");

    chart
        .append("text")
        .attr("transform", `translate(-90, ${height / 2}) rotate(-90)`)
        .style("text-anchor", "middle")
        .style("font-family", "Manrope")
        .style("font-size", "14px")
        .style("fill", "#4A5565")
        .text("Location");

    const legend = chart
        .append("g")
        .attr("transform", `translate(${width / 2 - 80}, ${height + 60})`)
        .attr("class", "legend");

    legend
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", "#F4A6B0")
        .attr("rx", 3);

    legend
        .append("text")
        .attr("x", 20)
        .attr("y", 11)
        .text("Active Families")
        .style("font-family", "Manrope")
        .style("font-size", "12px")
        .style("fill", "#4A5565");

    legend
        .append("rect")
        .attr("x", 130)
        .attr("y", 0)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", "#20B2AA")
        .attr("rx", 3);

    legend
        .append("text")
        .attr("x", 150)
        .attr("y", 11)
        .text("Housed Families")
        .style("font-family", "Manrope")
        .style("font-size", "12px")
        .style("fill", "#4A5565");
}

export default function LocationBarChart({ data }: { data: HousingRecord[] }) {
    const chartRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (chartRef.current && data.length > 0) {
            const processedData = processData(data);
            drawHorizontalBarChart(chartRef.current, processedData);
        }
    }, [data]);

    useEffect(() => {
        const handleResize = () => {
            if (chartRef.current && data.length > 0) {
                const processedData = processData(data);
                drawHorizontalBarChart(chartRef.current, processedData);
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
