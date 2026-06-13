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

function getPasswordRequirements(password: string, confirmPassword: string) {
    return {
        "At least 8 characters": password.length >= 8,
        "Contains uppercase letter": /[A-Z]/.test(password),
        "Contains lowercase letter": /[a-z]/.test(password),
        "Contains number": /\d/.test(password),
        "Passwords match": password !== "" && password === confirmPassword,
    };
}

export function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const queryError = searchParams.get("error");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState(
        queryError === "INVALID_TOKEN"
            ? "This password reset link is invalid or has expired."
            : ""
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const requirements = getPasswordRequirements(password, confirmPassword);
    const allValid = Object.values(requirements).every(Boolean);
    const canSubmit = allValid && !isSubmitting && !!token;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("Missing reset token. Please request a new link.");
            return;
        }

        if (!canSubmit) {
            setError("Please make sure all password requirements are met.");
            return;
        }

        setIsSubmitting(true);

        try {
            const { error: resetError } = await authClient.resetPassword({
                newPassword: password,
                token,
            });

            if (resetError) {
                setError(
                    resetError.message ||
                        "Could not reset your password. Please try again."
                );
                setIsSubmitting(false);
                return;
            }

            router.push("/login");
        } catch {
            setError("An unexpected error occurred. Please try again.");
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="w-md px-8 py-8 rounded-3xl bg-white shadow-[0px_24px_50px_0px_rgba(167,74,91,0.2)] text-center">
                <p className="text-2xl font-bold text-[#555] mb-4">
                    Invalid Reset Link
                </p>
                <p className="text-neutral-600 mb-6">
                    This password reset link is missing or expired.
                </p>
                <a
                    href="/login"
                    className="inline-block w-full rounded-xl bg-[#E76C82] px-4 py-3 text-center font-medium text-white transition hover:bg-[#E05A74]"
                >
                    Back to Login
                </a>
            </div>
        );
    }

    return (
        <div className="w-md px-8 py-8 rounded-3xl bg-white shadow-[0px_24px_50px_0px_rgba(167,74,91,0.2)]">
            <h1 className="text-center text-2xl font-bold text-[#555]">
                Reset Password
            </h1>
            <p className="mt-2 text-center text-sm text-neutral-500">
                Enter a new password for your account.
            </p>

            <form
                className="mt-6 flex w-full flex-col space-y-4"
                onSubmit={handleSubmit}
            >
                {/* New Password */}
                <div>
                    <label className="block text-[#555] font-medium">
                        New Password{" "}
                        <span className="text-[#D9534F]">*</span>
                    </label>
                    <div className="relative mt-1">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full rounded-xl bg-[#F3F3F5] py-2.5 px-3 pr-10 outline-none focus:ring-2 focus:ring-[#E76C82]"
                            placeholder="Enter your new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-2.5 text-neutral-600"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
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

                {/* Confirm Password */}
                <div>
                    <label className="block text-[#555] font-medium">
                        Confirm Password{" "}
                        <span className="text-[#D9534F]">*</span>
                    </label>
                    <div className="relative mt-1">
                        <input
                            type={showConfirm ? "text" : "password"}
                            className="w-full rounded-xl bg-[#F3F3F5] py-2.5 px-3 pr-10 outline-none focus:ring-2 focus:ring-[#E76C82]"
                            placeholder="Re-enter your new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-2.5 text-neutral-600"
                            onClick={() => setShowConfirm(!showConfirm)}
                            tabIndex={-1}
                            aria-label={
                                showConfirm ? "Hide password" : "Show password"
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

                {/* Requirements */}
                <div className="rounded-xl border bg-[#F9F7FC] px-4 py-4">
                    <p className="mb-2 font-semibold text-[#555]">
                        Password Requirements:
                    </p>
                    <ul>
                        {Object.entries(requirements).map(([label, valid]) => (
                            <li
                                key={label}
                                className="mb-1 flex items-center space-x-2 text-sm"
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
                                        valid ? "text-[#555]" : "text-[#aaa]"
                                    }
                                >
                                    {label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <ErrorMessage message={error} />

                <button
                    type="submit"
                    className={`mt-2 w-full rounded-xl py-3 text-center text-lg font-medium text-white transition ${
                        canSubmit
                            ? "bg-[#E76C82] hover:bg-[#E05A74]"
                            : "cursor-not-allowed bg-[#E59AA8]"
                    }`}
                    disabled={!canSubmit}
                    aria-disabled={!canSubmit}
                >
                    {isSubmitting ? "Resetting Password..." : "Reset Password"}
                </button>
            </form>
        </div>
    );
}
