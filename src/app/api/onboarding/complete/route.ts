"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userInfo } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const [existingUserInfo] = await db
        .select({ id: userInfo.id })
        .from(userInfo)
        .where(eq(userInfo.userId, session.user.id))
        .limit(1);

    if (!existingUserInfo) {
        await db.insert(userInfo).values({
            id: crypto.randomUUID(),
            userId: session.user.id,
            authorized: true,
            permissions: "user",
        });
    } else {
        await db
            .update(userInfo)
            .set({ authorized: true })
            .where(eq(userInfo.userId, session.user.id));
    }

    return Response.json({ success: true });
}
