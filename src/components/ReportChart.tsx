"use client"
import { FileText, X } from "lucide-react";

type ChartProps = {
    title: string;
};

export default function ReportChart({ title }: ChartProps) {
    const handleDelete = () => {
        console.log("delete clicked");
    };

    return (
        <div
            className="group relative w-36 space-y-2 rounded-2xl bg-[#F9FAFB] p-4 border border-[#E5E7EB] transition-all duration-200 hover:shadow-md cursor-pointer"
        >
            {/* X Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                }}
                className="
                    absolute top-2 right-2
                    opacity-0 group-hover:opacity-100
                    transition-all duration-200
                    w-6 h-6
                    flex items-center justify-center
                    rounded-full
                    bg-white
                    text-gray-400
                    shadow-md
                    hover:bg-rose-100
                    hover:text-rose-500
                "
            >
                <X className="w-4 h-4" />
            </button>

            <FileText className="w-[20px] h-[20px] text-bhg-pink" />

            <div className="font-semibold text-xs transition-colors duration-200 group-hover:text-bhg-pink">
                {title}
            </div>
        </div>
    );
}