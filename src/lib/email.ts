import { auth } from "@/lib/auth";

export async function sendEmail({
    email,
    otp,
    type,
}: {
    email: string;
    otp: string;
    type: "sign-in" | "email-verification" | "forget-password";
}): Promise<void> {
    await auth.api.sendVerificationOTP({
        body: {
            email: email,
            type: type,
        },
    })
    console.log(`[Email] Sending ${type} OTP to ${email}: ${otp}`);

}

