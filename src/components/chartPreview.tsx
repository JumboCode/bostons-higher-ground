"use client";

import React from "react";
import { X } from "lucide-react";
import { ChartRenderer } from "@/components/charts";
import { type GeneratedChartModel } from "@/lib/generateChart";

interface ChartPreviewModalProps {
    src?: string | null;
    chart?: GeneratedChartModel | null;
    title?: string | null;
    onClose: () => void;
}

function PreviewChart({ chart }: { chart: GeneratedChartModel }) {
    const height = chart.type === "donut" ? 320 : chart.type === "horizontal-bar" ? 550 : 400;
    const width = chart.type === "vertical-bar" || chart.type === "donut" ? 600 : 700;

    return <ChartRenderer model={chart} width={width} height={height} className="w-full" />;
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
                    <div className="w-full h-[520px] rounded-lg border border-gray-200 bg-white p-5 pt-5">
                        <PreviewChart chart={chart} />
                    </div>
                ) : (
                    src && (
                        <img
                            src={src}
                            alt="Chart Preview"
                            className="w-full rounded-lg object-contain"
                        />
                    )
                )}
            </div>
        </div>
    );
}
