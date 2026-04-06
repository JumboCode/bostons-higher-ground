"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CircleCheck, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function ErrorMessage({ message }: { message: string }) {
    if (!message) return null;
    return (
        <p
            className="text-[#D9534F] text-sm mt-1 mb-2"
            role="alert"
            aria-live="polite"
        >
            {message}
        </p>
    );
}

function validatePassword(password: string, confirmPassword: string) {
    return {
        "At least 8 characters": password.length >= 8,
        "Contains uppercase letter": /[A-Z]/.test(password),
        "Contains lowercase letter": /[a-z]/.test(password),
        "Contains number": /\d/.test(password),
        "Passwords match": password !== "" && password === confirmPassword,
    };
}

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const requirements = validatePassword(password, confirmPassword);
    const allValid = Object.values(requirements).every(Boolean);
    const canSubmit = allValid && !isSubmitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!canSubmit) {
            setError("Please make sure all requirements are met.");
            return;
        }

        if (!token) {
            setError("Missing reset token. Please use the link from your email.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await authClient.resetPassword({
                newPassword: password,
                token,
            });

            if (result.error) {
                setError(result.error.message || "Could not reset password. Please try again.");
                setIsSubmitting(false);
                return;
            }

            router.push("/login");
        } catch {
            setError("Could not reset password. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex flex-col grow items-center justify-center">
            <div className="w-md px-8 py-8 rounded-3xl bg-white shadow-[0px_24px_50px_0px_rgba(167,74,91,0.2)] flex flex-col items-center space-y-6">
                <p className="text-3xl font-bold text-[#555] mt-2">
                    Reset Your Password
                </p>
                <form
                    className="w-full flex flex-col space-y-4"
                    onSubmit={handleSubmit}
                >
                    {/* Password Input */}
                    <div>
                        <label className="block text-[#555] font-medium">
                            New Password <span className="text-[#D9534F]">*</span>
                        </label>
                        <div className="relative mt-1">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="bg-[#F3F3F5] py-2 px-3 rounded-xl w-full pr-10 outline-none"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-2"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? (
                                    <Eye size={20} />
                                ) : (
                                    <EyeOff size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                    {/* Confirm Password Input */}
                    <div>
                        <label className="block text-[#555] font-medium">
                            Confirm Password{" "}
                            <span className="text-[#D9534F]">*</span>
                        </label>
                        <div className="relative mt-1">
                            <input
                                type={showConfirm ? "text" : "password"}
                                className="bg-[#F3F3F5] py-2 px-3 rounded-xl w-full pr-10 outline-none"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-2"
                                onClick={() => setShowConfirm(!showConfirm)}
                                tabIndex={-1}
                                aria-label={
                                    showConfirm
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showConfirm ? (
                                    <Eye size={20} />
                                ) : (
                                    <EyeOff size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                    {/* Password Requirements List */}
                    <div className="bg-[#F9F7FC] border rounded-xl px-4 py-4">
                        <p className="font-semibold mb-2 text-[#555]">
                            Password Requirements:
                        </p>
                        <ul>
                            {Object.entries(requirements).map(
                                ([label, valid]) => (
                                    <li
                                        key={label}
                                        className="flex items-center space-x-2 text-sm mb-1"
                                    >
                                        {valid ? (
                                            <CircleCheck
                                                size={18}
                                                className="text-[#76C893]"
                                            />
                                        ) : (
                                            <X
                                                size={18}
                                                className="text-[#D9534F]"
                                            />
                                        )}
                                        <span
                                            className={
                                                valid
                                                    ? "text-[#555]"
                                                    : "text-[#aaa]"
                                            }
                                        >
                                            {label}
                                        </span>
                                    </li>
                                )
                            )}
                        </ul>
                    </div>
                    {/* Error Message */}
                    <ErrorMessage message={error} />
                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={`mt-4 py-3 w-full rounded-xl text-white justify-center bg-[#E76C82] text-lg font-medium transition ${
                            canSubmit
                                ? "hover:bg-[#E05A74]"
                                : "opacity-70 cursor-not-allowed pointer-events-none"
                        }`}
                        disabled={!canSubmit}
                        aria-disabled={!canSubmit}
                    >
                        {isSubmitting
                            ? "Resetting Password..."
                            : "Reset Password"}
                    </button>
                </form>
            </div>
        </main>
    );
}
