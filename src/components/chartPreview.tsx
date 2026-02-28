"use client";

import React from "react";
import { X } from "lucide-react";

interface ChartPreviewModalProps {
    src: string | null;
    onClose: () => void;
}

export default function ChartPreviewModal({ src, onClose }: ChartPreviewModalProps) {
    if (!src) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl p-4 max-w-xl w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="ml-5 text-lg font-semibold text-gray-800">Preview</span>
                    <button
                        onClick={onClose}
                        className="ml-auto text-gray-600 hover:text-gray-800 hover:bg-[#EEEEEE] rounded-md w-8 h-8 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <img src={src} alt="Chart Preview" className="w-full rounded-lg aspect-[3/2] object-contain" />
            </div>
        </div>
    );
}