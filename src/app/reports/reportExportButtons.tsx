"use client";

import { Download } from "lucide-react";
import { usePdfMetadataStore } from "@/lib/pdfMetadataStore";
import { redirect } from "next/navigation";

export default function ReportExportButton() {
    const filename = usePdfMetadataStore((s) => s.filename);

    async function setPdfTitle() {
        try {
            const res = await fetch("/api/reports/drafts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: filename,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to update report name");
            }
        } catch (error) {
            console.log(error);
        }
        redirect("/preview");
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
