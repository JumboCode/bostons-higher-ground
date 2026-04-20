"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";
import { InvitationSentCard, ModalOverlay } from "./notifCard";
import { Manrope } from "next/font/google";
const manrope = Manrope({ subsets: ["latin"] });
import { Poppins } from "next/font/google";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["700"],
});
export default function InviteCard({
    onCancel,
    onSend,
    className = "",
}: {
    onCancel?: () => void;
    onSend?: (payload: { name: string; email: string }) => void | Promise<void>;
    className?: string;
}) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [showSent, setShowSent] = useState(false);

    const canSend = name.trim() !== "" && email.trim() !== "";

    return (
        <>
            <div
                role="dialog"
                aria-labelledby="invite-title"
                aria-modal="true"
                className={[
                    "w-[384px] max-w-[94vw] rounded-[20px] border border-white/30 bg-white p-7.5 shadow-xl ring-1 ring-black/5",
                    className,
                ].join(" ")}
                style={{ boxShadow: "0px 24px 50px rgba(167,165,181,.20)" }}
            >
                <h2
                    id="invite-title"
                    className="font-poppins mb-10 text-center text-[24px] leading-10.5 font-bold text-[#555]"
                >
                    Invite Member
                </h2>

                <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (!canSend) return;
                        if (onSend) {
                            await onSend({
                                name: name.trim(),
                                email: email.trim(),
                            });
                            return;
                        }

                        setShowSent(true);
                    }}
                >
                    <label className="block">
                        <span
                            className="font-manrope mb-1 block text-[14px] font-medium text-[#555]"
                        >
                            Full Name <span className="text-bhg-pink">*</span>
                        </span>
                        <input
                            type="text"
                            placeholder="First Last"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="font-manrope h-9 w-81 rounded-[14px] border border-[#F3F3F5] bg-[#F3F3F5] px-3 text-[14px] placeholder:text-[#AAAAAA] focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        />
                    </label>

                    <label className="block">
                        <span
                            className="font-manrope mb-1 block text-[14px] font-medium text-[#555]"
                        >
                            Email Address{" "}
                            <span className="text-bhg-pink">*</span>
                        </span>
                        <input
                            type="email"
                            inputMode="email"
                            placeholder="name@higherground.org"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="font-manrope h-9 w-81 rounded-[14px] border border-[#F3F3F5] bg-[#F3F3F5] px-3 text-[14px] placeholder:text-[#AAAAAA] focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        />
                    </label>

                    <div
                        className="font-manrope mt-4 w-81 rounded-[20px] border border-[#DBEAFE] bg-[#EFF6FF] px-4.25 py-4.25 text-[13px] leading-5 text-[#1C398E]"
                    >
                        The staff member will receive an email with a temporary
                        code and link to create their account.
                    </div>

                    <div className="mt-6 flex w-81 items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="font-manrope h-9 w-39 rounded-[14px] border border-black/10 bg-white text-[14px] font-medium text-[#555] hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSend}
                            className="font-manrope inline-flex h-9 w-39 items-center justify-center gap-4 rounded-[14px] bg-bhg-pink px-2.25 py-2 text-[14px] font-medium text-white hover:bg-[#d35f73] disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            <span>Send Invite</span>
                        </button>
                    </div>
                </form>
            </div>

            {showSent && (
                <ModalOverlay onClose={() => setShowSent(false)}>
                    <InvitationSentCard
                        email={email}
                        onClose={() => setShowSent(false)}
                    />
                </ModalOverlay>
            )}
        </>
    );
}
