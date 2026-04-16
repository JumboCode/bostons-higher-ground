"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import NavBar from "../../components/navbar";
import InviteCard from "../../components/onboarding/inviteCard";
import { ModalOverlay } from "../../components/onboarding/notifCard";
import { RemoveUserCard } from "../../components/onboarding/notifCard";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    InvitationSentCard,
    ResendInviteCard,
} from "@/components/onboarding/notifCard";

import {
    Search,
    CircleCheckBig,
    UsersRound,
    Send,
    RefreshCcw,
    MoreVertical,
    Shield,
    Eye,
    Trash2,
    X,
} from "lucide-react";

type User = {
    id: string;
    name: string;
    email: string;
    status: "Active" | "Pending";
    role?: string;
};

type ApiUserRow = {
    id: string;
    name: string;
    email: string;
    status: boolean;
    role?: string;
};

// type GetUsersResponse = {
//   users: ApiUserRow[];
// };

//changes this function to get actual users
export default function Admin() {
    // for invite staff pop up
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resendError, setResendError] = useState(false);

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isInviteSentOpen, setIsInviteSentOpen] = useState(false);
    const [inviteSentEmail, setInviteSentEmail] = useState("");
    const [isResendOpen, setIsResendOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch("/api/users");
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data?.error ?? "Failed to fetch users");
                }
                const data = await res.json();

                const rows: ApiUserRow[] = Array.isArray(data)
                    ? data
                    : (data?.users ?? []);

                const mapped: User[] = rows.map((u: ApiUserRow) => ({
                    id: u.id,
                    name: u.name ?? "(no name)",
                    email: u.email ?? "(no email)",
                    status: u.status === true ? "Active" : "Pending",
                    role: u.role ?? undefined,
                }));
                setUsers(mapped);
            } catch (e: unknown) {
                const message =
                    e instanceof Error ? e.message : "Error loading users";
                setError(message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const numMembers = users.length;

    const filteredUsers = useMemo(
        () =>
            users.filter(
                (user) =>
                    user.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [users, searchQuery]
    );

    return (
        <main className="flex min-h-screen bg-[#F5F5F5] overflow-x-hidden">
            <NavBar userName="admin" />
            <div className="relative flex-1 overflow-x-hidden">
                {/*Top bar*/}
                {/* <div className="w-full h-16 border-b border-[#E5E7EB] bg-[#ffffff]"></div> */}

                {/*Title*/}
                <div className="mt-12.5 mx-[45px] flex items-center justify-between">
                    <h1 className="text-4xl font-extrabold text-[#555555] gap-8 font-poppins">
                        Admin Settings
                    </h1>
                    <button className="px-2.5 py-[5px] rounded-xl border border-[#E76C82] text-[#E76C82] flex items-center justify-center gap-2">
                        <RefreshCcw className="w-[17px] h-[17px] text-[#E76C82]" />
                        Update Data
                    </button>
                </div>

                {/*Alert Box */}
                <div className="mt-[13px] mx-[45px] h-[46px] bg-[#4CAF501A] border border-[#4CAF5033] rounded-[16px] px-4 flex items-center">
                    <CircleCheckBig className="w-[16px] h-[16px] text-[#555555] shrink-0" />
                    <p className="font-manrope text-[14px] text-[#555555] leading-[20px] pl-[10px] line-clamp-2">
                        Last sync from Salesforce: Today at 12:44AM
                    </p>
                </div>

                {/*Table*/}
                <div className="mt-[25px] mx-[45px] h-[538px] border border-[#0000001A] rounded-[20px] bg-[#FFFFFF] p-[24px] flex flex-col min-w-[800px]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-[45px] h-[45px] rounded-2xl bg-[#F0E7ED] flex items-center justify-center">
                                <UsersRound className="w-[25px] h-[25px] text-[#E76C82]" />
                            </div>

                            <div>
                                <h2 className="text-[#555555] text-[20px] leading-[30px] font-poppins font-semibold h-[30px]">
                                    User Management
                                </h2>

                                <p className="font-manrope text-[14px] leading-[21px] text-[#ABABAB]">
                                    {numMembers} members
                                </p>
                            </div>
                        </div>

                        {/*Invite Staff*/}
                        <button
                            onClick={() => setIsInviteOpen(true)}
                            className="pl-[15px] pr-[18px] py-2 h-10 rounded-[14px] bg-[#E76C82] hover:bg-[#d75c6f] flex items-center justify-center
                            text-[#FFFFFF] font-manrope text-[15px] leading-5 gap-3"
                        >
                            <Send className="w-[18px] h-[18px]" />
                            Invite Staff
                        </button>
                    </div>

                    {/*Search bar*/}
                    <div className="relative pt-2.5">
                        <Search className="mt-[25px] absolute left-3 top-[13.5px] w-5 h-5 text-[#ABABAB]" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full mt-3 top-[66px] h-[55px] rounded-[14px] border border-[#D9D9D9] px-11 py-3 pr-4 outline-none ring-0 placeholder:text-neutral-400 focus:border-rose-300 focus:bg-white focus:shadow focus:shadow-rose-100"
                        ></input>
                    </div>

                    {/* ALL USERS!! */}
                    <div className="mt-[35px] mx-[8px]  overflow-x-auto">
                        <div className="min-w-[900px]">
                            {/* Header */}
                            <div className="flex w-full text-[#555555] font-manrope font-semibold mb-3 ">
                                <span className="text-left w-1/6">Member</span>
                                <span className="text-center grow w-1/3">
                                    Email
                                </span>
                                <span className="text-center w-1/6">
                                    Status
                                </span>
                                <span className="text-right w-1/6">
                                    Actions
                                </span>
                            </div>

                            {/* Dividing line for the table */}
                            <div className="border-b border-[#E0E0E0] mb-3 "></div>

                            {/* Rows */}
                            <div className="flex flex-col gap-0.5 overflow-y-auto ">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user, idx) => (
                                        <UserRow
                                            key={idx}
                                            user={user}
                                            setIsResendOpen={setIsResendOpen}
                                            setResendError={setResendError}
                                            setInviteSentEmail={
                                                setInviteSentEmail
                                            }
                                            setIsInviteSentOpen={
                                                setIsInviteSentOpen
                                            }
                                        />
                                    ))
                                ) : (
                                    <p>No users found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-[250px] right-0">
                <div className="h-[66px] border-t border-[#E5E7EB] flex items-center justify-center px-[32px] bg-white">
                    <footer className="text-[12px] text-[#6A7282]">
                        © 2025 Higher Ground Boston. For authorized staff use
                        only.
                    </footer>
                </div>
            </div>

            {isInviteOpen && (
                <ModalOverlay onClose={() => setIsInviteOpen(false)}>
                    <InviteCard
                        onCancel={() => setIsInviteOpen(false)}
                        onSend={async ({ name, email }) => {
                            console.log("Send invite", { name, email });
                            const res = await fetch("/api/users/email/", {
                                method: "POST",
                                body: JSON.stringify({ email }),
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            });

                            if (!res.ok) {
                                setResendError(true);
                                setIsInviteOpen(false);
                                return;
                            }

                            setIsInviteOpen(false);
                            setInviteSentEmail(email);
                            setIsInviteSentOpen(true);
                        }}
                    />
                </ModalOverlay>
            )}

            {isInviteSentOpen && !resendError && (
                <ModalOverlay onClose={() => setIsInviteSentOpen(false)}>
                    <InvitationSentCard
                        email={inviteSentEmail}
                        showOverlay={false}
                        onClose={() => setIsInviteSentOpen(false)}
                    />
                </ModalOverlay>
            )}

            {isResendOpen && (
                <ModalOverlay onClose={() => setIsResendOpen(false)}>
                    <ResendInviteCard
                        showOverlay={false}
                        onCancel={() => {
                            setIsResendOpen(false);
                        }}
                        onResend={() => {
                            setIsResendOpen(false);
                            setIsInviteSentOpen(true);
                        }}
                    />
                </ModalOverlay>
            )}

            {resendError && (
                <div className="fixed top-10 right-4 w-80 bg-white border border-gray-300 px-4 py-3 shadow-lg shadow-gray-400 z-50 cursor-pointer rounded-md text-sm flex items-center gap-5">
                    <button
                        className=" left-4 hover:text-gray-700"
                        onClick={() => setResendError(false)}
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <span className="text-left">Failed to resend invite </span>
                </div>
            )}
        </main>
    );
}

function UserRow({
    user,
    setIsResendOpen,
    setResendError,
    setInviteSentEmail,
    setIsInviteSentOpen,
}: {
    user: User;
    setIsResendOpen: (value: boolean) => void;
    setResendError: (value: boolean) => void;
    setInviteSentEmail: (value: string) => void;
    setIsInviteSentOpen: (value: boolean) => void;
}) {
    const [actionVisible, setActionVisible] = useState(false);
    const actionsRef = useRef<HTMLDivElement | null>(null);
    const [isRemoveOpen, setIsRemoveOpen] = useState(false);

    useEffect(() => {
        if (!actionVisible) return;

        function handleClickOutside(e: MouseEvent) {
            if (
                actionsRef.current &&
                !actionsRef.current.contains(e.target as Node)
            ) {
                setActionVisible(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [actionVisible]);

    async function handleResend() {
        try {
            const res = await fetch("/api/users/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setResendError(true);
                return;
            }
            setInviteSentEmail(user.email);
            setIsInviteSentOpen(true);
        } catch (e) {
            console.error(e);
            setResendError(true);
        }
    }

    async function handleRemove() {
        setIsRemoveOpen(true);
    }

    async function removeUser() {
        const res = await fetch("/api/users", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: user.id }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data?.error ?? "Failed to remove user");
            return;
        }
        setIsRemoveOpen(false);
        window.location.reload();
    }

    return (
        <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0]">
            {/* Member */}
            <div className="flex items-center gap-3 w-[200px] min-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-[#E76C82] flex items-center justify-center text-white font-bold shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                </div>

                <div className="flex flex-col truncate">
                    <span className="font-poppins font-semibold text-[#111827]">
                        {user.name}
                    </span>

                    {user.role && (
                        <span className="flex text-[12px] text-[#E76C82] gap-1">
                            <Shield className="w-[15px] h-[15px]" />
                            {user.role.toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            {/* Email */}
            <div className="text-gray-400 text-center w-[300px] truncate">
                {user.email}
            </div>

            {/* Status */}
            <div className="w-[120px] text-center">
                <span
                    className={`px-2 py-1 rounded-full text-[12px] ${
                        user.status === "Active"
                            ? "bg-green-100 text-green-600"
                            : "bg-yellow-100 text-yellow-600"
                    }`}
                >
                    {user.status}
                </span>
            </div>

            {isRemoveOpen && (
                <ModalOverlay onClose={() => setIsRemoveOpen(false)}>
                    <RemoveUserCard
                        onCancel={() => setIsRemoveOpen(false)}
                        onRemove={() => {
                            removeUser();
                        }}
                    />
                </ModalOverlay>
            )}

            {/* Actions */}
            <div className="relative w-[60px] text-right" ref={actionsRef}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        {user.status === "Pending" && (
                            <DropdownMenuItem onClick={handleResend}>
                                <Send className="mr-2 h-4 w-4" />
                                Resend Invite
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                            onClick={handleRemove}
                            className="text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
