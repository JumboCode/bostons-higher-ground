"use client";
import * as React from "react";
import { type DateRange } from "react-day-picker";

import { useEffect, useMemo, useState } from "react";
import { Manrope } from "next/font/google";
const manrope = Manrope({ subsets: ["latin"] });

import useFilters, { type Timeframe } from "@/lib/filterStore";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar as UiCalendar } from "@/components/ui/calendar";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Funnel, ChevronDown, Calendar } from "lucide-react";

const SCHOOL_LIST = [
    "Brighton High School",
    "Burke High School",
    "Charlestown High School",
    "Community Academy",
    "Dorchester Academy",
    "East Boston High School",
    "English High School",
    "Excel High School",
    "Fenway High School",
    "Hyde Park High School",
    "John D. O'Bryant School",
    "Latin Academy",
    "Latin School",
    "Madison Park Technical",
    "Margarita Muñiz Academy",
    "New Mission High School",
    "O'Bryant School of Math",
    "Odyssey High School",
    "Quincy Upper School",
    "Renaissance Charter",
    "Roxbury Prep",
    "South Boston High School",
    "TechBoston Academy",
    "The English High School",
    "Urban Science Academy",
    "West Roxbury Academy",
    "William McKinley",
    "Another Course to College",
    "Boston Community Leadership",
    "Boston Green Academy",
    "Boston International",
    "Snowden International",
    "UP Academy Boston",
    "Henderson Inclusion",
    "Lyon Pilot High School",
];

const LOCATION_LIST = [
    "Allston",
    "Back Bay",
    "Beacon Hill",
    "Brighton",
    "Charlestown",
    "Dorchester",
    "East Boston",
    "Fenway",
    "Hyde Park",
    "Jamaica Plain",
    "Mattapan",
    "Mission Hill",
    "North End",
    "Roslindale",
    "Roxbury",
    "South Boston",
    "South End",
    "West Roxbury",
];

const CURRENT_YEAR = new Date().getFullYear();
// Past FY years for Row 2 (current year handled by "This FY" in Row 1)
const FY_YEARS = ["2022", "2023", "2024", "2025"].filter(
    (y) => parseInt(y) < CURRENT_YEAR
);

