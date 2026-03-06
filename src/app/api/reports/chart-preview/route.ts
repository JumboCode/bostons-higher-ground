import { auth } from "@/lib/auth";
import { generateChartModel, type StoredChart } from "@/lib/generateChart";

function parseStoredChart(input: unknown): StoredChart | null {
    if (!input || typeof input !== "object") return null;

    const { title, filters } = input as Record<string, unknown>;
    if (typeof title !== "string" || !title.trim()) return null;

    return {
        title: title.trim(),
        filters:
            typeof filters === "string" && filters.trim().length > 0
                ? filters
                : null,
    };
}

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const chart = parseStoredChart(body);

    if (!chart) {
        return Response.json(
            { error: "invalid chart payload" },
            { status: 400 }
        );
    }

    const model = await generateChartModel(chart);
    if (!model) {
        return Response.json({ error: "chart not found" }, { status: 404 });
    }

    return Response.json({ success: true, model });
}
