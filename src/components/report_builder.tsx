"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import ChartPreview from "@/components/chartPreview";
import html2canvas from "html2canvas-pro";
import {
    X,
    GripVertical,
    FileDown,
    FileText as FileTextIcon,
    ArrowUp,
    ArrowDown,
    Eye,
    EyeClosed,
} from "lucide-react";


function ChartEntry({
    title,
    filters,
    onDelete,
    onPreview,
    index,
}: {
    title: string;
    filters: string | null;
    onDelete: () => Promise<void> | void;
    onPreview: () => void;
    index: number;
}) {
    return (
        <div className="group relative bg-white border border-gray-200 
        rounded-2xl px-5 py-4 mb-4 transition-all duration-200 hover:shadow-md 
        hover:border-gray-300">

            {/* Remove button (only on hover) */}
            <button
                onClick={onDelete}
                className="
                    absolute top-0 right-0
                    translate-x-1/2 -translate-y-1/2
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200

                    w-6 h-6
                    flex items-center justify-center
                    rounded-full
                    bg-gray-100
                    text-gray-400
                    shadow-md

                    hover:bg-rose-100
                    hover:text-rose-500"
                >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 text-gray-900 
            transition-colors duration-200 group-hover:text-rose-500">
                
                {/* Number circle */}
                <div className="flex items-center justify-center w-6 h-6 
                rounded-full bg-rose-100 text-rose-500 text-xs font-semibold">
                    {index}
                </div>

                {/* Text content */}
                <div className="flex-1">
                    <div className="text-base font-semibold ">
                        {title}
                    </div>
                </div>
                
                {/* Eye icon */}
                <div
                    className="cursor-pointer transition-colors"
                    onClick={onPreview}
                >
                    <Eye className="w-5 h-5" />
                </div>

            </div>
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
    const scrollYRef = useRef(0);

    useEffect(() => {
        scrollYRef.current = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollYRef.current}px`;
        document.body.style.width = "100%";

        return () => {
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.width = "";
            window.scrollTo(0, scrollYRef.current);
        };
    }, []);


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

    const handleDelete = async (index: number) => {
        const next = charts.filter((_, i) => i !== index);
        setCharts(next);
        onCountChange?.(next.length);

        try {
            const res = await fetch("/api/reports/in-progress", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ index }),
            });
            if (!res.ok) {
                const retry = await fetch("/api/reports/in-progress");
                if (retry.ok) {
                    const data = (await retry.json()) as {
                        charts?: ReportChartEntry[];
                    };
                    const nextCharts = Array.isArray(data.charts)
                        ? data.charts
                        : [];
                    setCharts(nextCharts);
                    onCountChange?.(nextCharts.length);
                }
            }
        } catch {
            // ignore network errors for now
        }

        window.dispatchEvent(new Event("report-updated"));
    };

    const handleMove = async (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= charts.length) return;

        setCharts((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            onCountChange?.(next.length);
            return next;
        });

        try {
            const res = await fetch("/api/reports/in-progress", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fromIndex, toIndex }),
            });
            if (!res.ok) {
                const retry = await fetch("/api/reports/in-progress");
                if (retry.ok) {
                    const data = (await retry.json()) as {
                        charts?: ReportChartEntry[];
                    };
                    const nextCharts = Array.isArray(data.charts)
                        ? data.charts
                        : [];
                    setCharts(nextCharts);
                    onCountChange?.(nextCharts.length);
                }
            }
        } catch {
            // ignore network errors for now
        }

        window.dispatchEvent(new Event("report-updated"));
    };

    const count = charts.length;
    const router = useRouter();

    const [previewSrc, setPreviewSrc] = React.useState<string | null>(null);

    const handlePreview = () => {
        const element = document.getElementById("chartElement");
        if (!element) {
            console.log("element not found");
            return;
        }
        html2canvas(element, { useCORS: true }).then((canvas) => {
            setPreviewSrc(canvas.toDataURL("image/png"));
        });
    };

    return (
    <div className="fixed inset-0 z-50">
        
        {/* Dark overlay */}
        <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
        />

        {/* Sidebar */}
        <div
            className="
                absolute right-0 top-0
                h-full w-1/3 min-w-[400px]
                rounded-l-lg
                bg-white
                flex flex-col
            "
        >
            <div className="px-10 pt-10 pb-6">
                <div className="flex items-center">
                    <div className="text-xl font-bold">Report Builder</div>
                    <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center ml-auto text-gray-600 hover:text-gray-800 hover:bg-[#EEEEEE] rounded-md p-1 transition-colors"
                    >
                    <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="text-sm text-gray-500 mt-3">
                    {count} {count === 1 ? "chart" : "charts"} added
                </div>

                <hr className="border-gray-200 mt-4" />
            </div>

            <div className="flex-1 overflow-y-auto px-10 pt-6 pb-8">
                {count > 0 ? (
                charts.map((chart, idx) => (
                    <ChartEntry
                        key={`${chart.title}-${idx}`}
                        title={chart.title}
                        filters={chart.filters}
                        onDelete={() => handleDelete(idx)}
                        onPreview={() => handlePreview()}
                        index={idx + 1}
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
                        No charts added yet. Click the &quot;+&quot; icon on any chart to add it to your Report
                    </p>
                </div>
                )}
            </div>
            <div className="px-10 pb-6 pt-4 border-t">
                <div className="mt-3 flex w-full py-2">
                    <button
                        disabled={charts.length === 0}
                        onClick={() => router.push("/reports")}
                        className={`w-full px-3 py-3 rounded-full text-white font-medium transition-colors ${
                        charts.length > 0
                            ? "bg-[#E76C82] hover:bg-[#d9566e] cursor-pointer"
                            : "bg-[#E59AA8] cursor-not-allowed"
                        }`}
                    >
                        Go to Reports Tab
                    </button>
                </div>
            </div>
        </div>
        <ChartPreview src={previewSrc} onClose={() => setPreviewSrc(null)} />
    </div>
    );
}
