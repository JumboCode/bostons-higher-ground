import { db } from "./db";
import { verification, user } from "./schema";
import { eq, and, gt } from "drizzle-orm";
import { NextRequest } from "next/server";

export const VERIFICATION_TOKEN_COOKIE = "verification_token";

export async function verifyCodeToken(
    email: string,
    token: string
): Promise<boolean> {
    try {
        const [userRecord] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (!userRecord) {
            return false;
        }

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
    } catch {
        return false;
    }
}

export function hasVerificationToken(request: NextRequest): boolean {
    try {
        let cookieHeader = "";
        if (request && typeof request === "object") {
            if ("cookies" in request && request.cookies) {
                const cookieValue = request.cookies.get(
                    VERIFICATION_TOKEN_COOKIE
                );
                return !!cookieValue;
            }
            if ("get" in request && typeof request.get === "function") {
                cookieHeader = request.get("cookie") || "";
            }
        } else if (typeof request === "string") {
            cookieHeader = request;
        }
        if (cookieHeader) {
            const cookiePairs = cookieHeader.split(";").map((c) => c.trim());
            const verificationCookie = cookiePairs.find((c) =>
                c.startsWith(`${VERIFICATION_TOKEN_COOKIE}=`)
            );
            return !!verificationCookie;
        }

        return false;
    } catch {
        return false;
    }
}
