"use client";

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { Poppins, Manrope } from "next/font/google";
import { getAllData } from "@/lib/getAllData";

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
    .sort((a, b) => (b.activeCount + b.housedCount) - (a.activeCount + a.housedCount));

  return data;
}

function drawHorizontalBarChart(svgElement: SVGSVGElement, data: LocationDataPoint[]) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const margin = { top: 60, right: 80, bottom: 100, left: 140 };

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

  const maxValue = d3.max(data, (d) => Math.max(d.activeCount, d.housedCount)) || 0;
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
    .attr("transform", `translate(${width / 2 - 80}, ${height + 70})`)
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

export default function D3TestingVansh() {
  const chartRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<LocationDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const records = await getAllData();
        console.log("Data from getAllData():", records);
        const processedData = processData(records as HousingRecord[]);
        console.log("Processed data:", processedData);
        setData(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      drawHorizontalBarChart(chartRef.current, data);
    }
  }, [data]);

  return (
    <div className="bg-[#F5F5F5] flex flex-col items-center space-y-6 mt-10 p-6">
      <div className="bg-[#FFFFFF] w-full max-w-4xl rounded-2xl border-t border-t-[#0000001A] p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2
              className={`${poppins.className} text-xl font-semibold mb-2 text-[#555555] text-left`}
            >
              Active vs Housed Families by Location
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <p className={`${manrope.className} text-[#767676]`}>Loading data...</p>
          </div>
        ) : data.length > 0 ? (
          <div className="relative">
            <svg ref={chartRef} className="w-full h-[500px]"></svg>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className={`${manrope.className} text-[#767676]`}>
              No data available
            </p>
          </div>
        )}

        <div className="mt-4">
          <p className={`${manrope.className} text-sm`}>
            Applied filters: Fiscal Year 2025
          </p>
        </div>
      </div>
    </div>
  );
}