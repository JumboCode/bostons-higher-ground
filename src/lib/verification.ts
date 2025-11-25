/**
 * @file verification.ts
 * @description Utility functions for verification token management
 */

"use server";

import { db } from "./db";
import { verification, user } from "./schema";
import { eq, and, gt } from "drizzle-orm";

/**
 * Cookie name for storing verification token
 */
export const VERIFICATION_TOKEN_COOKIE = "verification_token";

/**
 * Check if a verification token is valid for a given email
 * @param email - The email address
 * @param token - The verification token
 * @returns true if token is valid and not expired, false otherwise
 */
export async function verifyCodeToken(
    email: string,
    token: string
): Promise<boolean> {
    try {
        // Find user by email
        const [userRecord] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (!userRecord) {
            return false;
        }

        // Check if verification token exists and is valid
        const [verificationRecord] = await db
            .select()
            .from(verification)
            .where(
                and(
                    eq(verification.identifier, email),
                    eq(verification.value, token),
                    gt(verification.expiresAt, new Date())
                )
            )
            .limit(1);

        return !!verificationRecord;
    } catch (error) {
        return false;
    }
}

/**
 * Check if user has a valid verification token in cookies
 * @param request - NextRequest object or Headers object or cookie string
 * @param email - Optional email to verify against
 * @returns true if valid token exists, false otherwise
 */
export function hasVerificationToken(
    request: any,
    email?: string
): boolean {
    try {
        let cookieHeader: string = "";
        
        // Handle NextRequest
        if (request && typeof request === "object") {
            if ("cookies" in request && request.cookies) {
                // NextRequest has cookies property
                const cookieValue = request.cookies.get(VERIFICATION_TOKEN_COOKIE);
                return !!cookieValue;
            } else if ("get" in request && typeof request.get === "function") {
                // Headers object
                cookieHeader = request.get("cookie") || "";
            }
        } else if (typeof request === "string") {
            cookieHeader = request;
        }

        // Extract verification token from cookie string
        if (cookieHeader) {
            const cookiePairs = cookieHeader.split(";").map((c) => c.trim());
            const verificationCookie = cookiePairs.find((c) =>
                c.startsWith(`${VERIFICATION_TOKEN_COOKIE}=`)
            );
            return !!verificationCookie;
        }

        return false;
    } catch (error) {
        return false;
    }
}

