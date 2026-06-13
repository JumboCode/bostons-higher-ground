import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { sendEmail, sendPasswordResetEmail } from "./email";

export const auth = betterAuth({
    trustedOrigins: [
        "http://localhost:3000",
        ...(process.env.VERCEL_URL
            ? [`https://${process.env.VERCEL_URL}`]
            : []),
    ],
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({ user, url }) => {
            // Avoid awaiting to prevent timing attacks that reveal whether
            // an account exists. In production, consider using waitUntil.
            sendPasswordResetEmail({ email: user.email, url }).catch((err) =>
                console.error("[Auth] Failed to send password reset email:", err)
            );
        },
    },
    emailVerification: {
        autoSignInAfterVerification: true,
    },
    user: {
        deleteUser: {
            enabled: true,
        },
    },
    plugins: [
        nextCookies(),
        emailOTP({
            otpLength: 6,
            expiresIn: 15 * 60,
            sendVerificationOTP: async ({ email, otp, type }) => {
                await sendEmail({ email, otp, type });
            },
        }),
    ],
});
