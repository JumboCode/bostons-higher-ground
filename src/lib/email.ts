import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
    email,
    otp,
    type,
}: {
    email: string;
    otp: string;
    type: string;
}): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    try {
        if (type === "invite") {
            // Send invitation email
            await resend.emails.send({
                from: "no-reply@bostonsground.com",
                to: email,
                subject: "You've been invited to join Boston's Higher Ground!",
                html: `
                    <p>Hello,</p>
                    <p>You've been invited to join our internal site. Use the code below to verify your invitation:</p>
                    <h2>${otp}</h2>
                    <p>
                        Or click
                        <a href="${baseUrl}/invite/verify?code=${otp}">
                            this link
                        </a>
                        to continue registration.
                    </p>
                `,
            });
        } else {
            // Send OTP verification email for other auth flows
            await resend.emails.send({
                from: "no-reply@bostonsground.com",
                to: email,
                subject: "Your verification code",
                html: `
                    <p>Hello,</p>
                    <p>Your verification code is:</p>
                    <h2>${otp}</h2>
                    <p>This code will expire in 15 minutes.</p>
                `,
            });
        }
    } catch (error) {
        console.error(`[Email] Failed to send ${type} email to ${email}:`, error);
        throw error;
    }
}