export function LocationFilter() {
    const { selectedLocations, setSelectedLocations } = useFilters();

    const toggleLocation = (location: string) => {
        if (selectedLocations.includes(location)) {
            setSelectedLocations(selectedLocations.filter((s) => s !== location));
        } else {
            setSelectedLocations([...selectedLocations, location]);
        }
    };

    const allSelected = selectedLocations.length === LOCATION_LIST.length;
    const noneSelected = selectedLocations.length === 0;

    const label =
        allSelected || noneSelected
            ? "All Locations"
            : `${selectedLocations.length} Locations`;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-max">
                <button className="bg-[#F3F3F5] hover:bg rounded-2xl px-4 py-1 flex items-center justify-between gap-1">
                    <span className={`text-[#555555] ${manrope.className}`}>{label}</span>
                    <ChevronDown size={16} className="mt-[1px] text-[#717182]" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto" align="start">
                <DropdownMenuLabel className={`flex text-[#555555] ${manrope.className}`}>
                    Select Locations
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div className={`flex items-center gap-3 text-[#555555] ${manrope.className}`}>
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => {
                                if (allSelected) setSelectedLocations([]);
                                else setSelectedLocations(LOCATION_LIST);
                            }}
                        />
                        <Label>All Locations</Label>
                    </div>
                </DropdownMenuItem>
                {LOCATION_LIST.map((location, idx) => (
                    <DropdownMenuItem key={idx} onSelect={(e) => e.preventDefault()}>
                        <div className={`flex py-1 items-center gap-3 text-[#555555] ${manrope.className}`}>
                            <Checkbox
                                checked={selectedLocations.includes(location)}
                                onCheckedChange={() => toggleLocation(location)}
                            />
                            <Label>{location}</Label>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function SchoolFilter() {
    const { selectedSchools, setSelectedSchools } = useFilters();

    const toggleSchool = (school: string) => {
        if (selectedSchools.includes(school)) {
            setSelectedSchools(selectedSchools.filter((s) => s !== school));
        } else {
            setSelectedSchools([...selectedSchools, school]);
        }
    };

    const allSelected = selectedSchools.length === SCHOOL_LIST.length;
    const noneSelected = selectedSchools.length === 0;

    const label =
        allSelected || noneSelected
            ? "All Schools"
            : `${selectedSchools.length} Schools`;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-max">
                <button className="bg-[#F3F3F5] hover:bg rounded-2xl px-4 py-1 flex items-center justify-between gap-1">
                    <span className={`text-[#555555] ${manrope.className}`}>{label}</span>
                    <ChevronDown size={16} className="mt-[1px] text-[#717182]" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto" align="start">
                <DropdownMenuLabel className={`flex text-[#555555] ${manrope.className}`}>
                    Select Schools
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div className={`flex items-center gap-3 text-[#555555] ${manrope.className}`}>
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => {
                                if (allSelected) setSelectedSchools([]);
                                else setSelectedSchools(SCHOOL_LIST);
                            }}
                        />
                        <Label>All Schools</Label>
                    </div>
                </DropdownMenuItem>
                {SCHOOL_LIST.map((school, idx) => (
                    <DropdownMenuItem key={idx} onSelect={(e) => e.preventDefault()}>
                        <div className={`flex py-1 items-center gap-3 text-[#555555] ${manrope.className}`}>
                            <Checkbox
                                checked={selectedSchools.includes(school)}
                                onCheckedChange={() => toggleSchool(school)}
                            />
                            <Label>{school}</Label>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function DateFilter() {
    const {
        timeframe,
        customRange,
        fiscalYear,
        setTimeframe,
        setCustomRange,
        setFiscalYear,
    } = useFilters();

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"fiscal" | "custom">("fiscal");

    // Staged local state — store is only updated when Apply is clicked
    const [localQuick, setLocalQuick] = useState<Timeframe | null>(null);
    const [localFYYear, setLocalFYYear] = useState<string | null>(null);
    const [localRange, setLocalRange] = useState<DateRange | undefined>(undefined);

    // Sync local state from store each time dropdown opens
    useEffect(() => {
        if (!open) return;
        if (timeframe === "custom") {
            setMode("custom");
            setLocalRange(customRange);
            setLocalQuick(null);
            setLocalFYYear(null);
        } else if (timeframe === "thisFY" && fiscalYear && fiscalYear < CURRENT_YEAR) {
            setMode("fiscal");
            setLocalFYYear(fiscalYear.toString());
            setLocalQuick(null);
            setLocalRange(undefined);
        } else {
            setMode("fiscal");
            setLocalQuick(timeframe);
            setLocalFYYear(null);
            setLocalRange(customRange);
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // Row 1 click — clears Row 2 selection
    const handleRow1Click = (value: Timeframe) => {
        setLocalQuick(value);
        setLocalFYYear(null);
    };

    // Row 2 click — clears Row 1 selection
    const handleRow2Click = (fy: string) => {
        setLocalFYYear(fy);
        setLocalQuick(null);
    };

    const applyFiscal = () => {
        if (localFYYear) {
            setFiscalYear(parseInt(localFYYear));
            setTimeframe("thisFY");
            setCustomRange(undefined);
        } else if (localQuick) {
            setTimeframe(localQuick);
            setFiscalYear(localQuick === "thisFY" ? CURRENT_YEAR : undefined);
            setCustomRange(undefined);
        }
        setOpen(false);
    };

    const applyCustom = () => {
        if (localRange?.from && localRange?.to) {
            setCustomRange(localRange);
            setTimeframe("custom");
            setFiscalYear(undefined);
        }
        setOpen(false);
    };

    const formattedRange = useMemo(() => {
        switch (timeframe) {
            case "thisMonth":
                return "This Month";
            case "lastMonth":
                return "Last Month";
            case "thisFY":
                return fiscalYear && fiscalYear < CURRENT_YEAR
                    ? `FY${fiscalYear}`
                    : "This FY";
            case "custom":
                return customRange?.from && customRange?.to
                    ? `${customRange.from.toLocaleDateString()} – ${customRange.to.toLocaleDateString()}`
                    : "Custom Range";
            default:
                return "All Time";
        }
    }, [timeframe, customRange, fiscalYear]);

    const row1Btn = (label: string, value: Timeframe) => (
        <button
            key={value}
            onClick={() => handleRow1Click(value)}
            className={`flex-1 rounded-full border text-[14px] py-[4px] ${manrope.className} ${
                localQuick === value
                    ? "border-[#E76C82] text-[#E76C82]"
                    : "border-[#D9D9D9] text-[#555555]"
            }`}
        >
            {label}
        </button>
    );

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    className={`flex justify-center items-center px-4 py-1 ${manrope.className} text-[#555555] rounded-2xl border border-grey-200 gap-2`}
                >
                    <Calendar className="w-[18px] h-[18px]" />
                    {formattedRange}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-[520px] px-[15px] py-[15px] rounded-xl"
                align="start"
                sideOffset={10}
            >
                {/* Tab switcher: Fiscal Year | Custom Range */}
                <div className="flex rounded-full bg-[#EBEBEB] w-full h-[46px] px-[8px] py-[6px]">
                    <button
                        onClick={() => setMode("fiscal")}
                        className={`w-1/2 justify-center items-center rounded-full text-[15px] ${manrope.className} ${
                            mode === "fiscal"
                                ? "bg-white text-[#E76C82] shadow"
                                : "text-[#555555]"
                        }`}
                    >
                        Fiscal Year
                    </button>
                    <button
                        onClick={() => setMode("custom")}
                        className={`w-1/2 justify-center items-center rounded-full text-[15px] ${manrope.className} ${
                            mode === "custom"
                                ? "bg-white text-[#E76C82] shadow"
                                : "text-[#555555]"
                        }`}
                    >
                        Custom Range
                    </button>
                </div>

                <div className="mt-4">
                    {mode === "fiscal" ? (
                        <div className="flex flex-col gap-3">
                            {/* Row 1 — quick timeframe buttons */}
                            <div className="flex gap-2 h-[30px]">
                                {row1Btn("This Month", "thisMonth")}
                                {row1Btn("Last Month", "lastMonth")}
                                {row1Btn("This FY", "thisFY")}
                                {row1Btn("All Time", "allTime")}
                            </div>

                            <hr className="border-t border-[#D9D9D9]" />

                            {/* Row 2 — specific past FY years */}
                            <div>
                                <p className={`text-[#555555] text-[13px] mb-2 ${manrope.className}`}>
                                    Select Fiscal Year
                                </p>
                                <div className="flex gap-2 h-[30px]">
                                    {FY_YEARS.map((fy) => (
                                        <button
                                            key={fy}
                                            onClick={() => handleRow2Click(fy)}
                                            className={`flex-1 rounded-2xl border text-[14px] py-[5px] ${manrope.className} ${
                                                localFYYear === fy
                                                    ? "border-[#E76C82] text-[#E76C82]"
                                                    : "border-[#D9D9D9] text-[#555555]"
                                            }`}
                                        >
                                            FY{fy}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={applyFiscal}
                                className={`w-full rounded-full py-[8px] bg-[#E76C82] text-white hover:bg-[#d85c70] ${manrope.className}`}
                            >
                                Apply Filter
                            </button>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col gap-3">
                            <UiCalendar
                                mode="range"
                                defaultMonth={localRange?.from}
                                selected={localRange}
                                onSelect={setLocalRange}
                                numberOfMonths={2}
                                className="rounded-lg border shadow-sm w-full"
                            />
                            <div
                                className={`flex w-full rounded-full px-[20px] py-[8px] bg-[#E0F7F4] text-[#555555] border border-[#85CFCA4D] items-center ${manrope.className} gap-2`}
                            >
                                <Calendar className="w-[15px] h-[15px]" />
                                {localRange?.from ? localRange.from.toLocaleDateString() : "—"} –{" "}
                                {localRange?.to ? localRange.to.toLocaleDateString() : "—"}
                            </div>
                            <button
                                onClick={applyCustom}
                                className={`w-full rounded-full py-[8px] bg-[#E76C82] text-white hover:bg-[#d85c70] ${manrope.className}`}
                            >
                                Apply Filter
                            </button>
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function FilterBar() {
    const { clearAll } = useFilters();

    return (
        <div className="flex flex-row items-center w-full h-full">
            <div className={`flex items-center ${manrope.className} text-[#4A5565]`}>
                <Funnel className="ml-[25px] mr-[10px] w-[20px] h-[20px] text-[#6A7282]" />
                Filters:
            </div>
            <div className="ml-4">
                <DateFilter />
            </div>
            <div className="ml-4">
                <SchoolFilter />
            </div>
            <div className="ml-4">
                <LocationFilter />
            </div>
            <button
                onClick={clearAll}
                className={`flex justify-center items-center ${manrope.className} bg-[#E76C82] text-[#EBEDEF] rounded-2xl ml-auto h-[30px] px-[20px] py-[20px] mr-[25px]`}
            >
                Clear
            </button>
        </div>
    );
}
