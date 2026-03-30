"use client";

import React from "react";
import { X } from "lucide-react";
import {
    HorizontalBarChart,
    LineChart,
    VerticalBarChart,
    DonutChart,
} from "@/components/charts";
import { type GeneratedChartModel } from "@/lib/generateChart";

interface ChartPreviewModalProps {
    src?: string | null;
    chart?: GeneratedChartModel | null;
    title?: string | null;
    onClose: () => void;
}

function PreviewChart({ chart }: { chart: GeneratedChartModel }) {
    if (chart.chartKey === "families-housed-line") {
        return (
            <LineChart
                data={chart.data}
                xLabel={chart.xLabel}
                yLabel={chart.yLabel}
                width={640}
                height={320}
                className="w-full h-[320px]"
            />
        );
    }

    if (
        chart.chartKey === "family-intake-bar" ||
        chart.chartKey === "days-to-house-bar"
    ) {
        return (
            <VerticalBarChart
                data={chart.data}
                xLabel={chart.xLabel}
                yLabel={chart.yLabel}
                width={640}
                height={320}
                className="w-full h-[320px]"
            />
        );
    }

    if (chart.chartKey === "housing-sources-donut") {
        return (
            <DonutChart
                data={chart.data}
                centerLabel={chart.centerLabel}
                width={640}
                height={320}
                className="w-full h-[380px]"
            />
        );
    }

    return (
        <HorizontalBarChart
            data={chart.data}
            xLabel={chart.xLabel}
            yLabel={chart.yLabel}
            width={640}
            height={320}
            className="w-full"
        />
    );
}

export default function ChartPreviewModal({
    src,
    chart,
    title,
    onClose,
}: ChartPreviewModalProps) {
    if (!src && !chart) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl p-4 max-w-3xl w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="ml-5 text-lg font-semibold text-gray-800">
                        Preview
                    </span>
                    <button
                        onClick={onClose}
                        className="ml-auto text-gray-600 hover:text-gray-800 hover:bg-[#EEEEEE] rounded-md w-8 h-8 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <h2 className="text-lg font-semibold mb-4 mx-5">{title}</h2>
                {chart ? (
                    <div className="w-full rounded-lg border border-gray-200 bg-white p-5">
                        <PreviewChart chart={chart} />
                    </div>
                ) : (
                    src && (
                        <img
                            src={src}
                            alt="Chart Preview"
                            className="w-full rounded-lg aspect-[3/2] object-contain"
                        />
                    )
                )}
            </div>
        </div>
    );
}
