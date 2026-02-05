"use server";

import { auth } from "@/lib/auth";
// import { db } from "@/lib/db";
// import { userInfo, user, housingRecords } from "@/lib/schema";
// import { eq } from "drizzle-orm";
import { getUserPermission } from "@/lib/usersFunction";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
    // IF THE USER IS A LOGGED IN 
    const session = await auth.api.getSession({ headers: request.headers });
    if(!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    //CHECKS IF THE LOGGED IN USER IS AN ADMIN
    const isAdmin = await getUserPermission(session.user.id);
    if (!isAdmin) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }
    
    //READ EMAIL ADDRESS FROM BODY
    let body: { email?: string };
    try {
        body = await request.json(); //THE REUQEST IS THE EMAIL REQUEST
    } catch {
        return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    if (!body.email) {
        return Response.json({ error: "missing_email" }, { status: 400 });
    }

    //GENERATE OTP TOKEN TO REPLACE WITH THE PREVIOUS EMAIL TOKEN
    const otp = crypto.randomUUID(); //otp=one time token

    //CALLS THE SEND EMAL FUNCTION 
    await sendEmail({
        email: body.email,
        otp,
        type: "invite",
    });
    // console.log(`[Email] Sending "invite" OTP to ${body.email}: ${otp}`);
    //SAYS ALL WORKED
    return Response.json({ success: true });

}
