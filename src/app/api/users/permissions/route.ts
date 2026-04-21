import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userInfo } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const result = await db
            .select({
                permissions: userInfo.permissions,
            })
            .from(userInfo)
            .where(eq(userInfo.userId, session.user.id))
            .limit(1);

        return NextResponse.json({
            permissions: result[0]?.permissions ?? null,
        });
    } catch (error) {
        console.error("Error fetching permissions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
