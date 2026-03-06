import { Download, SquarePen, Calendar, Trash2, FileText, Info, ArchiveIcon, X} from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import ReportChart from "@/components/ReportChart";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { inProgressReports } from "@/lib/schema";
import { type StoredChart } from "@/lib/generateChart";

import ReportNameInput from "./reportNameInput";
import ReportExportButton from "./reportExportButtons";

async function DraftReportPopulated() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return (
            <div className="p-10 text-gray-700">
                Please sign in to view your in-progress report.
            </div>
        );
    }

    const userId = session.user.id;

    const existing = await db.query.inProgressReports.findFirst({
        where: eq(inProgressReports.userId, userId),
    });

    const charts = Array.isArray(existing?.charts)
        ? (existing!.charts as StoredChart[])
        : [];

    return (
        <div className="flex flex-col grow bg-white mb-6 border rounded-2xl py-6 px-6 border-[rgba(0,0,0,0.1)] space-y-10">
            <div className="ReportNameEditBar space-y-2">
                <div className="DraftHeading+NoOfChartsAdded+ClearButton flex flex-row items-center">
                    <div className="Name+ChartNoDisplay">
                        <h2 className="text-[#555555] text-lg font-semibold">
                            Draft Report
                        </h2>
                        <p className="text-sm">
                            {charts.length}{" "}
                            {charts.length === 1 ? "chart" : "charts"} added
                            from dashboard
                        </p>
                    </div>
                    <div className="ClearButton ml-auto border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 hover:bg-[#E76C82] transition-colors duration-150 hover:text-white">
                        <button className="flex flex-row items-center space-x-4 ">
                            <Trash2 className="w-[16] h-[16] " />
                            <p className="font-medium text-sm">Clear</p>
                        </button>
                    </div>
                </div>
                <ReportNameInput />
            </div>
            <div className="w-full overflow-x-hidden">
            <div className="Reports flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0 w-full">
                {charts.length > 0 ? (
                    charts.map((chart, idx) => (
                        <ReportChart
                            key={`${chart.title}-${idx}`}
                            title={chart.title}
                        />
                    ))
                ) : (
                    <p className="px-4 text-gray-400">
                        Add charts using the &quot;+&quot; buttons to see them
                        here.
                    </p>
                )}
            </div>
            </div>
            <div className="ExportOptions flex flex-col md:flex-row md:space-x-3 space-y-3 w-full">
                <ReportExportButton />
                <button className="flex flex-row items-center space-x-4 border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 min-w-40 h-10 hover:bg-[#E76C82] transition-colors duration-150 hover:text-white">
                    <ArchiveIcon className="w-4 h-4" />
                    <div className="font-medium">Save to Archive</div>
                </button>
            </div>
        </div>
    );
}

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
}) {
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

export default function Archive() {
    return (
        <main className="bg-[#F5F5F5] p-10 flex flex-col gap-y-10 pt-12.5">
            <h1 className="text-4xl font-extrabold text-[#555555] gap-8">
                Reports
            </h1>
            {/* <DraftReport /> */}
            <DraftReportPopulated />
            <div className="flex flex-col gap-y-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-[#555555]">
                        Archived Reports
                    </h2>
                    <span className="relative inline-flex group">
                        <Info
                            className="w-4 h-4 text-[#555555] group-hover:text-[#E76C82] transition-colors"
                            aria-label="Archived reports info"
                        />
                        <span
                            role="tooltip"
                            className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-2 w-[320px] rounded-xl bg-[rgba(239,246,255,1)] px-2 py-2 text-left text-sm text-[rgba(28,57,142,1)] shadow-lg ring-1 ring-black/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            The system can save a maximum of 20 archived reports.
                            When the limit is reached, you&apos;ll need to remove old
                            reports before saving new ones.
                        </span>
                    </span>
                </div>
                <ReportEntry
                    title="Q4 Report 2025"
                    date={new Date(2025, 0, 4)}
                    schools="All Schools"
                    category="Housing"
                    numOfCharts={4}
                />
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
