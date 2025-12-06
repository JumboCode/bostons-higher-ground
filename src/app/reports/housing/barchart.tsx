"use client";

import * as d3 from "d3";
import icon from "./Icon.png";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Poppins, Manrope } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-poppins",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-manrope",
});

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
}

export function drawVerticalBarChart(svgElement: SVGSVGElement, data: housingRecord[] ) { //the code makes horizontal bar chart, need to change it to make it vertical
        const svg = d3.select(svgElement);
        svg.selectAll('*').remove();
        const margin = { top: 10, right: 40, bottom: 90, left: 130 };
    
        const width = svgElement.clientWidth - margin.left - margin.right;
        const height = svgElement.clientHeight - margin.top - margin.bottom;
      
        const chart = svg
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);
      
        const y = d3
          .scaleBand()
          .domain(d3.groupSort(data, ([d]) => d.intakeData.getMonth()))
          .range([0, height])
          .padding(0.35);
      
        const x = d3
          .scaleLinear()
          .domain([0, d3.max(data, (d) => Math.max(d.activeCount, d.housedCount))!])
          .nice()
          .range([0, width]);
      
        // gridlines
        chart
          .append('g')
          .call(
            d3.axisBottom(x)
              .ticks(5)
              .tickSize(height)
              .tickFormat(() => '')
          )
          .selectAll('line')
          .attr('stroke', '#E5E7EB');
      
        // bars
        chart
          .selectAll('.bar-housed')
          .data(data)
          .join('rect')
          .attr('y', (d) => y(d.partnerSchool)!)
          .attr('x', 0)
          .attr('height', y.bandwidth() / 2 - 3)
          .attr('width', (d) => x(d.housedCount))
          .attr('fill', '#A7C7E7')
          .attr('rx', 3);
      
        chart
          .selectAll('.bar-active')
          .data(data)
          .join('rect')
          .attr('y', (d) => y(d.partnerSchool)! + y.bandwidth() / 2)
          .attr('x', 0)
          .attr('height', y.bandwidth() / 2 - 3)
          .attr('width', (d) => x(d.activeCount))
          .attr('fill', '#F4A6B0')
          .attr('rx', 3);
      
        // axes
        chart
          .append('g')
          .call(d3.axisLeft(y).tickSize(0))
          .selectAll('text')
          .style('font-family', 'Poppins')
          .style('font-size', '12px')
          .style('fill', '#767676');
      
        chart
          .append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x).ticks(5).tickSize(0))
          .selectAll('text')
          .style('font-family', 'Manrope')
          .style('font-size', '12px')
          .style('fill', '#767676');
    
        // --- Legend ---
        const legend = chart.append("g")
        .attr("transform", `translate(${width / 2 - 60}, ${height + 40})`) // position legend centered under chart
        .attr("class", "legend");
    
        // Housed legend
        legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", "#A7C7E7")
        .attr("rx", 3);
    
        legend.append("text")
        .attr("x", 20)
        .attr("y", 11)
        .text("Housed")
        .style("font-family", "Manrope")
        .style("font-size", "12px")
        .style("fill", "#4A5565");
    
        // Active legend
        legend.append("rect")
        .attr("x", 90)
        .attr("y", 0)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", "#F4A6B0")
        .attr("rx", 3);
    
        legend.append("text")
        .attr("x", 110)
        .attr("y", 11)
        .text("Active")
        .style("font-family", "Manrope")
        .style("font-size", "12px")
        .style("fill", "#4A5565");
}