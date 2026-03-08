"use client";

import React from "react";
import { Download, Plus } from "lucide-react";
import type { FilterState } from "@/lib/filterStore";
import html2canvas from "html2canvas-pro";

interface ChartProps {
    title: string;
    children: React.ReactNode;
    appliedFilters?: string; // human-readable display string
    filterState?: Partial<FilterState>; // raw filter state to persist
    onAddToReport?: () => Promise<void> | void;
}

export default function Chart({
    title,
    children,
    appliedFilters,
    filterState,
    onAddToReport,
}: ChartProps) {
    const handleDownload = () => {
        //initializing element
        const element = document.getElementById("chartElement");
        if (!element) {
            return;
        }
        //chart container to canvas
        html2canvas(element, { useCORS: true })
            .then((canvas) => {
                //generate image
                const image = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = image;
                console.log(link.href);
                link.download = title + ".png";
                // programmatically click the link so that the image automatically downloads
                link.click();
            })
            .catch((err) => {
                console.error("Unable to take screenshot.");
            });
    };

    const handleAdd = onAddToReport
        ? () => onAddToReport()
        : async () => {
              try {
                  await fetch("/api/reports/in-progress", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                          title,
                          filters: filterState
                              ? JSON.stringify(filterState)
                              : (appliedFilters ?? null),
                      }),
                  });
                  window.dispatchEvent(new Event("report-updated"));
              } catch (error) {
                  console.error("Failed to add chart to report", error);
              }
          };

    return (
        <div className="relative bg-white rounded-3xl shadow-sm mb-6 w-160 h-150">
            {/* Chart */}
            <div
                id="chartElement"
                className="flex flex-col w-full h-full gap-y-10 p-8"
            >
                <h2 className="pr-24 text-2xl font-semibold text-gray-800">
                    {title}
                </h2>

                {/* Chart Content */}
                <div className="flex-1">{children}</div>

                {/* Applied Filters */}
                {appliedFilters && (
                    <div className="pt-1 text-sm text-gray-600">
                        <span className="font-medium">Applied filters: </span>
                        <span>{appliedFilters}</span>
                    </div>
                )}
            </div>

            <div className="absolute top-8 right-8 flex items-center gap-3">
                <button
                    onClick={handleDownload}
                    className="p-2.5 rounded-2xl hover:bg-gray-100 cursor-pointer transition-colors"
                    aria-label="Download chart"
                >
                    <Download className="w-5 h-5 text-gray-600" />
                </button>
                <button
                    onClick={handleAdd}
                    className="p-2.5 rounded-2xl hover:bg-red-100 cursor-pointer hover:text-white transition-colors"
                    aria-label="Add"
                >
                    <Plus className="w-5 h-5 text-gray-600" />
                </button>
            </div>
        </div>
    );
}
