"use client";

import { usePdfMetadataStore } from "@/lib/pdfMetadataStore";
import { SquarePen } from "lucide-react";

export default function ReportNameInput() {
    const filename = usePdfMetadataStore((s) => s.filename);
    const setFilename = usePdfMetadataStore((s) => s.setFilename);
    const titleError = usePdfMetadataStore((s) => s.titleError);

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const next = e.target.value;
        setFilename(next);
    }

    const hasError = Boolean(titleError);

    return (
        <div className="flex flex-col ReportNameEdit space-y-1">
            <div className="text-sm font-medium">Report Name</div>
            <div className="ReportNameTextField">
                <div className="relative w-full">
                    <SquarePen
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                            hasError ? "text-[#E76C82]" : "text-gray-400"
                        }`}
                    />
                    <input
                        type="text"
                        value={filename}
                        onChange={onChange}
                        placeholder="Enter report name (e.g., October 2025 Housing Report)"
                        aria-invalid={hasError}
                        aria-describedby={hasError ? "report-name-error" : undefined}
                        className={`w-full text-sm pl-9 pr-3 p-2 bg-[#F3F3F5] rounded-2xl font-normal focus:outline-none ${
                            hasError ? "ring-1 ring-[#E76C82]" : ""
                        }`}
                    />
                </div>
            </div>
            {hasError && (
                <p
                    id="report-name-error"
                    role="alert"
                    className="text-xs text-[#E76C82] mt-1"
                >
                    {titleError}
                </p>
            )}
        </div>
    );
}
