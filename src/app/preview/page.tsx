import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inProgressReports } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateChart, type StoredChart } from "@/lib/generateChart";
import { headers } from "next/headers";

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
        <div className="p-10 space-y-6">
            <h1 className="text-3xl font-semibold text-gray-800">
                Report Preview
            </h1>
            <div className="flex flex-col gap-6">
                {visible.length > 0 ? (
                    visible.map((chart) => (
                        <div key={chart.key}>{chart.node}</div>
                    ))
                ) : (
                    <div className="text-gray-600">
                        The saved charts could not be rendered. Add a chart to
                        your report and try again.
                    </div>
                )}
            </div>
        </div>
    );
}
