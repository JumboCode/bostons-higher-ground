// app/account-created/page.tsx
"use client";
import { CircleCheck } from "lucide-react";

export default function AccountCreatedPage() {
  return (
    <main className="flex flex-col grow items-center justify-center min-h-screen">
      {/* Centered confirmation card */}
      <div className="w-md px-8 py-10 rounded-3xl bg-white shadow-[0px_24px_50px_0px_rgba(167,74,91,0.2)] flex flex-col items-center space-y-6">
        <CircleCheck
          className="text-[#e76c82]"
          size={64}
          strokeWidth={2.5}
        />
        <p className="text-2xl font-bold text-[#444] mt-1 text-center">Account Created!</p>
        <p className="text-[#666] text-center text-base max-w-xs">
          Your account has been successfully created.<br />
          You can now log in to access your dashboard.
        </p>
        <a
          href="/login"
          className="mt-2 py-3 w-full rounded-xl text-white flex justify-center items-center bg-[#E76C82] text-base font-medium transition hover:bg-[#e05a74]"
        >
          Login
        </a>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center text-xs text-[#aaa] absolute inset-x-0 bottom-3">
        © 2025 Higher Ground Boston. For authorized staff use only.
      </footer>
    </main>
  );
}
