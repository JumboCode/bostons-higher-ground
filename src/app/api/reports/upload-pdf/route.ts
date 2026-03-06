import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/upload-file";

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.blob();
    const pathname = `reports/${session.user.id}/preview-${Date.now()}.pdf`;

    try {
        await uploadFile(pathname, body, {
            access: "private",
            contentType: "application/pdf",
            addRandomSuffix: true,
        });
    } catch (error) {
        console.error("[reports/upload-pdf] uploadFile failed", error);
        return Response.json(
            { error: "upload failed" },
            { status: 500 }
        );
    }

    return Response.json({ success: true });
}
