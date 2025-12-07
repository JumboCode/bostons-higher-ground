"use client";

// Import your image components
import { House, FileText, Settings } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Color palette constants
const SOFT_PINK = "bg-[#DE8F9C]";
const LIGHT_GRAY = "bg-[#414141]";

// used placeholders for icons not found. (to be impelemented using Lucide React)
const TAB_CONFIG = [
    { name: "Overview", Icon: House, href: "/reports/overview" },
    { name: "Housing", Icon: House, href: "/reports/housing" },
    { name: "Education", Icon: House, href: "/reports/education" },
    { name: "Schools", Icon: House, href: "/reports/schools" },
    { name: "Reports", Icon: FileText, href: "/reports" },
    { name: "Admin", Icon: Settings, href: "/admin" },
];

export default function NavBar() {
    const [selected, setSelected] = useState("");
    const [hovered, setHovered] = useState("");

    return (
        <nav className="fixed left-0 top-0 w-[280px] h-screen bg-bhg-gray-300 text-white flex flex-col overflow-y-auto z-40">
            {/* Logo Area */}
            <div className="flex flex-col items-start px-6 py-6 border-bhg-gray-200/30 border-b">
                <Image
                    src="/Logo.svg"
                    alt="Boston Higher Ground logo"
                    className="w-52 h-10 mb-2"
                    width={52}
                    height={10}
                />
            </div>

            {/* Spacer */}
            <div className="h-4" />

            <ul className="flex flex-col gap-4 px-5">
                {TAB_CONFIG.map(({ name, Icon, href }) => {
                    const isSelected = selected === name;
                    return (
                        <Link
                            href={href}
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
                        </Link>
                    );
                })}
            </ul>
        </nav>
    );
}
