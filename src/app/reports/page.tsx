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
    Info,
} from "lucide-react";
import ReportChart from "@/components/ReportChart";
import { type StoredChart } from "@/lib/generateChart";
import ChartPreview from "@/components/chartPreview";

import ReportNameInput from "./reportNameInput";
import ReportExportButton from "./reportExportButtons";
import { ReportChartEntry } from "@/components/report_builder";
import { usePdfMetadataStore } from "@/lib/pdfMetadataStore";

function DraftReportPopulated({ onArchived }: { onArchived: () => void }) {
    const [charts, setCharts] = useState<StoredChart[]>([]);
    const [archiving, setArchiving] = useState(false);
    const filename = usePdfMetadataStore((s) => s.filename);

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
                        <button className="flex flex-row items-center space-x-4 ">
                            <Trash2 className="w-[16] h-[16] " />
                            <p className="font-medium text-sm">Clear</p>
                        </button>
                    </div>
                </div>
                <ReportNameInput />
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
                <div className="ExportOptions flex flex-col md:flex-row md:space-x-3 space-y-3 w-full">
                    <ReportExportButton />
                    <button
                        disabled={archiving || charts.length === 0}
                        onClick={async () => {
                            setArchiving(true);
                            try {
                                const res = await fetch("/api/reports/upload-pdf", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ title: filename }),
                                });
                                if (res.ok) {
                                    onArchived();
                                } else {
                                    const data = await res.json();
                                    console.error("Archive failed:", data.error);
                                }
                            } catch (err) {
                                console.error("Failed to archive report", err);
                            } finally {
                                setArchiving(false);
                            }
                        }}
                        className="flex flex-row items-center space-x-4 border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 min-w-40 h-10 hover:bg-[#E76C82] transition-colors duration-150 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArchiveIcon className="w-4 h-4" />
                        <div className="font-medium">
                            {archiving ? "Saving..." : "Save to Archive"}
                        </div>
                    </button>
                </div>
                <ChartPreview
                    chart={previewChart}
                    title={previewTitle}
                    onClose={() => setPreviewChart(null)}
                />
            </div>
        </div>
    );
}

type ArchivedReport = {
    url: string;
    pathname: string;
    uploadedAt: string;
    size: number;
};

function ReportEntry({
    report,
    onDelete,
}: {
    report: ArchivedReport;
    onDelete: (url: string) => void;
}) {
    const date = new Date(report.uploadedAt);
    // Derive a display name from the pathname (e.g. "October_2025_Housing_Report")
    const filename = report.pathname.split("/").pop() ?? "report.pdf";
    const displayName = filename.replace(/\.pdf$/, "").replace(/[_-]/g, " ").replace(/ +/g, " ").trim();

    return (
        <div className="items-center flex px-4 py-4 border border-[rgba(0,0,0,0.1)] rounded-2xl mb-4 bg-white">
            <div className="flex grow flex-row h-full space-x-6 items-center">
                <div className="flex grow flew-row items-center space-x-5">
                    <div className="w-10 h-10 border-0 bg-[#F3E8FF] rounded-[16] flex justify-center items-center ">
                        <FileText className="text-[#E76C82]" />
                    </div>
                    <div className="flex-col space-y-1">
                        <h3 className="text-[#555555] font-semibold">
                            {displayName}
                        </h3>
                        <div className="flex flew-row space-x-2 items-center">
                            <div className="flex flex-row items-center space-x-1">
                                <Calendar className="w-3 h-3 text-[#4A5565] stroke-2" />
                                <p className="text-[#4A5565] text-xs">
                                    {date.toLocaleDateString("en-US", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                            <div className="text-xs">&middot;</div>
                            <div className="text-[#4A5565] text-xs">
                                {(report.size / 1024).toFixed(0)} KB
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <a
                        href={report.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download PDF"
                    >
                        <Download className="stroke-[1.33px] text-gray-600 h-[18px]" />
                    </a>
                    <button
                        onClick={() => onDelete(report.url)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete report"
                    >
                        <Trash2 className="w-[16px] h-[16px] text-gray-600 hover:text-red-500" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function ArchivedReportsSection({
    refreshKey,
}: {
    refreshKey: number;
}) {
    const [reports, setReports] = useState<ArchivedReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/reports/upload-pdf");
                if (!res.ok) return;
                const data = await res.json();
                setReports(data.reports || []);
            } catch (err) {
                console.error("Failed to fetch archived reports", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [refreshKey]);

    const handleDelete = async (url: string) => {
        setReports((prev) => prev.filter((r) => r.url !== url));
        try {
            await fetch("/api/reports/upload-pdf", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
        } catch (err) {
            console.error("Failed to delete report", err);
        }
    };

    return (
        <div className="flex flex-col gap-y-4">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#555555]">
                    Archived Reports
                </h2>
                <span className="relative inline-flex group">
                    <Info
                        className="w-4 h-4 text-[#555555] group-hover:text-[#E76C82] transition-colors"
                        aria-label="Archived reports info"
                    />
                    <span
                        role="tooltip"
                        className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-2 w-[320px] rounded-xl bg-[rgba(239,246,255,1)] px-2 py-2 text-left text-sm text-[rgba(28,57,142,1)] shadow-lg ring-1 ring-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        The system can save a maximum of 20 archived reports.
                        When the limit is reached, you&apos;ll need to remove old
                        reports before saving new ones.
                    </span>
                </span>
            </div>
            {loading ? (
                <p className="text-gray-400 text-sm">Loading archived reports...</p>
            ) : reports.length === 0 ? (
                <p className="text-gray-400 text-sm">No archived reports yet.</p>
            ) : (
                reports.map((report) => (
                    <ReportEntry
                        key={report.url}
                        report={report}
                        onDelete={handleDelete}
                    />
                ))
            )}
        </div>
    );
}

export default function Archive() {
    const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);

    return (
        <main className="bg-[#F5F5F5] p-10 flex flex-col gap-y-10 pt-12.5">
            <h1 className="text-4xl font-extrabold text-[#555555] gap-8">
                Reports
            </h1>
            <DraftReportPopulated
                onArchived={() => setArchiveRefreshKey((k) => k + 1)}
            />
            <ArchivedReportsSection refreshKey={archiveRefreshKey} />
        </main>
    );
}
