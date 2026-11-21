"use client";

import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };
/** A plain option, or a labelled <optgroup> of options. */
export type SelectItem = Option | { group: string; options: Option[] };

const renderOption = (o: Option) => (
    <option key={o.value} value={o.value}>
        {o.label}
    </option>
);

// Compact native <select> for the map overlay; the label is for screen readers only.
export default function FilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: SelectItem[];
    onChange: (value: string) => void;
}) {
    return (
        <label className="relative block min-w-0 flex-1 sm:flex-none">
            <span className="sr-only">{label}</span>
            {/* appearance-none + own chevron: the native arrow ignores padding */}
            <select
                value={value}
                onChange={(e) => onChange(e.currentTarget.value)}
                className="w-full appearance-none truncate rounded-md border border-bhg-gray-200 bg-white py-1.5 pl-2.5 pr-8 text-xs font-medium text-bhg-gray-300 sm:max-w-44"
            >
                {options.map((o) =>
                    "group" in o ? (
                        <optgroup key={o.group} label={o.group}>
                            {o.options.map(renderOption)}
                        </optgroup>
                    ) : (
                        renderOption(o)
                    )
                )}
            </select>
            <ChevronDown
                size={14}
                aria-hidden
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
            />
        </label>
    );
}
