import { after } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncLog } from "@/lib/schema";
import { getUserPermission } from "@/lib/usersFunction";
import { runSalesforceSync } from "@/lib/salesforce/sync";
import { and, desc, eq } from "drizzle-orm";

export const runtime = "nodejs"; // jsforce needs Node, not Edge.
export const dynamic = "force-dynamic";
// Includes post-response work; keep below the stale-run recovery window.
export const maxDuration = 300;

async function requireAdmin(
    request: Request
): Promise<{ ok: true; userId: string } | { ok: false; response: Response }> {
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
            and(eq(syncLog.source, "salesforce"), eq(syncLog.status, "success"))
        )
        .orderBy(desc(syncLog.startedAt))
        .limit(1);

    return Response.json({
        latest: latest ?? null,
        latestSuccess: latestSuccess ?? null,
    });
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
            and(eq(syncLog.source, "salesforce"), eq(syncLog.status, "running"))
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
            .where(
                and(eq(syncLog.id, running.id), eq(syncLog.status, "running"))
            );
    }

    const [logRow] = await db
        .insert(syncLog)
        .values({
            source: "salesforce",
            status: "running",
            triggeredBy: guard.userId,
        })
        // The partial unique index arbitrates concurrent requests atomically.
        .onConflictDoNothing()
        .returning();

    if (!logRow) {
        // Another request claimed the source after our initial read. It may
        // already have finished by this read; 409 still tells the UI to retry
        // status rather than launching a second job.
        const [active] = await db
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
        return Response.json(
            { error: "sync_already_running", log: active ?? null },
            { status: 409 }
        );
    }

    // Register with Next's request lifecycle so Vercel keeps the invocation
    // alive after responding. Await the whole job inside the callback.
    after(async () => {
        try {
            await runSalesforceSync(logRow.id);
        } catch (err) {
            // runSalesforceSync persists failures; retain server diagnostics.
            console.error("[salesforce sync] fatal:", err);
        }
    });

    return Response.json({ ok: true, log: logRow });
}
