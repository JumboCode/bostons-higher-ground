"use client";
import * as React from "react";
import { type DateRange } from "react-day-picker";

// import font
import { useEffect, useMemo, useState } from "react";
import { Manrope } from "next/font/google";
const manrope = Manrope({ subsets: ["latin"] });

import useFilters, { Timeframe } from "@/lib/filterStore";

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

export const SCHOOL_LIST = [
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

export const LOCATION_LIST = [
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

type CustomRangeProps = {
    dateRange: DateRange | undefined;
    setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
};

type FiscalYearProps = {
    timeFilter: Timeframe | number;
    setTimeFilter: React.Dispatch<React.SetStateAction<Timeframe | number>>;
};

export function LocationFilter() {
    const { selectedLocations, setSelectedLocations } = useFilters();

    const toggleLocation = (location: string) => {
        if (selectedLocations.includes(location)) {
            setSelectedLocations(
                selectedLocations.filter((s) => s !== location)
            );
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
                    <span className={` text-[#555555] ${manrope.className}`}>
                        {label}
                    </span>
                    <ChevronDown
                        size={16}
                        className="mt-px text-[#717182]"
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 max-h-64 overflow-y-auto"
                align="start"
            >
                <DropdownMenuLabel
                    className={`flex  text-[#555555] ${manrope.className}`}
                >
                    Select Locations
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div
                        className={`flex items-center gap-3 text-[#555555] ${manrope.className}`}
                    >
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => {
                                if (allSelected) setSelectedLocations([]);
                                else setSelectedLocations(LOCATION_LIST);
                            }}
                        />
                        <Label htmlFor="terms">All Locations</Label>
                    </div>
                </DropdownMenuItem>
                {LOCATION_LIST.map((location, idx) => (
                    <DropdownMenuItem
                        key={idx}
                        onSelect={(e) => e.preventDefault()}
                    >
                        <div
                            className={`flex  py-1 items-center gap-3 text-[#555555] ${manrope.className}`}
                        >
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
                    <span className={` text-[#555555] ${manrope.className}`}>
                        {label}
                    </span>
                    <ChevronDown
                        size={16}
                        className="mt-px text-[#717182]"
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 max-h-64 overflow-y-auto"
                align="start"
            >
                <DropdownMenuLabel
                    className={`flex  text-[#555555] ${manrope.className}`}
                >
                    Select Schools
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div
                        className={`flex items-center gap-3 text-[#555555] ${manrope.className}`}
                    >
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => {
                                if (allSelected) setSelectedSchools([]);
                                else setSelectedSchools(SCHOOL_LIST);
                            }}
                        />
                        <Label htmlFor="terms">All Schools</Label>
                    </div>
                </DropdownMenuItem>
                {SCHOOL_LIST.map((school, idx) => (
                    <DropdownMenuItem
                        key={idx}
                        onSelect={(e) => e.preventDefault()}
                    >
                        <div
                            className={`flex  py-1 items-center gap-3 text-[#555555] ${manrope.className}`}
                        >
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
    const [ timeFilter, setTimeFilter ] = useState<Timeframe | number>("allTime");
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"fiscal" | "custom">(
        timeframe === "custom" ? "custom" : "fiscal"
    );
    const [localRange, setLocalRange] = useState<DateRange | undefined>(
        customRange
    );

    useEffect(() => {
        setLocalRange(customRange);
        setMode(timeframe === "custom" ? "custom" : "fiscal");
    }, [customRange, fiscalYear, timeframe]);

    const formattedRange = useMemo(() => {
        switch (timeframe) {
            case "thisMonth":
                return "This Month";
            case "lastMonth":
                return "Last Month";
            case "thisFY":
                return fiscalYear ? `FY${fiscalYear}` : "This Fiscal Year";
            case "custom":
                return customRange?.from && customRange?.to
                    ? `${customRange.from.toLocaleDateString()} - ${customRange.to.toLocaleDateString()}`
                    : "Custom Range";
            case "allTime":
            default:
                return "All Time";
        }
    }, [timeframe, customRange, fiscalYear]);

    const handleQuickTimeframe = (value: typeof timeframe) => {
        setMode("fiscal");
        setTimeFilter(value);
        if (value !== "custom") {
            setCustomRange(undefined);
        }
    };

    const applyFiscal = () => {
        if (typeof timeFilter === "number") {
          setFiscalYear(Number(timeFilter));
          setTimeframe("thisFY"); // placeholder
        } else {
          setTimeframe(timeFilter as Timeframe);
          setFiscalYear(undefined);
        }
        setOpen(false);
    };

    const applyCustom = () => {
        setCustomRange(localRange);
        setTimeframe("custom");
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    className={`flex justify-center items-center px-4 py-1 ${manrope.className} text-[#555555] rounded-2xl border border-grey-200 gap-2`}
                >
                    <Calendar className="w-4.5 h-4.5" />
                    {formattedRange}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-130 flex-row px-3.75 py-3.75 rounded-xl"
                align="start"
                sideOffset={10}
            >
                <div className="flex rounded-full bg-bhg-gray-100 w-full h-11.5 px-2 py-1.5">
                    <button
                        onClick={() => setMode("fiscal")}
                        className={`w-1/2 justify-center items-center rounded-full text-[15px] ${manrope.className} ${
                            mode === "fiscal"
                                ? "bg-white text-bhg-pink shadow"
                                : "text-[#555555]"
                        }`}
                    >
                        Fiscal Year
                    </button>
                    <button
                        onClick={() => setMode("custom")}
                        className={`w-1/2 justify-center items-center rounded-full text-[15px] ${manrope.className} ${
                            mode === "custom"
                                ? "bg-white text-bhg-pink shadow"
                                : "text-[#555555]"
                        }`}
                    >
                        Custom Range
                    </button>
                </div>

                <div className="mt-4">
                    <div className="flex mb-3.5 gap-2 h-7.5">
                        <button
                            onClick={() => handleQuickTimeframe("thisMonth")}
                            className={`w-1/4 rounded-full justify-center items-center border text-[14px] py-1 ${manrope.className} ${
                                timeFilter === "thisMonth"
                                    ? "border-bhg-pink text-bhg-pink"
                                    : "border-bhg-gray-200 text-[#555555]"
                            }`}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => handleQuickTimeframe("lastMonth")}
                            className={`w-1/4 rounded-full justify-center items-center border text-[14px] py-1 ${manrope.className} ${
                                timeFilter === "lastMonth"
                                    ? "border-bhg-pink text-bhg-pink"
                                    : "border-bhg-gray-200 text-[#555555]"
                            }`}
                        >
                            Last Month
                        </button>
                        <button
                            onClick={() => handleQuickTimeframe("thisFY")}
                            className={`w-1/4 rounded-full justify-center items-center border text-[14px] py-1 ${manrope.className} ${
                                timeFilter === "thisFY"
                                    ? "border-bhg-pink text-bhg-pink"
                                    : "border-bhg-gray-200 text-[#555555]"
                            }`}
                        >
                            This FY
                        </button>
                        <button
                            onClick={() => handleQuickTimeframe("allTime")}
                            className={`w-1/4 rounded-full justify-center items-center border text-[14px] py-1 ${manrope.className} ${
                                timeFilter === "allTime"
                                    ? "border-bhg-pink text-bhg-pink"
                                    : "border-bhg-gray-200 text-[#555555]"
                            }`}
                        >
                            All Time
                        </button>
                    </div>
                    <hr className="w-full border-t border-bhg-gray-200 mb-2.5" />

                    {mode === "fiscal" ? (
                        <FiscalYearContent
                            timeFilter={timeFilter}
                            setTimeFilter={setTimeFilter}
                        />
                    ) : (
                        <CustomRangeContent
                            dateRange={localRange}
                            setDateRange={setLocalRange}
                        />
                    )}
                </div>
                {mode === "fiscal" 
                    ? <button
                          onClick={applyFiscal}
                          className={`w-full rounded-full py-2 bg-bhg-pink text-[#FFFFFF] justify-center items-center hover:bg-[#d85c70] ${manrope.className}`}
                      >
                          Apply Filter
                      </button> 
                    : <button
                          onClick={applyCustom}
                          className={`w-full rounded-full py-2 bg-bhg-pink text-[#FFFFFF] justify-center items-center hover:bg-[#d85c70] ${manrope.className}`}
                      >
                          Apply Custom Range
                      </button>
            }
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function FiscalYearContent({
  timeFilter,
  setTimeFilter,
}: FiscalYearProps) {
    const currYear = (new Date).getFullYear()

    return (
        <div className="flex-row">
            <div className={`text-[#555555] text-[15px] ${manrope.className}`}>
                Select Fiscal Year
                <div className="flex mt-2 mb-3.5 gap-2 h-7.5">
                    {[4, 3, 2, 1].map((fy) => (
                        <button
                            key={currYear - fy}
                            onClick={() => setTimeFilter(currYear - fy)}
                            className={`w-1/4 rounded-2xl justify-center items-center border text-[14px] py-1.25 ${manrope.className} ${
                                timeFilter === currYear - fy
                                    ? "border-bhg-pink text-bhg-pink"
                                    : "border-bhg-gray-200 text-[#555555]"
                            }`}
                        >
                            FY{currYear - fy}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function CustomRangeContent({
    dateRange,
    setDateRange,
}: CustomRangeProps) {
    return (
        <div className="w-full flex-row">
            <UiCalendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="rounded-lg border shadow-sm w-full mb-3.25"
            />
            {/* range confirmation */}
            <div
                className={`flex w-full rounded-full mb-3.25 px-5 py-2 bg-bhg-mint-100 text-[#555555] border border-[#85CFCA4D] justify-start items-center ${manrope.className} gap-2`}
            >
                <Calendar className="w-3.75 h-3.75" />
                {dateRange?.from
                    ? dateRange.from.toLocaleDateString()
                    : ""} -{" "}
                {dateRange?.to ? dateRange.to.toLocaleDateString() : ""}
            </div>
        </div>
    );
}

export default function FilterBar() {
    const { clearAll } = useFilters();

    return (
        <div className="flex flex-row items-center w-full h-full">
            <div
                className={`flex items-center ${manrope.className} text-[#4A5565]`}
            >
                <Funnel className="ml-6.25 mr-2.5 w-5 h-5 text-[#6A7282]" />
                Filters:
            </div>
            {/* The three actual filters */}
            <div className="ml-4">
                <DateFilter />
            </div>
            <div className="ml-4">
                <SchoolFilter />
            </div>
            <div className="ml-4">
                <LocationFilter />
            </div>

            {/* Clear Button */}
            <button
                onClick={clearAll}
                className={`flex justify-center items-center ${manrope.className} bg-bhg-pink text-[#EBEDEF] rounded-2xl ml-auto h-7.5 px-5 py-5 mr-6.25`}
            >
                Clear
            </button>
        </div>
    );
}
