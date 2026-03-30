"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account, user, userInfo } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { getUserPermission } from "@/lib/usersFunction";
import { APIError } from "better-auth";

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const permissions = await getUserPermission(session.user.id);
    const isAdmin = permissions === "admin";
    if (!isAdmin) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    let body: { email?: string };
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    const normalizedEmail = body.email?.trim().toLowerCase();
    if (!normalizedEmail) {
        return Response.json({ error: "missing_email" }, { status: 400 });
    }

    try {
        const [existingUser] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, normalizedEmail))
            .limit(1);

        let userId = existingUser?.id;

        if (!userId) {
            userId = crypto.randomUUID();

            await db.insert(user).values({
                id: userId,
                email: normalizedEmail,
                name: normalizedEmail.split("@")[0],
                emailVerified: false,
            });
        }

        const [existingUserInfo] = await db
            .select({ id: userInfo.id, authorized: userInfo.authorized })
            .from(userInfo)
            .where(eq(userInfo.userId, userId))
            .limit(1);

        if (!existingUserInfo) {
            await db.insert(userInfo).values({
                id: crypto.randomUUID(),
                userId,
                authorized: false,
                permissions: "none",
            });
        } else if (!existingUserInfo.authorized) {
            await db
                .delete(account)
                .where(
                    and(
                        eq(account.userId, userId),
                        eq(account.providerId, "credential")
                    )
                );
        }

        await auth.api.sendVerificationOTP({
            body: {
                email: normalizedEmail,
                type: "email-verification",
            },
        });

        return Response.json({ success: true });
    } catch (error) {
        if (error instanceof APIError) {
            return Response.json({ error: error.message }, { status: 400 });
        }

        console.error("Failed to send invite verification OTP", error);
        return Response.json(
            { error: "internal_server_error" },
            { status: 500 }
        );
    }
}
