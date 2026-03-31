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
                <div className="flex items-center w-full bg-[#F3F3F5] rounded-2xl px-3">
                    <SquarePen className="text-gray-400 w-4 h-4 ml-2 shrink-0" />
                    <input
                        type="text"
                        value={filename}
                        onChange={onChange}
                        placeholder="Enter report name (e.g., October 2025 Housing Report)"
                        className="flex-1 text-sm p-2 bg-transparent font-normal focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
