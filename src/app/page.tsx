"use client"
import Navbar from "@/components/navbar";

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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"


import { Funnel, ChevronDown } from 'lucide-react';

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
                <button className="bg-[#F3F3F5] hover:bg rounded-2xl px-6 py-1 flex items-center justify-between gap-1">
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
                <button className="bg-[#F3F3F5] hover:bg rounded-2xl px-6 py-1 flex items-center justify-between gap-1">
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
                        <SchoolFilter />
                    </div>
                    <div className="ml-4">
                        <LocationFilter />
                    </div>
                    <div>

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