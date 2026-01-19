"use client";

import React from "react";
import { CheckCircle, Trash2, Send } from "lucide-react";
import clsx from "clsx";

/** ---------------------------
 *  Overlay (exported)
 *  --------------------------- */
export function ModalOverlay({
    children,
    onClose,
    className,
}: {
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}) {
    return (
        <div
            aria-modal="true"
            role="dialog"
            className={clsx(
                "fixed inset-0 z-50 flex items-center justify-center",
                "bg-black/40 backdrop-blur-sm",
                className
            )}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            {children}
        </div>
    );
}

/** ---------------------------
 *  Base Card (exported)
 *  --------------------------- */
export function NotifCard({
    icon,
    title,
    children,
    primaryAction,
    secondaryAction,
    centerAction = false,
    pill = false, // NEW: blue "pill" container only when true
    className,
}: {
    icon?: React.ReactNode;
    title: string;
    children?: React.ReactNode;
    primaryAction?: {
        label: string;
        onClick?: () => void;
        iconLeft?: React.ReactNode;
    };
    secondaryAction?: { label: string; onClick?: () => void };
    centerAction?: boolean;
    pill?: boolean;
    className?: string;
}) {
    return (
        <div
            className={clsx(
                "w-[384px] rounded-2xl bg-white p-8 shadow-xl",
                "shadow-[0_12px_48px_rgba(0,0,0,0.12)]",
                className
            )}
        >
            {icon && (
                <div className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center">
                    <div className="[&>svg]:h-[60px] [&>svg]:w-[60px]">
                        {icon}
                    </div>
                </div>
            )}

            <h2
                className={clsx(
                    "mb-4 text-center font-bold",
                    "text-[24px] leading-[42px]",
                    "text-[#555555]"
                )}
                style={{ fontFamily: "Poppins, ui-sans-serif, system-ui" }}
            >
                {title}
            </h2>

            {children &&
                (pill ? (
                    <div
                        className="mb-6 rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] px-5 py-4 text-center text-[13px] leading-5 text-[#1C398E]"
                        style={{
                            fontFamily: "Manrope, ui-sans-serif, system-ui",
                        }}
                    >
                        {children}
                    </div>
                ) : (
                    <div
                        className="mb-6 text-center text-[14px] leading-6 text-[#6A7282]"
                        style={{
                            fontFamily: "Manrope, ui-sans-serif, system-ui",
                        }}
                    >
                        {children}
                    </div>
                ))}

            <div
                className={clsx(
                    "mt-2 flex gap-4",
                    centerAction ? "justify-center" : "justify-between"
                )}
            >
                {secondaryAction && (
                    <button
                        type="button"
                        onClick={secondaryAction.onClick}
                        className={clsx(
                            "h-9 w-[156px] rounded-[14px] border",
                            "border-black/10 bg-white px-4 text-[14px] leading-5",
                            "text-[#111827] transition-colors",
                            "hover:bg-black/5"
                        )}
                        style={{
                            fontFamily: "Manrope, ui-sans-serif, system-ui",
                        }}
                    >
                        {secondaryAction.label}
                    </button>
                )}

                {primaryAction && (
                    <button
                        type="button"
                        onClick={primaryAction.onClick}
                        className={clsx(
                            "h-9 rounded-[14px] bg-[#E76C82] px-4 text-white",
                            "text-[14px] font-medium leading-5",
                            centerAction ? "w-full max-w-[324px]" : "w-[156px]",
                            "flex items-center justify-center gap-2"
                        )}
                        style={{
                            fontFamily: "Manrope, ui-sans-serif, system-ui",
                        }}
                    >
                        {primaryAction.iconLeft}
                        {primaryAction.label}
                    </button>
                )}
            </div>
        </div>
    );
}

/** Utility icon */
const PinkSendIcon = <Send className="text-white" size={18} />;

/** ---------------------------
 *  Popups (overlay baked in but toggleable)
 *  --------------------------- */

/** Invitation Sent (no pill, no blue text) */
export function InvitationSentCard({
    email = "name@higherground.org",
    onClose,
    showOverlay = true,
}: {
    email?: string;
    onClose?: () => void;
    showOverlay?: boolean;
}) {
    const card = (
        <NotifCard
            icon={<CheckCircle className="text-[#22C55E]" />}
            title="Invitation Sent!"
        >
            <>
                Invitation email sent to
                <br />
                <span className="font-medium">{email}.</span>
            </>
        </NotifCard>
    );

    return showOverlay ? (
        <ModalOverlay onClose={onClose}>{card}</ModalOverlay>
    ) : (
        card
    );
}

/** Remove User (no pill) */
export function RemoveUserCard({
    onCancel,
    onRemove,
    showOverlay = true,
}: {
    onCancel?: () => void;
    onRemove?: () => void;
    showOverlay?: boolean;
}) {
    const card = (
        <NotifCard
            icon={<Trash2 className="text-[#E76C82]" />}
            title="Remove User"
            secondaryAction={{ label: "Cancel", onClick: onCancel }}
            primaryAction={{ label: "Remove", onClick: onRemove }}
        >
            <>Are you sure you want to remove this user?</>
        </NotifCard>
    );

    return showOverlay ? (
        <ModalOverlay onClose={onCancel}>{card}</ModalOverlay>
    ) : (
        card
    );
}

/** User Removed (no pill, no blue text) */
export function UserRemovedCard({
    name = "Emily Rodriguez",
    onClose,
    showOverlay = true,
}: {
    name?: string;
    onClose?: () => void;
    showOverlay?: boolean;
}) {
    const card = (
        <NotifCard
            icon={<Trash2 className="text-[#E76C82]" />}
            title="User Removed"
        >
            <>
                Removed <span className="font-medium">{name}</span>{" "}
                successfully.
            </>
        </NotifCard>
    );

    return showOverlay ? (
        <ModalOverlay onClose={onClose}>{card}</ModalOverlay>
    ) : (
        card
    );
}

/** Account Created (no pill) */
export function AccountCreatedCard({
    onLogin,
    onClose,
    showOverlay = true,
}: {
    onLogin?: () => void;
    onClose?: () => void;
    showOverlay?: boolean;
}) {
    const card = (
        <NotifCard
            icon={<CheckCircle className="text-[#E76C82]" />}
            title="Account Created!"
            centerAction
            primaryAction={{ label: "Login", onClick: onLogin }}
        >
            {
                "Your account has been successfully created.\nYou can now log in to access your dashboard."
            }
        </NotifCard>
    );

    return showOverlay ? (
        <ModalOverlay onClose={onClose}>{card}</ModalOverlay>
    ) : (
        card
    );
}

/** Resend Invite (ONLY one that keeps the blue pill) */
export function ResendInviteCard({
    onCancel,
    onResend,
    showOverlay = true,
}: {
    onCancel?: () => void;
    onResend?: () => void;
    showOverlay?: boolean;
}) {
    const card = (
        <NotifCard
            title="Resend Invite"
            secondaryAction={{ label: "Cancel", onClick: onCancel }}
            primaryAction={{
                label: "Resend Invite",
                onClick: onResend,
                iconLeft: PinkSendIcon,
            }}
            pill
        >
            The staff member will receive an email with a temporary code and
            link to create their account.
        </NotifCard>
    );

    return showOverlay ? (
        <ModalOverlay onClose={onCancel}>{card}</ModalOverlay>
    ) : (
        card
    );
}
