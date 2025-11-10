"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userInfo } from "@/lib/schema";
import {eq} from "drizzle-orm";
import { getUserPermission } from "@/lib/usersFunction";
import { BetterAuthError } from "better-auth";
import { handleBetterAuthError } from "@/lib/usersFunction";


/* Adds a user*/
export async function POST (request: Request) {
    // const session = await auth.api.getSession({headers:( request.headers) });

    // /* If the client is not logged in, return an unauthorized error */
    // if (!session)  {
    //     return Response.json({error: "unauthorized"}, {status: 401});
    // }

    // /* Grabs the userid associated with the current session */
    // const Id = session.user.id;

    // /* If the client is not an admin, return an unauthorized error */
    // if (! getUserPermission(Id)) {
    //     return Response.json({error: "unauthorized"}, {status: 401});
    // }

    /* Grabs info from client*/
    const body = await request.json();

    /* Tries to insert user profile, catches an error if the action produces an error */
    try {
        const newUser = await auth.api.signUpEmail({
           body : {
            email: body.email,
            password: crypto.randomUUID(), // temporary password
            name: body.name
           }
        });
        
        if (!newUser) {
            return Response.json({error: "error"})
        }
        else {
            const userInfoId = crypto.randomUUID();

            await db.insert(userInfo).values({
                id: userInfoId,
                userId: newUser.user.id,
                authorized: false,
                permissions: 'none'
            });

        }
        return Response.json({success: true, user: newUser.user})

    }
    catch (err: unknown) {
        if (err instanceof BetterAuthError) {
            return handleBetterAuthError(err)
        }
        else {
            return Response.json({error: "Unknown server error"}, {status: 500})
        }

          /* TODO ask what error message to put*/
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
    await db.delete(userInfo).where(eq (userInfo.id, body.id) );
}