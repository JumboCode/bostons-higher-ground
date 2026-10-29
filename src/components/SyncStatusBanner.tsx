import { AlertTriangle, CircleCheckBig, RefreshCcw } from "lucide-react";

export type SyncLogRow = {
    id: string;
    source: string;
    status: "running" | "success" | "error";
    startedAt: string;
    finishedAt: string | null;
    rowsSynced: number | null;
    rowsSkipped: number | null;
    missingFields: string[] | null;
    errorMessage: string | null;
    triggeredBy: string | null;
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

export default function SyncStatusBanner({
    latest,
    latestSuccess,
    triggerError,
}: {
    latest: SyncLogRow | null;
    latestSuccess: SyncLogRow | null;
    triggerError: string | null;
}) {
    // These warnings describe the dataset currently in the dashboards, even
    // while a newer attempt is running or has failed.
    const missing = latestSuccess?.missingFields ?? [];
    const datasetWarnings = (
        <>
            {typeof latestSuccess?.rowsSkipped === "number" && (
                <p className="text-[#8a6d00] text-[12px] mt-1">
                    {latestSuccess.rowsSkipped} skipped (missing familyId)
                </p>
            )}
            {missing.length > 0 && (
                <p className="text-[#8a6d00] text-[12px] mt-1">
                    Note: the following Salesforce field
                    {missing.length === 1 ? " was" : "s were"} not found and
                    left empty: {missing.join(", ")}
                </p>
            )}
        </>
    );
    // Highest-priority states first.
    if (triggerError) {
        return (
            <div className="mt-[13px] mx-[45px] min-h-[46px] py-2 bg-[#FEEBEE] border border-[#F4433633] rounded-[16px] px-4 flex items-center">
                <AlertTriangle className="w-[16px] h-[16px] text-[#C62828] shrink-0" />
                <div className="font-manrope text-[14px] text-[#C62828] leading-[20px] pl-[10px]">
                    <p>Could not start sync: {triggerError}</p>
                    {datasetWarnings}
                </div>
            </div>
        );
    }

    if (latest?.status === "running") {
        return (
            <div className="mt-[13px] mx-[45px] min-h-[46px] py-2 bg-[#FFF6E0] border border-[#FFB30033] rounded-[16px] px-4 flex items-center">
                <RefreshCcw className="w-[16px] h-[16px] text-[#8a6d00] shrink-0 animate-spin" />
                <div className="font-manrope text-[14px] text-[#8a6d00] leading-[20px] pl-[10px]">
                    <p>Sync in progress&hellip;</p>
                    {datasetWarnings}
                </div>
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
                    {datasetWarnings}
                </div>
            </div>
        );
    }

    // Success or "never run" fallback.
    const lastSyncDate = latestSuccess?.finishedAt ?? null;
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
                {datasetWarnings}
            </div>
        </div>
    );
}
