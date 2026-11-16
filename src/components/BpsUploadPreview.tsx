"use client";

import { useState, type FormEvent } from "react";
import type { BpsPreview } from "@/lib/bps-preview";

export default function BpsUploadPreview() {
    const [file, setFile] = useState<File | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [preview, setPreview] = useState<BpsPreview | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!file || !confirmed || busy) return;
        setBusy(true); setPreview(null); setError(null);
        try {
            const body = new FormData();
            body.set("file", file); body.set("mockOnly", "true");
            const response = await fetch("/api/admin/bps-preview", { method: "POST", body });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Preview failed.");
            setPreview(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Preview failed. Try again.");
        } finally { setBusy(false); }
    }

    return (
        <section aria-labelledby="bps-upload-title" className="mx-4 mt-6 rounded-2xl border border-gray-200 bg-white p-6 md:mx-[45px]">
            <h2 id="bps-upload-title" className="text-xl font-semibold text-[#555555]">BPS upload preview</h2>
            <p className="mt-2 text-sm text-gray-600">Test a synthetic workbook against the mock student directory. Nothing is saved or sent to Salesforce.</p>
            <a className="mt-3 inline-block text-sm font-medium underline" href="/mock-bps.xlsx" download>Download sample workbook</a>
            <form onSubmit={submit} className="mt-4 space-y-3">
                <label className="block text-sm font-medium" htmlFor="bps-file">Mock Excel workbook (.xlsx, up to 1 MiB)</label>
                <input id="bps-file" type="file" accept=".xlsx" disabled={busy} className="block max-w-full text-sm"
                    onChange={event => { setFile(event.target.files?.[0] ?? null); setPreview(null); setError(null); setConfirmed(false); }} />
                <p className="text-xs text-gray-600">Use the “Mock BPS” sheet with student_id, period, math_grade, and attendance_pct columns. The sample uses 2025-fall and 2026-spring.</p>
                <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} />
                    This workbook contains synthetic data only, with no real student information.
                </label>
                <button type="submit" disabled={!file || !confirmed || busy} className="rounded-xl bg-[#B94160] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                    {busy ? "Checking workbook…" : "Preview upload"}
                </button>
            </form>
            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
            <div aria-live="polite" aria-busy={busy}>
                {preview && <div className="mt-5">
                    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[["Total rows", preview.totalRows], ["Matched", preview.matchedRows], ["Unmatched", preview.unmatchedRows], ["Rows with errors", preview.errorRows]].map(([label, count]) =>
                            <div key={label} className="rounded-lg bg-gray-50 p-3"><dt className="text-sm text-gray-600">{label}</dt><dd className="mt-1 text-2xl font-semibold">{count}</dd></div>)}
                    </dl>
                    <p className="mt-3 text-sm text-gray-600">Preview only. Unmatched and error rows are excluded. No records have been written.</p>
                    {preview.issues.length > 0 && <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-sm"><caption className="py-2 text-left font-medium">Rows needing attention</caption>
                            <thead><tr><th className="p-2">Excel row</th><th className="p-2">Reason</th></tr></thead>
                            <tbody>{preview.issues.map(issue => <tr key={issue.row} className="border-t"><td className="p-2">{issue.row}</td><td className="p-2">{issue.reason}</td></tr>)}</tbody>
                        </table>
                        {preview.issuesTruncated && <p className="mt-2 text-sm">Showing the first 50 issues. Counts include all rows.</p>}
                    </div>}
                </div>}
            </div>
        </section>
    );
}
