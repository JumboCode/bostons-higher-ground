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
};

type Props = {
  data: housingRecord[];
};

function prepareLineData(records: housingRecord[]) {
  return records
    .filter((r) => r.intakeMonth !== null && r.studentCount !== null)
    .map((r) => ({ x: r.intakeMonth as number, y: r.studentCount as number }));
}

export default function LineChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const lineData = prepareLineData(data);

    const r = containerRef.current;
    r.innerHTML = "";

    const width = 650;
    const height = 350;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const svg = d3.select(r)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain(d3.extent(lineData, d => d.x) as [number, number])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(lineData, d => d.y) as number])
      .range([innerHeight, 0]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const line = d3.line<{x:number,y:number}>()
      .x(d => x(d.x))
      .y(d => y(d.y));

    g.append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x));

    g.append("g")
      .call(d3.axisLeft(y));

  }, [data]);

  return <div ref={containerRef} className="w-full h-[350px]" />;
}