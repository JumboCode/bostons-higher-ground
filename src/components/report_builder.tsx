import { useState } from "react"; 
import {FileText, Trash2} from "./icons"
import { X, GripVertical, FileDown } from 'lucide-react';

/* TODO: make a dummy page for toggleable report sidebar */

/*
 * This component represents a single chart entry in the report builder. Given
 * that we want this component to be resuable as multiple charts get selected,
 * think about what props it needs to take as you're designing it.
 */
function ChartEntry({title,chartType}:{title:string, chartType:string}) {
    return (
        <div className="mx-1 border-2 border-gray-200 py-5 pl-4 pr-8 rounded-xl mb-3"> {/*needs something to enlargen box*/}
            <div className="flex">
                <GripVertical color = "#a9a9a9" className="mt-2 mr-3 w-5 h-5"/>
                <div>
                    <div className="text-base font-semibold">{title}</div> {/*chart entry title*/}
                    <div className="text-sm text-gray-400">{chartType}</div> {/*type of chart subtitle*/}
                </div>
                <Trash2 stroke="#555555" width="17" height="17" className="mt-2 ml-auto"/>
            </div>
            {/*text box for adding notes*/}
            <input
                type="text"
                className="bg-[#F3F3F5] w-[calc(100%-2rem)] h-16 rounded-xl py-2 px-3 mt-2 ml-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add notes..."
            />
        </div>
    );
}

function DownloadButton({doctype, count}:{doctype:string, count:number}) {
    return (
        <div className="flex">
            {count == 0 ? (
                <>
                    <button className="flex text-gray-200 border-gray-200 border-2 py-2 px-8 rounded-full">
                        <FileDown className="mr-2 mt-0.5 w-5 h-5"/>
                        {doctype}
                    </button>
                </>
            ) : (
                <>
                    <button className="flex text-gray-700 border-gray-200 border-2 py-2 px-8 rounded-full">
                        <FileDown className="mr-2 mt-0.5 w-5 h-5"/>
                        {doctype}
                    </button>
                </>
            )}
        </div>
    );
}

/*
 * This component is the UI for building reports. It should list the charts the
 * user currently has selected to be included in the report, along with any
 * notes to be associated with that chart. Additionally, There should be buttons
 * to download the report/data as a PDF, CSV, or PNG.
 */
export default function ReportBuilder({count, onClose}:{count:number, onClose: () => void}) {    
    return (
        <div className="flex justify-end">
            <div className="relative h-dvh w-1/3 px-10 py-10 rounded-l-lg border-4 border-indigo-500">
                <div className="flex">
                    <div className="text-xl font-bold mb-3">Report Builder</div> {/*main title*/}
                    <button onClick={onClose}
                        className="ml-auto text-gray-600 hover:text-gray-800"
                    >
                        <X className="w-4 h-4"/>
                    </button>
                </div>
                
                <div className="text-sm text-gray-500 mb-4">{count} {count === 1 ? "chart" : "charts"} added</div> {/*# charts subtitle*/}
                <hr className="w-full border-gray-200"></hr> {/*line divider*/}
                
                {/*Chart Section*/}
                <div className="my-8">
                    {count > 0 ? (
                        <>
                            <ChartEntry title="Families Housed Over Time" chartType="Line Chart" />
                            <ChartEntry title="Children Housed Over Time" chartType="Bar Chart" />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 mt-10">
                            <FileText stroke="#D1D5DC" width="60" height="60"/>
                            <p className="mt-8 text-center text-md mb-2">No charts added yet. Click the "+" icon on any chart to add it to your Report</p>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-5 left-0 w-full">
                    <hr className="border-gray-200"></hr> {/*line divider*/}

                    {/*Footer Buttons */}
                    <div className="mt-5 flex justify-evenly w-full py-2">
                        <DownloadButton doctype="PDF" count={count} />
                        <DownloadButton doctype="CSV" count={count} />
                        <DownloadButton doctype="PNG" count={count} />
                    </div>
                </div>
            </div>
        </div>
    );
}
