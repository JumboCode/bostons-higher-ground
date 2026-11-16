import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/checkPermissions";
import { createBpsPreviewHandler } from "@/lib/bps-preview-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createBpsPreviewHandler(async request => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Sign in to continue." }, { status: 401 });
    if (!(await isAdmin(session.user.id)))
        return Response.json({ error: "Admin access required." }, { status: 403 });
    return session.user.id;
});
