/*
 * This component represents the navbar that will consistently visible as users
 * navigate the application. As you are building out this component, keep in
 * mind that we want it to be reusable across different pages in the
 * application. Do you need any props?
 */

"use client";

// Import your image components
import { House, FileText, Settings } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

// Color palette constants
const SOFT_PINK = "bg-[#DE8F9C]";
const LIGHT_GRAY = "bg-[#414141]";
const DARK_GRAY = "bg-[#555555]";

// used placeholders for icons not found. (to be impelemented using Lucide React)
const TAB_CONFIG = [
    { name: "Overview", Icon: House },
    { name: "Housing", Icon: House },
    { name: "Education", Icon: House },
    { name: "Schools", Icon: House },
    { name: "Reports", Icon: FileText },
    { name: "Admin", Icon: Settings },
];

export default function Navbar() {
    const [selected, setSelected] = useState("Overview");
    const [hovered, setHovered] = useState("");

    return (
        <nav
            className={`w-[280px] min-h-screen ${DARK_GRAY} text-white flex flex-col`}
        >
            {/* Logo Area */}
            <div className="flex flex-col items-start px-6 py-6 border-b border-[#F5F5F5]">
                <Image
                    src="/Logo.png"
                    alt="Boston Higher Ground logo"
                    className="w-52 h-10 mb-2"
                    width={208}
                    height={40}
                />
            </div>

            {/* Spacer */}
            <div className="h-4" />

            <ul className="flex flex-col gap-4 px-5">
                {TAB_CONFIG.map(({ name, Icon }) => {
                    const isSelected = selected === name;
                    return (
                        <li
                            key={name}
                            onMouseEnter={() => setHovered(name)}
                            onMouseLeave={() => setHovered("")}
                            onClick={() => setSelected(name)}
                            className="px-0"
                        >
                            <div
                                className={[
                                    "flex items-center px-5 py-2.5 rounded-xl transition-colors cursor-pointer",
                                    isSelected
                                        ? SOFT_PINK + " text-white"
                                        : hovered === name
                                          ? LIGHT_GRAY + " text-white"
                                          : "text-white",
                                ].join(" ")}
                            >
                                <Icon className="w-6 h-6 mr-4" />
                                <span className="text-base">{name}</span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
