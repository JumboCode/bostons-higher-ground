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
import { useEffect, useState } from "react";
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
    const router = useRouter();
    const [hovered, setHovered] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    async function handleLogout() {
        await authClient.signOut();
        router.refresh();
        router.replace("/");
    }

    const navLinks = (
        <ul className="flex flex-col gap-4 p-5">
            {TAB_CONFIG.map(({ name, Icon, href }) => {
                const isSelected =
                    pathname === href ||
                    (href !== "/reports" && pathname.startsWith(href + "/"));

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
                                "flex cursor-pointer items-center rounded-xl px-5 py-2.5 transition-colors",
                                isSelected
                                    ? SOFT_PINK + " text-white"
                                    : hovered === name
                                      ? LIGHT_GRAY + " text-white"
                                      : "text-white",
                            ].join(" ")}
                        >
                            <Icon className="mr-4 h-6 w-6" />
                            <span className="text-base">{name}</span>
                        </div>
                    </Link>
                );
            })}
        </ul>
    );

    const profileMenu = (
        <div className="mt-auto px-4 pb-6">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#E5737D] font-medium text-white shadow-md transition-all hover:brightness-90"
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
    );

    return (
        <>
            <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between bg-bhg-gray-300 px-4 text-white shadow-md md:hidden">
                <Image
                    src="/Logo.svg"
                    alt="Boston Higher Ground logo"
                    className="h-8 w-auto"
                    width={180}
                    height={32}
                />
                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                    className="rounded-md p-2 transition-colors hover:bg-white/10"
                    aria-label="Toggle navigation menu"
                >
                    {isMobileMenuOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Menu className="h-6 w-6" />
                    )}
                </button>
            </div>

            <div
                className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden ${
                    isMobileMenuOpen
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <nav
                className={`fixed left-0 top-0 z-50 flex h-screen w-[250px] flex-col bg-bhg-gray-300 text-white drop-shadow-sm transition-transform duration-200 md:hidden ${
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between border-b border-bhg-gray-200/30 px-6 py-6">
                    <Image
                        src="/Logo.svg"
                        alt="Boston Higher Ground logo"
                        className="h-8 w-auto"
                        width={180}
                        height={32}
                    />
                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="rounded-md p-2 transition-colors hover:bg-white/10"
                        aria-label="Close navigation menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {navLinks}
                {profileMenu}
            </nav>

            <nav className="sticky left-0 top-0 hidden h-screen w-[250px] flex-shrink-0 flex-col bg-bhg-gray-300 text-white drop-shadow-sm md:flex">
                <div className="flex flex-col items-start border-b border-bhg-gray-200/30 px-6 py-6">
                    <Image
                        src="/Logo.svg"
                        alt="Boston Higher Ground logo"
                        className="mb-2 h-10 w-52"
                        width={52}
                        height={10}
                    />
                </div>
                {navLinks}
                {profileMenu}
            </nav>
        </>
    );
}
