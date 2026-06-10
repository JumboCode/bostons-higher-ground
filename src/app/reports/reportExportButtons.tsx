"use client";

import { Download } from "lucide-react";
import { usePdfMetadataStore } from "@/lib/pdfMetadataStore";
import { useRouter } from "next/navigation";// include router

export default function ReportExportButton() {
    const filename = usePdfMetadataStore((s) => s.filename);
    const setTitleError = usePdfMetadataStore((s) => s.setTitleError);
    const router = useRouter(); // declare router


    async function setPdfTitle() {
        // Validate title before submission so users aren't left wondering why nothing happened.
        const trimmed = filename.trim();
        if (!trimmed) {
            setTitleError("Please enter a report name before exporting.");
            return;
        }
        setTitleError(null);

        try {
            const res = await fetch("/api/reports/in-progress", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: trimmed,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setTitleError(data?.error || "Failed to update report name.");
                return;
            }
            router.push("/preview");

        } catch (error) {
            console.error(error);
            setTitleError("Something went wrong. Please try again.");
        }
    }

    const baseBtn =
        "flex flex-row items-center space-x-4 border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 min-w-40 h-10 hover:bg-[#E76C82] transition-colors duration-150 hover:text-white";

    return (
        <div className="ExportOptions flex flex-col md:flex-row md:space-x-3 space-y-3">
            <button onClick={setPdfTitle} className={baseBtn}>
                <Download className="w-4 h-4" />
                <p>Export as PDF</p>
            </button>
        </div>
    );
}
