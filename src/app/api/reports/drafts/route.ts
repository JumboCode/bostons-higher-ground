import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inProgressReports } from "@/lib/schema";
import { eq } from "drizzle-orm";

type ChartEntry = {
    title: string;
    filters: string | null;
};

export async function DELETE(request: Request) {
    const session = await auth.api.getSession({headers: request.headers});

   if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    await db.delete(inProgressReports)
        .where(eq(inProgressReports.userId, userId))

    return Response.json({
        sucess:true
    })
}

export async function PATCH(request: Request) {
    const session = await auth.api.getSession({headers: request.headers});

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
}