"use server";

import { auth } from "@/lib/auth";
import { APIError } from "better-auth";

export async function POST(request: Request) {
    let body: { newPassword?: string };

    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    if (!body.newPassword) {
        return Response.json(
            { error: "missing_new_password" },
            { status: 400 }
        );
    }

    try {
        const result = await auth.api.setPassword({
            headers: request.headers,
            body: {
                newPassword: body.newPassword,
            },
        });

        return Response.json(result);
    } catch (error) {
        if (error instanceof APIError) {
            return Response.json({ error: error.message }, { status: 400 });
        }

        console.error("Failed to set password during onboarding", error);
        return Response.json(
            { error: "internal_server_error" },
            { status: 500 }
        );
    }
}
