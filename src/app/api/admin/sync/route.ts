import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncLog } from "@/lib/schema";
import { getUserPermission } from "@/lib/usersFunction";
import { runSalesforceSync } from "@/lib/salesforce/sync";
import { and, desc, eq } from "drizzle-orm";

export const runtime = "nodejs"; // jsforce needs Node, not Edge.
export const dynamic = "force-dynamic";

async function requireAdmin(request: Request): Promise<
    | { ok: true; userId: string }
    | { ok: false; response: Response }
> {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return {
            ok: false,
            response: Response.json({ error: "unauthorized" }, { status: 401 }),
        };
    }
    if ((await getUserPermission(session.user.id)) !== "admin") {
        return {
            ok: false,
            response: Response.json({ error: "forbidden" }, { status: 403 }),
        };
    }
    return { ok: true, userId: session.user.id };
}

/**
 * GET /api/admin/sync
 *
 * Returns the most recent sync_log row plus the most recent successful one.
 * Used by the admin page to render "Last sync from Salesforce: ...".
 */
export async function GET(request: Request) {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;

    const [latest] = await db
        .select()
        .from(syncLog)
        .where(eq(syncLog.source, "salesforce"))
        .orderBy(desc(syncLog.startedAt))
        .limit(1);

    const [latestSuccess] = await db
        .select()
        .from(syncLog)
        .where(
            and(
                eq(syncLog.source, "salesforce"),
                eq(syncLog.status, "success")
            )
        )
        .orderBy(desc(syncLog.startedAt))
        .limit(1);

    return Response.json({ latest: latest ?? null, latestSuccess: latestSuccess ?? null });
}

/**
 * POST /api/admin/sync
 *
 * Triggers a Salesforce → housing_records sync. Returns the sync_log id
 * so the client can poll GET to display progress / outcome.
 *
 * If a sync is already running, returns 409 with the running log row.
 */
export async function POST(request: Request) {
    const guard = await requireAdmin(request);
    if (!guard.ok) return guard.response;

    // Reject if a sync is already in flight.
    const [running] = await db
        .select()
        .from(syncLog)
        .where(
            and(
                eq(syncLog.source, "salesforce"),
                eq(syncLog.status, "running")
            )
        )
        .orderBy(desc(syncLog.startedAt))
        .limit(1);

    if (running) {
        // Guard against stale "running" rows from a crashed previous run.
        const ageMs = Date.now() - new Date(running.startedAt).getTime();
        const STALE_MS = 10 * 60 * 1000; // 10 minutes
        if (ageMs < STALE_MS) {
            return Response.json(
                { error: "sync_already_running", log: running },
                { status: 409 }
            );
        }
        // Mark stale row as errored and continue to start a fresh sync.
        await db
            .update(syncLog)
            .set({
                status: "error",
                finishedAt: new Date(),
                errorMessage: "Marked stale by next sync attempt",
            })
            .where(eq(syncLog.id, running.id));
    }

    const [logRow] = await db
        .insert(syncLog)
        .values({
            source: "salesforce",
            status: "running",
            triggeredBy: guard.userId,
        })
        .returning();

    // Fire and forget. The sync function updates the log row when done.
    // We don't await it so the admin UI gets a fast response; the client
    // polls GET /api/admin/sync and triggers a router refresh on success.
    runSalesforceSync(logRow.id).catch((err) => {
        // Already logged into sync_log; just print for server logs.
        console.error("[salesforce sync] fatal:", err);
    });

    return Response.json({ ok: true, log: logRow });
}
