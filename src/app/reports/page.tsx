import { Download, SquarePen, Calendar, Trash2, FileText } from "lucide-react";
import ReportCharts from "@/components/Report_Charts"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/*
 * TODO: This component represents the draft report interface that goes at the
 * top of the page. Ultimately, it will list the charts the user has selected to
 * go into their next report, but for now you only need to make the interface
 * drawn on the figma for the case when no charts are selected.
 */

 async function DraftReportPopulated() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    console.log(session);
    const res = await fetch("http://localhost:3000/api/reports/in-progress");
    // const {success, reportId, charts, numCharts} = await res.json();
    console.log(res);

    return (
        <div className="flex flex-col grow bg-white mb-6 border rounded-2xl py-6 px-6 border-[rgba(0,0,0,0.1)] space-y-10">
            <div className="ReportNameEditBar space-y-2">
                <div className="DraftHeading+NoOfChartsAdded+ClearButton flex flex-row items-center">
                    <div className="Name+ChartNoDisplay">
                        <h2 className="text-[#555555] text-lg font-semibold">
                            Draft Report
                        </h2>
                        <p className="text-sm">3 charts added from dashboard</p>
                    </div>
                    <div className="ClearButton ml-auto border border-[rgba(0,0,0,0.1)] rounded-2xl p-3">
                        <button className="flex flex-row items-center space-x-4">
                            <Trash2 className="w-[16] h-[16]" />
                            <p className="font-medium text-sm">Clear</p>
                        </button>
                    </div>
                </div>
                <div className="flex flex-col ReportNameEdit space-y-1">
                    <div className="text-sm font-medium">Report Name</div>
                    <div className="ReportNameTextField">
                        <div className="relative w-full">
                            <SquarePen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                name="reportName"
                                placeholder="Enter report name (e.g., October 2025 Housing Report)"
                                className="w-full text-sm pl-9 pr-3 p-2 bg-[#F3F3F5] rounded-2xl font-normal focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="Reports flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0 w-full">
                <div className="w-36 space-y-2 rounded-2xl bg-[#F9FAFB] p-4 border border-[#E5E7EB] hover:bg-bgh-gray-100 duration-200 cursor-pointer">
                    <FileText className="w-[20] h-[20] text-[#E76C82]" />
                    <div className="font-semibold text-xs">
                        Housing Pipeline
                    </div>
                </div>
                <div className="w-36 space-y-2 rounded-2xl bg-[#F9FAFB] p-4 border border-[#E5E7EB] hover:bg-bgh-gray-100 duration-200 cursor-pointer">
                    <FileText className="w-[20] h-[20] text-[#E76C82]" />
                    <div className="font-semibold text-xs">
                        Intakes vs Families Housed
                    </div>
                </div>
                <div className="w-36 space-y-2 rounded-2xl bg-[#F9FAFB] p-4 border border-[#E5E7EB] hover:bg-bgh-gray-100 duration-200 cursor-pointer">
                    <FileText className="w-[20] h-[20] text-[#E76C82]" />
                    <div className="font-semibold text-xs">
                        Families Housed Over Time
                    </div>
                </div>
            </div>
            <div className="ExportOptions flex flex-col md:flex-row md:space-x-3 space-y-3 w-full">
                <button className="flex flex-row items-center space-x-4 border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 w-40 h-10">
                    <Download className="w-4 h-4" />
                    <div className="font-medium text-sm">Export as PDF</div>
                </button>
                <button className="flex flex-row items-center space-x-4 border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 w-40 h-10">
                    <Download className="w-4 h-4" />
                    <div className="font-medium text-sm">Export as CSV</div>
                </button>
                <button className="flex flex-row items-center space-x-4 border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 w-40 h-10">
                    <Download className="w-4 h-4" />
                    <div className="font-medium text-sm">Export as PNG</div>
                </button>
            </div>
        </div>
    );
}

/*
 * TODO: This component represents a single report in the list of archived
 * reports. As you are designing it, think about what props you need in order to
 * make it reusable.
 */


export function ReportEntry({
    title,
    date,
    schools,
    category,
    numOfCharts,
}: {
    title: string;
    date: Date;
    schools: string;
    category: string;
    numOfCharts: number;
} 

) { 
    return (
        <div className="items-center flex px-4 py-4 border border-[rgba(0,0,0,0.1)] rounded-2xl mb-4 bg-white">
            <div className="flex grow flex-row h-full space-x-6 items-center">
                <div className="flex grow flew-row items-center space-x-5">
                    {" "}
                    {/* container*/}
                    <div className="w-10 h-10 border-0 bg-[#F3E8FF] rounded-[16] flex justify-center items-center ">
                        <FileText className="text-[#E76C82]" />
                    </div>
                    <div className="flex-col space-y-1">
                        <div className="">
                            {" "}
                            {/*title of report*/}
                            <h3 className="text-[#555555] font-semibold">
                                {title}
                            </h3>
                        </div>
                        <div className="flex flew-row space-x-2 items-center">
                            {" "}
                            {/*items below title*/}
                            <div className="flex flex-row items-center space-x-1 ">
                                <Calendar className="w-3 h-3 text-[#4A5565] stroke-2" />
                                <p className="text-[#4A5565] text-xs">
                                    {date.toLocaleDateString("en-US", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>{" "}
                            {/*Date of report*/}
                            <div className="text-xs">&middot;</div> {/*dot*/}
                            <div className="text-[#4A5565] text-xs">
                                {" "}
                                {schools}{" "}
                            </div>{" "}
                            {/*schools*/}
                            <div className="text-xs">&middot;</div> {/*dot*/}
                            <div className="text-[#4A5565] text-xs border border-gray-300 rounded-full px-2">
                                {" " + category + " "}
                            </div>{" "}
                            {/*housing*/}
                            <div className="text-xs">&middot;</div> {/*dot*/}
                            <div className="text-[#4A5565] text-xs">
                                {" "}
                                {numOfCharts} charts
                            </div>{" "}
                            {/*number of charts*/}
                        </div>
                    </div>
                </div>

                <div className="button">
                    <Download className="stroke-[1.33px] text-gray-600 h-[18px] mx-2" />
                </div>
            </div>
        </div>
    );
}

/*
 * TODO: This function is the top level component of the archive page. All of
 * the JSX returned by this function will be rendered on the /reports route.
 * Complete the component to match the designs provided in the ticket.
 */
export default function Archive() {
    return (
        <main className="bg-[#F5F5F5] p-10 flex flex-col overflow-scroll gap-y-8">
            <h1 className="text-4xl font-extrabold text-[#555555] gap-8">
                Reports
            </h1>
            {/* <DraftReport /> */}
            <DraftReportPopulated />
            <div className="flex flex-col gap-y-4">
                <h2 className="text-xl font-extrabold text-[#555555] gap-8">
                    Archived Reports
                </h2>
                <ReportEntry
                    title="Q4 Report 2025"
                    date={new Date(2025, 0, 4)}
                    schools="All Schools"
                    category="Housing"
                    numOfCharts={4}
                />
            </div>
        </main>
    );
}
