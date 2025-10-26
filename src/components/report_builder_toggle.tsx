"use client";
import { useState } from "react"; 
import ReportBuilder from "./report_builder";
import { FileText } from 'lucide-react';

export default function ReportBuilderToggle() {
    const [showRB, setShowRB] = useState(false);

    return (
        <div>
            {!showRB ? (
                <div className="flex justify-end h-screen items-center">
                    <button
                        id="showRBbutton"
                        onClick={() => setShowRB(true)}
                        className="flex-col h-1/8 text-gray-600 hover:text-gray-800 px-4 py-3 rounded-lg shadow-md transition-all"
                    >
                        <FileText className="justify-self-center mr-2 my-1 w-4 h-4"/>
                        Report
                    </button>
                </div>
            ) : (
                <>
                    <ReportBuilder onClose={() => setShowRB(false)} />
                </>
            )}
        </div>
    )
}