"use client";

import { useState, useEffect } from "react";
import ReportBuilder from "./report_builder";
import { File, Circle } from "lucide-react";

export default function ReportBuilderToggle() {
    const [showRB, setShowRB] = useState(false);
    const [count, setCount] = useState(0);

    const fetchCount = async () => {
        try {
            const res = await fetch("/api/reports/in-progress");
            if (!res.ok) return;
            const data = await res.json();
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

    useEffect(() => {
        fetchCount();

        const onUpdate = () => fetchCount();
        window.addEventListener("report-updated", onUpdate);

        return () =>
            window.removeEventListener("report-updated", onUpdate);
    }, []);

    useEffect(() => {
        // When builder closes, refresh the count
        if (!showRB) {
            fetchCount();
        }
    }, [showRB]);

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
                <div className="fixed bottom-8 right-8 z-50 group">
                    <button
                        id="showRBbutton"
                        onClick={() => setShowRB(true)}
                        className="relative w-14 h-14 rounded-full text-white
                        bg-[#D86A7A] flex items-center shadow-xl transition-all 
                        duration-300 ease-in-out group-hover:w-44 overflow-hidden">
                        {/* Icon */}
                        <div className="flex items-center justify-center 
                        w-14 h-14 shrink-0">
                            <File className="w-6 h-6" />
                        </div>
                        {/* Expanding Text */}
                        <span className="whitespace-nowrap opacity-0 
                        group-hover:opacity-100 transition-opacity duration-200 
                        pr-6 text-lg font-semibold">
                            Report
                        </span>
                        {/* Yellow Count Badge */}
                        {count > 0 && (
                            <div
                            className="absolute top-2 right-2 
                            group-hover:top-1/2 group-hover:-translate-y-1/2 
                            transition-all duration-300 w-5 h-5 rounded-full
                            bg-yellow-300 text-black text-xs font-bold flex 
                            items-center justify-center shadow">
                                {count}
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
