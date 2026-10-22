import { validateBaseline, type BaselineValue } from "./baseline-calculation";
import type { HousedBaselineSummary } from "./baselines";

type Dependencies = {
    authorize: (request: Request) => Promise<string | Response>;
    read: () => Promise<HousedBaselineSummary>;
    save: (value: BaselineValue, userId: string) => Promise<void>;
};
export function createBaselineHandlers({
    authorize,
    read,
    save,
}: Dependencies) {
    return {
        async GET(request: Request) {
            const userId = await authorize(request);
            if (userId instanceof Response) return userId;
            return Response.json(await read(), {
                headers: { "Cache-Control": "no-store" },
            });
        },
        async PUT(request: Request) {
            const origin = request.headers.get("origin");
            if (origin && origin !== new URL(request.url).origin)
                return Response.json(
                    { error: "Invalid request origin." },
                    { status: 403 }
                );
            const userId = await authorize(request);
            if (userId instanceof Response) return userId;
            let baseline;
            try {
                baseline = validateBaseline(await request.json());
            } catch (error) {
                return Response.json(
                    {
                        error:
                            error instanceof Error
                                ? error.message
                                : "Invalid baseline.",
                    },
                    { status: 400 }
                );
            }
            if ((await read()).migrationRequired)
                return Response.json(
                    {
                        error: "Baseline storage is not installed yet. Ask the team to apply the baseline migration.",
                    },
                    { status: 503 }
                );
            await save(baseline, userId);
            return Response.json(await read());
        },
    };
}
