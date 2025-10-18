"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userInfo } from "@/lib/schema";
import {user} from "@/lib/schema";
import {eq} from "drizzle-orm";
import { getUserPermission } from "@/lib/usersFunction";


/* Adds a user*/
export async function POST (request: Request) {
    const session = await auth.api.getSession({headers:( request.headers) });

    /* If the client is not logged in, return an unauthorized error */
    if (!session)  {
        return Response.json({error: "unauthorized"}, {status: 401});
    }

    /* Grabs the userid associated with the current session */
    const Id = session.user.id;

    /* If the client is not an admin, return an unauthorized error */
    if (! getUserPermission(Id)) {
        return Response.json({error: "unauthorized"}, {status: 401});
    }

    /* Grabs info from client*/
    const body = await request.json();

    /* Tries to insert user profile, catches an error if the email used is not unique */
    try {
        await db.transaction (async (tx) => {
            tx.insert(user)
                .values({
                    id: body.id,
                    name: body.name,
                    email: body.email});
            tx.insert(userInfo)
                .values ({
                    id: body.id,
                    userId: body.userId,
                    authorized: body.authorized,
                    permissions: body.permissions})
                });
    }
    catch (error: any) {
        if (error.code === "23505") {
            return Response.json({error: "This email is already taken!"})
        }
        else {
            return Response.json({error: "error"})  /* TODO ask what error message to put*/
        }
    }
}

/* Deletes a user */
export async function DELETE (request: Request) {
    const session = await auth.api.getSession({headers:( request.headers) });

    /* Grabs the userid associated with the current session */

    if (!session)  {
        return Response.json({error: "unauthorized"}, {status: 401});
    }

    /* Grabs the userid associated with the current session */
    const Id = session.user.id;

     /* If the client is not an admin, return an unauthorized error */
    if (! getUserPermission(Id)) {
        return Response.json({error: "unauthorized"}, {status: 401});
    }

    /* Grabs info from client*/
    const body = await request.json();

    /* Deletes profile from user and userinfo */
    await db.transaction (async (tx) => {
        await tx.delete(user).where(eq(user.id, body.id));
        await tx.delete(userInfo).where(eq(userInfo.id, body.id));
    });
}