"use client";
import { useEffect, useState, type FormEvent } from "react";
import { bostonToday } from "@/lib/baseline-calculation";
import type { HousedBaselineSummary } from "@/lib/baselines";

export default function BaselineSettings() {
    const [summary, setSummary] = useState<HousedBaselineSummary | null>(null);
    const [value, setValue] = useState("");
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    useEffect(() => {
        let active = true;
        fetch("/api/admin/baselines", { cache: "no-store" })
            .then(async (response) => {
                if (!response.ok)
                    throw new Error(
                        "Could not load the baseline. Refresh to try again."
                    );
                const data: HousedBaselineSummary = await response.json();
                if (!active) return;
                setSummary(data);
                setValue(
                    data.baseline ? String(data.baseline.startingValue) : ""
                );
                setDate(data.baseline?.asOfDate ?? "");
            })
            .catch((error) => {
                if (active) setError(error.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);
    async function save(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const response = await fetch("/api/admin/baselines", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startingValue: value === "" ? null : Number(value),
                    asOfDate: date,
                }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(
                    data.error || "Could not save the baseline. Try again."
                );
            setSummary(data);
            setMessage("Baseline saved. The overview total is updated.");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Could not save the baseline."
            );
        } finally {
            setSaving(false);
        }
    }
    return (
        <section
            className="mx-[45px] mt-6 rounded-[20px] border border-black/10 bg-white p-6"
            aria-labelledby="baseline-heading"
        >
            <h2
                id="baseline-heading"
                className="text-xl font-semibold text-[#555555]"
            >
                Families housed baseline
            </h2>
            <p className="mt-2 text-sm text-gray-600">
                Set the total through the as-of date. Families first housed
                afterward are added from synced data.
            </p>
            {loading ? (
                <p role="status" className="mt-4">
                    Loading baseline…
                </p>
            ) : (
                <>
                    {summary?.provisional && (
                        <p role="status" className="mt-4 text-amber-800">
                            Suggested: 0 through {summary.baseline?.asOfDate}, before
                            the first intake. Confirm with BHG and save to fix
                            this date; otherwise it follows synced data.
                        </p>
                    )}
                    {summary?.migrationRequired && (
                        <p role="status" className="mt-4 text-amber-800">
                            Apply the baseline migration to enable saving.
                        </p>
                    )}
                    <form
                        onSubmit={save}
                        className="mt-4 flex flex-wrap items-end gap-4"
                    >
                        <label className="flex flex-col gap-1 text-sm">
                            Starting families housed
                            <input
                                type="number"
                                min="0"
                                max="2147483647"
                                step="1"
                                required
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                disabled={
                                    saving ||
                                    !summary ||
                                    summary.migrationRequired
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                            As of (inclusive)
                            <input
                                type="date"
                                required
                                max={bostonToday()}
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                disabled={
                                    saving ||
                                    !summary ||
                                    summary.migrationRequired
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2"
                            />
                        </label>
                        <button
                            disabled={
                                saving || !summary || summary.migrationRequired
                            }
                            className="rounded-xl bg-[#E76C82] px-4 py-2 text-white disabled:opacity-50"
                        >
                            {saving ? "Saving…" : "Save baseline"}
                        </button>
                    </form>
                    <p className="mt-4 text-sm text-gray-600">
                        {summary?.total != null
                            ? `${summary.baseline!.startingValue.toLocaleString()} historical + ${summary.additions!.toLocaleString()} since cutoff = ${summary.total.toLocaleString()} families housed. This total covers all locations and schools.`
                            : "No intake dates found. Enter a confirmed baseline."}
                    </p>
                </>
            )}
            {error && (
                <p role="alert" className="mt-3 text-red-700">
                    {error}
                </p>
            )}
            {message && (
                <p role="status" className="mt-3 text-green-800">
                    {message}
                </p>
            )}
        </section>
    );
}
