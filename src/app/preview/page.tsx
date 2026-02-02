import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inProgressReports } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateChart, type StoredChart } from "@/lib/generateChart";
import { headers } from "next/headers";
import Image from "next/image";

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
        <div>
            <div className={`print:[print-color-adjust:exact] bg-bhg-gray-300 flex justify-between items-center p-6`}>
                <Image
                    src="/Logo.svg"
                    alt="Boston Higher Ground logo"
                    className="w-56 h-auto"
                    width={60}
                    height={20}
                    priority
                />
                <h1 className="text-3xl font-semibold text-white">
                    {report?.title}
                </h1>
            </div>
            <div className="flex flex-wrap gap-x-28 gap-y-20 p-10">
                {visible.length > 0 ? (
                    visible.map((chart) => (
                        <div key={chart.key} className="flex-1 min-w-[calc(50%-3.5rem)] ">{chart.node}</div>
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
