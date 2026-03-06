"use client";

import { usePdfMetadataStore } from "@/lib/pdfMetadataStore";
import { SquarePen } from "lucide-react";

export default function ReportNameInput() {
    const filename = usePdfMetadataStore((s) => s.filename);
    const setFilename = usePdfMetadataStore((s) => s.setFilename);

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const next = e.target.value;
        setFilename(next);
    }

    return (
        <div className="flex flex-col ReportNameEdit space-y-1">
            <div className="text-sm font-medium">Report Name</div>
            <div className="ReportNameTextField">
                <div className="relative w-full">
                    <SquarePen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        value={filename}
                        onChange={onChange}
                        placeholder="Enter report name (e.g., October 2025 Housing Report)"
                        className="w-full text-md pl-9 pr-3 p-2 py-3 bg-[#F3F3F5] rounded-2xl font-normal focus:outline-bhg-pink"
                    />
                </div>
            </div>
        </div>
    );
}
