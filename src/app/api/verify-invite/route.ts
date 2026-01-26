"use server";

import { db } from "@/lib/db";
import { verification, user, userInfo } from "@/lib/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { VERIFICATION_TOKEN_COOKIE } from "@/lib/verification";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, tempCode } = body;

        if (!email || !tempCode) {
            return NextResponse.json(
                { error: "Email and temporary code are required" },
                { status: 400 }
            );
        }

        const [verificationRecord] = await db
            .select()
            .from(verification)
            .where(
                and(
                    eq(verification.identifier, email),
                    eq(verification.value, tempCode),
                    gt(verification.expiresAt, new Date())
                )
            )
            .limit(1);

        if (!verificationRecord) {
            return NextResponse.json(
                { error: "Invalid or expired verification code" },
                { status: 401 }
            );
        }

        const existingUser = await db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        let finalUser;

        if (existingUser.length > 0) {
        finalUser = existingUser[0];

        await db.update(userInfo)
            .set({ authorized: true })
            .where(eq(userInfo.userId, finalUser.id));
        } else {
        const signupResult = await auth.api.signUpEmail({
            body: {
                email,
                password: crypto.randomUUID(),
                name: email.split("@")[0],
            },
        });

        finalUser = signupResult.user;

        await db.insert(userInfo).values({
            id: crypto.randomUUID(),
            userId: finalUser.id,
            authorized: true, 
            permissions: "none",
        });
        }
        

        const response = NextResponse.json({
            success: true,
            message: "Verification successful",
        });

        const expires = new Date();
        expires.setHours(expires.getHours() + 1);

        response.cookies.set(VERIFICATION_TOKEN_COOKIE, tempCode, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

