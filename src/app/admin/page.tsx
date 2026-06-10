"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
    AlertTriangle,
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

type SyncLogRow = {
    id: string;
    source: string;
    status: "running" | "success" | "error";
    startedAt: string;
    finishedAt: string | null;
    rowsSynced: number | null;
    missingFields: string[] | null;
    errorMessage: string | null;
    triggeredBy: string | null;
};

type SyncStatusResponse = {
    latest: SyncLogRow | null;
    latestSuccess: SyncLogRow | null;
};

function formatLastSync(date: string | null | undefined): string {
    if (!date) return "Never";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "Unknown";

    const now = new Date();
    const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
    const timeStr = d.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
    if (sameDay) return `Today at ${timeStr}`;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
        d.getFullYear() === yesterday.getFullYear() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getDate() === yesterday.getDate();
    if (isYesterday) return `Yesterday at ${timeStr}`;

    return `${d.toLocaleDateString()} at ${timeStr}`;
}

//changes this function to get actual users
export default function Admin() {
    const router = useRouter();
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

    // Salesforce sync state
    const [syncLatest, setSyncLatest] = useState<SyncLogRow | null>(null);
    const [syncLatestSuccess, setSyncLatestSuccess] =
        useState<SyncLogRow | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);
    const isSyncing = syncLatest?.status === "running";

    async function fetchSyncStatus(): Promise<SyncStatusResponse | null> {
        try {
            const res = await fetch("/api/admin/sync", { cache: "no-store" });
            if (!res.ok) return null;
            const data: SyncStatusResponse = await res.json();
            setSyncLatest(data.latest);
            setSyncLatestSuccess(data.latestSuccess);
            return data;
        } catch {
            return null;
        }
    }

    useEffect(() => {
        fetchSyncStatus();
    }, []);

    // Poll while a sync is running. When it completes successfully, refresh
    // server components so report pages pick up the new housing_records data.
    useEffect(() => {
        if (!isSyncing) return;
        const watchedId = syncLatest?.id;
        const interval = setInterval(async () => {
            const data = await fetchSyncStatus();
            if (
                data?.latest &&
                data.latest.id === watchedId &&
                data.latest.status === "success"
            ) {
                router.refresh();
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [isSyncing, syncLatest?.id, router]);

    async function handleSync() {
        setSyncError(null);
        try {
            const res = await fetch("/api/admin/sync", { method: "POST" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (res.status === 409) {
                    // Already running — show its row.
                    if (data?.log) setSyncLatest(data.log);
                    return;
                }
                setSyncError(data?.error ?? `Sync failed (${res.status})`);
                return;
            }
            if (data?.log) setSyncLatest(data.log);
        } catch (e) {
            setSyncError(
                e instanceof Error ? e.message : "Failed to start sync"
            );
        }
    }

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
        <main className="flex flex-col md:flex-row min-h-screen max-h-screen bg-[#F5F5F5] overflow-x-hidden">
            <NavBar userName="admin" />
            <div className="relative flex-1 overflow-x-hidden h-full">
                {/*Top bar*/}
                {/* <div className="w-full h-16 border-b border-[#E5E7EB] bg-[#ffffff]"></div> */}

                {/*Title*/}
                <div className="mt-12.5 mx-[45px] flex items-center justify-between">
                    <h1 className="text-4xl font-extrabold text-[#555555] gap-8 font-poppins">
                        Admin Settings
                    </h1>
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="px-2.5 py-[5px] rounded-xl border border-[#E76C82] text-[#E76C82] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <RefreshCcw
                            className={`w-[17px] h-[17px] text-[#E76C82] ${
                                isSyncing ? "animate-spin" : ""
                            }`}
                        />
                        {isSyncing ? "Syncing..." : "Update Data"}
                    </button>
                </div>

                {/*Sync status banner*/}
                <SyncStatusBanner
                    latest={syncLatest}
                    latestSuccess={syncLatestSuccess}
                    triggerError={syncError}
                />

                {/*Table*/}
                <div className="mt-[25px] mx-[45px] h-full overflow-scroll border border-[#0000001A] rounded-[20px] bg-[#FFFFFF] p-[24px] flex flex-col min-w-[800px]">
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
                            text-[#FFFFFF] font-manrope text-[15px] leading-5 gap-3 cursor-pointer"
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

function SyncStatusBanner({
    latest,
    latestSuccess,
    triggerError,
}: {
    latest: SyncLogRow | null;
    latestSuccess: SyncLogRow | null;
    triggerError: string | null;
}) {
    // Highest-priority states first.
    if (triggerError) {
        return (
            <div className="mt-[13px] mx-[45px] min-h-[46px] py-2 bg-[#FEEBEE] border border-[#F4433633] rounded-[16px] px-4 flex items-center">
                <AlertTriangle className="w-[16px] h-[16px] text-[#C62828] shrink-0" />
                <p className="font-manrope text-[14px] text-[#C62828] leading-[20px] pl-[10px]">
                    Could not start sync: {triggerError}
                </p>
            </div>
        );
    }

    if (latest?.status === "running") {
        return (
            <div className="mt-[13px] mx-[45px] min-h-[46px] py-2 bg-[#FFF6E0] border border-[#FFB30033] rounded-[16px] px-4 flex items-center">
                <RefreshCcw className="w-[16px] h-[16px] text-[#8a6d00] shrink-0 animate-spin" />
                <p className="font-manrope text-[14px] text-[#8a6d00] leading-[20px] pl-[10px]">
                    Sync in progress&hellip;
                </p>
            </div>
        );
    }

    if (latest?.status === "error") {
        return (
            <div className="mt-[13px] mx-[45px] min-h-[46px] py-2 bg-[#FEEBEE] border border-[#F4433633] rounded-[16px] px-4 flex items-center">
                <AlertTriangle className="w-[16px] h-[16px] text-[#C62828] shrink-0 mt-[3px]" />
                <div className="font-manrope text-[14px] text-[#C62828] leading-[20px] pl-[10px]">
                    <p>
                        Last sync failed:{" "}
                        {latest.errorMessage ?? "unknown error"}
                    </p>
                    {latestSuccess && (
                        <p className="text-[#555555] text-[12px] mt-1">
                            Showing data from successful sync on{" "}
                            {formatLastSync(latestSuccess.finishedAt)}.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Success or "never run" fallback.
    const lastSyncDate = latestSuccess?.finishedAt ?? null;
    const missing = latest?.missingFields ?? [];
    return (
        <div className="mt-[13px] mx-[45px] min-h-[46px] py-2 bg-[#4CAF501A] border border-[#4CAF5033] rounded-[16px] px-4 flex items-center">
            <CircleCheckBig className="w-[16px] h-[16px] text-[#555555] shrink-0 mt-[3px]" />
            <div className="font-manrope text-[14px] text-[#555555] leading-[20px] pl-[10px]">
                <p>
                    Last sync from Salesforce: {formatLastSync(lastSyncDate)}
                    {typeof latestSuccess?.rowsSynced === "number" && (
                        <span className="text-[#888]">
                            {" "}
                            ({latestSuccess.rowsSynced} rows)
                        </span>
                    )}
                </p>
                {missing.length > 0 && (
                    <p className="text-[#8a6d00] text-[12px] mt-1">
                        Note: the following Salesforce field
                        {missing.length === 1 ? " was" : "s were"} not found
                        and left empty: {missing.join(", ")}
                    </p>
                )}
            </div>
        </div>
    );
}
