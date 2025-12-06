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
export default function HousingBarChart({ data }: { data: housingRecord[] }) {
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
function drawBarChart(svgElement: SVGSVGElement, data: housingRecord[] ) { //the code makes horizontal bar chart, need to change it to make it vertical
        const svg = d3.select(svgElement);
        svg.selectAll('*').remove();

        //prep data
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        //count intakes per month
        const monthCounts = d3.rollups(
            data,
            v => v.length ,
            d => d.intakeMonth
        )
        .map(([month, count]) => ({
        month: monthNames[Number(month)],
        count
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

  // --- Scales ---
  const x = d3
    .scaleBand()
    .domain(monthNames)
    .range([0, width])
    .padding(0.25);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(monthCounts, d => d.count)!])
    .nice()
    .range([height, 0]);

  // --- Gridlines ---
  chart
    .append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(y)
        .ticks(6)
        .tickSize(-width)
        .tickFormat(() => "")
    )
    .selectAll("line")
    .attr("stroke", "#E5E7EB");

  // --- Bars ---
  chart
    .selectAll(".bar")
    .data(monthCounts)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.month)!)
    .attr("y", d => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.count))
    .attr("fill", "#D28A93") // pinkish like screenshot
    .attr("rx", 4);

  // --- X Axis ---
  chart
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("font-size", "12px")
    .style("font-family", "Manrope")
    .style("fill", "#6B6B6B");

  // --- Y Axis ---
  chart
    .append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "12px")
    .style("font-family", "Manrope")
    .style("fill", "#6B6B6B");
}