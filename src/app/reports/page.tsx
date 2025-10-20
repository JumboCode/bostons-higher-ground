import { Edit3, Trash2, Download, Calendar, FileText } from "@/components/icons";
import { string } from "better-auth";

/*
 * TODO: This component represents the draft report interface that goes at the
 * top of the page. Ultimately, it will list the charts the user has selected to
 * go into their next report, but for now you only need to make the interface
 * drawn on the figma for the case when no charts are selected.
 */
function DraftReport() {
    return (
        <div className="border-1 flex flex-col flex-grow border-[rgba(0,0,0,0.1)] p-6 rounded-2xl space-y-10 mb-6 bg-white">
            <div className="flex items-center justify-between">
                <div className="Heading">
                    <h2 className="text-[#555555] font-semibold text-lg">Draft Report</h2>
                    <div className="text-sm text-[#4A5565]">0 charts added from dashboard</div>
                </div>
                <div>
                    <button className="Clear flex flex-row space-x-4 items-center border-1 p-2 rounded-xl border-[rgba(0,0,0,0.1)]">
                        <Trash2 className="w-4 h-4 stroke-[1.33] text-[#555555]"/>
                        <div className="text-sm text-[#555555]">Clear</div>
                    </button>
                </div>
            </div>
            <div className="flex flex-col space-y-4 items-center">
                <FileText className="h-12 w-12 text-[#6A7282] stroke-2"/>
                <div className="text-base text-[#6A7282] text-center leading-6">No charts in draft. Navigate to any dashboard and click the "+" icon on charts to add them here.</div>
            </div>
        </div>
    );
}

function DraftReportPopulated() {
    return (
        <div className="flex flex-col flex-grow bg-white mb-6 border-1 rounded-2xl py-6 px-6 border-[rgba(0,0,0,0.1)] space-y-10">
            <div className="ReportNameEditBar space-y-2">
                <div className="DraftHeading+NoOfChartsAdded+ClearButton flex flex-row items-center">
                    <div className="Name+ChartNoDisplay">
                        <h2 className="text-[#555555] text-lg font-semibold">Draft Report</h2>
                        <p className="text-sm">3 charts added from dashboard</p>
                    </div>
                    <div className="ClearButton ml-auto border-1 border-[rgba(0,0,0,0.1)] rounded-2xl p-3">
                        <button className="flex flex-row items-center space-x-4">
                            <Trash2 className="w-[16] h-[16]"/>
                            <p className="font-medium text-sm">Clear</p>
                        </button>
                    </div>
                </div>
                <div className="flex flex-col ReportNameEdit space-y-1">
                    <div className="text-sm font-medium">
                        Report Name
                    </div>
                    <div className="ReportNameTextField">
                        <div className="relative w-[448px]">
                            <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
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
            <div className="Reports flex flex-row space-x-3">
                <div className="Chart w-36 space-y-2 rounded-2xl bg-[#F9FAFB] p-4 border-1 border-[#E5E7EB]">
                    <FileText className="w-[20] h-[20] text-[#E76C82]"/>
                    <div className="font-semibold text-xs">Housing Pipeline</div>
                </div>
                <div className="Chart w-36 space-y-2 rounded-2xl bg-[#F9FAFB] p-4 border-1 border-[#E5E7EB]">
                    <FileText className="w-[20] h-[20] text-[#E76C82]"/>
                    <div className="font-semibold text-xs">Intakes vs Families Housed</div>
                </div>
                <div className="Chart w-36 space-y-2 rounded-2xl bg-[#F9FAFB] p-4 border-1 border-[#E5E7EB]">
                    <FileText className="w-[20] h-[20] text-[#E76C82]"/>
                    <div className="font-semibold text-xs">Families Housed Over Time</div>
                </div>
            </div>
            <div className="ExportOptions flex flex-row space-x-2">
                <button className="flex flex-row space-x-4 border-1 border-[rgba(0,0,0,0.1)] rounded-2xl p-3">
                    <Download className="w-4 h-4"/>
                    <div className="font-medium text-sm">Export as PDF</div>
                </button>
                <button className="flex flex-row space-x-4 border-1 border-[rgba(0,0,0,0.1)] rounded-2xl p-3">
                    <Download className="w-4 h-4"/>
                    <div className="font-medium text-sm">Export as PDF</div>
                </button>
                <button className="flex flex-row space-x-4 border-1 border-[rgba(0,0,0,0.1)] rounded-2xl p-3">
                    <Download className="w-4 h-4"/>
                    <div className="font-medium text-sm">Export as PDF</div>
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


function ReportEntry({ title, date, schools, category, numOfCharts } : {title : string, date : Date, schools : string, category : string, numOfCharts: number }) {
    return (
        <div className="items-center flex px-4 py-4 border-1 border-[rgba(0,0,0,0.1)] rounded-2xl mb-4 bg-white">
            <div className="flex flex-grow flex-row h-full space-x-6 items-center">
                <div className="flex flex-grow flew-row items-center space-x-5"> {/* container*/}
                    <div className="w-10 h-10 border-0 bg-[#F3E8FF] rounded-[16] flex justify-center items-center ">
                        <FileText className="text-[#E76C82]" />
                    </div>
                    <div className="flex-col space-y-1">
                        <div className=""> {/*title of report*/}
                            <h3 className="text-[#555555] font-semibold">{title}</h3>
                        </div>
                        <div className="flex flew-row space-x-2 items-center"> {/*items below title*/}
                            <div className="flex flex-row items-center space-x-1 ">
                                <Calendar className="w-3 h-3 text-[#4A5565] stroke-2"/>
                                <p className="text-[#4A5565] text-xs">{date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</p>
                            </div> {/*Date of report*/}
                            <div className="text-xs">&middot;</div> {/*dot*/}
                            <div className="text-[#4A5565] text-xs"> { schools } </div> {/*schools*/}
                            <div className="text-xs">&middot;</div> {/*dot*/}
                            <div className="text-[#4A5565] text-xs border-1 border-gray-300 rounded-full px-2"> { category } </div> {/*housing*/}
                            <div className="text-xs">&middot;</div> {/*dot*/}
                            <div className="text-[#4A5565] text-xs"> { numOfCharts } charts</div> {/*number of charts*/}
                        </div>
                    </div>
                </div>

                <div className="button">
                    <Download className="stroke-[1.33px] text-gray-600" />
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
        <main className="bg-[#F5F5F5] h-screen p-4">
            <DraftReport/>
            <DraftReportPopulated/>
            <ReportEntry title="Q4 Report 2025" date = {new Date(2025, 0, 4)} schools = "All Schools" category= "Housing" numOfCharts={4}/>
        </main>
    );
}
