"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";


type housingRecord = {
    id: number;
    intakeDate: string | null;
    dateHoused: string | null;
    currentStatus: string| null;
    sourceOfHousing: string | null;
    city: string | null;
    zipCode: string | null;
    school: string | null;
    schoolId: string | null;
    studentCount: number | null;
    intakeMonth: number | null;
    housedMonth: number | null;
}

//react component
export default function DaysHousedBarChart({ data }: { data: housingRecord[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (!svgRef.current) return;
    drawBarChart(svgRef.current, data);
  }, [data]);
  return (
    <svg
    ref={svgRef}
    width={900}
    height={380}
    style={{ overflow: "visible" }}
    />
  );
}

//d3 chart code
function drawBarChart(svgElement: SVGSVGElement, data: housingRecord[] ) {
    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    //prep data
    const housedData = data
        .filter(d => d.intakeDate && d.dateHoused)
        .map(d => {
            const start = new Date(d.intakeDate!);
            const end = new Date(d.dateHoused!);
            const days = (end.getTime() - start.getTime())/(1000*60*60*24);
            return {
                school: d.school ?? "Unknown",
                days: Math.round(days)
            }
        })

    const schoolAverages = d3.rollups(
        housedData,
        v => d3.mean(v,d=>d.days) as number,
        d=> d.school
    ).map(([school,avg]) => ({
        school,
        avgDays:avg
    }));

  // --- Dimensions ---
  const margin = { top: 10, right: 10, bottom: 50, left: 55 };
  const width = svgElement.clientWidth - margin.left - margin.right;
  const height = svgElement.clientHeight - margin.top - margin.bottom;

  const chart = svg
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // ---- X scale (schools) ----
  const x = d3
    .scaleBand()
    .domain(schoolAverages.map(d => d.school))
    .range([0, width])
    .padding(0.25);

  // ---- Y scale (days) ----
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(schoolAverages, d => d.avgDays)!])
    .nice()
    .range([height, 0]);

  // --- Horizontal Gridlines ---
const yGrid = chart
    .append("g")
    .call(
        d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => "")
    );

    yGrid.select(".domain").remove();
    yGrid.selectAll("line")
    .attr("stroke", "#E5E7EB")
    .attr("stroke-dasharray", "4 4")
    .attr("stroke-width", 1);

// Remove bottom gridline so solid X-axis shows
yGrid.select("line:last-of-type").remove();

// --- Vertical Gridlines ---
const xGrid = chart
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(
    d3.axisBottom(x)
        .tickSize(-height)
        .tickFormat(() => "")
    );

xGrid.select(".domain").remove();
xGrid.selectAll("line")
    .attr("stroke", "#E5E7EB")
    .attr("stroke-dasharray", "4 4")
    .attr("stroke-width", 1);

// Remove left-most vertical gridline so solid Y-axis shows
xGrid.select("line:first-of-type").remove();

// --- Bars ---
chart
    .selectAll(".bar")
    .data(schoolAverages)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.school)!)
    .attr("y", d => y(d.avgDays))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.avgDays))
    .attr("fill", "#D28A93") // pinkish like screenshot
    .attr("rx", 4);

// --- X Axis ---
const xAxis = chart
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

xAxis.selectAll("text")
    .style("font-size", "12px")
    .style("font-family", "Manrope")
    .style("fill", "#6B6B6B");

xAxis.select(".domain")
    .attr("stroke", "black")
    .attr("stroke-width", 1);

// --- Y Axis ---
    const yAxis = chart
    .append("g")
    .call(d3.axisLeft(y));

yAxis.selectAll("text")
    .style("font-size", "12px")
    .style("font-family", "Manrope")
    .style("fill", "#6B6B6B");

yAxis.select(".domain")
    .attr("stroke", "black")
    .attr("stroke-width", 1);

// --- Dashed Borders ---
    chart.append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", "#E5E7EB")
    .attr("stroke-dasharray", "4 4")
    .attr("stroke-width", 1);

chart.append("line")
    .attr("x1", width)
    .attr("x2", width)
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#E5E7EB")
    .attr("stroke-dasharray", "4 4")
    .attr("stroke-width", 1);
  }