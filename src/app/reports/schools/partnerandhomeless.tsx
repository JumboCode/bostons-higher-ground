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

type SchoolDataPoint = {
    school: string;
    activeStudents: number;
    housedStudents: number;
};

function processData(records: HousingRecord[]): SchoolDataPoint[] {
    const schoolMap = new Map<string, { active: number; housed: number }>();

    records.forEach((record) => {
        if (!record.school || !record.studentCount) return;

        const school = record.school;
        const studentCount = record.studentCount;

        if (!schoolMap.has(school)) {
            schoolMap.set(school, { active: 0, housed: 0 });
        }

        const counts = schoolMap.get(school)!;
        if (record.currentStatus === "active") {
            counts.active += studentCount;
        } else if (record.currentStatus === "housed") {
            counts.housed += studentCount;
        }
    });

    const data: SchoolDataPoint[] = Array.from(schoolMap.entries())
        .map(([school, counts]) => ({
            school,
            activeStudents: counts.active,
            housedStudents: counts.housed,
        }))
        .sort(
            (a, b) =>
                b.activeStudents +
                b.housedStudents -
                (a.activeStudents + a.housedStudents)
        );

    return data;
}

function drawHorizontalBarChart(
    svgElement: SVGSVGElement,
    data: SchoolDataPoint[]
) {
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 80, bottom: 80, left: 160 };

    const width = svgElement.clientWidth - margin.left - margin.right;
    const height = svgElement.clientHeight - margin.top - margin.bottom;

    const chart = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3
        .scaleBand()
        .domain(data.map((d) => d.school))
        .range([0, height])
        .padding(0.35);

    const maxValue =
        d3.max(data, (d) => Math.max(d.activeStudents, d.housedStudents)) || 0;
    const x = d3
        .scaleLinear()
        .domain([0, Math.max(maxValue, 50)])
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

    // Housed bars (teal)
    chart
        .selectAll(".bar-housed")
        .data(data)
        .join("rect")
        .attr("y", (d) => y(d.school)!)
        .attr("x", 0)
        .attr("height", y.bandwidth() / 2 - 3)
        .attr("width", (d) => x(d.housedStudents))
        .attr("fill", "#20B2AA")
        .attr("rx", 3);

    // Active bars (pink)
    chart
        .selectAll(".bar-active")
        .data(data)
        .join("rect")
        .attr("y", (d) => y(d.school)! + y.bandwidth() / 2)
        .attr("x", 0)
        .attr("height", y.bandwidth() / 2 - 3)
        .attr("width", (d) => x(d.activeStudents))
        .attr("fill", "#F4A6B0")
        .attr("rx", 3);

    // Y-axis (schools)
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
        .attr("transform", `translate(-110, ${height / 2}) rotate(-90)`)
        .style("text-anchor", "middle")
        .style("font-family", "Manrope")
        .style("font-size", "14px")
        .style("fill", "#4A5565")
        .text("School");

    // Legend
    const legend = chart
        .append("g")
        .attr("transform", `translate(${width / 2 - 60}, ${height + 60})`)
        .attr("class", "legend");

    // Active legend item
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
        .text("Active")
        .style("font-family", "Manrope")
        .style("font-size", "12px")
        .style("fill", "#4A5565");

    // Housed legend item
    legend
        .append("rect")
        .attr("x", 80)
        .attr("y", 0)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", "#20B2AA")
        .attr("rx", 3);

    legend
        .append("text")
        .attr("x", 100)
        .attr("y", 11)
        .text("Housed")
        .style("font-family", "Manrope")
        .style("font-size", "12px")
        .style("fill", "#4A5565");
}

export default function PartnerAndHomeless({
    data,
}: {
    data: HousingRecord[];
}) {
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
