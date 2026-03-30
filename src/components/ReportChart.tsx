"use client";
import { FileText, X } from "lucide-react";

type ChartProps = {
    title: string;
    onDelete: () => void;
    onPreview?: () => void;
};

export default function ReportChart({ title, onDelete, onPreview }: ChartProps) {
    // assign id to each chart by title 
    const safeId = title.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-_]/g, "");
    
    return (
        <div
            id={`chartElement-${safeId}`}
            className="group relative w-36 space-y-2 rounded-2xl bg-[#F9FAFB] 
            p-4 border border-[#E5E7EB] transition-all duration-200 
            hover:shadow-md cursor-pointer"
            onClick={onPreview}
        >
            {/* X Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="
                    absolute -top-2 -right-2
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200
                    w-6 h-6
                    flex items-center justify-center
                    rounded-full
                    bg-gray-100
                    text-gray-500
                    shadow-md
                    hover:bg-rose-100
                    hover:text-rose-500
                "
            >
                <X className="w-4 h-4" />
            </button>

            <FileText className="w-5 h-5 text-bhg-pink" />

            <div className="font-semibold text-xs transition-colors duration-200 group-hover:text-bhg-pink">
                {title}
            </div>
        </div>
    );
}
