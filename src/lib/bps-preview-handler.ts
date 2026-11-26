import { MAX_FILE_BYTES, PreviewError, previewBpsWorkbook } from "./bps-preview";

const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 64 * 1024;
const headers = { "Cache-Control": "no-store" };
type Authorize = (request: Request) => Promise<string | Response>;

/** Auth is injected for isolated tests; the production route wires real session/role checks. */
export function createBpsPreviewHandler(authorize: Authorize) {
    return async function POST(request: Request) {
        const identity = await authorize(request);
        if (identity instanceof Response) return identity;
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin)
            return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.startsWith("multipart/form-data;"))
            return Response.json({ error: "Upload one .xlsx file using form data." }, { status: 400, headers });
        try {
            // Do not trust Content-Length. Bound actual streamed bytes before form parsing.
            if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES)
                return Response.json({ error: "Upload exceeds 1 MiB." }, { status: 413, headers });
            const reader = request.body?.getReader();
            if (!reader) throw new PreviewError("Choose a mock workbook.");
            const chunks: Uint8Array[] = [];
            let size = 0;
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    size += value.length;
                    if (size > MAX_REQUEST_BYTES) {
                        await reader.cancel();
                        return Response.json({ error: "Upload exceeds 1 MiB." }, { status: 413, headers });
                    }
                    chunks.push(value);
                }
            } finally { reader.releaseLock(); }
            const body = Buffer.concat(chunks);
            const form = await new Response(body, { headers: { "Content-Type": contentType } }).formData();
            const file = form.get("file");
            if (form.getAll("file").length !== 1 || !(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx"))
                throw new PreviewError("Choose exactly one .xlsx mock workbook.");
            if (file.size > MAX_FILE_BYTES)
                return Response.json({ error: "Upload exceeds 1 MiB." }, { status: 413, headers });
            if (form.get("mockOnly") !== "true")
                throw new PreviewError("Confirm this workbook contains synthetic data only.");
            return Response.json(await previewBpsWorkbook(Buffer.from(await file.arrayBuffer())), { headers });
        } catch (error) {
            return Response.json({ error: error instanceof PreviewError ? error.message : "Could not read the mock workbook." }, { status: 400, headers });
        }
    };
}
