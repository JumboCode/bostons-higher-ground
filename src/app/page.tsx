"use client"
import Navbar from "@/components/navbar";
import * as React from "react"
import { type DateRange } from "react-day-picker"

// import font
import { useState } from "react";
import { Manrope } from "next/font/google";
const manrope = Manrope({ subsets:["latin"] });

import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"], // bold weight
});


import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Calendar as UiCalendar } from "@/components/ui/calendar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"


import { Funnel, ChevronDown, Calendar } from 'lucide-react';

const SCHOOL_LIST =  [
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

type CustomRangeProps = {
    dateRange: DateRange | undefined;
    setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>;
    closeMenu: () => void;
};

type FiscalYearProps = {
  closeMenu: () => void;
};

export function LocationFilter() {
    const [selected, setSelected] = useState<string[]>([]);

    const toggleLocation = (location: string) => {
        setSelected(prev =>
            prev.includes(location)
                ? prev.filter(s => s !== location)
                : [...prev, location]
        );
    };

    const allSelected = selected.length === LOCATION_LIST.length;
    const noneSelected = selected.length === 0;

    const label = allSelected || noneSelected 
        ? "All Locations"
        : `${selected.length} Locations`;


    return(
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-max">
                <button className="bg-[#F3F3F5] hover:bg rounded-2xl px-4 py-1 flex items-center justify-between gap-1">
                    <span className={` text-[#555555] ${manrope.className}`}>{label}</span>
                    <ChevronDown size={16} className="mt-[1px] text-[#717182]"/>
                </button> 
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto" align="start">
                <DropdownMenuLabel className={`flex  text-[#555555] ${manrope.className}`}>Select Locations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}> 
                    <div className={`flex items-center gap-3 text-[#555555] ${manrope.className}`}>
                        <Checkbox checked={allSelected} onCheckedChange={() => {
                            if (allSelected) setSelected([]);
                            else setSelected(LOCATION_LIST);
                         }}/>
                        <Label htmlFor="terms">All Locations</Label>
                    </div>
                </DropdownMenuItem>
                {LOCATION_LIST.map((location, idx) => (
                    <DropdownMenuItem 
                        key={idx}
                        onSelect={(e) => e.preventDefault()} 
                    >
                        <div className={`flex  py-1 items-center gap-3 text-[#555555] ${manrope.className}`}>
                            <Checkbox
                                checked={selected.includes(location)}        
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
    const [selected, setSelected] = useState<string[]>([]); 

    const toggleSchool = (school: string) => {
        setSelected(prev =>
            prev.includes(school)
                ? prev.filter(s => s !== school)
                : [...prev, school]
        );
    };
    const allSelected = selected.length === SCHOOL_LIST.length;
    const noneSelected = selected.length === 0;

    const label = allSelected || noneSelected
        ? "All Schools"
        : `${selected.length} Schools`;
    

    return(
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-max">
                <button className="bg-[#F3F3F5] hover:bg rounded-2xl px-4 py-1 flex items-center justify-between gap-1">
                    <span className={` text-[#555555] ${manrope.className}`}>{label}</span>
                    <ChevronDown size={16} className="mt-[1px] text-[#717182]"/>
                </button> 
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto" align="start">
                <DropdownMenuLabel className={`flex  text-[#555555] ${manrope.className}`}>Select Schools</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}> 
                    <div className={`flex items-center gap-3 text-[#555555] ${manrope.className}`}>
                        <Checkbox checked={allSelected} onCheckedChange={() => {
                            if (allSelected) setSelected([]);
                            else setSelected(SCHOOL_LIST);
                         }}/>
                        <Label htmlFor="terms">All Schools</Label>
                    </div>
                </DropdownMenuItem>
                {SCHOOL_LIST.map((school, idx) => (
                    <DropdownMenuItem 
                        key={idx}
                        onSelect={(e) => e.preventDefault()} 
                    >
                        <div className={`flex  py-1 items-center gap-3 text-[#555555] ${manrope.className}`}>
                            <Checkbox
                                checked={selected.includes(school)}        
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
    // is popup open
    const [open, setOpen] = useState(false);

    // button content
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(2025, 10, 11),
        to: new Date(2025, 11, 11),
    });
    // to string
    const formattedRange =
    dateRange?.from && dateRange?.to
        ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
        : "Select Range";

    // what popup will display, default to fiscal year
    const [mode, setMode] = useState<"fiscal" | "custom">("fiscal");

    const [timeframe, setTimeFrame] = useState<"thisMonth" | "lastMonth" | "thisFY" | "allTime">("allTime");

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            {/* button that triggers popup */}
            <DropdownMenuTrigger asChild>
                <button className={`flex justify-center items-center px-4 py-1 ${manrope.className} text-[#555555] rounded-2xl border border-grey-200 gap-2`}>
                    <Calendar className="w-[18px] h-[18px]"/>
                    {formattedRange}
                </button>
            </DropdownMenuTrigger>
            
            {/* actual popup */}
            <DropdownMenuContent className="w-[520px] flex-row px-[15px] py-[15px] rounded-xl" align="start" sideOffset={10}>
                {/* top bar */}
                <div className="flex rounded-full bg-[#EBEBEB] w-full h-[46px] px-[8px] py-[6px]">
                    <button
                        onClick={() => setMode("fiscal")}
                        className={`w-1/2 justify-center items-center rounded-full text-[15px] ${manrope.className} ${
                            mode === "fiscal" ? "bg-white text-[#E76C82] shadow" : "text-[#555555]"
                        }`}
                    >
                        Fiscal Year
                    </button>
                    <button
                        onClick={() => setMode("custom")}
                        className={`w-1/2 justify-center items-center rounded-full text-[15px] ${manrope.className} ${
                            mode === "custom" ? "bg-white text-[#E76C82] shadow" : "text-[#555555]"
                        }`}
                        >
                        Custom Range
                    </button>
                </div>
                {/* body content */}
                <div className="mt-4">
                    {/* timeframe buttons */}
                    <div className="flex mb-[14px] gap-2 h-[30px]">
                        <button
                            onClick={() => setTimeFrame("thisMonth")}
                            className={`w-1/4 rounded-full justify-center items-center border text-[14px] py-[4px] ${manrope.className} ${
                                timeframe === "thisMonth" ? "border-[#E76C82] text-[#E76C82]" : "border-[#D9D9D9] text-[#555555]"
                            }`}
                            >
                            This Month
                        </button>
                        <button
                            onClick={() => setTimeFrame("lastMonth")}
                            className={`w-1/4 rounded-full justify-center items-center border text-[14px] py-[4px] ${manrope.className} ${
                                timeframe === "lastMonth" ? "border-[#E76C82] text-[#E76C82]" : "border-[#D9D9D9] text-[#555555]"
                            }`}
                            >
                            Last Month
                        </button>
                        <button
                            onClick={() => setTimeFrame("thisFY")}
                            className={`w-1/4 rounded-full justify-center items-center border text-[14px] py-[4px] ${manrope.className} ${
                                timeframe === "thisFY" ? "border-[#E76C82] text-[#E76C82]" : "border-[#D9D9D9] text-[#555555]"
                            }`}
                            >
                            This FY
                        </button>
                        <button
                            onClick={() => setTimeFrame("allTime")}
                            className={`w-1/4 rounded-full justify-center items-center border text-[14px] py-[4px] ${manrope.className} ${
                                timeframe === "allTime" ? "border-[#E76C82] text-[#E76C82]" : "border-[#D9D9D9] text-[#555555]"
                            }`}
                            >
                            All Time
                        </button>
                    </div>
                    {/* divider */}
                    <hr className="w-full border-t-1 border-[#D9D9D9] mb-[10px]"></hr>

                    {mode === "fiscal" ? (
                    <FiscalYearContent closeMenu={() => setOpen(false)}/>
                    ) : (
                    <CustomRangeContent 
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        closeMenu={() => setOpen(false)} />
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function FiscalYearContent ({ closeMenu }: FiscalYearProps) {
    const [fiscalYear, setFiscalYear] = useState<"2022" | "2023" | "2024" | "2025">("2024");
    return (
        <div className="flex-row">
            {/* fiscal year selector */}
            <div className={`text-[#555555] text-[15px] ${manrope.className}`}>
                Select Fiscal Year
                <div className="flex mt-[8px] mb-[14px] gap-2 h-[30px]">
                    <button
                        onClick={() => setFiscalYear("2022")}
                        className={`w-1/4 rounded-2xl justify-center items-center border text-[14px] py-[5px] ${manrope.className} ${
                            fiscalYear === "2022" ? "border-[#E76C82] text-[#E76C82]" : "border-[#D9D9D9] text-[#555555]"
                        }`}
                        >
                        FY2022
                    </button>
                    <button
                        onClick={() => setFiscalYear("2023")}
                        className={`w-1/4 rounded-2xl justify-center items-center border text-[14px] py-[5px] ${manrope.className} ${
                            fiscalYear === "2023" ? "border-[#E76C82] text-[#E76C82]" : "border-[#D9D9D9] text-[#555555]"
                        }`}
                        >
                        FY2023
                    </button>
                    <button
                        onClick={() => setFiscalYear("2024")}
                        className={`w-1/4 rounded-2xl justify-center items-center border text-[14px] py-[5px] ${manrope.className} ${
                            fiscalYear === "2024" ? "border-[#E76C82] text-[#E76C82]" : "border-[#D9D9D9] text-[#555555]"
                        }`}
                        >
                        FY2024
                    </button>
                    <button
                        onClick={() => setFiscalYear("2025")}
                        className={`w-1/4 rounded-2xl justify-center items-center border text-[14px] py-[5px] ${manrope.className} ${
                            fiscalYear === "2025" ? "border-[#E76C82] text-[#E76C82]" : "border-[#D9D9D9] text-[#555555]"
                        }`}
                        >
                        FY2025
                    </button>
                </div>
            </div>
            {/* month seletor */}
            <div className={`mb-[16px] text-[#555555] text-[15px] ${manrope.className}`}>
                Month 
                <div className="grid grid-cols-4 gap-4 mt-[6px]">
                    <button className={`py-[4px] rounded-full border border-[#D9D9D9] ${manrope.className}`}>Jan</button>
                    <button className={`rounded-full border border-[#D9D9D9] ${manrope.className}`}>Feb</button>
                    <button className={`rounded-full border border-[#D9D9D9] ${manrope.className}`}>Mar</button>
                    <button className={`rounded-full border border-[#D9D9D9] ${manrope.className}`}>Apr</button>
                    <button className={`py-[4px] rounded-full border border-[#D9D9D9] ${manrope.className}`}>May</button>
                    <button className={`rounded-full border border-[#D9D9D9] ${manrope.className}`}>Jun</button>
                    <button className={`rounded-full border border-[#D9D9D9] ${manrope.className}`}>Jul</button>
                    <button className={`rounded-full border border-[#D9D9D9] ${manrope.className}`}>Aug</button>
                    <button className={`py-[4px] rounded-full border border-[#D9D9D9] ${manrope.className}`}>Sep</button>
                    <button className={`rounded-full border border-[#D9D9D9] ${manrope.className}`}>Oct</button>
                    <button className={`rounded-full border border-[#D9D9D9] ${manrope.className}`}>Nov</button>
                    <button className={`rounded-full border border-[#D9D9D9] ${manrope.className}`}>Dec</button>
                </div>
            </div>
            {/* apply filter button */}
            <button 
                onClick={closeMenu}
                className={`w-full rounded-full py-[8px] bg-[#E76C82] text-[#FFFFFF] justify-center items-center hover:bg-[#d85c70] ${manrope.className}`}>
                Apply Filter
            </button>
        </div>
    );
}

export function CustomRangeContent ({ dateRange, setDateRange, closeMenu }: CustomRangeProps) {
    return (
        <div className="w-full flex-row">
            <UiCalendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="rounded-lg border shadow-sm w-full mb-[13px]"
            />
            {/* range confirmation */}
            <div className={`flex w-full rounded-full mb-[13px] px-[20px] py-[8px] bg-[#E0F7F4] text-[#555555] border border-[#85CFCA4D] justify-start items-center ${manrope.className} gap-2`}>
                <Calendar className="w-[15px] h-[15px]" />
                {dateRange?.from ? dateRange.from.toLocaleDateString() : ""} - {dateRange?.to ? dateRange.to.toLocaleDateString() : ""}
            </div>
            {/* apply range button */}
            <button 
                onClick={closeMenu}
                className={`w-full rounded-full py-[8px] bg-[#E76C82] text-[#FFFFFF] justify-center items-center hover:bg-[#d85c70] ${manrope.className}`}>
                Apply Custom Range
            </button>
        </div>
    )
}


export default function Home() {
    return (
        <div className="flex min-h-screen bg-[#F5F5F5]">
            <Navbar />
            <div className="flex-1 overflow-x-hidden">
                {/*Top bar*/}
                <div className="flex flex-row items-center w-full h-[70px] border-b border-[#E5E7EB] bg-[#FFFFFF]">
                    <div className={`flex items-center ${manrope.className} text-[#4A5565]`}>
                        <Funnel className="ml-[25px] mr-[10px] w-[20px] h-[20px] text-[#6A7282]"/>
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
                    <button className={`flex justify-center items-center ${manrope.className} bg-[#E76C82] text-[#EBEDEF] rounded-2xl ml-auto h-[30px] px-[20px] py-[20px] mr-[25px]`}>
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}