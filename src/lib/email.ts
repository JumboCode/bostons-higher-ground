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
    // todo: implement actual email sending logic
    await resend.emails.send({
        from: "no-reply@bhg.com ",
        to: email,
        subject: "You've been invited to join!",
        html: `
            <p>Hello, </p>
            <p> You've been invited to join our internal site. Use the code below to verify your invitation: </p>
            <h2>${tempCode}</h2>
            <p> 
                Or click
                <a href="${process.env.NEXT_PUBLIC_URL}/onboarding/verify-invite?code=${tempCode}">
                this link
                </a>
                to continue registration.
            </p>
            `,
    });

    console.log(`[Email] Sending ${type} OTP to ${email}: ${otp}`);

}

