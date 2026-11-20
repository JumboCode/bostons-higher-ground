"use client";

import { ChevronDown } from "lucide-react";

// Native <select> inside a GET form; submits on change so filters live in the URL.
export default function FilterSelect({
    name,
    label,
    value,
    options,
}: {
    name: string;
    label: string;
    value: string;
    options: { value: string; label: string }[];
}) {
    return (
        <label className="flex flex-col gap-1 text-xs font-medium text-bhg-gray-300">
            {label}
            <span className="relative">
                {/* appearance-none + own chevron: the native arrow ignores padding */}
                <select
                    name={name}
                    defaultValue={value}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="w-full appearance-none rounded-md border border-bhg-gray-200 bg-white py-2 pl-3 pr-10 text-sm"
                >
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    size={16}
                    aria-hidden
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                />
            </span>
        </label>
    );
}
