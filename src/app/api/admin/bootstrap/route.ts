import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userInfo } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    const createdUser = await auth.api.signUpEmail({
        body: {
            email: "amitav.nott@tufts.edu", // required
            password: "testtest", // required
            name: "Amitav Nott", // required
        },
    });

    const existingUserInfo = await db.query.userInfo.findFirst({
        where: eq(userInfo.userId, createdUser.user.id),
    });

    if (existingUserInfo) {
        await db
            .update(userInfo)
            .set({ authorized: true, permissions: "admin" })
            .where(eq(userInfo.userId, createdUser.user.id));
    } else {
        await db.insert(userInfo).values({
            id: crypto.randomUUID(),
            userId: createdUser.user.id,
            authorized: true,
            permissions: "admin",
        });
    }

    return Response.json({ success: true, user: createdUser.user });
}
