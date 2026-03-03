"use client"
import { useState, useCallback } from "react";

export default function ReportTitle({ initialTitle }: { initialTitle: string }) {
    const [currentTitle, setCurrentTitle] = useState(initialTitle);
    
    const [updateTitle] = useCallback(
        async function() {
            const res = await fetch("api/reports/drafts", {
                method: "PATCH",
                body: JSON.stringify({ title: currentTitle }),
                headers: { "Content-Type": "application/json" },
            })
        },
        [currentTitle]
    );

    return (
        <div>
            <input
                type="text"
                name="reportName"
                placeholder="Enter report name (e.g., October 2025 Housing Report)"
                className="w-full text-sm pl-9 pr-3 p-2 bg-[#F3F3F5] rounded-2xl font-normal focus:outline-none"
                value={currentTitle}
                onChange={(e) => {setCurrentTitle(e.target.value)}}
            />
            <button className="p-3" onClick={updateTitle}>Save Changes</button>
        </div>
    )
    
}