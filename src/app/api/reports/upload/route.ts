import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/upload-file";

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const pathname = `reports/${session.user.id}/placeholder-${Date.now()}.txt`;
    const body = "Report upload placeholder";

    try {
        await uploadFile(pathname, body, {
            access: "public",
            contentType: "text/plain",
            addRandomSuffix: true,
        });
    } catch (error) {
        console.error("[reports/upload] uploadFile failed (ignored for now)", error);
    }

    return Response.json({ success: true });
}

