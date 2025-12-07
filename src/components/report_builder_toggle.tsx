"use client";
import { useState } from "react"; 
import ReportBuilder from "./report_builder";
import { FileText, Circle } from 'lucide-react';

export default function ReportBuilderToggle() {
    /* if we are showing the report side bar */
    const [showRB, setShowRB] = useState(false);
    /* number of graphs added to report */
    const [count, setCount] = useState(0)

    return (
        <div>
            {!showRB ? (
                <div className="flex justify-end h-screen items-center">
                    <button
                        id="showRBbutton"
                        onClick={() => setShowRB(true)}
                        className="flex-col h-1/8 bg-white drop-shadow-md text-gray-600 hover:text-gray-800 px-4 py-3 rounded-lg shadow-md transition-all"
                    >
                        <FileText className="justify-self-center ml-1 mr-2 my-1 w-5 h-5"/>
                        Report

                        {/* Number of graphs added, only show alert when there are graphs */}
                        {count > 0 && (
                            <div className="relative block mt-1 mx-auto w-fit">
                                <Circle className="w-5 h-5 fill-[#E76C82] stroke-[#E76C82]" />
                                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                                    {count}
                                </span>
                            </div>
                        )}

                    </button>
                </div>
            ) : (
                <>
                    <ReportBuilder count={count} onClose={() => setShowRB(false)} />
                </>
            )}
        </div>
    )
}