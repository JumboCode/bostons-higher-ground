import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { sendEmail } from "./email";

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
        sendResetPassword: async({ user, url, token }) => {
            console.log("auth.ts 21: sending email...");
            await sendEmail({
                email: user.email,
                otp: url,
                type: "forget-password"
            });
        },
        onPasswordReset: async({ user }, request) => {
            console.log(`password successfully reset for ${user.email}`);
        }
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
