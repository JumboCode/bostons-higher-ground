import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-8">
            <Suspense
                fallback={
                    <div className="w-md rounded-3xl bg-white p-8 shadow-[0px_24px_50px_0px_rgba(167,74,91,0.2)] text-center text-neutral-600">
                        Loading…
                    </div>
                }
            >
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}
