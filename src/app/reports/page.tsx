"use client";

import { useState, useEffect } from "react";
import React from "react";
import { type GeneratedChartModel } from "@/lib/generateChart";
import {
    Download,
    Calendar,
    Trash2,
    FileText,
    ArchiveIcon,
    X,
} from "lucide-react";
import ReportChart from "@/components/ReportChart";
import { type StoredChart } from "@/lib/generateChart";
import ChartPreview from "@/components/chartPreview";

import ReportNameInput from "./reportNameInput";
import ReportExportButton from "./reportExportButtons";
import { ReportChartEntry } from "@/components/report_builder";
import { usePdfMetadataStore } from "@/lib/pdfMetadataStore"; // ✅ NEW

function DraftReportPopulated() {
    const [charts, setCharts] = useState<StoredChart[]>([]);
    const [showClearModal, setShowClearModal] = useState(false);

    // ✅ USE ZUSTAND INSTEAD OF useState
    const reportName = usePdfMetadataStore((s) => s.filename);

    const handleClear = async () => {
        setCharts([]);
        setShowClearModal(false);

        try {
            await fetch("/api/reports/in-progress", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clearAll: true }),
            });
        } catch (err) {
            console.error("Failed to clear report", err);
        }
    };

    useEffect(() => {
        const fetchCharts = async () => {
            try {
                const res = await fetch("/api/reports/in-progress");
                if (!res.ok) return;
                const data = await res.json();
                setCharts(data.charts || []);
            } catch (err) {
                console.error("Failed to fetch in-progress charts", err);
            }
        };

        fetchCharts();
    }, []);

    const handleDelete = async (index: number) => {
        const nextCharts = charts.filter((_, i) => i !== index);
        setCharts(nextCharts);

        try {
            await fetch("/api/reports/in-progress", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ index }),
            });
        } catch (err) {
            console.error("Failed to delete chart", err);
        }
    };

    const [previewChart, setPreviewChart] =
        React.useState<GeneratedChartModel | null>(null);
    const [previewTitle, setPreviewTitle] = React.useState<string | null>(null);

    const handlePreview = async (chart: ReportChartEntry) => {
        try {
            const res = await fetch("/api/reports/chart-preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(chart),
            });
            if (!res.ok) return;

            const payload = (await res.json()) as {
                model?: GeneratedChartModel;
            };
            setPreviewChart(payload.model ?? null);
            setPreviewTitle(chart.title);
        } catch {}
    };

    const [isArchivePopupOpen, setIsArchivePopupOpen] = useState(false);

    useEffect(() => {
        if (isArchivePopupOpen) {
            const timer = setTimeout(() => {
                setIsArchivePopupOpen(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isArchivePopupOpen]);

    // ✅ DUPLICATE NAME LOGIC
    const handleSaveToArchive = async () => {
        try {
            const baseName = reportName?.trim() || "Untitled Report";

            const res = await fetch("/api/reports/archive");
            const data = await res.json();
            const existingNames = data.reports.map((r: any) => r.title);

            let newName = baseName;
            let counter = 1;

            while (existingNames.includes(newName)) {
                newName = `${baseName} (${counter})`;
                counter++;
            }

            await fetch("/api/reports/archive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newName,
                    charts,
                }),
            });

            setIsArchivePopupOpen(true);
        } catch (err) {
            console.error("Failed to save report", err);
        }
    };

    return (
        <div className="flex flex-col grow bg-white mb-6 border rounded-2xl py-6 px-6 border-[rgba(0,0,0,0.1)] space-y-10">
            <div className="space-y-2">
                <div className="flex flex-row items-center">
                    <div>
                        <h2 className="text-[#555555] text-lg font-semibold">
                            Draft Report
                        </h2>
                        <p className="text-sm">
                            {charts.length}{" "}
                            {charts.length === 1 ? "chart" : "charts"} added
                            from dashboard
                        </p>
                    </div>

                    <div className="ml-auto border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 hover:bg-[#E76C82] hover:text-white">
                        <button
                            onClick={() => setShowClearModal(true)}
                            className="flex flex-row items-center space-x-4"
                        >
                            <Trash2 className="w-[16] h-[16]" />
                            <p className="font-medium text-sm">Clear</p>
                        </button>
                    </div>
                </div>

                {charts.length > 0 && <ReportNameInput />}
            </div>

            <div className="w-full overflow-x-hidden">
                <div className="flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0 w-full pb-5">
                    {charts.length > 0 ? (
                        charts.map((chart, idx) => (
                            <ReportChart
                                key={`${chart.title}-${idx}`}
                                title={chart.title}
                                onDelete={() => handleDelete(idx)}
                                onPreview={() => handlePreview(chart)}
                            />
                        ))
                    ) : (
                        <p className="px-4 text-gray-400">
                            Add charts using the "+" buttons to see them here.
                        </p>
                    )}
                </div>

                {charts.length > 0 && (
                    <div className="flex flex-col md:flex-row md:space-x-3 space-y-3 w-full">
                        <ReportExportButton />

                        <button
                            onClick={handleSaveToArchive}
                            className="flex flex-row items-center space-x-4 border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 min-w-40 h-10 hover:bg-[#E76C82] hover:text-white"
                        >
                            <ArchiveIcon className="w-4 h-4" />
                            <div className="font-medium">
                                Save to Archive
                            </div>
                        </button>
                    </div>
                )}

                <ChartPreview
                    chart={previewChart}
                    title={previewTitle}
                    onClose={() => setPreviewChart(null)}
                />

                {showClearModal && (
                    <div
                        className="fixed inset-0 flex items-center justify-center bg-black/30 z-50"
                        onClick={() => setShowClearModal(false)}
                    >
                        <div
                            className="bg-white rounded-3xl px-4 py-8 w-[360px] shadow-lg relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="absolute top-4 right-4"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <h2 className="text-xl font-bold text-center">
                                Clear Draft Report
                            </h2>

                            <div className="flex justify-between mt-6 gap-3">
                                <button
                                    onClick={() =>
                                        setShowClearModal(false)
                                    }
                                    className="w-full border rounded-xl py-2"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleClear}
                                    className="w-full bg-[#E76C82] text-white rounded-xl py-2"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DraftReportPopulated;