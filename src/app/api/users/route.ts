"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userInfo, user, verification, account } from "@/lib/schema";
import {session} from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getUserPermission } from "@/lib/usersFunction";
import { createUser } from "@/lib/create-user";

const VALID_PERMISSIONS = ["admin", "user", "none"] as const;

/* Adds a user*/
export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    if ((await getUserPermission(session.user.id)) !== "admin") {
        return Response.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (
        !body || typeof body.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
        typeof body.name !== "string" || !body.name.trim()
    ) {
        return Response.json({ error: "invalid_user" }, { status: 400 });
    }

    try {
        const newUser = await createUser({
            email: body.email,
            name: body.name,
            password: crypto.randomUUID(),
        });
        return Response.json({ success: true, user: newUser });
    } catch {
        return Response.json({ error: "Unable to create user" }, { status: 500 });
    }
}

/* Deletes a user */
export async function DELETE(request: Request) {
    const user_session = await auth.api.getSession({ headers: request.headers });

    /* Grabs the userid associated with the current session */

    if (!user_session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    /* Grabs the userid associated with the current session */
    const Id = user_session.user.id;

    /* If the client is not an admin, return an unauthorized error */
    const userPermission = await getUserPermission(Id);
    if (userPermission !== "admin") {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    /* Grabs info from client*/
    let body: { id?: string };
    try {
        body = await request.json();
        
    } catch {
        return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    if (!body.id) {
        return Response.json({ error: "missing_id" }, { status: 400 });
    }
    
    /* Deletes profile from all tables */
    await db.delete(userInfo).where(eq(userInfo.userId, body.id));
    await db.delete(user).where(eq(user.id, body.id));
    await db.delete(session).where(eq(session.id, body.id));
    await db.delete(account).where(eq(account.id, body.id));
    await db.delete(verification).where(eq(verification.id, body.id));

    return Response.json({ success: true });
}

/* Updates a user's permissions (admin only) */
export async function PATCH(request: Request) {
    const user_session = await auth.api.getSession({ headers: request.headers });

    if (!user_session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const Id = user_session.user.id;

    const userPermission = await getUserPermission(Id);
    if (userPermission !== "admin") {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    let body: { id?: string; permissions?: string };
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    if (!body.id) {
        return Response.json({ error: "missing_id" }, { status: 400 });
    }

    if (!body.permissions || !VALID_PERMISSIONS.includes(body.permissions as typeof VALID_PERMISSIONS[number])) {
        return Response.json({ error: "invalid_permissions" }, { status: 400 });
    }

    const [targetUser] = await db
        .select({ id: userInfo.id })
        .from(userInfo)
        .where(eq(userInfo.userId, body.id))
        .limit(1);

    if (!targetUser) {
        return Response.json({ error: "user_not_found" }, { status: 404 });
    }

    await db
        .update(userInfo)
        .set({ permissions: body.permissions })
        .where(eq(userInfo.userId, body.id));

    return Response.json({ success: true });
}

// Gets a user 

export async function GET(request: Request) {
    /* Checks if a user is logged in */
    const session = await auth.api.getSession({headers: request.headers});

    if (!session) {
        return Response.json({error: "unauthorized"}, {status: 401});
    }

     /* Grabs the userid associated with the current session */
    const Id = session.user.id;

    /* If the client is not an admin, return an unauthorized error */
    if ((await getUserPermission(Id)) !== "admin") {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    /* Grabs data table */
    const allUsers = await db
        .select({
            id: userInfo.userId,                    // string 
            name: user.name,                        // string
            email: user.email,                      // string
            status: userInfo.authorized,            // boolean 
            role: userInfo.permissions,             // string 
        })
        .from(userInfo)
        .leftJoin(user, eq(user.id, userInfo.userId));

    return Response.json(allUsers);
    
}