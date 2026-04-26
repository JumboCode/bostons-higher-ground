"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { usePdfMetadataStore } from "@/lib/pdfMetadataStore";
import { useRouter } from "next/navigation";

export default function ReportExportButton() {
    const filename = usePdfMetadataStore((s) => s.filename);
    const router = useRouter(); // declare router
    const [isExporting, setIsExporting] = useState(false);

    async function setPdfTitle() {
        setIsExporting(true);
        try {
            console.log("Sending filename:", filename);

            const res = await fetch("/api/reports/in-progress", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: filename,
                }),
            });
            const data = await res.json();
            console.log("PATCH response:", data);

            if (!res.ok) {
                throw new Error("Failed to update report name");
            }
            router.push("/preview");
        } catch (error) {
            console.log(error);
        } finally {
            setIsExporting(false);
        }
    }

    const baseBtn =
        "flex flex-row items-center space-x-4 border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 min-w-40 h-10 transition-colors duration-150";

    return (
        <div className="ExportOptions flex flex-col md:flex-row md:space-x-3 space-y-3">
            <button
                onClick={setPdfTitle}
                disabled={isExporting}
                className={`${baseBtn} ${
                    isExporting
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "hover:bg-[#E76C82] hover:text-white"
                }`}
            >
                <Download className="w-4 h-4" />
                <p>{isExporting ? "Exporting..." : "Export as PDF"}</p>
            </button>
        </div>
    );
}
