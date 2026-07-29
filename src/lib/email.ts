import { Resend } from "resend";

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function baseUrl(): string {
    return process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
}

function logoUrl(): string {
    return `${baseUrl()}/Logo_black_text.png`;
}

function emailTemplate({
    title,
    bodyHtml,
}: {
    title: string;
    bodyHtml: string;
}): string {
    const year = new Date().getFullYear();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 32px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                            <img src="${logoUrl()}" alt="Boston's Higher Ground" width="200" style="display: block; margin: 0 auto; max-width: 100%; height: auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; color: #1f2937;">
                            ${bodyHtml}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 32px; text-align: center; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb;">
                            &copy; ${year} Boston's Higher Ground.<br />
                            If you need help, contact your administrator.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function codeBox(code: string): string {
    const safeCode = escapeHtml(code);
    return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 24px 0;">
            <tr>
                <td style="padding: 16px 32px; background-color: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; text-align: center; font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #111827;">
                    ${safeCode}
                </td>
            </tr>
        </table>
    `.trim();
}

function ctaButton({
    url,
    label,
}: {
    url: string;
    label: string;
}): string {
    const safeUrl = escapeHtml(url);
    const safeLabel = escapeHtml(label);
    return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 24px 0;">
            <tr>
                <td style="border-radius: 6px; background-color: #111827; text-align: center;">
                    <a href="${safeUrl}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">${safeLabel}</a>
                </td>
            </tr>
        </table>
    `.trim();
}

async function sendEmailWithTemplate({
    to,
    subject,
    title,
    bodyHtml,
}: {
    to: string;
    subject: string;
    title: string;
    bodyHtml: string;
}): Promise<void> {
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (!process.env.EMAIL_SEND_ADDRESS) {
        throw new Error("email send address not configured");
    }

    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_SEND_ADDRESS,
        to,
        subject,
        html: emailTemplate({ title, bodyHtml }),
    });

    if (error) {
        throw new Error(error.message);
    }

    console.log("[Email] Email sent:", data);
}

export async function sendPasswordResetEmail({
    email,
    url,
}: {
    email: string;
    url: string;
}): Promise<void> {
    try {
        const body = `
            <p>Hi there,</p>
            <p>We received a request to reset the password for your <strong>Boston's Higher Ground</strong> account.</p>
            <p>If this was you, click the button below to choose a new password:</p>
            ${ctaButton({ url, label: "Reset password" })}
            <p style="text-align: center; font-size: 14px; color: #4b5563;">
                Or copy and paste this link into your browser:<br />
                <a href="${escapeHtml(url)}" style="color: #2563eb; word-break: break-all;">${escapeHtml(url)}</a>
            </p>
            <p>This link will expire soon. If you did not request this, you can safely ignore this email &mdash; your account is secure.</p>
        `;

        await sendEmailWithTemplate({
            to: email,
            subject: "Reset your Boston's Higher Ground password",
            title: "Reset your password",
            bodyHtml: body,
        });

        console.log(`[Email] Password reset email sent to ${email}`);
    } catch (error) {
        console.error(
            `[Email] Failed to send password reset email to ${email}:`,
            error
        );
        throw error;
    }
}

export async function sendEmail({
    email,
    otp,
    type,
}: {
    email: string;
    otp: string;
    type: "sign-in" | "email-verification" | "forget-password";
}): Promise<void> {
    const base = baseUrl();

    try {
        if (type === "email-verification") {
            const verifyInviteUrl = `${base}/onboarding/verify-invite?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`;

            const body = `
                <p>Hi there,</p>
                <p>You've been invited to join <strong>Boston's Higher Ground</strong>, our internal team dashboard.</p>
                <p>To complete your registration, enter the verification code below:</p>
                ${codeBox(otp)}
                <p style="text-align: center; margin-top: 0;">
                    <a href="${escapeHtml(verifyInviteUrl)}" style="color: #2563eb;">Complete registration with this link</a>
                </p>
                <p>This code will expire in 15 minutes. If you didn't expect this email, you can safely ignore it.</p>
            `;

            await sendEmailWithTemplate({
                to: email,
                subject: "You're invited to Boston's Higher Ground",
                title: "Complete your registration",
                bodyHtml: body,
            });

            console.log(`[Email] Invitation email sent to ${email}`);
            return;
        }

        if (type === "sign-in") {
            const body = `
                <p>Hi there,</p>
                <p>Use the one-time code below to sign in to your <strong>Boston's Higher Ground</strong> account:</p>
                ${codeBox(otp)}
                <p>This code will expire in 15 minutes and can only be used once. If you didn't request this code, you can safely ignore this email.</p>
            `;

            await sendEmailWithTemplate({
                to: email,
                subject: "Sign-in code for Boston's Higher Ground",
                title: "Your sign-in code",
                bodyHtml: body,
            });

            console.log(`[Email] Sign-in code sent to ${email}`);
            return;
        }

        // forget-password
        const body = `
            <p>Hi there,</p>
            <p>We received a request to reset your <strong>Boston's Higher Ground</strong> password.</p>
            <p>Use the one-time code below to continue:</p>
            ${codeBox(otp)}
            <p>This code will expire in 15 minutes and can only be used once. If you didn't request this code, you can safely ignore this email &mdash; your account is secure.</p>
        `;

        await sendEmailWithTemplate({
            to: email,
            subject: "Password reset code for Boston's Higher Ground",
            title: "Reset your password",
            bodyHtml: body,
        });

        console.log(`[Email] Password reset code sent to ${email}`);
    } catch (error) {
        console.error(
            `[Email] Failed to send ${type} email to ${email}:`,
            error
        );
        throw error;
    }
}
