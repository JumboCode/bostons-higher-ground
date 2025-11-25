/**
 * @file email.ts
 * @description Email utility functions for sending verification OTPs
 */

/**
 * Send email with OTP verification code
 * @param email - Recipient email address
 * @param otp - One-time password code
 * @param type - Type of verification (e.g., "email", "password-reset")
 */
export async function sendEmail({
    email,
    otp,
    type,
}: {
    email: string;
    otp: string;
    type: string;
}): Promise<void> {
    // TODO: Implement actual email sending logic
    // This is a placeholder - integrate with your email service provider
    // (e.g., SendGrid, Resend, AWS SES, etc.)
    
    console.log(`[Email] Sending ${type} OTP to ${email}: ${otp}`);
    
    // Example implementation structure:
    // await emailService.send({
    //     to: email,
    //     subject: `Your verification code: ${otp}`,
    //     body: `Your verification code is: ${otp}`,
    // });
}

