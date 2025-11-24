/* A library that checks if a user is an admin, given their userId */

"use server";

import { db } from "@/lib/db";
import { userInfo } from "@/lib/schema";
import {eq} from "drizzle-orm";
import {APIError} from "better-auth";

export async function getUserPermission(userId: string) {
    const [result] = 
        await db
            .select({permissions: userInfo.permissions})
            .from(userInfo)
            .where(eq (userInfo.userId, userId))

    return result?.permissions;
}

// Also contains a function handle better auth errors 
export async function handleBetterAuthError(error: APIError) {
    if (!error) {
        return null
    }

    // need to add to this 
    switch (error.message) {
        case "User already exists. Use another email.":
            return Response.json({error: "User already exists"}, {status: 401});
        case "Invalid email":
            return Response.json({error: "invalid input"}, {status: 400});
        default:
            return Response.json({error: "unknown server error"}, {status: 500});
    }
}