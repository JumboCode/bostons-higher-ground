import React from "react";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import NavBar from "@/components/navbar";
import ReportBuilderToggle from "@/components/report_builder_toggle";
import { authClient } from "@/lib/auth-client";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const userName = session?.user.name;

    return (
        <>
            <div className="flex">
                <NavBar />
                <div className="bg-[#F5F5F5] w-full flex-col">
                    <div className="min-h-[40px] bg-white top-0 flex justify-end px-5 py-3">
                        {userName || "John Doe"}
                    </div>
                    {children}
                </div>
            </div>
            <div className="absolute right-0 top-0 z-50 pointer-events-auto">
                <ReportBuilderToggle />
            </div>
        </>
    );
}
