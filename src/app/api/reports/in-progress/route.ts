import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inProgressReports } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";


type ChartEntry = {
    title: string;
    chartType: string;
    filters: string | null;
};

function parseChartEntry(input: unknown): ChartEntry | null {
    if (!input || typeof input !== "object") return null;
    const { title, chartType, filters } = input as {
      title: string;
      chartType: string;
      filters: unknown;
    };

    if (typeof title !== "string" || !title.trim()) return null;

    return {
        title: title.trim(),
        chartType,
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

    console.log("in progress get existing:", existing);

    const charts: ChartEntry[] = Array.isArray(existing?.charts)
        ? (existing!.charts as ChartEntry[])
        : [];

    console.log("in progress get:", charts);

    return Response.json({
        success: true,
        reportId: existing?.id ?? null,
        charts,
        chartCount: charts.length,
    });
}

export async function POST(request: Request) {
  console.log("posting chart to report")
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    console.log(body)
    const chartEntry = parseChartEntry(body);
    console.log(chartEntry)

    if (!chartEntry) {
        return Response.json(
            { error: "invalid chart payload" },
            { status: 400 }
        );
    }

    const userId = session.user.id;
    console.log("userId:", userId)

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

export async function DELETE(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const clearAll = body && (body as Record<string, unknown>).clearAll === true;

    const indexValue: number | null =
        body && typeof (body as Record<string, unknown>).index === "number"
            ? ((body as Record<string, unknown>).index as number)
            : null;

    const matchTitle =
        body && typeof (body as Record<string, unknown>).title === "string"
            ? (body as Record<string, unknown>).title
            : null;
    const matchFilters =
        body && typeof (body as Record<string, unknown>).filters === "string"
            ? (body as Record<string, unknown>).filters
            : null;

    const userId = session.user.id;

    const existing = await db.query.inProgressReports.findFirst({
        where: eq(inProgressReports.userId, userId),
    });

    if (!existing) {
        return Response.json({ error: "not found" }, { status: 404 });
    }

    // Clear entire in-progress report
    if (clearAll) {
        const [updated] = await db
            .update(inProgressReports)
            .set({
                title: null,
                charts: [],
            })
            .where(eq(inProgressReports.id, existing.id))
            .returning({
                id: inProgressReports.id,
                title: inProgressReports.title,
                charts: inProgressReports.charts,
            });

        return Response.json({
            success: true,
            reportId: updated.id,
            chartCount: 0,
            message: "In-progress report cleared",
        });
    }

    const existingCharts: ChartEntry[] = Array.isArray(existing.charts)
        ? (existing.charts as ChartEntry[])
        : [];

    let removed = false;
    let nextCharts: ChartEntry[] = existingCharts;

    if (
        indexValue !== null &&
        indexValue >= 0 &&
        indexValue < existingCharts.length
    ) {
        nextCharts = existingCharts.filter((_, i) => i !== indexValue);
        removed = nextCharts.length !== existingCharts.length;
    } else if (matchTitle) {
        let removedOnce = false;
        nextCharts = existingCharts.filter((chart) => {
            if (removedOnce) return true;
            const sameTitle = chart.title === matchTitle;
            const sameFilters =
                chart.filters === (matchFilters ?? chart.filters);
            if (sameTitle && sameFilters) {
                removedOnce = true;
                return false;
            }
            return true;
        });
        removed = removedOnce;
    }

    if (!removed) {
        return Response.json({ error: "chart not found" }, { status: 400 });
    }

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

export async function PATCH(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const userId = session.user.id;

    
    if (body && typeof body.title === "string") {
        const title = body.title.trim();

        if (!title) {
            return Response.json({ error: "invalid title" }, { status: 400 });
        }

        const existing = await db.query.inProgressReports.findFirst({
            where: eq(inProgressReports.userId, userId),
        });

        if (!existing) {
            return Response.json({ error: "not found" }, { status: 404 });
        }

        const [updated] = await db
            .update(inProgressReports)
            .set({ title })
            .where(eq(inProgressReports.id, existing.id))
            .returning({
                id: inProgressReports.id,
                title: inProgressReports.title,
            });

        return Response.json({ success: true, reportId: updated.id, title: updated.title });
    }

    
    const fromIndex =
        body && typeof body.fromIndex === "number" ? body.fromIndex : null;
    const toIndex =
        body && typeof body.toIndex === "number" ? body.toIndex : null;

    if (
        fromIndex === null ||
        toIndex === null ||
        fromIndex < 0 ||
        toIndex < 0
    ) {
        return Response.json({ error: "invalid patch payload" }, { status: 400 });
    }

    const existing = await db.query.inProgressReports.findFirst({
        where: eq(inProgressReports.userId, userId),
    });

    if (!existing) {
        return Response.json({ error: "not found" }, { status: 404 });
    }

    const existingCharts: ChartEntry[] = Array.isArray(existing.charts)
        ? (existing.charts as ChartEntry[])
        : [];

    if (
        fromIndex >= existingCharts.length ||
        toIndex >= existingCharts.length
    ) {
        return Response.json({ error: "index out of range" }, { status: 400 });
    }

    const nextCharts = [...existingCharts];
    const [moved] = nextCharts.splice(fromIndex, 1);
    nextCharts.splice(toIndex, 0, moved);

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