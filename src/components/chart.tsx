"use client";

import React from "react";
import { Download, Plus } from "lucide-react";
import type { FilterState } from "@/lib/filterStore";
import html2canvas from "html2canvas-pro";
import { LOCATION_LIST, SCHOOL_LIST } from "./FilterBar"
import { chartRegistry } from "@/lib/generateChart";
import { useId } from "react";

interface ChartProps {
    title: string;
    chartType: string;
    children: React.ReactNode;
    appliedFilters?: string; // human-readable display string
    filterState?: Partial<FilterState>; // raw filter state to persist
    onAddToReport?: () => Promise<void> | void;
}

export default function Chart({
    title,
    chartType,
    children,
    appliedFilters,
    filterState,
    onAddToReport,
}: ChartProps) {
    const id = useId(); 

    const handleDownload = () => {
        //initializing element
        const element = document.getElementById(id);
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
                          chartType,
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
        <div className="relative w-full max-w-[900px] overflow-hidden rounded-3xl bg-white shadow-sm">
            {/* Chart */}
            <div
                id={id}
                className="flex w-full min-w-0 flex-col gap-6 p-8"
            >
                <h2 className="pr-24 text-2xl font-semibold text-gray-800">
                    {title}
                </h2>

                {/* Chart Content */}
                <div className="w-full min-w-0">{children}</div>

                {filterState && (
                    <div className="pt-1 text-sm text-gray-600">
                        {(filterState.selectedLocations || []).length > 0 &&  (filterState.selectedLocations || []).length < LOCATION_LIST.length && (
                            <div>
                                <span className="font-medium">Cities: </span>
                                <span>{(filterState.selectedLocations || []).join(", ")}</span>
                                
                            </div>
                        )}

                        {(filterState.selectedSchools || []).length > 0 && (filterState.selectedSchools || []).length < SCHOOL_LIST.length && (
                            <div>
                                <span className="font-medium">Schools: </span>
                                <span>{(filterState.selectedSchools || []).join(", ")}</span>
                                
                            </div>
                        )}

                    
                    
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
