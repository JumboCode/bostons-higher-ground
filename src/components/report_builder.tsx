"use client";

import { useEffect, useState } from "react";
import {
    X,
    GripVertical,
    FileDown,
    FileText as FileTextIcon,
} from "lucide-react";

function ChartEntry({
    title,
    filters,
}: {
    title: string;
    filters: string | null;
}) {
    return (
        <div className="mx-1 border-2 border-gray-200 py-5 pl-4 pr-8 rounded-xl mb-3">
            <div className="flex">
                <GripVertical color="#a9a9a9" className="mt-2 mr-3 w-5 h-5" />
                <div>
                    <div className="text-base font-semibold">{title}</div>
                    <div className="text-sm text-gray-400">
                        {filters ? filters : "No filters applied"}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DownloadButton({
    doctype,
    count,
}: {
    doctype: string;
    count: number;
}) {
    return (
        <div className="flex">
            {count === 0 ? (
                <button className="flex text-gray-200 border-gray-200 border-2 py-2 px-8 rounded-full">
                    <FileDown className="mr-2 mt-0.5 w-5 h-5" />
                    {doctype}
                </button>
            ) : (
                <button className="flex text-gray-700 border-gray-200 border-2 py-2 px-8 rounded-full">
                    <FileDown className="mr-2 mt-0.5 w-5 h-5" />
                    {doctype}
                </button>
            )}
        </div>
    );
}

export type ReportChartEntry = {
    title: string;
    filters: string | null;
};

type ReportBuilderProps = {
    onClose: () => void;
    onCountChange?: (count: number) => void;
};

export default function ReportBuilder({
    onClose,
    onCountChange,
}: ReportBuilderProps) {
    const [charts, setCharts] = useState<ReportChartEntry[]>([]);

    useEffect(() => {
        let active = true;

        const fetchCharts = async () => {
            try {
                const res = await fetch("/api/reports/in-progress");
                if (!res.ok) return;
                const data = (await res.json()) as {
                    charts?: ReportChartEntry[];
                    chartCount?: number;
                };
                if (!active) return;
                const nextCharts = Array.isArray(data.charts)
                    ? data.charts
                    : [];
                setCharts(nextCharts);
                onCountChange?.(nextCharts.length);
            } catch {
                // silently ignore
            }
        };

        fetchCharts();
        const onUpdate = () => fetchCharts();
        window.addEventListener("report-updated", onUpdate);

        return () => {
            active = false;
            window.removeEventListener("report-updated", onUpdate);
        };
    }, [onCountChange]);

    const count = charts.length;

    return (
        <div className="z-50 bg-black/50 backdrop-blur-xs flex justify-end w-screen h-screen">
            <div className="w-full h-full bg-none" onClick={onClose} />
            <div className="relative h-full w-1/3 min-w-[400px] px-10 py-10 rounded-l-lg bg-white">
                <div className="flex">
                    <div className="text-xl font-bold mb-3">Report Builder</div>
                    <button
                        onClick={onClose}
                        className="ml-auto text-gray-600 hover:text-gray-800"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                    {count} {count === 1 ? "chart" : "charts"} added
                </div>
                <hr className="w-full border-gray-200" />

                <div className="my-8">
                    {count > 0 ? (
                        charts.map((chart, idx) => (
                            <ChartEntry
                                key={`${chart.title}-${idx}`}
                                title={chart.title}
                                filters={chart.filters}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 mt-10">
                            <FileTextIcon
                                stroke="#D1D5DC"
                                width="60"
                                height="60"
                            />
                            <p className="mt-8 text-center text-md mb-2">
                                No charts added yet. Click the "+" icon on any
                                chart to add it to your Report
                            </p>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-5 left-0 w-full">
                    <hr className="border-gray-200" />

                    <div className="mt-5 flex justify-evenly w-full py-2">
                        <DownloadButton doctype="PDF" count={count} />
                        <DownloadButton doctype="CSV" count={count} />
                        <DownloadButton doctype="PNG" count={count} />
                    </div>
                </div>
            </div>
        </div>
    );
}
