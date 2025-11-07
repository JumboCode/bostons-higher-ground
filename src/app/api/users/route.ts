"use server";

import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client"
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

    /* Tries to insert user profile, catches an error if the action produces an error */
    try {
        const newUser = await authClient.signUp.email({
            email: body.email,
            password: crypto.randomUUID(), // temporary password
            name: body.name
        });
        
        if (!newUser.data) {
            return Response.json({error: "error"})
        }
        else {
            await db.transaction(async (tx) => {
                await tx.insert(userInfo).values({
                    id: newUser.data.user.id,
                    userId: 
                    authorized: false,
                    permissions: 'none',
                });
            });
        }

        
        console.log(newUser);
    }
    catch (error: any) {
        return Response.json({error: "error"})  /* TODO ask what error message to put*/
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

    /* Deletes profile from userinfo */
    await db.transaction (async (tx) => {
        await tx.delete(userInfo).where(eq(userInfo.id, body.id));
    });
}