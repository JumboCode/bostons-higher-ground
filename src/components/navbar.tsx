"use client";

import {
    House,
    FileText,
    Settings,
    School,
    LayoutDashboard,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
//logout functionality
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SOFT_PINK = "bg-[#DE8F9C]";
const LIGHT_GRAY = "bg-[#414141]";

// Icons
const TAB_CONFIG = [
    { name: "Overview", Icon: LayoutDashboard, href: "/reports/overview" },
    { name: "Housing", Icon: House, href: "/reports/housing" },
    // { name: "Education", Icon: GraduationCap, href: "/reports/education" },
    { name: "Schools", Icon: School, href: "/reports/schools" },
    { name: "Reports", Icon: FileText, href: "/reports" },
    { name: "Admin", Icon: Settings, href: "/admin" },
];

export default function Navbar({ userName }: { userName: string }) {
    const pathname = usePathname();
    //for logout functionality
    const router = useRouter();
    const [hovered, setHovered] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await authClient.signOut();
        router.refresh();
        router.replace("/");
    };

    return (
        <nav
            className={`w-full md:w-[250px] md:flex-shrink-0 md:h-screen md:sticky md:top-0 md:left-0 bg-bhg-gray-300 text-white flex flex-col drop-shadow-sm`}
        >
            {/* Logo Area */}
            <div className="flex items-center justify-between px-4 py-4 md:px-6 md:py-6 border-bhg-gray-200/30 border-b">
                <Image
                    src="/Logo.svg"
                    alt="Boston Higher Ground logo"
                    className="w-40 h-8 md:w-52 md:h-10"
                    width={52}
                    height={10}
                />
                <button
                    type="button"
                    className="md:hidden rounded-md p-2 hover:bg-[#414141] transition-colors"
                    aria-label={
                        isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
                    }
                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                >
                    {isMobileMenuOpen ? (
                        <X className="w-5 h-5" />
                    ) : (
                        <Menu className="w-5 h-5" />
                    )}
                </button>
            </div>

            <ul
                className={`${
                    isMobileMenuOpen ? "flex" : "hidden"
                } md:flex flex-col gap-3 md:gap-4 p-4 md:p-5`}
            >
                {TAB_CONFIG.map(({ name, Icon, href }) => {
                    const isSelected =
                        pathname === href ||
                        (href !== "/reports" &&
                            pathname.startsWith(href + "/"));

                    return (
                        <Link
                            href={href}
                            key={name}
                            prefetch={false}
                            onClick={() => setIsMobileMenuOpen(false)}
                            onMouseEnter={() => setHovered(name)}
                            onMouseLeave={() => setHovered("")}
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

            {/* <button onClick={async () => {
                await authClient.signOut();
                redirect("/");
            }}
            className="cursor-pointer underline">{userName}</button> */}

            {/* This is the bottom left button */}
            <div
                className={`${
                    isMobileMenuOpen ? "flex" : "hidden"
                } md:flex mt-1 md:mt-auto pb-4 md:pb-6 px-4`}
            >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="w-12 h-12 rounded-full bg-[#E5737D] flex items-center justify-center text-white font-medium hover:brightness-90 transition-all cursor-pointer shadow-md"
                            aria-label="User profile"
                        >
                            {userName?.charAt(0).toUpperCase()}
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="start">
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer"
                        >
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    );
}
