import { createBaselineHandlers } from "@/lib/baseline-handlers";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/checkPermissions";
import { db } from "@/lib/db";
import { metricBaselines } from "@/lib/schema";
import { FAMILIES_HOUSED } from "@/lib/baseline-calculation";
import { getHousedBaselineSummary } from "@/lib/baselines";

export const dynamic = "force-dynamic";
async function authorize(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session)
        return Response.json(
            { error: "Sign in to continue." },
            { status: 401 }
        );
    if (!(await isAdmin(session.user.id)))
        return Response.json(
            { error: "Admin access required." },
            { status: 403 }
        );
    return session.user.id;
}
export const { GET, PUT } = createBaselineHandlers({
    authorize,
    read: getHousedBaselineSummary,
    save: async (baseline, userId) => {
        await db
            .insert(metricBaselines)
            .values({ metric: FAMILIES_HOUSED, ...baseline, updatedBy: userId })
            .onConflictDoUpdate({
                target: metricBaselines.metric,
                set: { ...baseline, updatedBy: userId, updatedAt: new Date() },
            });
    },
});
