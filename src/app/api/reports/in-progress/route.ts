"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inProgressReports } from "@/lib/schema";
import { eq } from "drizzle-orm";

type ChartEntry = {
    title: string;
    filters: string | null;
};

function parseChartEntry(input: unknown): ChartEntry | null {
    if (!input || typeof input !== "object") return null;
    const { title, filters } = input as Record<string, unknown>;

    if (typeof title !== "string" || !title.trim()) return null;

    return {
        title: title.trim(),
        filters:
            typeof filters === "string" && filters.trim().length
                ? filters.trim()
                : null,
    };
}

export async function GET(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const existing = await db.query.inProgressReports.findFirst({
        where: eq(inProgressReports.userId, userId),
    });

    const charts: ChartEntry[] = Array.isArray(existing?.charts)
        ? (existing!.charts as ChartEntry[])
        : [];

    return Response.json({
        success: true,
        reportId: existing?.id ?? null,
        charts,
        chartCount: charts.length,
    });
}

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const chartEntry = parseChartEntry(body);

    if (!chartEntry) {
        return Response.json(
            { error: "invalid chart payload" },
            { status: 400 }
        );
    }

    const userId = session.user.id;

    const existing = await db.query.inProgressReports.findFirst({
        where: eq(inProgressReports.userId, userId),
    });

    const existingCharts: ChartEntry[] = Array.isArray(existing?.charts)
        ? (existing!.charts as ChartEntry[])
        : [];

    const nextCharts: ChartEntry[] = [...existingCharts, chartEntry];

    if (existing) {
        const [updated] = await db
            .update(inProgressReports)
            .set({ charts: nextCharts })
            .where(eq(inProgressReports.id, existing.id))
            .returning({
                id: inProgressReports.id,
                charts: inProgressReports.charts,
            });

        const updatedCharts = Array.isArray(updated.charts)
            ? (updated.charts as ChartEntry[])
            : nextCharts;

        return Response.json({
            success: true,
            reportId: updated.id,
            chartCount: updatedCharts.length,
        });
    }

    const reportTitle =
        body &&
        typeof (body as Record<string, unknown>).reportTitle === "string"
            ? ((body as Record<string, unknown>).reportTitle as string)
            : "In Progress Report";

    const [created] = await db
        .insert(inProgressReports)
        .values({
            userId,
            title: reportTitle,
            charts: nextCharts,
        })
        .returning({
            id: inProgressReports.id,
            charts: inProgressReports.charts,
        });

    const createdCharts = Array.isArray(created.charts)
        ? (created.charts as ChartEntry[])
        : nextCharts;

    return Response.json({
        success: true,
        reportId: created.id,
        chartCount: createdCharts.length,
    });
}
