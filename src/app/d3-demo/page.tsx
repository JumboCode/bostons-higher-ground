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

type fhtDataPoint = {
  month: string;
  familiesHoused: number;
};

type pshsDataPoint = {
  partnerSchool: string;
  activeCount: number;
  housedCount: number;
};

const fhtDataSet: fhtDataPoint[] = [
  { month: "Jan", familiesHoused: 7 },
  { month: "Feb", familiesHoused: 10 },
  { month: "Mar", familiesHoused: 14 },
  { month: "Apr", familiesHoused: 13 },
  { month: "May", familiesHoused: 15 },
  { month: "Jun", familiesHoused: 12 },
  { month: "Jul", familiesHoused: 14 },
  { month: "Aug", familiesHoused: 16 },
  { month: "Sep", familiesHoused: 18 },
  { month: "Oct", familiesHoused: 17 },
];

const pshsDataset: pshsDataPoint[] = [
  { partnerSchool: "Burke High", activeCount: 13, housedCount: 32 },
  { partnerSchool: "TechBoston Academy", activeCount: 20, housedCount: 10 },
  { partnerSchool: "McCormack Middle", activeCount: 10, housedCount: 33 },
  { partnerSchool: "King K-8", activeCount: 14, housedCount: 29 },
  { partnerSchool: "Orchard Gardens K-8", activeCount: 13, housedCount: 33 },
];

const empthySet: pshsDataPoint[] = [];

function drawHorizontalBarChart(svgElement: SVGSVGElement, data: pshsDataPoint[]) {
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
      .domain(data.map((d) => d.partnerSchool))
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
  

function drawLineChart(svgElement: SVGSVGElement, data: fhtDataPoint[]) {
    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();
  
    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    const width = svgElement.clientWidth - margin.left - margin.right;
    const height = svgElement.clientHeight - margin.top - margin.bottom;
  
    const chart = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // scales
    const x = d3
      .scalePoint()
      .domain(data.map((d) => d.month))
      .range([0, width])
      .padding(0.5);
  
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.familiesHoused)!])
      .nice()
      .range([height, 0]);
  
    // --horizontal gridlines
    chart
      .append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-dasharray', '4,3');

    // -- vertical gridlines (from x-axis)
    chart
    .append('g')
    .attr('class', 'grid grid-x')
    .attr('transform', `translate(0, ${height})`)
    .call(
        d3.axisBottom(x)
        .tickSize(-height)
        .tickFormat(() => '')
    )
    .selectAll('line')
    .attr('stroke', '#E5E7EB')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-dasharray', '4,3');

    chart.selectAll('.domain').remove();

  
    // line
    const line = d3
      .line<fhtDataPoint>()
      .x((d) => x(d.month)!)
      .y((d) => y(d.familiesHoused))
      .curve(d3.curveMonotoneX);
  
    chart
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#F47C90')
      .attr('stroke-width', 3)
      .attr('d', line);
  
    // dots
    chart
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (d) => x(d.month)!)
      .attr('cy', (d) => y(d.familiesHoused))
      .attr('r', 10)
      .attr('fill', '#F47C90')
      //.attr('stroke', '#fff')
      //.attr('stroke-width', 2);
  
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
  

export default function D3Demo() {
  const barRef = useRef<SVGSVGElement | null>(null);
  const lineRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (lineRef.current) drawLineChart(lineRef.current, fhtDataSet);
    if (barRef.current) drawHorizontalBarChart(barRef.current, pshsDataset);
  }, []);

    return (
        <div className="bg-[#F5F5F5] flex flex-col items-center space-y-12 mt-10 relative">
            <div className="flex flex-col items-start w-[820px]">
                <h1 className= {poppins.className + " text-3xl font-bold text-[#555555]"}>
                    Overview Dashboard
                </h1>
            </div>
        
            <div className=" bg-[#FFFFFF] w-[773px] h-[404px] rounded-[16px] border-t border-t-[#0000001A] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] p-6 relative">
                {fhtDataSet.length > 0 ? (
                    <>  
                        <h2 
                        className= {poppins.className + "text-lg font-semibold mb-2 text-[#555555] text-left"}
                        >
                        New Intakes vs Families Housed (Monthly)
                        </h2>
                        <svg ref={lineRef } className="w-full h-full"></svg>

                    </>
                ):(
                    <div className="flex flex-col items-center justify-center text-center h-full space-y-3">
                        <Image
                        src={icon}
                        alt="icon"
                        width={40}
                        height={40}
                        />
                        <div className="flex flex-col items-center justify-center text-center">
                            <h1 className={poppins.className + "text-base font-semibold mb-2 text-[#4A5565] "}>
                                No data for this filter — try adjusting date or school
                            </h1>
                            <p className={manrope.className + " text-sm text-center font-semibold mb-2 text-[#6A7282] "}>
                                Switch to a different time period or select All Schools
                            </p>
                        </div>
                        
                    </div>
                )}
                    
            </div>
            <div className="flex justify-center gap-[40px] mt-10 relative">
                <div className="bg-[#FFFFFF] w-[374.5px] h-[428px] rounded-[16px] border-t border-t-[#0000001A] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] p-6">
                    {pshsDataset.length > 0 ? (
                    <>
                        <h2
                            className={poppins.className + "text-[18px]  font-semibold mb-2 text-[#555555] text-left"}
                            >
                            Partner Schools and Homeless Student Count
                        </h2>
                        <svg ref={barRef} className="w-full h-full"></svg>
                    </>
                    ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full space-y-3">
                        <Image
                        src={icon}
                        alt="icon"
                        width={40}
                        height={40}
                        />
                        <div className="flex flex-col items-center justify-center text-center">
                            <h1 className={poppins.className + "text-base font-semibold mb-2 text-[#4A5565] "}>
                                No data for this filter — try adjusting date or school
                            </h1>
                            <p className={manrope.className + " text-sm text-center font-semibold mb-2 text-[#6A7282] "}>
                                Switch to a different time period or select All Schools
                            </p>
                        </div>
                        
                    </div>
                    )}
                </div>

                <div className="bg-[#FFFFFF] w-[374.5px] h-[428px] rounded-[16px] border-t border-t-[#0000001A] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] p-6">
                    {empthySet.length > 0 ? (
                        <>
                            <h2 className= {poppins.className + "text-[18px] font-semibold mb-2 text-[#555555] text-left"}>
                            Emotional Wellbeing & Improvement by Stage
                            </h2>
                            <svg ref={lineRef}></svg>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center h-full space-y-3">
                            <Image
                            src={icon}
                            alt="icon"
                            width={40}
                            height={40}
                            />
                            <div className="flex flex-col items-center justify-center text-center">
                                <h1 className={poppins.className + "text-base font-semibold mb-2 text-[#4A5565] "}>
                                    No data for this filter — try adjusting date or school
                                </h1>
                                <p className={manrope.className + " text-sm text-center font-semibold mb-2 text-[#6A7282] "}>
                                    Switch to a different time period or select  All Schools 
                                </p>
                            </div>
                            
                        </div>
                    )}   
                </div>
            </div>
        
        
        </div>
    );
}
