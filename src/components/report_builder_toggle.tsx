"use client";
"use client";

import { useState, useEffect } from "react";
import ReportBuilder from "./report_builder";
import { FileText, Circle } from "lucide-react";

export default function ReportBuilderToggle() {
    const [showRB, setShowRB] = useState(false);
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch("/api/reports/in-progress");
                if (!res.ok) return;
                const data = (await res.json()) as {
                    chartCount?: number;
                    charts?: { title: string; filters: string | null }[];
                };
                const nextCount =
                    typeof data.chartCount === "number"
                        ? data.chartCount
                        : Array.isArray(data.charts)
                          ? data.charts.length
                          : 0;
                setCount(nextCount);
            } catch {
                // ignore
            }
        };

        fetchCount();
        const onUpdate = () => fetchCount();
        window.addEventListener("report-updated", onUpdate);
        return () => window.removeEventListener("report-updated", onUpdate);
    }, []);

    // Prevent body scroll when report builder is open
    useEffect(() => {
        if (showRB) {
            // Save current scroll position
            const scrollY = window.scrollY;
            document.body.style.position = "fixed";
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = "100%";
            document.body.style.overflow = "hidden";
        } else {
            // Restore scroll position
            const scrollY = document.body.style.top;
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.width = "";
            document.body.style.overflow = "";
            window.scrollTo(0, parseInt(scrollY || "0") * -1);
        }

        // Cleanup on unmount
        return () => {
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.width = "";
            document.body.style.overflow = "";
        };
    }, [showRB]);

    return (
        <div>
            {!showRB ? (
                <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50">
                    <button
                        id="showRBbutton"
                        onClick={() => setShowRB(true)}
                        className="flex-col h-fit py-8 bg-white drop-shadow-md text-gray-600 hover:text-gray-800 px-4 py-3 rounded-lg shadow-md transition-all"
                    >
                        <FileText className="justify-self-center ml-1 mr-2 my-1 w-5 h-5" />
                        Report
                        {/* Number of graphs added, only show alert when there are graphs */}
                        {count > 0 && (
                            <div className="relative block mt-1 mx-auto w-fit">
                                <Circle className="w-5 h-5 fill-[#E76C82] stroke-[#E76C82]" />
                                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                                    {count}
                                </span>
                            </div>
                        )}
                    </button>
                </div>
            ) : (
                <>
                    <ReportBuilder
                        onClose={() => setShowRB(false)}
                        onCountChange={setCount}
                    />
                </>
            )}
        </div>
    );
}
