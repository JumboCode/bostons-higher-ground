"use server";

import { db } from "@/lib/db";
import { verification, user } from "@/lib/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { VERIFICATION_TOKEN_COOKIE } from "@/lib/verification";

/**
 * POST /api/verify-invite
 * Verifies the invite code and sets a verification token cookie
 */
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

        // Find user by email
        const [userRecord] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (!userRecord) {
            return NextResponse.json(
                { error: "Invalid email or code" },
                { status: 401 }
            );
        }

        // Check if verification token exists and is valid
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

        // Create response with success
        const response = NextResponse.json({
            success: true,
            message: "Verification successful",
        });

        // Set verification token cookie (expires in 1 hour)
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

