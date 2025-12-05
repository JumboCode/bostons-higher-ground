"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";
import { InvitationSentCard, ModalOverlay } from "./notifCard";

import { Manrope } from "next/font/google";
const manrope = Manrope({ subsets:["latin"] });

// import popins

import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"], // bold weight
});



export default function InviteCard({
  onCancel,
  onSend,
  className = "",
}: {
  onCancel?: () => void;
  onSend?: (payload: { name: string; email: string }) => void;
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
          "w-[384px] max-w-[94vw] rounded-[20px] border border-white/30 bg-white p-[30px] shadow-xl ring-1 ring-black/5",
          className,
        ].join(" ")}
        style={{ boxShadow: "0px 24px 50px rgba(167,165,181,.20)" }}
      >
        <h2
          id="invite-title"
          className="mb-[40px] text-center text-[24px] leading-[42px] font-bold text-[#555]"
          style={{ fontFamily: "Poppins, var(--font-poppins, inherit)" }}
        >
          Invite Member
        </h2>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSend) return;
            onSend?.({ name: name.trim(), email: email.trim() });
            setShowSent(true); // show Invitation Sent popup
          }}
        >
          <label className="block">
            <span className="mb-1 block text-[14px] font-medium text-[#555]" style={{ fontFamily: "Manrope" }}>
              Full Name <span className="text-[#E76C82]">*</span>
            </span>
            <input
              type="text"
              placeholder="Fist Last"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-[36px] w-[324px] rounded-[14px] border border-[#F3F3F5] bg-[#F3F3F5] px-3 text-[14px] placeholder:text-[#AAAAAA] focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              style={{ fontFamily: "Manrope" }}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[14px] font-medium text-[#555]" style={{ fontFamily: "Manrope" }}>
              Email Address <span className="text-[#E76C82]">*</span>
            </span>
            <input
              type="email"
              inputMode="email"
              placeholder="name@higherground.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[36px] w-[324px] rounded-[14px] border border-[#F3F3F5] bg-[#F3F3F5] px-3 text-[14px] placeholder:text-[#AAAAAA] focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              style={{ fontFamily: "Manrope" }}
            />
          </label>

          <div
            className="mt-4 w-[324px] rounded-[20px] border border-[#DBEAFE] bg-[#EFF6FF] px-[17px] py-[17px] text-[13px] leading-5 text-[#1C398E]"
            style={{ fontFamily: "Manrope" }}
          >
            The staff member will receive an email with a temporary code and link to create their account.
          </div>

          <div className="mt-6 flex w-[324px] items-center justify-between gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-[36px] w-[156px] rounded-[14px] border border-black/10 bg-white text-[14px] font-medium text-[#555] hover:bg-gray-50"
              style={{ fontFamily: "Manrope" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex h-[36px] w-[156px] items-center justify-center gap-4 rounded-[14px] bg-[#E76C82] px-[9px] py-[8px] text-[14px] font-medium text-white hover:bg-[#d35f73] disabled:opacity-50"
              style={{ fontFamily: "Manrope" }}
            >
              <Send className="h-4 w-4" />
              <span>Send Invite</span>
            </button>
          </div>
        </form>
      </div>

      {showSent && (
        <ModalOverlay onClose={() => setShowSent(false)}>
          <InvitationSentCard email={email} onClose={() => setShowSent(false)} />
        </ModalOverlay>
      )}
    </>
  );
}
