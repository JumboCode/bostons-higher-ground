"use client";

import React from "react";
import { Download, Plus } from "lucide-react";

interface ChartProps {
    title: string;
    children: React.ReactNode;
    appliedFilters?: string;
}

export default function Chart({ title, children, appliedFilters }: ChartProps) {
    const handleDownload = () => {
        console.log("Download chart:", title);
    };

    const handleAdd = () => {
        console.log("Add action for:", title);
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-6 w-full max-w-[900px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                    {title}
                </h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownload}
                        className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Download chart"
                    >
                        <Download className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={handleAdd}
                        className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Add"
                    >
                        <Plus className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Chart Content */}
            <div>{children}</div>

            {/* Applied Filters */}
            {appliedFilters && (
                <div className="text-sm text-gray-600">
                    <span className="font-medium">Applied filters: </span>
                    <span>{appliedFilters}</span>
                </div>
            )}
        </div>
    );
}
