import { Resend } from "resend";

export async function sendEmail({
    email,
    otp,
    type,
}: {
    email: string;
    otp: string;
    type: "sign-in" | "email-verification" | "forget-password";
}): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        if (type === "email-verification") {
            const verifyInviteUrl = `${baseUrl}/onboarding/verify-invite?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`;
            const { data, error } = await resend.emails.send({
                from: "no-reply@bhg.jumbocode.org",
                to: email,
                subject: "You've been invited to join Boston's Higher Ground!",
                html: `
                    <p>Hello,</p>
                    <p>You've been invited to join our internal site. Use the code below to verify your invitation:</p>
                    <h2>${otp}</h2>
                    <p>
                        Open
                        <a href="${verifyInviteUrl}">this link</a>
                        to continue registration.
                    </p>
                `,
            });

            if (error) {
                return console.error({ error });
            }
            console.log({ data });
            return;
        }

        if (type === "sign-in") {
            await resend.emails.send({
                from: "no-reply@bhg.jumbocode.org",
                to: email,
                subject: "Your sign-in code",
                html: `
                    <p>Hello,</p>
                    <p>Your one-time sign-in code is:</p>
                    <h2>${otp}</h2>
                    <p>This code will expire in 15 minutes.</p>
                `,
            });
            return;
        } else {
            console.log("email.ts 55: sending...", email);
            await resend.emails.send({
                from: "no-reply@bhg.jumbocode.org",
                to: email,
                subject: "Boston's Higher Ground Password Reset",
                html: `
                    <p>Hello,</p>
                    <p>Reset your password at the following url:</p>
                    <h2>${otp}</h2>
                    <p>If you did not request a password reset, you can ignore this email.</p>
                `,
            });
        }
    } catch (error) {
        console.error(
            `[Email] Failed to send ${type} email to ${email}:`,
            error
        );
        throw error;
    }
}
