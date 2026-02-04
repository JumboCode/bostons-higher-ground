"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userInfo, user, verification, account } from "@/lib/schema";
import {session} from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getUserPermission } from "@/lib/usersFunction";
import { APIError } from "better-auth";


/* Adds a user*/
export async function POST(request: Request) {
    /* Grabs info from client*/
    const body = await request.json();

    /* Tries to insert user profile, catches an error if the action produces an error */
    try {
        const newUser = await auth.api.signUpEmail({
            body: {
                email: body.email,
                password: crypto.randomUUID(), // temporary password
                name: body.name,
            },
        });

        if (!newUser) {
            return Response.json(
                { success: false, error: "Error signing up user" },
                { status: 500 }
            );
        } else {
            const userInfoId = crypto.randomUUID();

            await db.insert(userInfo).values({
                id: userInfoId,
                userId: newUser.user.id,
                authorized: false,
                permissions: "none",
            });

            return Response.json({ success: true, user: newUser.user });
        }
    } catch (err: unknown) {
        if (err instanceof APIError) {
            // return handleBetterAuthError(err)
            return Response.json(
                { error: err.message || "Unknown server error" },
                { status: 500 }
            );
        } else {
            return Response.json(
                { error: "Unknown server error" },
                { status: 500 }
            );
        }
        /* TODO ask what error message to put*/
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
    const isAdmin = await getUserPermission(Id);
    if (!isAdmin) {
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
    if (!getUserPermission(Id)) {
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