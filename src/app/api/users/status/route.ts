"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userInfo } from "@/lib/schema";
import {eq} from "drizzle-orm";
import { getUserPermission } from "@/lib/usersFunction";


export async function GET(request: Request) {

    /* Uses better auth to grab the session from the request header*/
    const session = await auth.api.getSession({headers: (request.headers)});
    

    /* If the user isn't authenticated, throw a unauthorized error, status 401*/
    if (!session) {
        return Response.json({error: "unauthorized"}, {status: 401});
    }

    /* Grabs the userid associated with the current session */
    const curUserId = session.user.id;
    
    /* Fetch call to SQL database, looks in the entire userInfo table for the info where 
       userInfo.id = curUserId  */
    const [result] = await db
        .select({authorized: userInfo.authorized})
        .from (userInfo)
        .where (eq(userInfo.id, curUserId));

    return result?.authorized;
}

export async function POST(request: Request) {
    /* Uses better auth to grab the session from the request header*/
    const session = await auth.api.getSession({headers: (request.headers)});
    

    /* If the user isn't authenticated, throw a unauthorized error, status 401*/
    if (!session) {
        return Response.json({error: "unauthorized"}, {status: 401});
    }

    /* Grabs the userid associated with the current session */
    const Id = session.user.id;

    if (! getUserPermission(Id)) {
        return Response.json({error: "unauthorized"}, {status: 401});
    }

    const new_info = await request.json();

    await db
        .update(userInfo)
        .set({authorized: new_info.authorized})
        .where(eq (userInfo.id, Id));

    return Response.json({result: "success"});
}

