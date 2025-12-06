"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

type housingRecord = {
  id: number;
  intakeDate: string | null;
  dateHoused: string | null;
  currentStatus: string | null;
  sourceOfHousing: string | null;
  city: string | null;
  zipCode: string | null;
  school: string | null;
  schoolId: string | null;
  studentCount: number | null;
  intakeMonth: number | null;
  housedMonth: number | null;
};

// type Props = {
//   data: housingRecord[];
// };

function prepareLineData(records: housingRecord[]) {
  return records
    .filter((r) => r.intakeMonth !== null && r.studentCount !== null)
    .map((r) => ({ x: r.intakeMonth as number, y: r.studentCount as number }));
}

//react component
export default function HousingLineChart({ data }: { data: housingRecord[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (!svgRef.current) return;
    drawLineChart(svgRef.current, data);
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



function drawLineChart(svgElement: SVGSVGElement, data: housingRecord[] ) {
        const svg = d3.select(svgElement);
        svg.selectAll('*').remove();

        //prep data
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        //count intakes per month
        const monthCounts = d3.rollups(
            data,
            v => v.length,
            d => {if (!d.intakeDate) return -1;
                return d.housedMonth}
        )
        .filter(([m]) => m !== -1)
        .map(([month, count]) => ({
            monthIndex: Number(month),
            month: monthNames[Number(month)],
            count}))
        .sort((a, b) => a.monthIndex - b.monthIndex)
  
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

// --- Line generator ---
    const lineGenerator = d3
        .line<{ month: string; count: number }>()
        .x(d => x(d.month)! + x.bandwidth() / 2) // center line in band
        .y(d => y(d.count))
        .curve(d3.curveMonotoneX); // smooth line

    // --- Append path ---
    chart
        .append("path")
        .datum(monthCounts) // pass entire dataset
        .attr("fill", "none")       // line, not area
        .attr("stroke", "#D28A93")  // pink line
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);

        // --- Optional: Add circles at points ---
    chart
        .selectAll(".dot")
        .data(monthCounts)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.month)! + x.bandwidth() / 2)
        .attr("cy", d => y(d.count))
        .attr("r", 4)
        .attr("fill", "#D28A93");
            
    // axes
    chart
        .append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll('text')
        .style('font-family', 'Manrope')
        .style('font-size', '12px')
        .style('fill', '#4A5565');

    chart
        .append('g')
        .call(d3.axisLeft(y).ticks(5).tickSize(0))
        .selectAll('text')
        .style('font-family', 'Manrope')
        .style('font-size', '12px')
        .style('fill', '#4A5565');

}