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


function DraftReportPopulated() {
    const [charts, setCharts] = useState<StoredChart[]>([]);
    const [showClearModal, setShowClearModal] = useState(false);

    const handleClear = async () => {
    // lear UI immediately
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

    // Fetch charts once when component mounts
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
        // Update UI immediately
        const nextCharts = charts.filter((_, i) => i !== index);
        setCharts(nextCharts);

        // Delete from backend
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

    // Preview popup
    // const [previewSrc, setPreviewSrc] = React.useState<string | null>(null);
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
        } catch {
            // ignore network errors for now
        }
    };
    const [isArchivePopupOpen, setIsArchivePopupOpen] = useState(false);//pop up - auto false
    useEffect(() => {//timer 
    if (isArchivePopupOpen) {
        // Set a timer to close the toast after 5000 milliseconds (5 seconds)
        const timer = setTimeout(() => {
            setIsArchivePopupOpen(false);
        }, 5000);
        
        // Cleanup the timer if the component unmounts early
        return () => clearTimeout(timer); 
        }
        }, [isArchivePopupOpen]);
    return (
        <div className="flex flex-col grow bg-white mb-6 border rounded-2xl py-6 px-6 border-[rgba(0,0,0,0.1)] space-y-10">
            <div className="ReportNameEditBar space-y-2">
                <div className="DraftHeading+NoOfChartsAdded+ClearButton flex flex-row items-center">
                    <div className="Name+ChartNoDisplay">
                        <h2 className="text-[#555555] text-lg font-semibold">
                            Draft Report
                        </h2>
                        <p className="text-sm">
                            {charts.length}{" "}
                            {charts.length === 1 ? "chart" : "charts"} added
                            from dashboard
                        </p>
                    </div>
                    <div className="ClearButton ml-auto border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 hover:bg-[#E76C82] transition-colors duration-150 hover:text-white">
                        <button
                            onClick={() => setShowClearModal(true)}
                            className="flex flex-row items-center space-x-4 "
                        >
                            <Trash2 className="w-[16] h-[16] " />
                            <p className="font-medium text-sm">Clear</p>
                        </button>
                    </div>
                </div>
                {charts.length > 0 && <ReportNameInput />}
            </div>
            <div className="w-full overflow-x-hidden">
                <div className="Reports flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0 w-full pb-5">
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
                            Add charts using the &quot;+&quot; buttons to see
                            them here.
                        </p>
                    )}
                </div>
                {charts.length > 0 && (
                    <div className="ExportOptions flex flex-col md:flex-row md:space-x-3 space-y-3 w-full">
                        <ReportExportButton />
                        <button className="flex flex-row items-center space-x-4 border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 min-w-40 h-10 hover:bg-[#E76C82] transition-colors duration-150 hover:text-white">
                            <ArchiveIcon className="w-4 h-4" />
                            <div className="font-medium">Save to Archive</div>
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
                        onClick={() => setShowClearModal(false)} // ADDED: clicking the backdrop dismisses the modal
                    >
                        <div
                            className="bg-white rounded-3xl px-4 py-8 w-[360px] shadow-lg relative"
                            onClick={(e) => e.stopPropagation()} // ADDED: prevents backdrop click from firing when clicking inside modal
                        >
                            {/* ADDED: X button to dismiss modal */}
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                            >
                                <X className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                            <h2 className="text-xl font-bold text-center text-[#555555]">
                                Clear Draft Report
                            </h2>
                            <p className="text-sm text-center text-gray-500 mt-2">
                                Are you sure you want to clear the draft report?
                                <br />
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-between mt-6 gap-3">
                                {/* ADDED: Cancel button — closes modal without clearing */}
                                <button
                                    onClick={() => setShowClearModal(false)}
                                    className="w-full border rounded-xl py-2 text-sm hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                {/* ADDED: Confirm button — calls handleClear to clear charts and close modal */}
                                <button
                                    onClick={handleClear}
                                    className="w-full bg-[#E76C82] text-white rounded-xl py-2 text-sm hover:opacity-90"
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

export function ReportEntry({
    title,
    date,
    schools,
    category,
    numOfCharts,
}: {
    title: string;
    date: Date;
    schools: string;
    category: string;
    numOfCharts: number;
}) {
    return (
        <div className="items-center flex px-4 py-4 border border-[rgba(0,0,0,0.1)] rounded-2xl mb-4 bg-white">
            <div className="flex grow flex-row h-full space-x-6 items-center">
                <div className="flex grow flew-row items-center space-x-5">
                    {" "}
                    {/* container*/}
                    <div className="w-10 h-10 border-0 bg-[#F3E8FF] rounded-[16] flex justify-center items-center ">
                        <FileText className="text-[#E76C82]" />
                    </div>
                    <div className="flex-col space-y-1">
                        <div className="">
                            {" "}
                            {/*title of report*/}
                            <h3 className="text-[#555555] font-semibold">
                                {title}
                            </h3>
                        </div>
                        <div className="flex flew-row space-x-2 items-center">
                            {" "}
                            {/*items below title*/}
                            <div className="flex flex-row items-center space-x-1 ">
                                <Calendar className="w-3 h-3 text-[#4A5565] stroke-2" />
                                <p className="text-[#4A5565] text-xs">
                                    {date.toLocaleDateString("en-US", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>{" "}
                            {/*Date of report*/}
                            <div className="text-xs">&middot;</div> {/*dot*/}
                            <div className="text-[#4A5565] text-xs">
                                {" "}
                                {schools}{" "}
                            </div>{" "}
                            {/*schools*/}
                            <div className="text-xs">&middot;</div> {/*dot*/}
                            <div className="text-[#4A5565] text-xs border border-gray-300 rounded-full px-2">
                                {" " + category + " "}
                            </div>{" "}
                            {/*housing*/}
                            <div className="text-xs">&middot;</div> {/*dot*/}
                            <div className="text-[#4A5565] text-xs">
                                {" "}
                                {numOfCharts} charts
                            </div>{" "}
                            {/*number of charts*/}
                        </div>
                    </div>
                </div>

                <div className="button">
                    <Download className="stroke-[1.33px] text-gray-600 h-[18px] mx-2" />
                </div>
            </div>
        </div>
    );
}

export default function Archive() {
    return (
        <main className="bg-[#F5F5F5] p-10 flex flex-col gap-y-10 pt-12.5">
            <h1 className="text-4xl font-extrabold text-[#555555] gap-8">
                Reports
            </h1>
            <DraftReportPopulated />
            <div className="flex flex-col gap-y-4">
                <h2 className="text-xl font-extrabold text-[#555555] gap-8">
                    Archived Reports
                </h2>
                <ReportEntry
                    title="Q4 Report 2025"
                    date={new Date(2025, 0, 4)}
                    schools="All Schools"
                    category="Housing"
                    numOfCharts={4}
                />
            </div>
        </main>
    );
}
