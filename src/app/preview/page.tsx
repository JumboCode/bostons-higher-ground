import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inProgressReports } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateChart, type StoredChart } from "@/lib/generateChart";
import { headers } from "next/headers";
import ReportDoc from "./report-doc";

export default async function PreviewPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return (
            <div className="p-10 text-gray-700">
                Please sign in to view your in-progress report preview.
            </div>
        );
    }

    const report = await db.query.inProgressReports.findFirst({
        where: eq(inProgressReports.userId, session.user.id),
    });
    if (!report) {
        return (
            <div className="p-10 text-gray-700">
                No in-progress report found.
            </div>
        );
    }

    const charts = Array.isArray(report?.charts)
        ? (report!.charts as StoredChart[])
        : [];

    if (!charts.length) {
        return (
            <div className="p-10 text-gray-700">
                No in-progress report found. Add charts using the &quot;+&quot; buttons to
                see them here.
            </div>
        );
    }

    const rendered = await Promise.all(
        charts.map(async (chart, idx) => ({
            key: `${chart.title}-${idx}`,
            node: await generateChart(chart),
        }))
    );

    const visible = rendered.filter((c) => c.node !== null);

    return (
        <ReportDoc reportTitle={report.title ?? "Untitled Report"} charts={visible} />
    );
}