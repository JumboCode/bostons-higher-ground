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
    console.log(`[Email] Sending ${type} OTP to ${email}: ${otp}`);

}

