/* A library that checks if a user is an admin, given their userId*/

"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userInfo } from "@/lib/schema";
import {eq} from "drizzle-orm";

export async function getUserPermission(userId: string) {
    const [result] = 
        await db
            .select({permissions: userInfo.permissions})
            .from(userInfo)
            .where(eq (userInfo.id, userId))

    return result?.permissions;
}