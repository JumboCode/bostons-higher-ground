"use client";
import { useState } from "react"; 

/*
 * This component represents a single chart entry in the report builder. Given
 * that we want this component to be resuable as multiple charts get selected,
 * think about what props it needs to take as you're designing it.
 */
function ChartEntry({title,chartType}:{title:string, chartType:string}) {
    return (
        <div className="mx-10 border-2 border-gray-200 py-2 px-8 rounded-xl"> {/*needs something to enlargen box*/}
            <div className="text-base font-semibold">{title}</div> {/*chart entry title*/}
            <div className="text-sm text-gray-400">{chartType}</div> {/*type of chart subtitle*/}
        </div>
    );
}

/*
 * This component is the UI for building reports. It should list the charts the
 * user currently has selected to be included in the report, along with any
 * notes to be associated with that chart. Additionally, There should be buttons
 * to download the report/data as a PDF, CSV, or PNG.
 */
export default function ReportBuilder() {
    /* variable keeping track of #charts we have */
    const [count, setCount] = useState(0); //UPDATE LATER

    return (
        <div>
            {/* we use components within our JSX similarly to html tags */}
            
            <div className="h-full mx-96 my-5 px-10 py-10 rounded-l-lg border-4 border-indigo-500">
                <div className="text-lg font-bold mb-4">Report Builder</div> {/*main title*/}
                <div className="text-sm text-gray-500 mb-4">{count} chart added</div> {/*# charts subtitle*/}
                <hr className="border-gray-200"></hr> {/*line divider*/}

                {/*Chart Section*/}
                <div className="my-10">
                    <ChartEntry title="Families Housed Over Time" chartType="Line Chart"/>
                    <ChartEntry title="Children Housed Over Time" chartType="Bar Chart"/>
                    
                </div>

                <hr className="border-gray-200"></hr> {/*line divider*/}

                {/*Footer Buttons */}
                <div className="mt-5 flex justify-evenly w-full py-2">
                    <button className="border-2 border-gray-200 py-2 px-8 rounded-full">PDF</button>
                    <button className="border-2 border-gray-200 py-2 px-8 rounded-full">CSV</button>
                    <button className="border-2 border-gray-200 py-2 px-8 rounded-full">PNG</button>
                </div>

            </div>
        </div>
    );
}
