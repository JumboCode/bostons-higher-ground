/**
 * @file auth.ts
 * @description auth code that gets executed on the back end
 */

import { betterAuth, email } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { sendEmail } from "./email";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
    },

    plugins: [nextCookies(),
        emailOTP({
            otpLength: 10,
            expiresIn: 15 * 60,
            sendVerificationOTP: ({email, otp, type}) => {
                await sendEmail 
            }
        })
    ]
});
